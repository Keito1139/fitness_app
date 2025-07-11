# backend/management/commands/create_sample_users.py

from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from account.models import OwnerProfile, TeacherProfile
from school.models import School

User = get_user_model()

class Command(BaseCommand):
    help = 'Create sample users (superuser, owner, teacher) and a school'

    def handle(self, *args, **options):
        # 学校を作成
        school, created = School.objects.get_or_create(
            name='フィットネスクラブ',
        )
        if created:
            self.stdout.write(self.style.SUCCESS(f'学校 "{school.name}" を作成しました'))
        else:
            self.stdout.write(self.style.WARNING(f'学校 "{school.name}" は既に存在します'))

        # スーパーユーザーを作成
        if not User.objects.filter(username='superuser').exists():
            superuser = User.objects.create_superuser(
                username='superuser',
                email='superuser@example.com',
                password='detteiu0113',
                first_name='太郎',
                last_name='管理者'
            )
            self.stdout.write(self.style.SUCCESS('スーパーユーザーを作成しました'))
        else:
            self.stdout.write(self.style.WARNING('スーパーユーザーは既に存在します'))

        # オーナーを作成
        if not User.objects.filter(username='owner').exists():
            owner = User.objects.create_user(
                username='owner',
                email='owner@example.com',
                password='detteiu0113',
                first_name='聡',
                last_name='山田',
                is_owner=True,
                current_school=school
            )
            # schoolsフィールドに学校を追加
            owner.schools.add(school)
            
            # オーナープロフィールを作成
            OwnerProfile.objects.create(user=owner)
            
            self.stdout.write(self.style.SUCCESS('オーナーを作成しました'))
        else:
            self.stdout.write(self.style.WARNING('オーナーは既に存在します'))

        # 講師を作成
        if not User.objects.filter(username='teacher').exists():
            teacher = User.objects.create_user(
                username='teacher',
                email='teacher@example.com',
                password='detteiu0113',
                first_name='琢磨',
                last_name='佐藤',
                is_teacher=True,
                current_school=school
            )
            # schoolsフィールドに学校を追加
            teacher.schools.add(school)
            
            # 教師プロフィールを作成
            TeacherProfile.objects.create(user=teacher)
            
            self.stdout.write(self.style.SUCCESS('講師を作成しました'))
        else:
            self.stdout.write(self.style.WARNING('講師は既に存在します'))

        self.stdout.write(self.style.SUCCESS('サンプルデータの作成が完了しました'))
        self.stdout.write(self.style.SUCCESS('---'))
        self.stdout.write(self.style.SUCCESS('作成されたアカウント:'))
        self.stdout.write(self.style.SUCCESS('スーパーユーザー - username: superuser, password: detteiu0113'))
        self.stdout.write(self.style.SUCCESS('オーナー - username: owner, password: detteiu0113'))
        self.stdout.write(self.style.SUCCESS('講師 - username: teacher, password: detteiu0113'))