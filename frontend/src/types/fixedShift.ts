// frontend/src/types/fixedShift.ts

import type { Place, Day } from "./config";

export interface Teacher {
  id: number;
  username: string;
  first_name: string;
  last_name: string;
  full_name: string;
  email: string;
  role_display: string;
  is_teacher: boolean;
  is_owner: boolean;
}

export interface FixedShift {
  id: number;
  day: number;
  day_name: string;
  start_time: string;
  end_time: string;
  place: number;
  place_name: string;
  teacher: Teacher[]; // number[] から Teacher[] に変更
  teacher_names: string[];
  description: string;
  duration_minutes: number; // 追加（コンポーネントで使用されている）
}

export interface TimeSlot {
  hour: number;
  minute: number;
  displayTime: string;
  position: number;
}

export interface ShiftPosition {
  shift: FixedShift;
  top: number;
  height: number;
  startHour: number;
  endHour: number;
  leftOffset?: number; // 左からのオフセット（%）
  width?: number; // 幅（%）
  column?: number; // 列番号（0から開始）
  totalColumns?: number; // 総列数
  isOverlapped?: boolean; // 重複しているかどうか
  hasConflict?: boolean; // 競合があるかどうか（3つ以上の重複）
}

export interface DaySchedule {
  day: Day;
  places: Place[];
  shifts: FixedShift[];
  timeSlots: TimeSlot[];
}

export interface FixedShiftGrid {
  days: Day[];
  places: Place[];
  shifts: FixedShift[];
  start_hour: number;
  end_hour: number;
  school_start_time?: string; // 学校の開始時間
  school_end_time?: string; // 学校の終了時間
}

export interface AvailableTeacher {
  id: number;
  username: string;
  first_name: string;
  last_name: string;
  full_name: string;
  email: string;
  is_available: boolean;
  current_shifts: Array<{
    place_name: string;
    description: string;
  }>;
  can_teach_at_place: boolean;
  available_places: Array<{
    id: number;
    name: string;
  }>;
  role_display: string;
  is_teacher: boolean;
  is_owner: boolean;
}

export interface CreateFixedShiftRequest {
  day: number;
  start_time: string; // time から start_time に変更
  end_time: string; // 追加
  teacher_ids: number[];
  place: number;
  description?: string;
}

export interface ShiftFormData {
  day: number;
  start_time: string;
  end_time: string;
  place: number;
  teacher: number[];
  description: string;
}

export interface ShiftConflict {
  teacher_name: string;
  day_name: string;
  conflicting_shifts: Array<{
    shift_id: number;
    start_time: string;
    end_time: string;
    place_name: string;
    description: string;
  }>;
}

export interface BulkFixedShiftRequest {
  shifts: CreateFixedShiftRequest[];
}

export interface ConflictResult {
  conflict_count: number;
  conflicts: Array<{
    teacher_name: string;
    day_name: string;
    conflicting_shifts: Array<{
      shift_id: number;
      start_time: string;
      end_time: string;
      place_name: string;
      description: string;
    }>;
  }>;
}

export interface CopyWeekRequest {
  from_school_id: number;
  to_school_id: number;
  overwrite: boolean;
}

export interface CopyWeekResponse {
  copied_count: number;
  message: string;
}
