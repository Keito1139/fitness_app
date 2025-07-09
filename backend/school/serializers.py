# school/serializers.py

from rest_framework import serializers
from school.models import School

class SchoolSerializer(serializers.ModelSerializer):
    """学校のシリアライザー"""
    
    class Meta:
        model = School
        fields = ['id', 'name']
        read_only_fields = ['id']

    def validate_name(self, value):
        """学校名の重複チェック"""
        if School.objects.filter(name=value).exists():
            # 更新時は自分以外での重複をチェック
            if self.instance and School.objects.filter(name=value).exclude(id=self.instance.id).exists():
                raise serializers.ValidationError("この学校名は既に使用されています。")
            elif not self.instance:
                raise serializers.ValidationError("この学校名は既に使用されています。")
        return value