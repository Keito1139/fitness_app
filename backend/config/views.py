# config/views.py
from rest_framework import viewsets, filters
from rest_framework.permissions import IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend
from .models import Place
from .serializers import PlaceSerializer

class PlaceViewSet(viewsets.ReadOnlyModelViewSet):
    """指導場所のViewSet（読み取り専用）"""
    serializer_class = PlaceSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]
    filterset_fields = ['school']
    search_fields = ['name']
    
    def get_queryset(self):
        """ユーザーの所属学校の指導場所のみ取得"""
        queryset = Place.objects.all()
        
        # オーナーは自分の学校の指導場所のみ
        if self.request.user.is_owner and not self.request.user.is_superuser:
            user_schools = self.request.user.schools.all()
            queryset = queryset.filter(school__in=user_schools)
        
        return queryset.select_related('school')