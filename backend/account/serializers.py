# account/serializers.py

from rest_framework import serializers
from django.contrib.auth import authenticate
from .models import CustomUser, OwnerProfile, TeacherProfile
from school.models import School
from school.serializers import SchoolSerializer


class UserSerializer(serializers.ModelSerializer):
    """ユーザー情報のシリアライザー"""
    current_school_name = serializers.CharField(source='current_school.name', read_only=True)
    schools = serializers.PrimaryKeyRelatedField(many=True, queryset=School.objects.all(), required=False)
    
    class Meta:
        model = CustomUser
        fields = [
            'id', 'username', 'email', 'first_name', 'last_name',
            'is_owner', 'is_teacher', 'is_admin', 'schools', 
            'current_school', 'current_school_name', 'date_joined'
        ]
        read_only_fields = ['id', 'date_joined']


class OwnerLoginSerializer(serializers.Serializer):
    """オーナー専用ログイン用シリアライザー"""
    username = serializers.CharField()
    password = serializers.CharField(write_only=True)
    
    def validate(self, data):
        username = data.get('username')
        password = data.get('password')
        
        if username and password:
            user = authenticate(username=username, password=password)
            if user:
                if user.is_active:
                    # オーナー権限のチェック
                    if not user.is_owner:
                        raise serializers.ValidationError('オーナー権限が必要です。')
                    data['user'] = user
                else:
                    raise serializers.ValidationError('アカウントが無効です。')
            else:
                raise serializers.ValidationError('ユーザー名またはパスワードが正しくありません。')
        else:
            raise serializers.ValidationError('ユーザー名とパスワードを入力してください。')
        
        return data
    
class TeacherLoginSerializer(serializers.Serializer):
    """講師専用ログイン用シリアライザー"""
    username = serializers.CharField()
    password = serializers.CharField(write_only=True)
    
    def validate(self, data):
        username = data.get('username')
        password = data.get('password')
        
        if username and password:
            user = authenticate(username=username, password=password)
            if user:
                if user.is_active:
                    # 講師権限のチェック
                    if not user.is_teacher:
                        raise serializers.ValidationError('講師権限が必要です。')
                    data['user'] = user
                else:
                    raise serializers.ValidationError('アカウントが無効です。')
            else:
                raise serializers.ValidationError('ユーザー名またはパスワードが正しくありません。')
        else:
            raise serializers.ValidationError('ユーザー名とパスワードを入力してください。')
        
        return data


class OwnerProfileSerializer(serializers.ModelSerializer):
    """オーナープロフィール用シリアライザー"""
    user = UserSerializer(read_only=True)
    
    class Meta:
        model = OwnerProfile
        fields = ['user']


class TeacherProfileSerializer(serializers.ModelSerializer):
    """講師の基本情報シリアライザー"""
    full_name = serializers.SerializerMethodField()
    
    class Meta:
        model = CustomUser
        fields = ['id', 'username', 'first_name', 'last_name', 'full_name', 'email']
    
    def get_full_name(self, obj):
        if obj.last_name and obj.first_name:
            return f"{obj.last_name} {obj.first_name}"
        return obj.username


class TeacherListSerializer(serializers.ModelSerializer):
    """講師一覧用のシリアライザー"""
    current_school_name = serializers.CharField(
        source='current_school.name', 
        read_only=True
    )
    full_name = serializers.SerializerMethodField()
    schools_info = SchoolSerializer(source='schools', many=True, read_only=True)
    teacher_profile = serializers.SerializerMethodField()
    
    class Meta:
        model = CustomUser
        fields = [
            'id',
            'username',
            'email',
            'first_name',
            'last_name',
            'full_name',
            'is_active',
            'is_teacher',
            'current_school',
            'current_school_name',
            'schools',
            'schools_info',
            'teacher_profile',
            'date_joined',
        ]
        read_only_fields = ['id', 'username', 'date_joined']

    def get_full_name(self, obj):
        """フルネームを取得"""
        if obj.last_name and obj.first_name:
            return f"{obj.last_name} {obj.first_name}"
        return obj.username

    def get_teacher_profile(self, obj):
        """講師プロフィール情報を取得"""
        try:
            profile = obj.teacher_profile
            return {
                'id': profile.id,
                'created_at': profile.id  # プロフィール作成日の代替
            }
        except TeacherProfile.DoesNotExist:
            return None


