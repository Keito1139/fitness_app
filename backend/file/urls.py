# file/urls.py

from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import ExcelUploadViewSet

router = DefaultRouter()
router.register('excel-upload', ExcelUploadViewSet, basename='excel-upload')

urlpatterns = [
    path('', include(router.urls)),
]