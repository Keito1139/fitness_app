// frontend/src/hooks/useUpload.ts

import { useState, useCallback } from "react";
import { excelApi, downloadFile } from "../services/uploadApi";
import { useToast } from "../contexts/ToastContext";
import type {
  ExcelUploadFormData,
  UploadHistory,
  FormatGuide,
} from "../types/upload";

export const useExcelUpload = () => {
  const { showSuccess, showError, showInfo } = useToast();

  const [formData, setFormData] = useState<ExcelUploadFormData>({
    file: null,
    isValidating: false,
    isUploading: false,
    validationResult: null,
    uploadResult: null,
  });

  const [uploadHistory, setUploadHistory] = useState<UploadHistory[]>([]);
  const [formatGuide, setFormatGuide] = useState<FormatGuide | null>(null);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [isLoadingGuide, setIsLoadingGuide] = useState(false);

  /**
   * ファイル選択
   */
  const handleFileSelect = useCallback((file: File | null) => {
    setFormData((prev) => ({
      ...prev,
      file,
      validationResult: null,
      uploadResult: null,
    }));
  }, []);

  /**
   * ファイル検証
   */
  const validateFile = useCallback(async (): Promise<boolean> => {
    if (!formData.file) {
      showError("ファイルを選択してください");
      return false;
    }

    setFormData((prev) => ({
      ...prev,
      isValidating: true,
      validationResult: null,
    }));

    try {
      const result = await excelApi.validateFile(formData.file);

      setFormData((prev) => ({ ...prev, validationResult: result }));

      if (result.success) {
        showSuccess("ファイルの検証に成功しました");
        return true;
      } else {
        showError(result.error || "ファイルの検証に失敗しました");
        return false;
      }
    } catch (error) {
      console.error("Validation error:", error);
      showError("検証中にエラーが発生しました");
      return false;
    } finally {
      setFormData((prev) => ({ ...prev, isValidating: false }));
    }
  }, [formData.file, showSuccess, showError]);

  /**
   * アップロード履歴の読み込み
   */
  const loadUploadHistory = useCallback(async () => {
    setIsLoadingHistory(true);
    try {
      const history = await excelApi.getUploadHistory();
      setUploadHistory(history);
    } catch (error) {
      console.error("History load error:", error);
      showError("履歴の読み込みに失敗しました");
    } finally {
      setIsLoadingHistory(false);
    }
  }, [showError]);

  /**
   * 一括アップロード
   */
  const uploadFile = useCallback(async (): Promise<boolean> => {
    if (!formData.file) {
      showError("ファイルを選択してください");
      return false;
    }

    setFormData((prev) => ({ ...prev, isUploading: true, uploadResult: null }));

    try {
      const result = await excelApi.bulkUpload(formData.file);

      setFormData((prev) => ({ ...prev, uploadResult: result }));

      if (result.success) {
        showSuccess(result.message);
        // アップロード成功後、履歴を更新
        loadUploadHistory();
        return true;
      } else {
        showError(result.message || "アップロードに失敗しました");
        return false;
      }
    } catch (error) {
      console.error("Upload error:", error);
      showError("アップロード中にエラーが発生しました");
      return false;
    } finally {
      setFormData((prev) => ({ ...prev, isUploading: false }));
    }
  }, [formData.file, showSuccess, showError, loadUploadHistory]);

  /**
   * テンプレートダウンロード
   */
  const downloadTemplate = useCallback(async () => {
    try {
      showInfo("テンプレートをダウンロード中...");
      const blob = await excelApi.downloadTemplate();
      downloadFile(blob, "school_registration_template.xlsx");
      showSuccess("テンプレートをダウンロードしました");
    } catch (error) {
      console.error("Template download error:", error);
      showError("テンプレートのダウンロードに失敗しました");
    }
  }, [showInfo, showSuccess, showError]);

  /**
   * フォーマットガイドの読み込み
   */
  const loadFormatGuide = useCallback(async () => {
    setIsLoadingGuide(true);
    try {
      const guide = await excelApi.getFormatGuide();
      setFormatGuide(guide);
    } catch (error) {
      console.error("Format guide load error:", error);
      showError("フォーマットガイドの読み込みに失敗しました");
    } finally {
      setIsLoadingGuide(false);
    }
  }, [showError]);

  /**
   * フォームリセット
   */
  const resetForm = useCallback(() => {
    setFormData({
      file: null,
      isValidating: false,
      isUploading: false,
      validationResult: null,
      uploadResult: null,
    });
  }, []);

  return {
    // State
    formData,
    uploadHistory,
    formatGuide,
    isLoadingHistory,
    isLoadingGuide,

    // Actions
    handleFileSelect,
    validateFile,
    uploadFile,
    downloadTemplate,
    loadUploadHistory,
    loadFormatGuide,
    resetForm,
  };
};
