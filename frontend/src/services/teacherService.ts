// frontend/src/services/teacherService.ts

import api from "./api";
import type {
  Teacher,
  TeacherListResponse,
  TeacherStatistics,
  TeacherFilterParams,
  TeacherFormData,
  TeacherUpdateData,
  TeacherCreateResponse,
  TeacherUpdateResponse,
  TeacherDeleteResponse,
  TeacherActivateResponse,
  School,
} from "../types/teacher";

class TeacherService {
  /**
   * 講師一覧を取得
   */
  async getTeachers(
    params: TeacherFilterParams = {}
  ): Promise<TeacherListResponse> {
    const searchParams = new URLSearchParams();

    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") {
        searchParams.append(key, value.toString());
      }
    });

    const response = await api.get<TeacherListResponse>(
      `/account/teacher/?${searchParams.toString()}`
    );
    return response.data;
  }

  /**
   * 講師詳細を取得
   */
  async getTeacher(id: number): Promise<Teacher> {
    const response = await api.get<Teacher>(`/account/teacher/${id}/`);
    return response.data;
  }

  /**
   * 新規講師を作成
   */
  async createTeacher(data: TeacherFormData): Promise<TeacherCreateResponse> {
    const response = await api.post<TeacherCreateResponse>(
      "/account/teacher/",
      data
    );
    return response.data;
  }

  /**
   * 講師情報を更新
   */
  async updateTeacher(
    id: number,
    data: TeacherUpdateData
  ): Promise<TeacherUpdateResponse> {
    const response = await api.put<TeacherUpdateResponse>(
      `/account/teacher/${id}/`,
      data
    );
    return response.data;
  }

  /**
   * 講師情報を部分更新
   */
  async patchTeacher(
    id: number,
    data: Partial<TeacherUpdateData>
  ): Promise<TeacherUpdateResponse> {
    const response = await api.patch<TeacherUpdateResponse>(
      `/account/teacher/${id}/`,
      data
    );
    return response.data;
  }

  /**
   * 講師を論理削除（無効化）
   */
  async deleteTeacher(id: number): Promise<TeacherDeleteResponse> {
    const response = await api.delete<TeacherDeleteResponse>(
      `/account/teacher/${id}/`
    );
    return response.data;
  }

  /**
   * 講師を有効化
   */
  async activateTeacher(id: number): Promise<TeacherActivateResponse> {
    const response = await api.post<TeacherActivateResponse>(
      `/account/teacher/${id}/activate/`
    );
    return response.data;
  }

  /**
   * 講師統計情報を取得
   */
  async getTeacherStatistics(): Promise<TeacherStatistics> {
    const response = await api.get<TeacherStatistics>(
      "/account/teacher/statistics/"
    );
    return response.data;
  }

  /**
   * 学校一覧を取得（講師作成・編集用）
   */
  async getSchools(): Promise<School[]> {
    try {
      const response = await api.get<{ results?: School[] } | School[]>(
        "/school/"
      );
      // ページネーション形式かどうかを確認
      if (
        response.data &&
        typeof response.data === "object" &&
        "results" in response.data
      ) {
        return Array.isArray(response.data.results)
          ? response.data.results
          : [];
      }

      // 直接配列の場合
      return Array.isArray(response.data) ? response.data : [];
    } catch (error) {
      console.error("学校一覧取得エラー:", error);
      return []; // エラー時も空配列を返す
    }
  }

  /**
   * パスワードを変更（講師用）
   */
  async changePassword(
    id: number,
    data: {
      current_password: string;
      new_password: string;
      new_password_confirm: string;
    }
  ): Promise<{ message: string }> {
    const response = await api.post<{ message: string }>(
      `/account/teacher/${id}/change-password/`,
      data
    );
    return response.data;
  }

  /**
   * 講師の学校を更新
   */
  async updateTeacherSchools(
    id: number,
    schoolIds: number[]
  ): Promise<TeacherUpdateResponse> {
    const response = await api.patch<TeacherUpdateResponse>(
      `/account/teacher/${id}/`,
      { schools: schoolIds }
    );
    return response.data;
  }

  /**
   * 講師の現在の学校を変更
   */
  async updateCurrentSchool(
    id: number,
    schoolId: number | null
  ): Promise<TeacherUpdateResponse> {
    const response = await api.patch<TeacherUpdateResponse>(
      `/account/teacher/${id}/`,
      { current_school: schoolId }
    );
    return response.data;
  }

  /**
   * 複数の講師を一括操作
   */
  async bulkUpdateTeachers(
    teacherIds: number[],
    action: "activate" | "deactivate" | "delete",
    data?: Record<string, string | number | boolean | null>
  ): Promise<{ message: string; updated_count: number }> {
    const response = await api.post<{ message: string; updated_count: number }>(
      "/account/teacher/bulk-action/",
      {
        teacher_ids: teacherIds,
        action,
        data,
      }
    );
    return response.data;
  }
}

// シングルトンとしてエクスポート
export const teacherService = new TeacherService();
export default teacherService;
