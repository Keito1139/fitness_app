# config/models.py

from django.db import models
from school.models import School

class Place(models.Model):
    name = models.CharField(max_length=200, verbose_name="指導場所")
    school = models.ForeignKey(School, on_delete=models.CASCADE, related_name='places')

    class Meta:
        verbose_name = "指導場所"
        verbose_name_plural = "指導場所"

    def __str__(self):
        return self.name


class Day(models.Model):
    order = models.IntegerField(unique=False, verbose_name="順番")
    name = models.CharField(max_length=50, verbose_name="曜日名")
    school = models.ForeignKey(School, on_delete=models.CASCADE, related_name='days')

    class Meta:
        verbose_name = "曜日"
        verbose_name_plural = "曜日"
        ordering = ['order']

    def __str__(self):
        return self.name
