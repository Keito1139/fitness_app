# shift/urls.py

from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import FixedShiftViewSet

router = DefaultRouter()
router.register('fixed-shift', FixedShiftViewSet, basename='fixed-shift')

urlpatterns = [
    path('', include(router.urls)),
]