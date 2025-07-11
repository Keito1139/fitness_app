# file/serializers.py

from rest_framework import serializers
from django.contrib.auth import get_user_model
from django.db import transaction
from school.models import School
from config.models import Place, Day
from account.models import OwnerProfile, TeacherProfile
import pandas as pd
import io

User = get_user_model()

class ExcelUploadSerializer(serializers.Serializer):
    """エクセルファイルアップロード用シリアライザー"""
    file = serializers.FileField()
    
    def validate_file(self, value):
        """ファイル形式の検証"""
        if not value.name.endswith(('.xlsx', '.xls')):
            raise serializers.ValidationError("エクセルファイル(.xlsx, .xls)をアップロードしてください。")
        
        # ファイルサイズ制限 (10MB)
        if value.size > 10 * 1024 * 1024:
            raise serializers.ValidationError("ファイルサイズは10MB以下にしてください。")
        
        return value


class SchoolBulkCreateSerializer(serializers.Serializer):
    """学校情報一括作成用シリアライザー"""
    
    # fileフィールドを追加
    file = serializers.FileField()
    
    def validate_file(self, value):
        """ファイル形式の検証"""
        if not value.name.endswith(('.xlsx', '.xls')):
            raise serializers.ValidationError("エクセルファイル(.xlsx, .xls)をアップロードしてください。")
        
        # ファイルサイズ制限 (10MB)
        if value.size > 10 * 1024 * 1024:
            raise serializers.ValidationError("ファイルサイズは10MB以下にしてください。")
        
        return value
    
    def validate(self, data):
        """データ全体の検証"""
        file = data.get('file')
        if not file:
            raise serializers.ValidationError("ファイルが選択されていません。")
        
        try:
            # エクセルファイルの読み込み
            df = pd.read_excel(file, sheet_name=None)  # 全シートを読み込み
            
            # 必要なシートの存在確認
            required_sheets = ['学校情報', 'ユーザー情報', '指導場所', '曜日設定']
            missing_sheets = [sheet for sheet in required_sheets if sheet not in df.keys()]
            
            if missing_sheets:
                raise serializers.ValidationError(
                    f"必要なシートが見つかりません: {', '.join(missing_sheets)}"
                )
            
            # 各シートのデータ検証
            self._validate_school_sheet(df['学校情報'])
            self._validate_user_sheet(df['ユーザー情報'])
            self._validate_place_sheet(df['指導場所'])
            self._validate_day_sheet(df['曜日設定'])
            
            # 検証済みデータを保存
            data['excel_data'] = df
            
        except Exception as e:
            if isinstance(e, serializers.ValidationError):
                raise
            raise serializers.ValidationError(f"エクセルファイルの読み込みに失敗しました: {str(e)}")
        
        return data
    
    def _validate_school_sheet(self, df):
        """学校情報シートの検証"""
        required_columns = ['学校名', '始業時間', '終業時間']
        missing_columns = [col for col in required_columns if col not in df.columns]
        
        if missing_columns:
            raise serializers.ValidationError(
                f"学校情報シートに必要な列が見つかりません: {', '.join(missing_columns)}"
            )
        
        if df.empty:
            raise serializers.ValidationError("学校情報シートにデータがありません。")
        
        # 学校は1つのみ許可
        if len(df) > 1:
            raise serializers.ValidationError(
                f"学校情報シートには1つの学校のみ登録できます。現在{len(df)}件のデータがあります。"
            )
        
        # 既存学校との重複チェック
        school_name = df.iloc[0]['学校名']
        if School.objects.filter(name=school_name).exists():
            raise serializers.ValidationError(
                f"学校「{school_name}」は既に登録されています。"
            )
    
    def _validate_user_sheet(self, df):
        """ユーザー情報シートの検証"""
        required_columns = ['ユーザー名', 'メールアドレス', '姓', '名', '権限']
        missing_columns = [col for col in required_columns if col not in df.columns]
        
        if missing_columns:
            raise serializers.ValidationError(
                f"ユーザー情報シートに必要な列が見つかりません: {', '.join(missing_columns)}"
            )
        
        if df.empty:
            raise serializers.ValidationError("ユーザー情報シートにデータがありません。")
        
        # 権限の値チェック
        valid_permissions = ['オーナー', '講師']
        invalid_permissions = df[~df['権限'].isin(valid_permissions)]['権限'].unique()
        if len(invalid_permissions) > 0:
            raise serializers.ValidationError(
                f"無効な権限が指定されています: {', '.join(invalid_permissions)}。"
                f"有効な値: {', '.join(valid_permissions)}"
            )
        
        # ユーザー名の重複チェック
        duplicates = df[df['ユーザー名'].duplicated()]['ユーザー名'].tolist()
        if duplicates:
            raise serializers.ValidationError(
                f"ユーザー情報シートで重複するユーザー名があります: {', '.join(duplicates)}"
            )
        
        # メールアドレスの重複チェック
        email_duplicates = df[df['メールアドレス'].duplicated()]['メールアドレス'].tolist()
        if email_duplicates:
            raise serializers.ValidationError(
                f"ユーザー情報シートで重複するメールアドレスがあります: {', '.join(email_duplicates)}"
            )
        
        # 既存ユーザーとの重複チェック
        existing_usernames = User.objects.filter(username__in=df['ユーザー名'].tolist())
        if existing_usernames.exists():
            existing_names = [user.username for user in existing_usernames]
            raise serializers.ValidationError(
                f"既に登録されているユーザー名があります: {', '.join(existing_names)}"
            )
        
        existing_emails = User.objects.filter(email__in=df['メールアドレス'].tolist())
        if existing_emails.exists():
            existing_email_list = [user.email for user in existing_emails]
            raise serializers.ValidationError(
                f"既に登録されているメールアドレスがあります: {', '.join(existing_email_list)}"
            )
        
        # オーナーが1人のみかチェック
        owners = df[df['権限'] == 'オーナー']
        if len(owners) == 0:
            raise serializers.ValidationError("オーナーが設定されていません。1人のオーナーが必要です。")
        elif len(owners) > 1:
            raise serializers.ValidationError(
                f"オーナーは1人のみ設定できます。現在{len(owners)}人のオーナーが設定されています。"
            )
        
        # 講師が少なくとも1人いるかチェック
        teachers = df[df['権限'] == '講師']
        if len(teachers) == 0:
            raise serializers.ValidationError("講師が設定されていません。少なくとも1人の講師が必要です。")
    
    def _validate_place_sheet(self, df):
        """指導場所シートの検証"""
        required_columns = ['指導場所名']
        missing_columns = [col for col in required_columns if col not in df.columns]
        
        if missing_columns:
            raise serializers.ValidationError(
                f"指導場所シートに必要な列が見つかりません: {', '.join(missing_columns)}"
            )
        
        if df.empty:
            raise serializers.ValidationError("指導場所シートにデータがありません。")
        
        # 指導場所名の重複チェック
        duplicates = df[df['指導場所名'].duplicated()]['指導場所名'].tolist()
        if duplicates:
            raise serializers.ValidationError(
                f"指導場所シートで重複する指導場所名があります: {', '.join(duplicates)}"
            )
    
    def _validate_day_sheet(self, df):
        """曜日設定シートの検証"""
        required_columns = ['順番', '曜日名']
        missing_columns = [col for col in required_columns if col not in df.columns]
        
        if missing_columns:
            raise serializers.ValidationError(
                f"曜日設定シートに必要な列が見つかりません: {', '.join(missing_columns)}"
            )
        
        if df.empty:
            raise serializers.ValidationError("曜日設定シートにデータがありません。")
        
        # 順番の重複チェック
        duplicated_orders = df[df['順番'].duplicated()]['順番'].tolist()
        if duplicated_orders:
            raise serializers.ValidationError(
                f"曜日設定シートで重複する順番があります: {', '.join(map(str, duplicated_orders))}"
            )
        
        # 曜日名の重複チェック
        duplicated_days = df[df['曜日名'].duplicated()]['曜日名'].tolist()
        if duplicated_days:
            raise serializers.ValidationError(
                f"曜日設定シートで重複する曜日名があります: {', '.join(duplicated_days)}"
            )
    
    @transaction.atomic
    def create(self, validated_data):
        """データベースへの一括登録"""
        excel_data = validated_data['excel_data']
        
        result = {
            'schools_created': 0,
            'users_created': 0,
            'places_created': 0,
            'days_created': 0,
            'details': []
        }
        
        try:
            # 1. 学校の作成（1校のみ）
            schools_df = excel_data['学校情報']
            school_row = schools_df.iloc[0]  # 最初の行のみ取得
            
            school = School.objects.create(
                name=school_row['学校名'],
                start_time=school_row['始業時間'] if pd.notna(school_row['始業時間']) else None,
                end_time=school_row['終業時間'] if pd.notna(school_row['終業時間']) else None
            )
            result['schools_created'] = 1
            result['details'].append(f"学校「{school.name}」を作成しました")
            
            # 2. ユーザーの作成
            users_df = excel_data['ユーザー情報']
            
            for _, row in users_df.iterrows():
                # デフォルトパスワードを設定
                default_password = f"{row['ユーザー名']}123"
                
                user = User.objects.create_user(
                    username=row['ユーザー名'],
                    email=row['メールアドレス'],
                    first_name=row['名'],
                    last_name=row['姓'],
                    password=default_password,
                    is_owner=(row['権限'] == 'オーナー'),
                    is_teacher=(row['権限'] == '講師'),
                    current_school=school
                )
                
                # 学校をユーザーに関連付け
                user.schools.add(school)
                
                # プロフィールの作成
                if row['権限'] == 'オーナー':
                    OwnerProfile.objects.create(user=user)
                elif row['権限'] == '講師':
                    TeacherProfile.objects.create(user=user)
                
                result['users_created'] += 1
                result['details'].append(
                    f"{row['権限']}「{user.last_name} {user.first_name}」を作成しました "
                    f"(ユーザー名: {user.username})"
                )
            
            # 3. 指導場所の作成
            places_df = excel_data['指導場所']
            
            for _, row in places_df.iterrows():
                place = Place.objects.create(
                    name=row['指導場所名'],
                    school=school
                )
                result['places_created'] += 1
                result['details'].append(f"指導場所「{place.name}」を作成しました")
            
            # 4. 曜日の作成
            days_df = excel_data['曜日設定']
            
            for _, row in days_df.iterrows():
                day = Day.objects.create(
                    order=int(row['順番']),
                    name=row['曜日名'],
                    school=school
                )
                result['days_created'] += 1
                result['details'].append(f"曜日「{day.name}」を作成しました (順番: {day.order})")
            
            result['success'] = True
            result['message'] = (
                f"学校「{school.name}」の一括登録が完了しました。"
                f"ユーザー: {result['users_created']}件、"
                f"指導場所: {result['places_created']}件、"
                f"曜日: {result['days_created']}件"
            )
            
        except Exception as e:
            # トランザクションが自動的にロールバックされる
            result['success'] = False
            result['message'] = f"登録中にエラーが発生しました: {str(e)}"
            raise serializers.ValidationError(result['message'])
        
        return result


