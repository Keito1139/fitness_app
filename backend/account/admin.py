from django.contrib import admin
from .models import CustomUser, OwnerProfile, TeacherProfile

admin.site.register(CustomUser)
admin.site.register(OwnerProfile)
admin.site.register(TeacherProfile)