# account/filters.py

import django_filters
from django.db import models
from .models import CustomUser


class TeacherFilter(django_filters.FilterSet):
    """講師検索・フィルタリング用フィルターセット"""
    
    # 基本フィルター
    is_active = django_filters.BooleanFilter(field_name='is_active')
    current_school = django_filters.NumberFilter(field_name='current_school')
    schools = django_filters.NumberFilter(field_name='schools', method='filter_by_schools')
    
    # 日付フィルター
    date_joined_after = django_filters.DateFilter(field_name='date_joined', lookup_expr='gte')
    date_joined_before = django_filters.DateFilter(field_name='date_joined', lookup_expr='lte')
    last_login_after = django_filters.DateTimeFilter(field_name='last_login', lookup_expr='gte')
    last_login_before = django_filters.DateTimeFilter(field_name='last_login', lookup_expr='lte')
    
    # 文字列検索フィルター
    username_contains = django_filters.CharFilter(field_name='username', lookup_expr='icontains')
    email_contains = django_filters.CharFilter(field_name='email', lookup_expr='icontains')
    first_name_contains = django_filters.CharFilter(field_name='first_name', lookup_expr='icontains')
    last_name_contains = django_filters.CharFilter(field_name='last_name', lookup_expr='icontains')
    
    # 複合検索（名前全体）
    full_name = django_filters.CharFilter(method='filter_by_full_name')
    
    # 範囲フィルター
    id_in = django_filters.BaseInFilter(field_name='id', lookup_expr='in')
    schools_in = django_filters.BaseInFilter(field_name='schools', method='filter_by_schools_in')
    
    # 除外フィルター
    exclude_ids = django_filters.BaseInFilter(field_name='id', lookup_expr='in', exclude=True)
    
    class Meta:
        model = CustomUser
        fields = {
            'is_active': ['exact'],
            'current_school': ['exact'],
            'date_joined': ['exact', 'gte', 'lte'],
            'last_login': ['exact', 'gte', 'lte'],
            'username': ['exact', 'icontains'],
            'email': ['exact', 'icontains'],
            'first_name': ['exact', 'icontains'],
            'last_name': ['exact', 'icontains'],
        }
    
    def filter_by_schools(self, queryset, name, value):
        """学校IDで講師をフィルタリング"""
        if value:
            return queryset.filter(schools__id=value).distinct()
        return queryset
    
    def filter_by_schools_in(self, queryset, name, values):
        """複数の学校IDで講師をフィルタリング"""
        if values:
            return queryset.filter(schools__id__in=values).distinct()
        return queryset
    
    def filter_by_full_name(self, queryset, name, value):
        """フルネーム（姓名）で検索"""
        if value:
            # スペースで分割して姓名を検索
            names = value.split()
            if len(names) == 1:
                # 1つの単語の場合、姓または名のどちらかに一致
                return queryset.filter(
                    models.Q(first_name__icontains=names[0]) |
                    models.Q(last_name__icontains=names[0])
                )
            elif len(names) >= 2:
                # 2つ以上の単語の場合、姓と名の組み合わせで検索
                return queryset.filter(
                    models.Q(first_name__icontains=names[0], last_name__icontains=names[1]) |
                    models.Q(first_name__icontains=names[1], last_name__icontains=names[0])
                )
        return queryset