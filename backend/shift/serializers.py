# shift/serializers.py

from rest_framework import serializers
from django.db.models import Q
from .models import FixedShift
from account.models import CustomUser
from config.serializers import DaySerializer, PlaceSerializer
from account.serializers import TeacherProfileSerializer


class FixedShiftSerializer(serializers.ModelSerializer):
    """固定シフトシリアライザー"""
    teacher = TeacherProfileSerializer(many=True, read_only=True)
    teacher_ids = serializers.ListField(
        child=serializers.IntegerField(),
        write_only=True,
        required=False,
        allow_empty=True
    )
    place_name = serializers.CharField(source='place.name', read_only=True)
    day_name = serializers.CharField(source='day.name', read_only=True)
    day_order = serializers.IntegerField(source='day.order', read_only=True)
    duration_minutes = serializers.SerializerMethodField()
    
    class Meta:
        model = FixedShift
        fields = [
            'id', 'day', 'start_time', 'end_time', 'teacher', 'teacher_ids', 'place', 'description',
            'place_name', 'day_name', 'day_order', 'duration_minutes'
        ]
    
    def get_duration_minutes(self, obj):
        """シフトの長さを分単位で計算"""
        return obj.get_duration_minutes()
    
    def create(self, validated_data):
        teacher_ids = validated_data.pop('teacher_ids', [])
        fixed_shift = FixedShift.objects.create(**validated_data)
        
        if teacher_ids:
            # 講師権限またはオーナー権限を持つユーザーのみ割り当て
            teachers = CustomUser.objects.filter(
                id__in=teacher_ids
            ).filter(
                Q(is_teacher=True) | Q(is_owner=True)
            )
            fixed_shift.teacher.set(teachers)
        
        return fixed_shift
    
    def update(self, instance, validated_data):
        teacher_ids = validated_data.pop('teacher_ids', None)
        
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        
        if teacher_ids is not None:
            # 講師権限またはオーナー権限を持つユーザーのみ割り当て
            teachers = CustomUser.objects.filter(
                id__in=teacher_ids
            ).filter(
                Q(is_teacher=True) | Q(is_owner=True)
            )
            instance.teacher.set(teachers)
        
        return instance
    
    def validate(self, data):
        """バリデーション: 同じ講師が同じ時間に複数の場所にいないかチェック + 指導可能場所チェック"""
        teacher_ids = data.get('teacher_ids', [])
        day = data.get('day')
        start_time = data.get('start_time')
        end_time = data.get('end_time')
        place = data.get('place')
        
        # 時間の妥当性チェック
        if start_time and end_time and start_time >= end_time:
            raise serializers.ValidationError("開始時間は終了時間より前である必要があります。")
        
        if teacher_ids and day and start_time and end_time:
            # 講師の存在確認と指導可能場所チェック
            teachers = CustomUser.objects.filter(id__in=teacher_ids)
            for teacher in teachers:
                # 講師またはオーナーであることを確認
                if not (teacher.is_teacher or teacher.is_owner):
                    raise serializers.ValidationError(
                        f"ユーザー '{teacher.username}' は講師権限またはオーナー権限がありません。"
                    )
                
                # 指導可能場所チェック（オーナーは全ての場所で指導可能）
                if place and not teacher.is_owner:
                    if not teacher.place.filter(id=place.id).exists():
                        raise serializers.ValidationError(
                            f"講師 '{teacher.username}' は場所 '{place.name}' での指導権限がありません。"
                        )
            
            # 編集の場合は自分自身を除外
            existing_shifts = FixedShift.objects.filter(day=day)
            if self.instance:
                existing_shifts = existing_shifts.exclude(id=self.instance.id)
            
            # 時間の重複をチェック
            for shift in existing_shifts:
                # 時間が重複しているかチェック
                if not (end_time <= shift.start_time or start_time >= shift.end_time):
                    # 重複している講師がいるかチェック
                    existing_teacher_ids = list(shift.teacher.values_list('id', flat=True))
                    overlapping_teachers = set(teacher_ids) & set(existing_teacher_ids)
                    if overlapping_teachers:
                        teacher_names = CustomUser.objects.filter(
                            id__in=overlapping_teachers
                        ).values_list('username', flat=True)
                        raise serializers.ValidationError(
                            f"講師 {', '.join(teacher_names)} は{shift.start_time.strftime('%H:%M')}-{shift.end_time.strftime('%H:%M')}の時間に既に別の場所でシフトが組まれています。"
                        )
        
        return data


class FixedShiftGridSerializer(serializers.Serializer):
    """固定シフト時間割表示用シリアライザー"""
    school_id = serializers.IntegerField()
    days = DaySerializer(many=True, read_only=True)
    places = PlaceSerializer(many=True, read_only=True)
    shifts = FixedShiftSerializer(many=True, read_only=True)
    
    # 時間軸の設定
    start_hour = serializers.IntegerField(default=8)
    end_hour = serializers.IntegerField(default=18)
    hour_interval = serializers.IntegerField(default=1)  # 1時間ごと

    school_start_time = serializers.TimeField(read_only=True)
    school_end_time = serializers.TimeField(read_only=True)


