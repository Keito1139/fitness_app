// frontend/src/services/upload.ts

import api from "./api";
import type {
  BulkUploadResponse,
  ValidationResponse,
  UploadHistory,
  FormatGuide,
} from "../types/upload";

/**
 * エクセル一括アップロード関連のAPI
 */
export const excelApi = {
  /**
   * エクセルファイルの事前検証
   */
  validateFile: async (file: File): Promise<ValidationResponse> => {
    const formData = new FormData();
    formData.append("file", file);

    const response = await api.post<ValidationResponse>(
      "/file/excel-upload/validate-file/",
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      }
    );

    return response.data;
  },

  /**
   * エクセルファイルから学校情報を一括登録
   */
  bulkUpload: async (file: File): Promise<BulkUploadResponse> => {
    const formData = new FormData();
    formData.append("file", file);

    const response = await api.post<BulkUploadResponse>(
      "/file/excel-upload/bulk-upload/",
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      }
    );

    return response.data;
  },

  /**
   * エクセルテンプレートファイルのダウンロード
   */
  downloadTemplate: async (): Promise<Blob> => {
    const response = await api.get("/file/excel-upload/download-template/", {
      responseType: "blob",
    });

    return response.data;
  },

  /**
   * アップロード履歴の取得
   */
  getUploadHistory: async (): Promise<UploadHistory[]> => {
    const response = await api.get<{
      success: boolean;
      history: UploadHistory[];
    }>("/file/excel-upload/upload-history/");

    return response.data.history;
  },

  /**
   * フォーマットガイドの取得
   */
  getFormatGuide: async (): Promise<FormatGuide> => {
    const response = await api.get<{
      success: boolean;
      format_guide: FormatGuide;
    }>("/file/excel-upload/format-guide/");

    return response.data.format_guide;
  },
};

/**
 * ファイルダウンロード用のヘルパー関数
 */
export const downloadFile = (blob: Blob, filename: string): void => {
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
};