class ExcelTemplateSerializer(serializers.Serializer):
    """エクセルテンプレート生成用シリアライザー"""
    
    def create(self, validated_data):
        """エクセルテンプレートを生成"""
        try:
            # テンプレートデータの作成
            template_data = {
                '学校情報': pd.DataFrame({
                    '学校名': ['サンプル小学校'],
                    '始業時間': ['08:00'],
                    '終業時間': ['15:00'],
                    '備考': ['必須項目: 学校名。時間は HH:MM 形式で入力。1校のみ登録可能。']
                }),
                
                'ユーザー情報': pd.DataFrame({
                    'ユーザー名': ['owner1', 'teacher1', 'teacher2', 'teacher3'],
                    'メールアドレス': ['owner1@example.com', 'teacher1@example.com', 
                                  'teacher2@example.com', 'teacher3@example.com'],
                    '姓': ['田中', '佐藤', '鈴木', '高橋'],
                    '名': ['太郎', '花子', '次郎', '美咲'],
                    '権限': ['オーナー', '講師', '講師', '講師'],
                    '備考': ['オーナーは1人のみ必須', '講師は複数人可能', 
                            'パスワードは「ユーザー名+123」', '例: owner1123']
                }),
                
                '指導場所': pd.DataFrame({
                    '指導場所名': ['ジム', 'プール', 'フロント', 'スタジオ'],
                    '備考': ['指導場所を複数登録可能', '', '', '']
                }),
                
                '曜日設定': pd.DataFrame({
                    '順番': [0, 1, 2, 3, 4],
                    '曜日名': ['月曜日', '火曜日', '水曜日', '木曜日', '金曜日'],
                    '備考': ['順番は重複不可', '', '', '', '']
                })
            }
            
            # バイナリデータとして返す
            output = io.BytesIO()
            # engineを明示的に指定
            with pd.ExcelWriter(output, engine='openpyxl') as writer:
                for sheet_name, df in template_data.items():
                    df.to_excel(writer, sheet_name=sheet_name, index=False)
            
            output.seek(0)
            return output.getvalue()
            
        except Exception as e:
            # より詳細なエラーログ
            import traceback
            print(f"Template generation error: {str(e)}")
            print(f"Traceback: {traceback.format_exc()}")
            raise serializers.ValidationError(f"テンプレート生成エラー: {str(e)}")