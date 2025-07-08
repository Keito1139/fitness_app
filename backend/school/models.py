# school/models.py

from django.db import models

class School(models.Model):
    name = models.CharField(max_length=255, verbose_name="学校名")