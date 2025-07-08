# accounts/views.py

from rest_framework import status, permissions
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.generics import RetrieveUpdateAPIView
from django.contrib.auth import login, logout
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator
from django.http import JsonResponse
from django.middleware.csrf import get_token
from .models import OwnerProfile, TeacherProfile
from .serializers import (
    OwnerLoginSerializer, UserSerializer,
    OwnerProfileSerializer, TeacherProfileSerializer
)


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
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


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