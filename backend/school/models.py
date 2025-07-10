# school/models.py

from django.db import models

class School(models.Model):
    name = models.CharField(max_length=255, verbose_name="学校名")
    start_time = models.TimeField(blank=True, null=True, verbose_name="始業時間")
    end_time = models.TimeField(blank=True, null=True, verbose_name="終業時間")

    class Meta:
        verbose_name = "学校"
        verbose_name_plural = "学校"

    def __str__(self):
        return self.name