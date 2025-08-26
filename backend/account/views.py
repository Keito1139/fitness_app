# accounts/views.py

from rest_framework import status, permissions, viewsets, filters
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.generics import RetrieveUpdateAPIView
from django.contrib.auth import login, logout
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from django.http import JsonResponse
from django.utils import timezone
from datetime import timedelta
from django.middleware.csrf import get_token
from django_filters.rest_framework import DjangoFilterBackend
from .models import OwnerProfile, TeacherProfile, CustomUser
from .serializers import (
    OwnerLoginSerializer, UserSerializer,
    OwnerProfileSerializer, TeacherProfileSerializer,
    TeacherLoginSerializer, TeacherCreateSerializer,
    TeacherDetailSerializer, TeacherListSerializer,
    TeacherUpdateSerializer, AdminLoginSerializer
)
from permissions import IsOwnerOrAdmin
from .filters import TeacherFilter


class OwnerLoginView(APIView):
    """オーナー専用ログインビュー"""
    permission_classes = [permissions.AllowAny]
    
    def post(self, request):
        serializer = OwnerLoginSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.validated_data['user']
            login(request, user)
            user_serializer = UserSerializer(user)
            return Response({
                'message': 'オーナーログインに成功しました。',
                'user': user_serializer.data
            }, status=status.HTTP_200_OK)

        errors = serializer.errors
        if 'non_field_errors' in errors:
            error_message = errors['non_field_errors'][0]
        else:
            error_message = 'ログインに失敗しました。'
            
        return Response({
            'error': error_message
        }, status=status.HTTP_400_BAD_REQUEST)
    

class AdminLoginView(APIView):
    """管理者専用ログインビュー"""
    permission_classes = [permissions.AllowAny]
    
    def post(self, request):
        serializer = AdminLoginSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.validated_data['user']
            login(request, user)
            user_serializer = UserSerializer(user)
            return Response({
                'message': '管理者ログインに成功しました。',
                'user': user_serializer.data,
            }, status=status.HTTP_200_OK)

        errors = serializer.errors
        if 'non_field_errors' in errors:
            error_message = errors['non_field_errors'][0]
            # 管理者権限不足の場合は403を返す
            if '管理者権限が必要です' in error_message:
                return Response({
                    'error': error_message
                }, status=status.HTTP_403_FORBIDDEN)
        else:
            error_message = 'ログインに失敗しました。'
            
        return Response({
            'error': error_message
        }, status=status.HTTP_400_BAD_REQUEST)

    
class TeacherLoginView(APIView):
    """講師専用ログインビュー"""
    permission_classes = [permissions.AllowAny]
    
    def post(self, request):
        serializer = TeacherLoginSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.validated_data['user']
            login(request, user)
            user_serializer = UserSerializer(user)
            return Response({
                'message': '講師ログインに成功しました。',
                'user': user_serializer.data
            }, status=status.HTTP_200_OK)
        
        errors = serializer.errors
        if 'non_field_errors' in errors:
            error_message = errors['non_field_errors'][0]
        else:
            error_message = 'ログインに失敗しました。'
            
        return Response({
            'error': error_message
        }, status=status.HTTP_400_BAD_REQUEST)


