# account/serializers.py

from rest_framework import serializers
from django.contrib.auth import authenticate
from .models import CustomUser, OwnerProfile, TeacherProfile
from school.models import School


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


class OwnerProfileSerializer(serializers.ModelSerializer):
    """オーナープロフィール用シリアライザー"""
    user = UserSerializer(read_only=True)
    
    class Meta:
        model = OwnerProfile
        fields = ['user']


class TeacherProfileSerializer(serializers.ModelSerializer):
    """教師プロフィール用シリアライザー"""
    user = UserSerializer(read_only=True)
    
    class Meta:
        model = TeacherProfile
        fields = ['user']