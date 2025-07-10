// frontend/src/services/fixedShiftService.ts

import api from "./api";
import type {
  FixedShift,
  FixedShiftGrid,
  AvailableTeacher,
  ShiftConflict,
  CreateFixedShiftRequest,
  BulkFixedShiftRequest,
} from "../types/fixedShift";

export const shiftApi = {
  // 固定シフト一覧取得
  getFixedShifts: async (params?: {
    school_id?: number;
    day?: number;
    place?: number;
    teacher?: number;
  }) => {
    const response = await api.get<FixedShift[]>("/shift/fixed-shift/", {
      params,
    });
    return response.data;
  },

  // 固定シフト詳細取得
  getFixedShift: async (id: number) => {
    const response = await api.get<FixedShift>(`/shift/fixed-shift/${id}/`);
    return response.data;
  },

  // 固定シフト作成
  createFixedShift: async (data: CreateFixedShiftRequest) => {
    const response = await api.post<FixedShift>("/shift/fixed-shift/", data);
    return response.data;
  },

  // 固定シフト更新
  updateFixedShift: async (
    id: number,
    data: Partial<CreateFixedShiftRequest>
  ) => {
    const response = await api.patch<FixedShift>(
      `/shift/fixed-shift/${id}/`,
      data
    );
    return response.data;
  },

  // 固定シフト削除
  deleteFixedShift: async (id: number) => {
    await api.delete(`/shift/fixed-shift/${id}/`);
  },

  // 固定シフトグリッドデータ取得
  getFixedShiftGrid: async (schoolId: number) => {
    const response = await api.get<FixedShiftGrid>("/shift/fixed-shift/grid/", {
      params: { school_id: schoolId },
    });
    return response.data;
  },

  // 利用可能な講師一覧取得
  getAvailableTeachers: async (params: {
    school_id: number;
    day_id: number;
    start_time: string; // HH:MM形式
    end_time: string; // HH:MM形式
    place_id?: number;
  }) => {
    const response = await api.get<AvailableTeacher[]>(
      "/shift/fixed-shift/available_teachers/",
      { params }
    );
    return response.data;
  },

  // 一括固定シフト作成
  bulkCreateFixedShifts: async (data: BulkFixedShiftRequest) => {
    const response = await api.post<FixedShift[]>(
      "/shift/fixed-shift/bulk_create/",
      data
    );
    return response.data;
  },

  // 一括固定シフト削除
  bulkDeleteFixedShifts: async (shiftIds: number[]) => {
    const response = await api.delete("/shift/fixed-shift/bulk_delete/", {
      data: { shift_ids: shiftIds },
    });
    return response.data;
  },

  // シフト競合チェック
  checkConflicts: async (schoolId: number) => {
    const response = await api.get<{
      conflicts: ShiftConflict[];
      conflict_count: number;
    }>("/shift/fixed-shift/conflicts/", {
      params: { school_id: schoolId },
    });
    return response.data;
  },

  // 週間シフトコピー
  copyWeekSchedule: async (params: {
    from_school_id: number;
    to_school_id: number;
    overwrite?: boolean;
  }) => {
    const response = await api.post<{
      message: string;
      copied_count: number;
    }>("/shift/fixed-shift/copy_week/", params);
    return response.data;
  },

  // 場所別指導可能講師一覧
  getTeachersByPlace: async (schoolId: number) => {
    const response = await api.get<{
      school_id: number;
      school_name: string;
      places: Array<{
        place_id: number;
        place_name: string;
        available_teachers: AvailableTeacher[];
        teacher_count: number;
      }>;
    }>("/shift/fixed-shift/teachers_by_place/", {
      params: { school_id: schoolId },
    });
    return response.data;
  },

  // 講師の週間スケジュール取得
  getTeacherSchedule: async (schoolId: number, teacherId: number) => {
    const response = await api.get<{
      teacher_id: number;
      teacher_name: string;
      role_display: string;
      school_id: number;
      school_name: string;
      schedule: Record<
        string,
        Array<{
          shift_id: number;
          time_start: string;
          time_end: string;
          place_name: string;
          description: string;
          duration_minutes: number;
        }>
      >;
      total_shifts: number;
    }>("/shift/fixed-shift/teacher_schedules/", {
      params: { school_id: schoolId, teacher_id: teacherId },
    });
    return response.data;
  },
};
