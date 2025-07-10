# account/management/commands/reset_migrations.py

import os
import glob
from pathlib import Path
from django.core.management.base import BaseCommand
from django.conf import settings


class Command(BaseCommand):
    help = 'Reset all migrations and database for development'

    def add_arguments(self, parser):
        parser.add_argument(
            '--confirm',
            action='store_true',
            help='Confirm that you want to delete all migrations and database',
        )
        parser.add_argument(
            '--keep-db',
            action='store_true',
            help='Keep database file (only delete migration files)',
        )

    def handle(self, *args, **options):
        if not options['confirm']:
            self.stdout.write(
                self.style.WARNING(
                    'This command will DELETE all migration files and the database!\n'
                    'This should only be used in development.\n'
                    'Run with --confirm flag to proceed.\n'
                    'Example: python manage.py reset_migrations --confirm'
                )
            )
            return

        self.stdout.write(self.style.SUCCESS('Starting migration reset...'))
        
        # 削除対象のアプリ一覧
        target_apps = ['account', 'config', 'school', 'shift']
        
        # マイグレーションファイルを削除
        self.delete_migration_files(target_apps)
        
        # データベースファイルを削除（オプション）
        if not options['keep_db']:
            self.delete_database_file()
        
        self.stdout.write(
            self.style.SUCCESS(
                'Migration reset completed!\n'
                'Next steps:\n'
                '1. python manage.py makemigrations\n'
                '2. python manage.py migrate\n'
                '3. python manage.py createsuperuser\n'
                '4. python manage.py setup_initial_data'
            )
        )

    def delete_migration_files(self, target_apps):
        """マイグレーションファイルを削除"""
        total_deleted = 0
        
        for app_name in target_apps:
            app_path = Path(settings.BASE_DIR) / app_name / 'migrations'
            
            if not app_path.exists():
                self.stdout.write(
                    self.style.WARNING(f'Migration directory not found: {app_path}')
                )
                continue
            
            # 削除対象のファイルパターン
            patterns = ['0*.py', '0*.pyc']
            deleted_files = []
            
            for pattern in patterns:
                files = glob.glob(str(app_path / pattern))
                for file_path in files:
                    try:
                        os.remove(file_path)
                        deleted_files.append(os.path.basename(file_path))
                        total_deleted += 1
                    except OSError as e:
                        self.stdout.write(
                            self.style.ERROR(f'Failed to delete {file_path}: {e}')
                        )
            
            # __pycache__ ディレクトリも削除
            pycache_path = app_path / '__pycache__'
            if pycache_path.exists():
                try:
                    import shutil
                    shutil.rmtree(pycache_path)
                    self.stdout.write(
                        self.style.SUCCESS(f'Deleted __pycache__ in {app_name}')
                    )
                except OSError as e:
                    self.stdout.write(
                        self.style.ERROR(f'Failed to delete __pycache__ in {app_name}: {e}')
                    )
            
            if deleted_files:
                self.stdout.write(
                    self.style.SUCCESS(
                        f'Deleted {len(deleted_files)} migration files from {app_name}: '
                        f'{", ".join(deleted_files)}'
                    )
                )
            else:
                self.stdout.write(
                    self.style.WARNING(f'No migration files found in {app_name}')
                )
        
        self.stdout.write(
            self.style.SUCCESS(f'Total migration files deleted: {total_deleted}')
        )

    def delete_database_file(self):
        """データベースファイルを削除"""
        # SQLiteデータベースファイルのパスを取得
        db_config = settings.DATABASES['default']
        
        if db_config['ENGINE'] != 'django.db.backends.sqlite3':
            self.stdout.write(
                self.style.WARNING(
                    'Database is not SQLite. Skipping database file deletion.'
                )
            )
            return
        
        db_path = Path(db_config['NAME'])
        
        if db_path.exists():
            try:
                os.remove(db_path)
                self.stdout.write(
                    self.style.SUCCESS(f'Deleted database file: {db_path}')
                )
            except OSError as e:
                self.stdout.write(
                    self.style.ERROR(f'Failed to delete database file: {e}')
                )
        else:
            self.stdout.write(
                self.style.WARNING(f'Database file not found: {db_path}')
            )
        
        # SQLiteのジャーナルファイルも削除
        journal_files = [
            str(db_path) + '-journal',
            str(db_path) + '-wal',
            str(db_path) + '-shm'
        ]
        
        for journal_file in journal_files:
            journal_path = Path(journal_file)
            if journal_path.exists():
                try:
                    os.remove(journal_path)
                    self.stdout.write(
                        self.style.SUCCESS(f'Deleted journal file: {journal_path}')
                    )
                except OSError as e:
                    self.stdout.write(
                        self.style.ERROR(f'Failed to delete journal file: {e}')
                    )

    def handle_exception(self, exception):
        """例外処理"""
        self.stdout.write(
            self.style.ERROR(f'An error occurred: {str(exception)}')
        )
        return False