class TeacherDetailSerializer(serializers.ModelSerializer):
    """講師詳細用のシリアライザー"""
    current_school_name = serializers.CharField(
        source='current_school.name', 
        read_only=True
    )
    full_name = serializers.SerializerMethodField()
    schools_info = SchoolSerializer(source='schools', many=True, read_only=True)
    teacher_profile = serializers.SerializerMethodField()
    
    class Meta:
        model = CustomUser
        fields = [
            'id',
            'username',
            'email',
            'first_name',
            'last_name',
            'full_name',
            'is_active',
            'is_teacher',
            'is_admin',
            'current_school',
            'current_school_name',
            'schools',
            'schools_info',
            'teacher_profile',
            'date_joined',
        ]
        read_only_fields = ['id', 'username', 'is_teacher', 'date_joined']

    def get_full_name(self, obj):
        """フルネームを取得"""
        if obj.last_name and obj.first_name:
            return f"{obj.last_name} {obj.first_name}"
        return obj.username

    def get_teacher_profile(self, obj):
        """講師プロフィール情報を取得"""
        try:
            profile = obj.teacher_profile
            return {
                'id': profile.id,
                'created_at': profile.id
            }
        except TeacherProfile.DoesNotExist:
            return None


class TeacherCreateSerializer(serializers.ModelSerializer):
    """講師作成用のシリアライザー"""
    password = serializers.CharField(write_only=True, min_length=8)
    password_confirm = serializers.CharField(write_only=True)
    
    class Meta:
        model = CustomUser
        fields = [
            'username',
            'email',
            'first_name',
            'last_name',
            'password',
            'password_confirm',
            'current_school',
            'schools',
        ]

    def validate(self, attrs):
        """パスワード確認とバリデーション"""
        if attrs['password'] != attrs['password_confirm']:
            raise serializers.ValidationError("パスワードが一致しません。")
        
        # パスワード確認フィールドを削除（保存時に不要）
        attrs.pop('password_confirm')
        return attrs

    def validate_email(self, value):
        """メールアドレスの重複チェック"""
        if CustomUser.objects.filter(email=value).exists():
            raise serializers.ValidationError("このメールアドレスは既に使用されています。")
        return value

    def validate_username(self, value):
        """ユーザー名の重複チェック"""
        if CustomUser.objects.filter(username=value).exists():
            raise serializers.ValidationError("このユーザー名は既に使用されています。")
        return value

    def create(self, validated_data):
        """講師ユーザーの作成"""
        # パスワードを取得して削除
        password = validated_data.pop('password')
        schools_data = validated_data.pop('schools', [])
        
        # 講師フラグを設定
        validated_data['is_teacher'] = True
        
        # ユーザー作成
        user = CustomUser.objects.create_user(
            password=password,
            **validated_data
        )
        
        # 関連する学校を設定
        if schools_data:
            user.schools.set(schools_data)
        
        # 講師プロフィールを作成
        TeacherProfile.objects.create(user=user)
        
        return user


class TeacherUpdateSerializer(serializers.ModelSerializer):
    """講師更新用のシリアライザー"""
    
    class Meta:
        model = CustomUser
        fields = [
            'email',
            'first_name',
            'last_name',
            'is_active',
            'current_school',
            'schools',
        ]

    def validate_email(self, value):
        """メールアドレスの重複チェック（自分以外）"""
        instance = self.instance
        if instance and CustomUser.objects.filter(email=value).exclude(id=instance.id).exists():
            raise serializers.ValidationError("このメールアドレスは既に使用されています。")
        return value

    def update(self, instance, validated_data):
        """講師情報の更新"""
        schools_data = validated_data.pop('schools', None)
        
        # 基本情報を更新
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        
        # 学校情報を更新
        if schools_data is not None:
            instance.schools.set(schools_data)
        
        return instance