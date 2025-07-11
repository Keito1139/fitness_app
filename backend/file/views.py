# file/views.py

from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.parsers import MultiPartParser, FormParser
from django.http import HttpResponse
from permissions import IsAdminUser
from .serializers import SchoolBulkCreateSerializer, ExcelTemplateSerializer
import pandas as pd


class ExcelUploadViewSet(viewsets.ViewSet):
    """
    エクセルファイル一括登録用ビューセット
    
    管理者のみアクセス可能
    """
    permission_classes = [IsAuthenticated, IsAdminUser]
    parser_classes = [MultiPartParser, FormParser]
    
    @action(detail=False, methods=['post'], url_path='bulk-upload')
    def bulk_upload_schools(self, request):
        try:
            if 'file' not in request.FILES:
                return Response({
                    'success': False,
                    'error': 'ファイルが選択されていません。'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # ファイルデータの準備
            file_data = {'file': request.FILES['file']}
            
            # シリアライザーでの検証と登録
            serializer = SchoolBulkCreateSerializer(data=file_data)
            
            if serializer.is_valid():
                # 一括登録の実行
                result = serializer.save()
                
                return Response({
                    'success': True,
                    'message': result['message'],
                    'details': result['details'],
                    'statistics': {
                        'schools_created': result['schools_created'],
                        'users_created': result['users_created'],
                        'places_created': result['places_created'],
                        'days_created': result['days_created']
                    }
                }, status=status.HTTP_201_CREATED)
            
            else:
                # バリデーションエラー
                return Response({
                    'success': False,
                    'error': 'データの検証に失敗しました。',
                    'validation_errors': serializer.errors
                }, status=status.HTTP_400_BAD_REQUEST)
        
        except Exception as e:
            
            return Response({
                'success': False,
                'error': f'サーバーエラーが発生しました: {str(e)}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    @action(detail=False, methods=['get'], url_path='download-template')
    def download_template(self, request):
        """
        エクセルテンプレートファイルのダウンロード
        
        GET /api/excel-upload/download-template/
        """
        try:
            serializer = ExcelTemplateSerializer()
            template_data = serializer.create({})  # save → create に修正
            
            # HTTPレスポンスの作成
            response = HttpResponse(
                template_data,
                content_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
            )
            response['Content-Disposition'] = 'attachment; filename="school_registration_template.xlsx"'
            
            return response
        
        except Exception as e:
            import traceback
            print(f"Template download error: {str(e)}")
            print(f"Traceback: {traceback.format_exc()}")
            
            return Response({
                'success': False,
                'error': f'テンプレートの生成に失敗しました: {str(e)}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    @action(detail=False, methods=['post'], url_path='validate-file')
    def validate_file(self, request):
        """
        エクセルファイルの事前検証（登録は行わない）
        
        POST /api/file/excel-upload/validate-file/
        """
        try:
            if 'file' not in request.FILES:
                return Response({
                    'success': False,
                    'error': 'ファイルが選択されていません。'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # ファイルデータの準備
            file_data = {'file': request.FILES['file']}
            
            # シリアライザーでの検証のみ実行
            serializer = SchoolBulkCreateSerializer(data=file_data)
            
            if serializer.is_valid():
                # 検証成功
                excel_data = serializer.validated_data['excel_data']
                
                # 統計情報の計算
                statistics = {
                    'users_count': len(excel_data['ユーザー情報']),
                    'places_count': len(excel_data['指導場所']),
                    'days_count': len(excel_data['曜日設定']),
                    'owners_count': len(excel_data['ユーザー情報'][excel_data['ユーザー情報']['権限'] == 'オーナー']),
                    'teachers_count': len(excel_data['ユーザー情報'][excel_data['ユーザー情報']['権限'] == '講師'])
                }
                
                # 学校情報の取得
                school_info = {
                    'school_name': excel_data['学校情報'].iloc[0]['学校名'],
                    'start_time': excel_data['学校情報'].iloc[0]['始業時間'] if pd.notna(excel_data['学校情報'].iloc[0]['始業時間']) else None,
                    'end_time': excel_data['学校情報'].iloc[0]['終業時間'] if pd.notna(excel_data['学校情報'].iloc[0]['終業時間']) else None
                }
                
                return Response({
                    'success': True,
                    'message': 'ファイルの検証に成功しました。',
                    'statistics': statistics,
                    'school_info': school_info
                }, status=status.HTTP_200_OK)
            
            else:
                # バリデーションエラーの詳細を取得
                error_details = []
                for field, errors in serializer.errors.items():
                    if field == 'non_field_errors':
                        error_details.extend(errors)
                    else:
                        error_details.append(f"{field}: {', '.join(errors)}")
                
                return Response({
                    'success': False,
                    'error': 'ファイルの検証に失敗しました。',
                    'validation_errors': serializer.errors,
                    'error_details': error_details  # 詳細なエラー情報を追加
                }, status=status.HTTP_400_BAD_REQUEST)
        
        except Exception as e:
            import traceback
            print(f"Validation error: {str(e)}")
            print(f"Traceback: {traceback.format_exc()}")
            
            return Response({
                'success': False,
                'error': f'検証中にエラーが発生しました: {str(e)}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    @action(detail=False, methods=['get'], url_path='upload-history')
    def upload_history(self, request):
        try:
            # 実装例: ログファイルからアップロード履歴を取得
            # 実際の実装では、アップロード履歴をデータベースに保存することを推奨
            
            # 仮の履歴データ
            history = [
                {
                    'id': 1,
                    'upload_date': '2024-01-15T10:30:00Z',
                    'uploaded_by': 'admin1',
                    'file_name': 'schools_2024_01.xlsx',
                    'status': 'success',
                    'schools_created': 5,
                    'users_created': 23,
                    'places_created': 15,
                    'days_created': 25
                },
                {
                    'id': 2,
                    'upload_date': '2024-01-10T14:15:00Z',
                    'uploaded_by': 'admin2',
                    'file_name': 'test_data.xlsx',
                    'status': 'failed',
                    'error_message': 'データの検証に失敗しました'
                }
            ]
            
            return Response({
                'success': True,
                'history': history
            }, status=status.HTTP_200_OK)
        
        except Exception as e:
            
            return Response({
                'success': False,
                'error': f'履歴の取得に失敗しました: {str(e)}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    @action(detail=False, methods=['get'], url_path='format-guide')
    def format_guide(self, request):
        format_guide = {
            'description': '1つの学校とその関連データを一括登録するためのフォーマットです。',
            'sheets': [
                {
                    'name': '学校情報',
                    'description': '登録する学校の基本情報（1校のみ）',
                    'required_columns': [
                        {'name': '学校名', 'type': 'string', 'description': '学校の名前（重複不可）'},
                        {'name': '始業時間', 'type': 'time', 'description': 'HH:MM形式（例: 08:00）', 'optional': True},
                        {'name': '終業時間', 'type': 'time', 'description': 'HH:MM形式（例: 15:00）', 'optional': True}
                    ],
                    'notes': ['1つの学校のみ登録できます']
                },
                {
                    'name': 'ユーザー情報',
                    'description': '学校に所属するオーナー（1人）と講師（複数人）の情報',
                    'required_columns': [
                        {'name': 'ユーザー名', 'type': 'string', 'description': 'ログイン用のユーザー名（重複不可）'},
                        {'name': 'メールアドレス', 'type': 'email', 'description': '有効なメールアドレス（重複不可）'},
                        {'name': '姓', 'type': 'string', 'description': 'ユーザーの姓'},
                        {'name': '名', 'type': 'string', 'description': 'ユーザーの名'},
                        {'name': '権限', 'type': 'choice', 'description': 'オーナー または 講師', 'choices': ['オーナー', '講師']}
                    ],
                    'notes': [
                        'オーナーは必ず1人のみ設定してください',
                        '講師は複数人登録可能です（最低1人は必要）',
                        'パスワードは自動的に「ユーザー名+123」で設定されます'
                    ]
                },
                {
                    'name': '指導場所',
                    'description': '学校の指導場所（複数登録可能）',
                    'required_columns': [
                        {'name': '指導場所名', 'type': 'string', 'description': '教室名や場所の名前（重複不可）'}
                    ],
                    'notes': ['複数の指導場所を登録できます']
                },
                {
                    'name': '曜日設定',
                    'description': '学校の曜日設定（複数登録可能）',
                    'required_columns': [
                        {'name': '順番', 'type': 'integer', 'description': '曜日の順番（重複不可）'},
                        {'name': '曜日名', 'type': 'string', 'description': '曜日の名前（例: 月曜日）（重複不可）'}
                    ],
                    'notes': ['順番と曜日名は重複できません']
                }
            ],
            'general_notes': [
                'エクセルファイル形式（.xlsx または .xls）でアップロードしてください',
                'ファイルサイズは10MB以下にしてください',
                'シート名は上記の通りに正確に設定してください',
                'すべての必須列を含む必要があります',
                '1回のアップロードで1つの学校のみ登録できます',
                'データに重複や不整合がある場合、アップロードは失敗します'
            ]
        }
        
        return Response({
            'success': True,
            'format_guide': format_guide
        }, status=status.HTTP_200_OK)