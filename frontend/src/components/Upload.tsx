// frontend/src/components/Upload.tsx

import React, { useEffect, useRef, useState } from "react";
import {
  Upload,
  Download,
  CheckCircle,
  AlertCircle,
  FileSpreadsheet,
  Users,
  School,
  MapPin,
  Calendar,
  Info,
  RotateCcw,
  History,
  BookOpen,
  X,
  Eye,
  EyeOff,
} from "lucide-react";
import { useExcelUpload } from "..//hooks/useUpload";
import ConfirmModal from "./common/ConfirmModal";

const ExcelUpload: React.FC = () => {
  const {
    formData,
    uploadHistory,
    formatGuide,
    isLoadingHistory,
    isLoadingGuide,
    handleFileSelect,
    validateFile,
    uploadFile,
    downloadTemplate,
    loadUploadHistory,
    loadFormatGuide,
    resetForm,
  } = useExcelUpload();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [showGuideModal, setShowGuideModal] = useState(false);
  const [showValidationDetails, setShowValidationDetails] = useState(false);
  const [showUploadDetails, setShowUploadDetails] = useState(false);

  useEffect(() => {
    loadUploadHistory();
    loadFormatGuide();
  }, [loadUploadHistory, loadFormatGuide]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] || null;
    handleFileSelect(file);
  };

  const handleUploadClick = () => {
    if (formData.validationResult?.success) {
      setShowConfirmModal(true);
    } else {
      validateFile();
    }
  };

  const handleConfirmUpload = async () => {
    setShowConfirmModal(false);
    const success = await uploadFile();
    if (success) {
      resetForm();
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleReset = () => {
    resetForm();
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString("ja-JP", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* ヘッダー */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            エクセル一括アップロード
          </h1>
          <p className="text-gray-600 mt-2">
            学校、ユーザー、指導場所、曜日設定を一括で登録できます
          </p>
        </div>

        {/* アクションボタン */}
        <div className="mb-6 flex flex-wrap gap-3">
          <button
            onClick={downloadTemplate}
            className="flex items-center px-4 py-2 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-all duration-200 shadow-lg hover:shadow-xl"
          >
            <Download className="h-4 w-4 mr-2" />
            テンプレートダウンロード
          </button>

          <button
            onClick={() => setShowGuideModal(true)}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all duration-200 shadow-lg hover:shadow-xl"
          >
            <BookOpen className="h-4 w-4 mr-2" />
            フォーマットガイド
          </button>

          <button
            onClick={() => setShowHistoryModal(true)}
            className="flex items-center px-4 py-2 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl"
          >
            <History className="h-4 w-4 mr-2" />
            アップロード履歴
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* ファイルアップロードエリア */}
          <div className="lg:col-span-2">
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
                <FileSpreadsheet className="h-5 w-5 mr-2 text-blue-600" />
                ファイルアップロード
              </h2>

              {/* ファイル選択エリア */}
              <div className="mb-6">
                <div
                  className={`border-2 border-dashed rounded-xl p-8 text-center transition-all duration-200 ${
                    formData.file
                      ? "border-blue-400 bg-blue-50"
                      : "border-gray-300 hover:border-blue-400 hover:bg-blue-50"
                  }`}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".xlsx,.xls"
                    onChange={handleFileChange}
                    className="hidden"
                  />

                  {formData.file ? (
                    <div className="space-y-2">
                      <FileSpreadsheet className="h-12 w-12 text-blue-600 mx-auto" />
                      <p className="text-lg font-semibold text-gray-900">
                        {formData.file.name}
                      </p>
                      <p className="text-sm text-gray-600">
                        {(formData.file.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        className="text-blue-600 hover:text-blue-700 font-medium"
                      >
                        ファイルを変更
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <Upload className="h-12 w-12 text-gray-400 mx-auto" />
                      <p className="text-lg font-semibold text-gray-700">
                        エクセルファイルを選択
                      </p>
                      <p className="text-sm text-gray-500">
                        .xlsx または .xls ファイルをドラッグ&ドロップ
                      </p>
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        ファイルを選択
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* アクションボタン */}
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={handleUploadClick}
                  disabled={
                    !formData.file ||
                    formData.isValidating ||
                    formData.isUploading
                  }
                  className="flex items-center px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl"
                >
                  {formData.isValidating ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      検証中...
                    </>
                  ) : formData.isUploading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      アップロード中...
                    </>
                  ) : formData.validationResult?.success ? (
                    <>
                      <Upload className="h-4 w-4 mr-2" />
                      アップロード実行
                    </>
                  ) : (
                    <>
                      <CheckCircle className="h-4 w-4 mr-2" />
                      ファイルを検証
                    </>
                  )}
                </button>

                {formData.file && (
                  <button
                    onClick={handleReset}
                    className="flex items-center px-4 py-3 bg-gray-600 text-white rounded-xl hover:bg-gray-700 transition-all duration-200"
                  >
                    <RotateCcw className="h-4 w-4 mr-2" />
                    リセット
                  </button>
                )}
              </div>

              {/* 検証結果 */}
              {formData.validationResult && (
                <div className="mt-6">
                  <div
                    className={`rounded-xl p-4 ${
                      formData.validationResult.success
                        ? "bg-green-50 border border-green-200"
                        : "bg-red-50 border border-red-200"
                    }`}
                  >
                    <div className="flex items-start">
                      {formData.validationResult.success ? (
                        <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 mr-3" />
                      ) : (
                        <AlertCircle className="h-5 w-5 text-red-500 mt-0.5 mr-3" />
                      )}
                      <div className="flex-1">
                        <h3
                          className={`font-semibold ${
                            formData.validationResult.success
                              ? "text-green-800"
                              : "text-red-800"
                          }`}
                        >
                          {formData.validationResult.success
                            ? "検証成功"
                            : "検証失敗"}
                        </h3>
                        <p
                          className={`text-sm mt-1 ${
                            formData.validationResult.success
                              ? "text-green-700"
                              : "text-red-700"
                          }`}
                        >
                          {formData.validationResult.message}
                        </p>

                        {formData.validationResult.success && (
                          <button
                            onClick={() =>
                              setShowValidationDetails((prev) => !prev)
                            }
                            className="flex items-center mt-2 text-sm text-green-600 hover:text-green-700"
                          >
                            {showValidationDetails ? (
                              <EyeOff className="h-4 w-4 mr-1" />
                            ) : (
                              <Eye className="h-4 w-4 mr-1" />
                            )}
                            詳細を{showValidationDetails ? "非表示" : "表示"}
                          </button>
                        )}

                        {showValidationDetails &&
                          formData.validationResult.success && (
                            <div className="mt-3 p-3 bg-green-100 rounded-lg">
                              <h4 className="font-medium text-green-800 mb-2">
                                統計情報
                              </h4>
                              <div className="grid grid-cols-2 gap-2 text-sm text-green-700">
                                <div>
                                  ユーザー:{" "}
                                  {
                                    formData.validationResult.statistics
                                      ?.users_count
                                  }
                                  件
                                </div>
                                <div>
                                  指導場所:{" "}
                                  {
                                    formData.validationResult.statistics
                                      ?.places_count
                                  }
                                  件
                                </div>
                                <div>
                                  曜日:{" "}
                                  {
                                    formData.validationResult.statistics
                                      ?.days_count
                                  }
                                  件
                                </div>
                                <div>
                                  オーナー:{" "}
                                  {
                                    formData.validationResult.statistics
                                      ?.owners_count
                                  }
                                  人
                                </div>
                                <div>
                                  講師:{" "}
                                  {
                                    formData.validationResult.statistics
                                      ?.teachers_count
                                  }
                                  人
                                </div>
                              </div>
                              {formData.validationResult.school_info && (
                                <div className="mt-2 pt-2 border-t border-green-200">
                                  <h5 className="font-medium text-green-800">
                                    学校情報
                                  </h5>
                                  <p className="text-sm text-green-700">
                                    {
                                      formData.validationResult.school_info
                                        .school_name
                                    }
                                    {formData.validationResult.school_info
                                      .start_time &&
                                      ` (${formData.validationResult.school_info.start_time} - ${formData.validationResult.school_info.end_time})`}
                                  </p>
                                </div>
                              )}
                            </div>
                          )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* アップロード結果 */}
              {formData.uploadResult && (
                <div className="mt-6">
                  <div
                    className={`rounded-xl p-4 ${
                      formData.uploadResult.success
                        ? "bg-green-50 border border-green-200"
                        : "bg-red-50 border border-red-200"
                    }`}
                  >
                    <div className="flex items-start">
                      {formData.uploadResult.success ? (
                        <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 mr-3" />
                      ) : (
                        <AlertCircle className="h-5 w-5 text-red-500 mt-0.5 mr-3" />
                      )}
                      <div className="flex-1">
                        <h3
                          className={`font-semibold ${
                            formData.uploadResult.success
                              ? "text-green-800"
                              : "text-red-800"
                          }`}
                        >
                          {formData.uploadResult.success
                            ? "アップロード成功"
                            : "アップロード失敗"}
                        </h3>
                        <p
                          className={`text-sm mt-1 ${
                            formData.uploadResult.success
                              ? "text-green-700"
                              : "text-red-700"
                          }`}
                        >
                          {formData.uploadResult.message}
                        </p>

                        {formData.uploadResult.success && (
                          <button
                            onClick={() =>
                              setShowUploadDetails((prev) => !prev)
                            }
                            className="flex items-center mt-2 text-sm text-green-600 hover:text-green-700"
                          >
                            {showUploadDetails ? (
                              <EyeOff className="h-4 w-4 mr-1" />
                            ) : (
                              <Eye className="h-4 w-4 mr-1" />
                            )}
                            詳細を{showUploadDetails ? "非表示" : "表示"}
                          </button>
                        )}

                        {showUploadDetails && formData.uploadResult.success && (
                          <div className="mt-3 p-3 bg-green-100 rounded-lg">
                            <h4 className="font-medium text-green-800 mb-2">
                              登録統計
                            </h4>
                            <div className="grid grid-cols-2 gap-2 text-sm text-green-700 mb-3">
                              <div>
                                学校:{" "}
                                {
                                  formData.uploadResult.statistics
                                    .schools_created
                                }
                                校
                              </div>
                              <div>
                                ユーザー:{" "}
                                {formData.uploadResult.statistics.users_created}
                                人
                              </div>
                              <div>
                                指導場所:{" "}
                                {
                                  formData.uploadResult.statistics
                                    .places_created
                                }
                                件
                              </div>
                              <div>
                                曜日:{" "}
                                {formData.uploadResult.statistics.days_created}
                                件
                              </div>
                            </div>
                            <div className="max-h-32 overflow-y-auto">
                              <h5 className="font-medium text-green-800 mb-1">
                                詳細ログ
                              </h5>
                              {formData.uploadResult.details.map(
                                (detail, index) => (
                                  <p
                                    key={index}
                                    className="text-xs text-green-600"
                                  >
                                    • {detail}
                                  </p>
                                )
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* サイドバー */}
          <div className="space-y-6">
            {/* 機能説明 */}
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <Info className="h-5 w-5 mr-2 text-blue-600" />
                一括登録機能
              </h3>
              <div className="space-y-4 text-sm text-gray-600">
                <div className="flex items-start">
                  <School className="h-4 w-4 mt-0.5 mr-2 text-blue-500" />
                  <div>
                    <p className="font-medium text-gray-700">学校情報</p>
                    <p>1つの学校の基本情報を登録</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <Users className="h-4 w-4 mt-0.5 mr-2 text-green-500" />
                  <div>
                    <p className="font-medium text-gray-700">ユーザー</p>
                    <p>オーナー1人と講師複数人を登録</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <MapPin className="h-4 w-4 mt-0.5 mr-2 text-purple-500" />
                  <div>
                    <p className="font-medium text-gray-700">指導場所</p>
                    <p>複数の指導場所を一括登録</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <Calendar className="h-4 w-4 mt-0.5 mr-2 text-orange-500" />
                  <div>
                    <p className="font-medium text-gray-700">曜日設定</p>
                    <p>学校の曜日設定を登録</p>
                  </div>
                </div>
              </div>
            </div>

            {/* 注意事項 */}
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <AlertCircle className="h-5 w-5 mr-2 text-amber-600" />
                注意事項
              </h3>
              <div className="space-y-2 text-sm text-gray-600">
                <p>• ファイル形式: .xlsx または .xls</p>
                <p>• ファイルサイズ: 10MB以下</p>
                <p>• 1回のアップロードで1校のみ登録</p>
                <p>• オーナーは必ず1人設定</p>
                <p>• 講師は最低1人必要</p>
                <p>• 重複データがある場合は失敗</p>
              </div>
            </div>
          </div>
        </div>

        {/* 確認モーダル */}
        {showConfirmModal && (
          <ConfirmModal
            isOpen={showConfirmModal}
            title="アップロード確認"
            message={`ファイル「${formData.file?.name}」をアップロードして学校情報を一括登録しますか？\n\nこの操作は取り消すことができません。`}
            confirmText="アップロード実行"
            cancelText="キャンセル"
            confirmButtonColor="#2563eb"
            isLoading={formData.isUploading}
            onConfirm={handleConfirmUpload}
            onCancel={() => setShowConfirmModal(false)}
          />
        )}

        {/* 履歴モーダル */}
        {showHistoryModal && (
          <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4">
              <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" />
              <div className="relative bg-white rounded-2xl shadow-xl max-w-4xl w-full max-h-[80vh] overflow-hidden">
                <div className="flex items-center justify-between p-6 border-b border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                    <History className="h-5 w-5 mr-2 text-purple-600" />
                    アップロード履歴
                  </h3>
                  <button
                    onClick={() => setShowHistoryModal(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X className="h-6 w-6" />
                  </button>
                </div>
                <div className="p-6 overflow-y-auto max-h-[60vh]">
                  {isLoadingHistory ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
                    </div>
                  ) : uploadHistory.length === 0 ? (
                    <p className="text-gray-500 text-center py-8">
                      アップロード履歴がありません
                    </p>
                  ) : (
                    <div className="space-y-4">
                      {uploadHistory.map((item) => (
                        <div
                          key={item.id}
                          className={`p-4 rounded-xl border ${
                            item.status === "success"
                              ? "bg-green-50 border-green-200"
                              : "bg-red-50 border-red-200"
                          }`}
                        >
                          <div className="flex items-start justify-between">
                            <div>
                              <h4 className="font-medium text-gray-900">
                                {item.file_name}
                              </h4>
                              <p className="text-sm text-gray-600">
                                {formatDateTime(item.upload_date)} -{" "}
                                {item.uploaded_by}
                              </p>
                              {item.status === "success" ? (
                                <div className="mt-2 grid grid-cols-2 gap-2 text-sm text-green-700">
                                  <span>学校: {item.schools_created}校</span>
                                  <span>ユーザー: {item.users_created}人</span>
                                  <span>指導場所: {item.places_created}件</span>
                                  <span>曜日: {item.days_created}件</span>
                                </div>
                              ) : (
                                <p className="mt-2 text-sm text-red-700">
                                  {item.error_message}
                                </p>
                              )}
                            </div>
                            <span
                              className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                                item.status === "success"
                                  ? "bg-green-100 text-green-800"
                                  : "bg-red-100 text-red-800"
                              }`}
                            >
                              {item.status === "success" ? "成功" : "失敗"}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* フォーマットガイドモーダル */}
        {showGuideModal && (
          <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4">
              <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" />
              <div className="relative bg-white rounded-2xl shadow-xl max-w-5xl w-full max-h-[90vh] overflow-hidden">
                <div className="flex items-center justify-between p-6 border-b border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                    <BookOpen className="h-5 w-5 mr-2 text-blue-600" />
                    フォーマットガイド
                  </h3>
                  <button
                    onClick={() => setShowGuideModal(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X className="h-6 w-6" />
                  </button>
                </div>
                <div className="p-6 overflow-y-auto max-h-[75vh]">
                  {isLoadingGuide ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    </div>
                  ) : formatGuide ? (
                    <div className="space-y-6">
                      <div className="bg-blue-50 rounded-xl p-4">
                        <p className="text-blue-800">
                          {formatGuide.description}
                        </p>
                      </div>

                      {/* シート説明 */}
                      <div className="space-y-6">
                        {formatGuide.sheets.map((sheet, index) => (
                          <div
                            key={index}
                            className="bg-gray-50 rounded-xl p-4"
                          >
                            <h4 className="text-lg font-semibold text-gray-900 mb-2">
                              {sheet.name}
                            </h4>
                            <p className="text-gray-600 mb-4">
                              {sheet.description}
                            </p>

                            <div className="mb-4">
                              <h5 className="font-medium text-gray-800 mb-2">
                                必須列
                              </h5>
                              <div className="overflow-x-auto">
                                <table className="min-w-full bg-white rounded-lg overflow-hidden">
                                  <thead className="bg-gray-100">
                                    <tr>
                                      <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">
                                        列名
                                      </th>
                                      <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">
                                        型
                                      </th>
                                      <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">
                                        説明
                                      </th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-gray-200">
                                    {sheet.required_columns.map(
                                      (column, colIndex) => (
                                        <tr key={colIndex}>
                                          <td className="px-4 py-2 text-sm text-gray-900">
                                            {column.name}
                                            {column.optional && (
                                              <span className="text-gray-500 text-xs ml-1">
                                                (任意)
                                              </span>
                                            )}
                                          </td>
                                          <td className="px-4 py-2 text-sm text-gray-600">
                                            {column.type}
                                          </td>
                                          <td className="px-4 py-2 text-sm text-gray-600">
                                            {column.description}
                                            {column.choices && (
                                              <div className="text-xs text-blue-600 mt-1">
                                                選択肢:{" "}
                                                {column.choices.join(", ")}
                                              </div>
                                            )}
                                          </td>
                                        </tr>
                                      )
                                    )}
                                  </tbody>
                                </table>
                              </div>
                            </div>

                            {sheet.notes.length > 0 && (
                              <div>
                                <h5 className="font-medium text-gray-800 mb-2">
                                  注意事項
                                </h5>
                                <ul className="list-disc list-inside space-y-1 text-sm text-gray-600">
                                  {sheet.notes.map((note, noteIndex) => (
                                    <li key={noteIndex}>{note}</li>
                                  ))}
                                </ul>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>

                      {/* 全般的な注意事項 */}
                      <div className="bg-amber-50 rounded-xl p-4">
                        <h4 className="text-lg font-semibold text-amber-800 mb-2">
                          全般的な注意事項
                        </h4>
                        <ul className="list-disc list-inside space-y-1 text-sm text-amber-700">
                          {formatGuide.general_notes.map((note, index) => (
                            <li key={index}>{note}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  ) : (
                    <p className="text-gray-500 text-center py-8">
                      フォーマットガイドを読み込めませんでした
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ExcelUpload;
