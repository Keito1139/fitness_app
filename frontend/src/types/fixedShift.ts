// frontend/src/types/fixedShift.ts

import type { Place, Day } from "./config";

export interface FixedShift {
  id: number;
  day: number;
  day_name: string;
  start_time: string;
  end_time: string;
  place: number;
  place_name: string;
  teacher: number[];
  teacher_names: string[];
  description: string;
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

export interface ShiftFormData {
  day: number;
  start_time: string;
  end_time: string;
  place: number;
  teacher: number[];
  description: string;
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
