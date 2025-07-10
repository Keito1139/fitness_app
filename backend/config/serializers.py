# config/serializers.py

from rest_framework import serializers
from .models import Place, Day

class PlaceSerializer(serializers.ModelSerializer):
    """場所シリアライザー"""
    class Meta:
        model = Place
        fields = ['id', 'name', 'school']


class DaySerializer(serializers.ModelSerializer):
    """曜日シリアライザー"""
    class Meta:
        model = Day
        fields = ['id', 'name', 'order', 'school']