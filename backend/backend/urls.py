from django.contrib import admin
from django.urls import path, include

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/account/', include('account.urls')),
    path('api/school/', include('school.urls')),
    path('api/shift/', include('shift.urls')),
    path('api/config/', include('config.urls')),
]
