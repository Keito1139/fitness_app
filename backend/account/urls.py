# account/urls.py

from django.urls import path
from . import views

urlpatterns = [
    # 認証関連
    path('owner-login/', views.OwnerLoginView.as_view(), name='owner_login'),
    path('logout/', views.LogoutView.as_view(), name='logout'),
    path('csrf/', views.CSRFTokenView.as_view(), name='csrf_token'),
    
    # プロフィール関連
    path('profile/', views.UserProfileView.as_view(), name='user_profile'),
    path('owner-profile/', views.OwnerProfileView.as_view(), name='owner_profile'),
    path('teacher-profile/', views.TeacherProfileView.as_view(), name='teacher_profile'),
]