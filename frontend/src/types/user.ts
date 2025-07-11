// frontend/src/types/user.ts

export interface User {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  is_owner: boolean;
  is_teacher: boolean;
  is_superuser: boolean;
  schools: number[];
  current_school: number | null;
  current_school_name: string | null;
  date_joined: string;
}

export interface LoginFormData {
  username: string;
  password: string;
}

export interface LoginResponse {
  message: string;
  user: User;
}

export interface ApiError {
  non_field_errors?: string[];
  username?: string[];
  password?: string[];
  detail?: string;
  error?: string;
}
