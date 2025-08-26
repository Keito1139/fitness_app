# school/views.py

from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import filters
from .models import School
from .serializers import SchoolSerializer
from permissions import IsOwnerOrAdmin

class SchoolViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated, IsOwnerOrAdmin]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['name']
    ordering_fields = ['name', 'id']
    ordering = ['name']
    
    def get_queryset(self):
        """
        オーナーは自分の学校のみ、管理者は全ての学校を表示
        """
        if self.request.user.is_superuser:
            return School.objects.all()
        elif self.request.user.is_owner:
            return self.request.user.schools.all()
        else:
            return School.objects.none()
    
    def get_serializer_class(self):
        return SchoolSerializer