class AvailableTeacherSerializer(serializers.ModelSerializer):
    """割り当て可能講師シリアライザー"""
    full_name = serializers.SerializerMethodField()
    is_available = serializers.SerializerMethodField()
    current_shifts = serializers.SerializerMethodField()
    can_teach_at_place = serializers.SerializerMethodField()
    available_places = serializers.SerializerMethodField()
    role_display = serializers.SerializerMethodField()
    
    class Meta:
        model = CustomUser
        fields = [
            'id', 'username', 'first_name', 'last_name', 'full_name', 'email', 
            'is_available', 'current_shifts', 'can_teach_at_place', 'available_places',
            'role_display', 'is_teacher', 'is_owner'
        ]
    
    def get_full_name(self, obj):
        if obj.last_name and obj.first_name:
            return f"{obj.last_name} {obj.first_name}"
        return obj.username
    
    def get_role_display(self, obj):
        """役職表示"""
        roles = []
        if obj.is_owner:
            roles.append("オーナー")
        if obj.is_teacher:
            roles.append("講師")
        if obj.is_superuser:
            roles.append("管理者")
        return " / ".join(roles) if roles else "一般"
    
    def get_is_available(self, obj):
        """指定された時間に利用可能かチェック"""
        day_id = self.context.get('day_id')
        start_time = self.context.get('start_time')
        end_time = self.context.get('end_time')
        place_id = self.context.get('place_id')
        
        if not all([day_id, start_time, end_time]):
            return True
        
        # 指導可能場所チェック（オーナーは全ての場所で指導可能）
        if place_id and not obj.is_owner:
            if not obj.place.filter(id=place_id).exists():
                return False
        
        # 同じ時間に他の固定シフトがあるかチェック
        conflicting_shifts = FixedShift.objects.filter(
            day_id=day_id,
            teacher=obj
        )
        
        for shift in conflicting_shifts:
            # 時間が重複しているかチェック
            if not (end_time <= shift.start_time or start_time >= shift.end_time):
                return False
        
        return True
    
    def get_can_teach_at_place(self, obj):
        """指定された場所で指導可能かチェック"""
        place_id = self.context.get('place_id')
        
        if not place_id:
            return True
        
        # オーナーは全ての場所で指導可能
        if obj.is_owner:
            return True
            
        # 講師は指導可能場所に登録されている場所のみ
        return obj.place.filter(id=place_id).exists()
    
    def get_available_places(self, obj):
        """指導可能場所一覧"""
        school_id = self.context.get('school_id')
        
        if obj.is_owner and school_id:
            # オーナーは学校の全ての場所で指導可能
            from config.models import Place
            places = Place.objects.filter(school_id=school_id)
        else:
            # 講師は登録されている場所のみ
            places = obj.place.all()
            if school_id:
                places = places.filter(school_id=school_id)
        
        return [{'id': place.id, 'name': place.name} for place in places]
    
    def get_current_shifts(self, obj):
        """現在の固定シフト情報"""
        day_id = self.context.get('day_id')
        start_time = self.context.get('start_time')
        end_time = self.context.get('end_time')
        
        if not all([day_id, start_time, end_time]):
            return []
        
        shifts = FixedShift.objects.filter(
            day_id=day_id,
            teacher=obj
        ).select_related('place')
        
        # 時間が重複するシフトのみ取得
        conflicting_shifts = []
        for shift in shifts:
            if not (end_time <= shift.start_time or start_time >= shift.end_time):
                conflicting_shifts.append({
                    'place_name': shift.place.name, 
                    'description': shift.description,
                    'start_time': shift.start_time.strftime('%H:%M'),
                    'end_time': shift.end_time.strftime('%H:%M')
                })
        
        return conflicting_shifts


class BulkFixedShiftSerializer(serializers.Serializer):
    """一括固定シフト操作用シリアライザー"""
    shifts = serializers.ListField(
        child=serializers.DictField(),
        write_only=True
    )
    
    def validate_shifts(self, value):
        """一括操作のバリデーション"""
        validated_shifts = []
        
        for shift_data in value:
            serializer = FixedShiftSerializer(data=shift_data)
            if serializer.is_valid(raise_exception=True):
                validated_shifts.append(serializer.validated_data)
        
        return validated_shifts
    
    def create(self, validated_data):
        """一括作成"""
        shifts_data = validated_data['shifts']
        created_shifts = []
        
        for shift_data in shifts_data:
            teacher_ids = shift_data.pop('teacher_ids', [])
            shift = FixedShift.objects.create(**shift_data)
            
            if teacher_ids:
                # 講師権限またはオーナー権限を持つユーザーのみ割り当て
                teachers = CustomUser.objects.filter(
                    id__in=teacher_ids
                ).filter(
                    Q(is_teacher=True) | Q(is_owner=True)
                )
                shift.teacher.set(teachers)
            
            created_shifts.append(shift)
        
        return created_shifts