@method_decorator(csrf_exempt, name='dispatch')
class LogoutView(APIView):
    """ログアウトビュー（CSRF exempt）"""
    permission_classes = [permissions.IsAuthenticated]
    
    def post(self, request):
        try:
            logout(request)
            return Response({
                'message': 'ログアウトに成功しました。'
            }, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({
                'error': 'ログアウトに失敗しました。'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class CSRFTokenView(APIView):
    """CSRFトークンを取得するビュー"""
    permission_classes = [permissions.AllowAny]
    
    def get(self, request):
        # CSRFトークンをCookieに設定
        token = get_token(request)
        response = JsonResponse({'csrfToken': token})
        response.set_cookie(
            'csrftoken', 
            token,
            httponly=False,
            samesite='Lax',
            secure=False  # 開発環境用
        )
        return response


class UserProfileView(RetrieveUpdateAPIView):
    """ユーザープロフィール取得・更新ビュー"""
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_object(self):
        return self.request.user


class OwnerProfileView(RetrieveUpdateAPIView):
    """オーナープロフィールビュー"""
    serializer_class = OwnerProfileSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_object(self):
        if not self.request.user.is_owner:
            raise permissions.PermissionDenied('オーナー権限が必要です。')
        profile, created = OwnerProfile.objects.get_or_create(user=self.request.user)
        return profile


class TeacherProfileView(RetrieveUpdateAPIView):
    """教師プロフィールビュー"""
    serializer_class = TeacherProfileSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_object(self):
        if not self.request.user.is_teacher:
            raise permissions.PermissionDenied('教師権限が必要です。')
        profile, created = TeacherProfile.objects.get_or_create(user=self.request.user)
        return profile
    

class TeacherViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated, IsOwnerOrAdmin]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_class = TeacherFilter
    search_fields = ['username', 'first_name', 'last_name', 'email']
    ordering_fields = ['date_joined', 'last_login', 'first_name', 'last_name', 'username']
    ordering = ['-date_joined']
    
    def get_serializer_class(self):
        """アクションに応じてシリアライザーを切り替え"""
        if self.action == 'create':
            return TeacherCreateSerializer
        elif self.action in ['update', 'partial_update']:
            return TeacherUpdateSerializer
        elif self.action == 'retrieve':
            return TeacherDetailSerializer
        return TeacherListSerializer
    
    def get_queryset(self):
        """
        講師のクエリセットを取得（権限ベースフィルタリング）
        """
        queryset = CustomUser.objects.filter(is_teacher=True).select_related(
            'current_school'
        ).prefetch_related('schools')
        
        # オーナーは自分の学校の講師のみ表示
        if self.request.user.is_owner and not self.request.user.is_superuser:
            user_schools = self.request.user.schools.all()
            queryset = queryset.filter(schools__in=user_schools).distinct()
        
        return queryset
    
    def list(self, request, *args, **kwargs):
        """講師一覧を取得（カスタムページネーション対応）"""
        queryset = self.filter_queryset(self.get_queryset())
        
        # カスタムページネーション
        page_size = int(request.query_params.get('page_size', 20))
        page = int(request.query_params.get('page', 1))
        
        # ページサイズの制限
        page_size = min(page_size, 100)  # 最大100件
        
        start = (page - 1) * page_size
        end = start + page_size
        
        total_count = queryset.count()
        teachers = queryset[start:end]
        
        serializer = self.get_serializer(teachers, many=True)
        
        # ページネーション情報を計算
        total_pages = (total_count + page_size - 1) // page_size
        has_next = page < total_pages
        has_previous = page > 1
        
        return Response({
            'results': serializer.data,
            'pagination': {
                'count': total_count,
                'total_pages': total_pages,
                'current_page': page,
                'page_size': page_size,
                'has_next': has_next,
                'has_previous': has_previous,
                'next_page': page + 1 if has_next else None,
                'previous_page': page - 1 if has_previous else None,
            }
        })
    
    def create(self, request, *args, **kwargs):
        """新規講師を作成"""
        serializer = self.get_serializer(data=request.data)
        
        if serializer.is_valid():
            # オーナーの場合、自分の学校のみ設定可能
            if request.user.is_owner and not request.user.is_superuser:
                user_schools = request.user.schools.all()
                current_school = serializer.validated_data.get('current_school')
                schools = serializer.validated_data.get('schools', [])
                
                # 現在の学校チェック
                if current_school and current_school not in user_schools:
                    return Response(
                        {'error': '指定された学校にアクセス権限がありません。'},
                        status=status.HTTP_403_FORBIDDEN
                    )
                
                # 関連学校チェック
                for school in schools:
                    if school not in user_schools:
                        return Response(
                            {'error': '指定された学校にアクセス権限がありません。'},
                            status=status.HTTP_403_FORBIDDEN
                        )
            
            teacher = serializer.save()
            return Response(
                {
                    'message': '講師を作成しました。',
                    'teacher': TeacherDetailSerializer(teacher).data
                },
                status=status.HTTP_201_CREATED
            )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    def update(self, request, *args, **kwargs):
        """講師情報を更新"""
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        
        if serializer.is_valid():
            # オーナーの場合、自分の学校のみ設定可能
            if request.user.is_owner and not request.user.is_superuser:
                user_schools = request.user.schools.all()
                current_school = serializer.validated_data.get('current_school')
                schools = serializer.validated_data.get('schools')
                
                # 現在の学校チェック
                if current_school and current_school not in user_schools:
                    return Response(
                        {'error': '指定された学校にアクセス権限がありません。'},
                        status=status.HTTP_403_FORBIDDEN
                    )
                
                # 関連学校チェック
                if schools:
                    for school in schools:
                        if school not in user_schools:
                            return Response(
                                {'error': '指定された学校にアクセス権限がありません。'},
                                status=status.HTTP_403_FORBIDDEN
                            )
            
            teacher = serializer.save()
            return Response(
                {
                    'message': '講師情報を更新しました。',
                    'teacher': TeacherDetailSerializer(teacher).data
                }
            )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    def destroy(self, request, *args, **kwargs):
        """講師を論理削除"""
        instance = self.get_object()
        
        # 論理削除（is_activeをFalseにする）
        instance.is_active = False
        instance.save()
        
        return Response(
            {
                'message': '講師を無効化しました。',
                'teacher_id': instance.id
            },
            status=status.HTTP_200_OK
        )
    
    @action(detail=True, methods=['post'])
    def activate(self, request, pk=None):
        """講師を有効化"""
        teacher = self.get_object()
        
        # オーナーの場合、自分の学校の講師のみ操作可能
        if request.user.is_owner and not request.user.is_superuser:
            user_schools = request.user.schools.all()
            if not teacher.schools.filter(id__in=user_schools).exists():
                return Response(
                    {'error': 'この講師にアクセス権限がありません。'},
                    status=status.HTTP_403_FORBIDDEN
                )
        
        teacher.is_active = True
        teacher.save()
        
        return Response(
            {
                'message': '講師を有効化しました。',
                'teacher': TeacherDetailSerializer(teacher).data
            }
        )
    
    @action(detail=False, methods=['get'])
    def statistics(self, request):
        """講師統計情報を取得"""
        # 基本クエリセット
        queryset = self.get_queryset()
        
        total_teachers = queryset.count()
        active_teachers = queryset.filter(is_active=True).count()
        inactive_teachers = queryset.filter(is_active=False).count()
        
        # 学校別統計
        school_stats = []
        if request.user.is_superuser:
            from school.models import School
            schools = School.objects.all()
        else:
            schools = request.user.schools.all()
        
        for school in schools:
            school_teachers = queryset.filter(current_school=school)
            school_stats.append({
                'school_id': school.id,
                'school_name': school.name,
                'total_teachers': school_teachers.count(),
                'active_teachers': school_teachers.filter(is_active=True).count(),
            })
        
        monthly_stats = []
        for i in range(12):
            month_start = timezone.now().replace(day=1) - timedelta(days=30*i)
            month_end = month_start.replace(month=month_start.month % 12 + 1, day=1) if month_start.month < 12 else month_start.replace(year=month_start.year + 1, month=1, day=1)
            
            monthly_count = queryset.filter(
                date_joined__gte=month_start,
                date_joined__lt=month_end
            ).count()
            
            monthly_stats.append({
                'month': month_start.strftime('%Y-%m'),
                'count': monthly_count
            })
        
        monthly_stats.reverse()  # 古い順に並び替え
        
        return Response({
            'total_teachers': total_teachers,
            'active_teachers': active_teachers,
            'inactive_teachers': inactive_teachers,
            'school_statistics': school_stats,
            'monthly_registration': monthly_stats,
        })