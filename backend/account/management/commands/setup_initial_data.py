# config/management/commands/setup_initial_data.py

from django.core.management.base import BaseCommand
from datetime import time
from school.models import School
from config.models import Place, Day


class Command(BaseCommand):
    help = 'Setup initial data for School, Place, and Day models'

    def add_arguments(self, parser):
        parser.add_argument(
            '--school-id',
            type=int,
            help='Specify school ID to setup data for. If not provided, will use the first school or create one.',
        )

    def handle(self, *args, **options):
        self.stdout.write(self.style.SUCCESS('Starting initial data setup...'))
        
        # 対象の学校を決定
        target_school = self.get_target_school(options.get('school_id'))
        
        if not target_school:
            self.stdout.write(
                self.style.ERROR('No school found or created. Aborting setup.')
            )
            return
        
        self.stdout.write(
            self.style.SUCCESS(f'Setting up data for school: {target_school.name}')
        )
        
        # 各モデルのデータ作成
        self.setup_days(target_school)
        self.setup_places(target_school)
        
        self.stdout.write(
            self.style.SUCCESS(
                f'Successfully completed initial data setup for {target_school.name}!'
            )
        )

    def get_target_school(self, school_id=None):
        """対象となる学校を取得または作成"""
        if school_id:
            try:
                school = School.objects.get(id=school_id)
                self.stdout.write(
                    self.style.SUCCESS(f'Using specified school: {school.name}')
                )
                return school
            except School.DoesNotExist:
                self.stdout.write(
                    self.style.ERROR(f'School with ID {school_id} not found.')
                )
                return None
        
        # 既存の学校があるかチェック
        existing_school = School.objects.first()
        if existing_school:
            # 始業・終業時間が設定されていない場合は設定
            if not existing_school.start_time or not existing_school.end_time:
                existing_school.start_time = time(9, 0)   # 9:00
                existing_school.end_time = time(17, 0)    # 17:00
                existing_school.save()
                self.stdout.write(
                    self.style.SUCCESS(f'Updated school times for: {existing_school.name}')
                )
            return existing_school
        
        # 学校がない場合は作成
        school = School.objects.create(
            name="サンプル学校",
            start_time=time(9, 0),  # 9:00
            end_time=time(17, 0)    # 17:00
        )
        self.stdout.write(
            self.style.SUCCESS(f'Created new school: {school.name}')
        )
        return school

    def setup_places(self, school):
        """指導場所のデータを作成"""
        places_data = [
            "スタジオ1",
            "スタジオ2", 
            "スタジオ3",
            "プール",
            "ガード",
            "ジム",
            "ガイダンス",
            "フロント",
            "p",
            "内務",
            "休憩",
            "低",
        ]
        
        created_places = []
        for place_name in places_data:
            place, created = Place.objects.get_or_create(
                name=place_name,
                school=school,
                defaults={
                    'name': place_name,
                    'school': school
                }
            )
            if created:
                created_places.append(place_name)
                self.stdout.write(
                    self.style.SUCCESS(f'Created place: {place_name} for {school.name}')
                )
            else:
                self.stdout.write(
                    self.style.WARNING(f'Place already exists: {place_name} for {school.name}')
                )
        
        if created_places:
            self.stdout.write(
                self.style.SUCCESS(f'Created {len(created_places)} new places for {school.name}')
            )

    def setup_days(self, school):
        """曜日のデータを作成（月〜金）"""
        days_data = [
            (0, "月曜日"),
            (1, "火曜日"),
            (2, "水曜日"),
            (3, "木曜日"),
            (4, "金曜日")
        ]
        
        created_days = []
        for order, day_name in days_data:
            day, created = Day.objects.get_or_create(
                order=order,
                school=school,
                defaults={
                    'name': day_name,
                    'school': school
                }
            )
            if created:
                created_days.append(day)
                self.stdout.write(
                    self.style.SUCCESS(f'Created day: {order} - {day_name} for {school.name}')
                )
            else:
                created_days.append(day)  # 既存のものも含める
                self.stdout.write(
                    self.style.WARNING(f'Day already exists: {order} - {day_name} for {school.name}')
                )
        
        self.stdout.write(
            self.style.SUCCESS(f'Processed {len(created_days)} days for {school.name}')
        )
        return created_days

    def handle_exception(self, exception):
        """例外処理"""
        self.stdout.write(
            self.style.ERROR(f'An error occurred: {str(exception)}')
        )
        return False