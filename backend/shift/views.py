# shift/views.py

from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.shortcuts import get_object_or_404
from django.db.models import Q
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter
from datetime import datetime

from .models import FixedShift
from .serializers import (
    FixedShiftSerializer,
    FixedShiftGridSerializer,
    AvailableTeacherSerializer,
    BulkFixedShiftSerializer
)
from account.models import CustomUser
from config.models import Place, Day
from school.models import School


class FixedShiftViewSet(viewsets.ModelViewSet):
    """固定シフト管理ViewSet"""
    serializer_class = FixedShiftSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['day', 'place', 'teacher']
    search_fields = ['description', 'teacher__username', 'teacher__first_name', 'teacher__last_name']
    ordering_fields = ['day__order', 'start_time', 'place__name']
    ordering = ['day__order', 'start_time', 'place__name']
    
    def get_queryset(self):
        """オーナーが管理する学校の固定シフトのみ取得"""
        user = self.request.user
        
        if not user.is_owner:
            return FixedShift.objects.none()
        
        # オーナーが管理する学校の固定シフトのみ
        school_ids = user.schools.values_list('id', flat=True)
        
        queryset = FixedShift.objects.filter(
            place__school_id__in=school_ids
        ).select_related(
            'day', 'place', 'place__school'
        ).prefetch_related(
            'teacher'
        )
        
        # 学校IDでフィルタリング
        school_id = self.request.query_params.get('school_id')
        if school_id:
            queryset = queryset.filter(place__school_id=school_id)
        
        return queryset
    
    @action(detail=False, methods=['get'])
    def grid(self, request):
        """固定シフト時間割グリッド表示用データ取得"""
        school_id = request.query_params.get('school_id')
        
        if not school_id:
            return Response(
                {'error': '学校IDが必要です'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # 学校の存在確認とアクセス権限チェック
        school = get_object_or_404(School, id=school_id)
        if not request.user.schools.filter(id=school_id).exists():
            return Response(
                {'error': 'この学校にアクセスする権限がありません'}, 
                status=status.HTTP_403_FORBIDDEN
            )
        
        # 曜日データ取得
        days = Day.objects.filter(school=school).order_by('order')
        
        # 場所データ取得
        places = Place.objects.filter(school=school).order_by('name')
        
        # 固定シフトデータ取得
        shifts = FixedShift.objects.filter(
            place__school=school
        ).select_related(
            'day', 'place'
        ).prefetch_related(
            'teacher'
        ).order_by('day__order', 'start_time', 'place__name')
        
        # シリアライズ
        grid_data = {
            'school_id': school.id,
            'days': days,
            'places': places,
            'shifts': shifts,
            'start_hour': 8,
            'end_hour': 18,
            'hour_interval': 1,
            'school_start_time': school.start_time,  # 追加
            'school_end_time': school.end_time,      # 追加
        }
        
        serializer = FixedShiftGridSerializer(grid_data)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def available_teachers(self, request):
        """指定された時間と場所に割り当て可能な講師一覧取得"""
        school_id = request.query_params.get('school_id')
        day_id = request.query_params.get('day_id')
        start_time_str = request.query_params.get('start_time')  # HH:MM形式
        end_time_str = request.query_params.get('end_time')      # HH:MM形式
        place_id = request.query_params.get('place_id')
        
        if not all([school_id, day_id, start_time_str, end_time_str]):
            return Response(
                {'error': '学校ID、曜日ID、開始時間、終了時間が必要です'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # 時間の変換
        try:
            start_time = datetime.strptime(start_time_str, '%H:%M').time()
            end_time = datetime.strptime(end_time_str, '%H:%M').time()
        except ValueError:
            return Response(
                {'error': '時間の形式が正しくありません（HH:MM形式で入力してください）'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # 学校のアクセス権限チェック
        school = get_object_or_404(School, id=school_id)
        if not request.user.schools.filter(id=school_id).exists():
            return Response(
                {'error': 'この学校にアクセスする権限がありません'}, 
                status=status.HTTP_403_FORBIDDEN
            )
        
        # 学校に属する講師とオーナーを取得
        teachers_and_owners = CustomUser.objects.filter(
            schools=school
        ).filter(
            Q(is_teacher=True) | Q(is_owner=True)
        ).distinct()
        
        # 指導可能場所でフィルタリング（場所が指定されている場合）
        if place_id:
            try:
                place = Place.objects.get(id=place_id, school=school)
                # オーナーは全ての場所で指導可能、講師は指導可能場所に登録されている場所のみ
                teachers_and_owners = teachers_and_owners.filter(
                    Q(is_owner=True) | Q(place=place)
                ).distinct()
            except Place.DoesNotExist:
                return Response(
                    {'error': '指定された場所が見つかりません'}, 
                    status=status.HTTP_404_NOT_FOUND
                )
        
        teachers_and_owners = teachers_and_owners.order_by('last_name', 'first_name', 'username')
        
        serializer = AvailableTeacherSerializer(
            teachers_and_owners, 
            many=True,
            context={
                'school_id': school_id,
                'day_id': day_id,
                'start_time': start_time,
                'end_time': end_time,
                'place_id': place_id
            }
        )
        
        return Response(serializer.data)
    
    @action(detail=False, methods=['post'])
    def bulk_create(self, request):
        """固定シフト一括作成"""
        serializer = BulkFixedShiftSerializer(data=request.data)
        
        if serializer.is_valid():
            shifts = serializer.save()
            response_serializer = FixedShiftSerializer(shifts, many=True)
            return Response(
                response_serializer.data, 
                status=status.HTTP_201_CREATED
            )
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=False, methods=['delete'])
    def bulk_delete(self, request):
        """固定シフト一括削除"""
        shift_ids = request.data.get('shift_ids', [])
        
        if not shift_ids:
            return Response(
                {'error': '削除するシフトIDが必要です'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # アクセス権限チェック付きで削除
        user_school_ids = request.user.schools.values_list('id', flat=True)
        deleted_count = FixedShift.objects.filter(
            id__in=shift_ids,
            place__school_id__in=user_school_ids
        ).delete()[0]
        
        return Response({
            'message': f'{deleted_count}件の固定シフトを削除しました',
            'deleted_count': deleted_count
        })
    
    @action(detail=False, methods=['get'])
    def conflicts(self, request):
        """シフト競合チェック"""
        school_id = request.query_params.get('school_id')
        
        if not school_id:
            return Response(
                {'error': '学校IDが必要です'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # 同じ曜日・時間に複数の場所で割り当てられている講師を検出
        conflicts = []
        
        # 学校の全固定シフトを取得
        shifts = FixedShift.objects.filter(
            place__school_id=school_id
        ).select_related('day', 'place').prefetch_related('teacher')
        
        # 曜日ごとにグループ化して競合をチェック
        shift_groups = {}
        for shift in shifts:
            key = shift.day.id
            if key not in shift_groups:
                shift_groups[key] = []
            shift_groups[key].append(shift)
        
        for day_id, group_shifts in shift_groups.items():
            # 各グループ内で講師の重複をチェック
            for i, shift1 in enumerate(group_shifts):
                for j, shift2 in enumerate(group_shifts[i+1:], i+1):
                    # 時間が重複しているかチェック
                    if not (shift1.end_time <= shift2.start_time or shift1.start_time >= shift2.end_time):
                        # 重複する講師がいるかチェック
                        shift1_teachers = set(shift1.teacher.values_list('id', flat=True))
                        shift2_teachers = set(shift2.teacher.values_list('id', flat=True))
                        overlapping_teachers = shift1_teachers & shift2_teachers
                        
                        if overlapping_teachers:
                            for teacher_id in overlapping_teachers:
                                teacher = CustomUser.objects.get(id=teacher_id)
                                day = Day.objects.get(id=day_id)
                                
                                conflicts.append({
                                    'teacher_id': teacher_id,
                                    'teacher_name': teacher.username,
                                    'day_name': day.name,
                                    'conflicting_shifts': [
                                        {
                                            'shift_id': shift1.id,
                                            'start_time': shift1.start_time,
                                            'end_time': shift1.end_time,
                                            'place_name': shift1.place.name,
                                            'description': shift1.description
                                        },
                                        {
                                            'shift_id': shift2.id,
                                            'start_time': shift2.start_time,
                                            'end_time': shift2.end_time,
                                            'place_name': shift2.place.name,
                                            'description': shift2.description
                                        }
                                    ]
                                })
        
        return Response({
            'conflicts': conflicts,
            'conflict_count': len(conflicts)
        })
    
    @action(detail=False, methods=['post'])
    def copy_week(self, request):
        """固定シフトの週コピー機能"""
        from_school_id = request.data.get('from_school_id')
        to_school_id = request.data.get('to_school_id')
        overwrite = request.data.get('overwrite', False)
        
        if not all([from_school_id, to_school_id]):
            return Response(
                {'error': 'コピー元とコピー先の学校IDが必要です'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # アクセス権限チェック
        user_schools = request.user.schools.values_list('id', flat=True)
        if from_school_id not in user_schools or to_school_id not in user_schools:
            return Response(
                {'error': '学校にアクセスする権限がありません'}, 
                status=status.HTTP_403_FORBIDDEN
            )
        
        # コピー先の既存シフトを削除（上書きの場合）
        if overwrite:
            FixedShift.objects.filter(place__school_id=to_school_id).delete()
        
        # コピー元のシフトを取得
        source_shifts = FixedShift.objects.filter(
            place__school_id=from_school_id
        ).select_related('day', 'place').prefetch_related('teacher')
        
        # コピー先の対応する曜日・場所を取得
        to_school = School.objects.get(id=to_school_id)
        day_mapping = {day.order: day for day in Day.objects.filter(school=to_school)}
        place_mapping = {}
        
        copied_count = 0
        
        for source_shift in source_shifts:
            # 対応する曜日を探す
            target_day = day_mapping.get(source_shift.day.order)
            if not target_day:
                continue
            
            # 対応する場所を探す（同じ名前）
            target_place = Place.objects.filter(
                school=to_school,
                name=source_shift.place.name
            ).first()
            if not target_place:
                continue
            
            # 新しいシフトを作成
            new_shift = FixedShift.objects.create(
                day=target_day,
                start_time=source_shift.start_time,
                end_time=source_shift.end_time,
                place=target_place,
                description=source_shift.description
            )
            
            # 講師を割り当て（同じ学校に属し、指導可能場所を持つ講師・オーナーのみ）
            source_teacher_ids = source_shift.teacher.values_list('id', flat=True)
            
            # コピー先学校に属する講師・オーナーをフィルタリング
            available_teachers = CustomUser.objects.filter(
                id__in=source_teacher_ids,
                schools=to_school
            ).filter(
                Q(is_teacher=True) | Q(is_owner=True)
            )
            
            # 指導可能場所のチェック
            valid_teachers = []
            for teacher in available_teachers:
                # オーナーは全ての場所で指導可能
                if teacher.is_owner:
                    valid_teachers.append(teacher)
                # 講師は指導可能場所に登録されている場合のみ
                elif teacher.place.filter(id=target_place.id).exists():
                    valid_teachers.append(teacher)
            
            if valid_teachers:
                new_shift.teacher.set(valid_teachers)
                copied_count += 1
            else:
                # 指導可能な講師がいない場合はシフトを削除
                new_shift.delete()
        
        return Response({
            'message': f'{copied_count}件の固定シフトをコピーしました',
            'copied_count': copied_count
        })
    
    @action(detail=False, methods=['get'])
    def teachers_by_place(self, request):
        """場所別の指導可能講師・オーナー一覧取得"""
        school_id = request.query_params.get('school_id')
        
        if not school_id:
            return Response(
                {'error': '学校IDが必要です'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # 学校のアクセス権限チェック
        school = get_object_or_404(School, id=school_id)
        if not request.user.schools.filter(id=school_id).exists():
            return Response(
                {'error': 'この学校にアクセスする権限がありません'}, 
                status=status.HTTP_403_FORBIDDEN
            )
        
        # 学校の全ての場所を取得
        places = Place.objects.filter(school=school).order_by('name')
        
        result = []
        for place in places:
            # その場所で指導可能な講師・オーナーを取得
            available_users = CustomUser.objects.filter(
                schools=school
            ).filter(
                Q(is_teacher=True) | Q(is_owner=True)
            ).filter(
                Q(is_owner=True) | Q(place=place)  # オーナーは全場所可能、講師は登録場所のみ
            ).distinct().order_by('last_name', 'first_name', 'username')
            
            teachers_data = []
            for user in available_users:
                full_name = f"{user.last_name} {user.first_name}" if user.last_name and user.first_name else user.username
                role_display = []
                if user.is_owner:
                    role_display.append("オーナー")
                if user.is_teacher:
                    role_display.append("講師")
                
                teachers_data.append({
                    'id': user.id,
                    'username': user.username,
                    'full_name': full_name,
                    'role_display': " / ".join(role_display),
                    'is_owner': user.is_owner,
                    'is_teacher': user.is_teacher
                })
            
            result.append({
                'place_id': place.id,
                'place_name': place.name,
                'available_teachers': teachers_data,
                'teacher_count': len(teachers_data)
            })
        
        return Response({
            'school_id': school.id,
            'school_name': school.name,
            'places': result
        })

    @action(detail=False, methods=['get'])
    def teacher_schedules(self, request):
        """講師・オーナーの週間スケジュール取得"""
        school_id = request.query_params.get('school_id')
        teacher_id = request.query_params.get('teacher_id')
        
        if not all([school_id, teacher_id]):
            return Response(
                {'error': '学校IDと講師IDが必要です'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # 学校のアクセス権限チェック
        school = get_object_or_404(School, id=school_id)
        if not request.user.schools.filter(id=school_id).exists():
            return Response(
                {'error': 'この学校にアクセスする権限がありません'}, 
                status=status.HTTP_403_FORBIDDEN
            )
        
        # 講師・オーナーの存在確認
        teacher = get_object_or_404(
            CustomUser, 
            id=teacher_id, 
            schools=school
        )
        
        if not (teacher.is_teacher or teacher.is_owner):
            return Response(
                {'error': '指定されたユーザーは講師またはオーナーではありません'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # その講師・オーナーの固定シフト一覧を取得
        shifts = FixedShift.objects.filter(
            teacher=teacher,
            place__school=school
        ).select_related(
            'day', 'place'
        ).order_by('day__order', 'start_time')
        
        # 曜日別にグループ化
        schedule_by_day = {}
        for shift in shifts:
            day_name = shift.day.name
            if day_name not in schedule_by_day:
                schedule_by_day[day_name] = []
            
            schedule_by_day[day_name].append({
                'shift_id': shift.id,
                'start_time': shift.start_time,
                'end_time': shift.end_time,
                'place_name': shift.place.name,
                'description': shift.description,
                'duration_minutes': shift.get_duration_minutes()
            })
        
        return Response({
            'teacher_id': teacher.id,
            'teacher_name': f"{teacher.last_name} {teacher.first_name}" if teacher.last_name and teacher.first_name else teacher.username,
            'role_display': "オーナー" if teacher.is_owner else "講師",
            'school_id': school.id,
            'school_name': school.name,
            'schedule': schedule_by_day,
            'total_shifts': shifts.count()
        })
    
    @action(detail=False, methods=['get'])
    def time_slots(self, request):
        """指定された曜日の時間スロット一覧取得（既存シフトから抽出）"""
        school_id = request.query_params.get('school_id')
        day_id = request.query_params.get('day_id')
        
        if not all([school_id, day_id]):
            return Response(
                {'error': '学校IDと曜日IDが必要です'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # 学校のアクセス権限チェック
        school = get_object_or_404(School, id=school_id)
        if not request.user.schools.filter(id=school_id).exists():
            return Response(
                {'error': 'この学校にアクセスする権限がありません'}, 
                status=status.HTTP_403_FORBIDDEN
            )
        
        # その曜日の全シフトから時間帯を抽出
        shifts = FixedShift.objects.filter(
            day_id=day_id,
            place__school=school
        ).values('start_time', 'end_time').distinct().order_by('start_time')
        
        time_slots = []
        for shift in shifts:
            time_slots.append({
                'start_time': shift['start_time'],
                'end_time': shift['end_time'],
                'display': f"{shift['start_time'].strftime('%H:%M')}-{shift['end_time'].strftime('%H:%M')}"
            })
        
        return Response({
            'school_id': school.id,
            'day_id': day_id,
            'time_slots': time_slots
        })