# shift/models.py

from django.db import models
from account.models import CustomUser
from config.models import Place, Day


class FixedShift(models.Model):
    day = models.ForeignKey(Day, on_delete=models.CASCADE, verbose_name="曜日")
    start_time = models.TimeField(verbose_name="固定シフト開始時間")
    end_time = models.TimeField(verbose_name="固定シフト終了時間")
    teacher = models.ManyToManyField(CustomUser, blank=True, related_name='fixed_shifts', verbose_name="固定シフト割当講師")
    place = models.ForeignKey(Place, related_name='fixed_shifts', on_delete=models.CASCADE, verbose_name="固定シフト場所")
    description = models.CharField(blank=True, null=True, max_length=200, verbose_name="固定シフト内容")

    class Meta:
        verbose_name = "固定シフト"
        verbose_name_plural = "固定シフト"
        ordering = ['day__order', 'start_time']

    def __str__(self):
        return f"{self.day.name} {self.start_time.strftime('%H:%M')}-{self.end_time.strftime('%H:%M')} - {self.place.name}"

    def get_duration_minutes(self):
        """シフトの長さを分単位で計算"""
        from datetime import datetime
        start = datetime.combine(datetime.today(), self.start_time)
        end = datetime.combine(datetime.today(), self.end_time)
        duration = end - start
        return int(duration.total_seconds() / 60)


class Shift(models.Model):
    date = models.DateField(verbose_name="日付")
    start_time = models.TimeField(verbose_name="コマ開始時間")
    end_time = models.TimeField(verbose_name="コマ終了時間")
    place = models.ForeignKey(Place, related_name='shifts', on_delete=models.CASCADE, verbose_name="シフト場所")
    teacher = models.ManyToManyField(CustomUser, blank=True, related_name='shifts', verbose_name="シフト割当講師")
    is_empty = models.BooleanField(default=False, verbose_name="このシフトを空けるかどうか")

    class Meta:
        verbose_name = "シフト"
        verbose_name_plural = "シフト"
        ordering = ['date', 'start_time']

    def __str__(self):
        return f"{self.date} {self.start_time}-{self.end_time} - {self.place.name}"

    def get_duration_minutes(self):
        """シフトの長さを分単位で計算"""
        from datetime import datetime
        start = datetime.combine(datetime.today(), self.start_time)
        end = datetime.combine(datetime.today(), self.end_time)
        duration = end - start
        return int(duration.total_seconds() / 60)