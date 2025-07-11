// frontend/src/types/upload.ts

export interface UploadStatistics {
  schools_created: number;
  users_created: number;
  places_created: number;
  days_created: number;
}

export interface BulkUploadResponse {
  success: boolean;
  message: string;
  details: string[];
  statistics: UploadStatistics;
}

export interface ValidationResponse {
  success: boolean;
  message: string;
  statistics?: {
    users_count: number;
    places_count: number;
    days_count: number;
    owners_count: number;
    teachers_count: number;
  };
  school_info?: {
    school_name: string;
    start_time?: string;
    end_time?: string;
  };
  validation_errors?: Record<string, string[]>;
  error?: string;
}

export interface UploadHistory {
  id: number;
  upload_date: string;
  uploaded_by: string;
  file_name: string;
  status: "success" | "failed";
  schools_created?: number;
  users_created?: number;
  places_created?: number;
  days_created?: number;
  error_message?: string;
}

export interface FormatGuide {
  description: string;
  sheets: Array<{
    name: string;
    description: string;
    required_columns: Array<{
      name: string;
      type: string;
      description: string;
      optional?: boolean;
      choices?: string[];
    }>;
    notes: string[];
  }>;
  general_notes: string[];
}

export interface ExcelUploadFormData {
  file: File | null;
  isValidating: boolean;
  isUploading: boolean;
  validationResult: ValidationResponse | null;
  uploadResult: BulkUploadResponse | null;
}
