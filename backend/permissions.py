# backend/permissions.py

from rest_framework import permissions


class IsOwnerOrAdmin(permissions.BasePermission):
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        
        return request.user.is_owner or request.user.is_superuser  # is_admin → is_superuser
    
    def has_object_permission(self, request, view, obj):
        if not request.user or not request.user.is_authenticated:
            return False
        
        # 管理者は全てアクセス可能
        if request.user.is_superuser:  # is_admin → is_superuser
            return True
        
        # オーナーは自分の学校に関連するオブジェクトのみアクセス可能
        if request.user.is_owner:
            user_schools = request.user.schools.all()
            
            if hasattr(obj, 'schools'):
                return obj.schools.filter(id__in=user_schools).exists()
            
            if hasattr(obj, 'id') and hasattr(obj, 'name'):
                return obj in user_schools
        
        return False



class IsTeacher(permissions.BasePermission):
    """
    講師のみアクセス許可
    """
    
    def has_permission(self, request, view):
        """基本的な権限チェック"""
        if not request.user or not request.user.is_authenticated:
            return False
        
        return request.user.is_teacher


class IsOwnerOfSchool(permissions.BasePermission):
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        
        return request.user.is_owner or request.user.is_superuser  # is_admin → is_superuser
    
    def has_object_permission(self, request, view, obj):
        if not request.user or not request.user.is_authenticated:
            return False
        
        # 管理者は全てアクセス可能
        if request.user.is_superuser:  # is_admin → is_superuser
            return True
        
        # オーナーは自分の学校のみアクセス可能
        if request.user.is_owner:
            user_schools = request.user.schools.all()
            
            if hasattr(obj, 'current_school') and obj.current_school:
                return obj.current_school in user_schools
            elif hasattr(obj, 'school'):
                return obj.school in user_schools
        
        return False


class IsAdminUser(permissions.BasePermission):
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        
        return request.user.is_superuser 


class IsSameUserOrOwnerOrAdmin(permissions.BasePermission):
    def has_object_permission(self, request, view, obj):
        if not request.user or not request.user.is_authenticated:
            return False
        
        # 管理者は全てアクセス可能
        if request.user.is_superuser:  # is_admin → is_superuser
            return True
        
        # 自分自身の場合
        if obj == request.user:
            return True
        
        # オーナーは自分の学校の講師のみアクセス可能
        if request.user.is_owner:
            user_schools = request.user.schools.all()
            if hasattr(obj, 'schools'):
                return obj.schools.filter(id__in=user_schools).exists()
        
        return False