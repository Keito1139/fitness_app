// frontend/src/types/teacher.ts

import type { Place } from "./config";

export interface School {
  id: number;
  name: string;
}

export interface TeacherProfile {
  id: number;
  created_at: number;
}

export interface Teacher {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  full_name: string;
  is_active: boolean;
  is_teacher: boolean;
  is_admin: boolean;
  current_school: number | null;
  current_school_name: string | null;
  schools: number[];
  schools_info: School[];
  place: number[];
  place_info: Place[];
  teacher_profile: TeacherProfile | null;
  date_joined: string;
}

export interface PaginationInfo {
  count: number;
  total_pages: number;
  current_page: number;
  page_size: number;
  has_next: boolean;
  has_previous: boolean;
  next_page: number | null;
  previous_page: number | null;
}

export interface TeacherListResponse {
  results: Teacher[];
  pagination: PaginationInfo;
}

export interface TeacherStatistics {
  total_teachers: number;
  active_teachers: number;
  inactive_teachers: number;
  school_statistics: Array<{
    school_id: number;
    school_name: string;
    total_teachers: number;
    active_teachers: number;
  }>;
  monthly_registration: Array<{
    month: string;
    count: number;
  }>;
}

export interface TeacherFilterParams {
  search?: string;
  is_active?: string;
  current_school?: string;
  page?: number;
  page_size?: number;
  ordering?: string;
}

export interface TeacherFormData {
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  password: string;
  password_confirm: string;
  current_school: number | null;
  schools: number[];
  place: number[];
  is_active?: boolean;
}

export interface TeacherUpdateData {
  email: string;
  first_name: string;
  last_name: string;
  is_active: boolean;
  current_school: number | null;
  schools: number[];
  place: number[];
}

export interface TeacherCreateResponse {
  message: string;
  teacher: Teacher;
}

export interface TeacherUpdateResponse {
  message: string;
  teacher: Teacher;
}

export interface TeacherDeleteResponse {
  message: string;
  teacher_id: number;
}

export interface TeacherActivateResponse {
  message: string;
  teacher: Teacher;
}

export interface ApiError {
  [key: string]: string[] | string;
  non_field_errors: string[];
  detail: string;
  error: string;
}
