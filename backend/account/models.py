# account/models.py

from django.db import models
from django.contrib.auth.models import AbstractUser
from school.models import School
from config.models import Place


class CustomUser(AbstractUser):
    # 独自のフィールドのみ追加
    is_owner = models.BooleanField(default=False, verbose_name="オーナー権限")
    is_teacher = models.BooleanField(default=False, verbose_name="教師権限")
    schools = models.ManyToManyField(School, blank=True)
    current_school = models.ForeignKey(School, blank=True, null=True, on_delete=models.SET_NULL, related_name='users')

    # 必要に応じてAbstractUserのフィールドを上書き
    email = models.EmailField(unique=True, verbose_name="メールアドレス")
    place = models.ManyToManyField(Place, related_name='teacher_profiles', verbose_name="指導可能場所", blank=True)

    class Meta:
        verbose_name = "カスタムユーザー"
        verbose_name_plural = "カスタムユーザー"

    def __str__(self):
        return f"{self.username} ({self.last_name} {self.first_name}) - {self.current_school.name if self.current_school else 'No School'}"

# オーナープロフィール
class OwnerProfile(models.Model):
    user = models.OneToOneField(CustomUser, on_delete=models.CASCADE, related_name='owner_profile')

    def __str__(self):
        return f'{self.user}'
    
# 教師プロフィール
class TeacherProfile(models.Model):
    user = models.OneToOneField(CustomUser, on_delete=models.CASCADE, related_name='teacher_profile')

    def __str__(self):
        return f'{self.user}'
    