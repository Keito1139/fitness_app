// frontend/src/components/teacher/TeacherModal.tsx

import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  X,
  User,
  Mail,
  Lock,
  School,
  Eye,
  EyeOff,
  Save,
  UserPlus,
  AlertCircle,
} from "lucide-react";
import { useToast } from "../../contexts/ToastContext";
import teacherService from "../../services/teacherService";
import type {
  Teacher,
  School as SchoolType,
  TeacherFormData,
  TeacherUpdateData,
  ApiError,
} from "../../types/teacher";
import type { Place } from "../../types/config";

interface TeacherModalProps {
  teacher?: Teacher | null;
  onClose: () => void;
  onSuccess: () => void;
}

const TeacherModal: React.FC<TeacherModalProps> = ({
  teacher,
  onClose,
  onSuccess,
}) => {
  const [formData, setFormData] = useState<TeacherFormData>({
    username: "",
    email: "",
    first_name: "",
    last_name: "",
    password: "",
    password_confirm: "",
    current_school: null,
    schools: [],
    place: [],
    is_active: true,
  });

  const [schools, setSchools] = useState<SchoolType[]>([]);
  const [places, setPlaces] = useState<Place[]>([]);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordConfirm, setShowPasswordConfirm] = useState(false);
  const [errors, setErrors] = useState<Record<string, string[]>>({});

  const modalRef = useRef<HTMLDivElement>(null);
  const firstInputRef = useRef<HTMLInputElement>(null);
  const { showToast } = useToast();
  const isEdit = !!teacher;

  // 学校一覧取得
  const fetchSchools = useCallback(async () => {
    try {
      const schoolsData = await teacherService.getSchools();
      setSchools(Array.isArray(schoolsData) ? schoolsData : []); // 必ず配列にする
    } catch (error) {
      console.error("学校一覧取得エラー:", error);
      showToast("学校一覧の取得に失敗しました", "error");
      setSchools([]); // エラー時は空配列
    }
  }, [showToast]);

  // 指導場所一覧取得
  const fetchPlaces = useCallback(
    async (schoolIds?: number[]) => {
      try {
        if (!schoolIds || schoolIds.length === 0) {
          setPlaces([]);
          return;
        }

        // 複数の学校の場所を取得
        const allPlaces: Place[] = [];
        for (const schoolId of schoolIds) {
          const schoolPlaces = await teacherService.getPlaces(schoolId);
          allPlaces.push(...schoolPlaces);
        }

        // 重複を除去
        const uniquePlaces = allPlaces.filter(
          (place, index, self) =>
            index === self.findIndex((p) => p.id === place.id)
        );

        setPlaces(uniquePlaces);
      } catch (error) {
        console.error("指導場所一覧取得エラー:", error);
        showToast("指導場所一覧の取得に失敗しました", "error");
        setPlaces([]);
      }
    },
    [showToast]
  );

  // useEffectを修正
  useEffect(() => {
    fetchSchools();

    if (teacher) {
      setFormData({
        username: teacher.username,
        email: teacher.email,
        first_name: teacher.first_name,
        last_name: teacher.last_name,
        password: "",
        password_confirm: "",
        current_school: teacher.current_school,
        schools: teacher.schools,
        place: teacher.place || [],
        is_active: teacher.is_active,
      });

      // 講師の学校に基づいて指導場所を取得
      if (teacher.schools && teacher.schools.length > 0) {
        fetchPlaces(teacher.schools);
      }
    }

    // 最初の入力フィールドにフォーカス
    setTimeout(() => {
      firstInputRef.current?.focus();
    }, 100);

    // Escキーでモーダルを閉じる
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [teacher, onClose, fetchSchools, fetchPlaces]);

  // フォーム入力ハンドラー
  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]:
        type === "checkbox"
          ? (e.target as HTMLInputElement).checked
          : type === "number"
          ? value
            ? parseInt(value)
            : null
          : value,
    }));

    // エラーをクリア
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: [],
      }));
    }
  };

  // 学校選択時に指導場所も更新
  const handleSchoolChange = (schoolId: number, checked: boolean) => {
    setFormData((prev) => {
      const newSchools = checked
        ? [...prev.schools, schoolId]
        : prev.schools.filter((id) => id !== schoolId);

      const newCurrentSchool = newSchools.includes(prev.current_school || 0)
        ? prev.current_school
        : newSchools.length > 0
        ? newSchools[0]
        : null;

      // 指導場所を更新（選択されていない学校の場所を除外）
      const newPlaces = prev.place.filter((placeId) => {
        const place = places.find((p) => p.id === placeId);
        return place && newSchools.includes(place.school);
      });

      return {
        ...prev,
        schools: newSchools,
        current_school: newCurrentSchool,
        place: newPlaces,
      };
    });

    // 学校選択に基づいて指導場所一覧を更新
    const newSchools = checked
      ? [...formData.schools, schoolId]
      : formData.schools.filter((id) => id !== schoolId);

    if (newSchools.length > 0) {
      fetchPlaces(newSchools);
    } else {
      setPlaces([]);
    }
  };

  // 指導場所選択ハンドラー
  const handlePlaceChange = (placeId: number, checked: boolean) => {
    setFormData((prev) => ({
      ...prev,
      place: checked
        ? [...prev.place, placeId]
        : prev.place.filter((id) => id !== placeId),
    }));
  };

  // バリデーション
  const validateForm = (): boolean => {
    const newErrors: Record<string, string[]> = {};

    // 必須項目チェック
    if (!formData.username.trim()) {
      newErrors.username = ["ユーザー名は必須です"];
    }
    if (!formData.email.trim()) {
      newErrors.email = ["メールアドレスは必須です"];
    }
    if (!formData.first_name.trim()) {
      newErrors.first_name = ["名前は必須です"];
    }
    if (!formData.last_name.trim()) {
      newErrors.last_name = ["苗字は必須です"];
    }

    // 新規作成時のパスワードチェック
    if (!isEdit) {
      if (!formData.password) {
        newErrors.password = ["パスワードは必須です"];
      } else if (formData.password.length < 8) {
        newErrors.password = ["パスワードは8文字以上である必要があります"];
      }

      if (!formData.password_confirm) {
        newErrors.password_confirm = ["パスワード確認は必須です"];
      } else if (formData.password !== formData.password_confirm) {
        newErrors.password_confirm = ["パスワードが一致しません"];
      }
    }

    // メールアドレス形式チェック
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (formData.email && !emailRegex.test(formData.email)) {
      newErrors.email = ["正しいメールアドレス形式で入力してください"];
    }

    // 学校選択チェック
    if (formData.schools.length === 0) {
      newErrors.schools = ["少なくとも1つの学校を選択してください"];
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // フォーム送信
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      if (isEdit && teacher) {
        // 更新処理
        const updateData: TeacherUpdateData = {
          email: formData.email,
          first_name: formData.first_name,
          last_name: formData.last_name,
          is_active: formData.is_active ?? true,
          current_school: formData.current_school,
          schools: formData.schools,
          place: formData.place,
        };

        await teacherService.updateTeacher(teacher.id, updateData);
        showToast("講師情報を更新しました", "success");
      } else {
        // 新規作成
        await teacherService.createTeacher(formData);
        showToast("講師を作成しました", "success");
      }

      onSuccess();
    } catch (error: unknown) {
      console.error("講師保存エラー:", error);

      const axiosError = error as { response?: { data?: ApiError } };
      if (axiosError.response?.data) {
        const apiError = axiosError.response.data;

        // フィールドエラーを設定
        const fieldErrors: Record<string, string[]> = {};
        Object.entries(apiError).forEach(([key, value]) => {
          if (Array.isArray(value)) {
            fieldErrors[key] = value;
          } else if (typeof value === "string") {
            fieldErrors[key] = [value];
          }
        });
        setErrors(fieldErrors);

        // 一般的なエラーメッセージを表示
        if (apiError.error) {
          showToast(apiError.error, "error");
        } else if (apiError.non_field_errors) {
          showToast(apiError.non_field_errors[0], "error");
        } else if (apiError.detail) {
          showToast(apiError.detail, "error");
        } else {
          showToast("保存に失敗しました", "error");
        }
      } else {
        showToast("サーバーエラーが発生しました", "error");
      }
    } finally {
      setLoading(false);
    }
  };

  // 背景クリックでモーダルを閉じる
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div
        className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0"
        onClick={handleBackdropClick}
      >
        {/* 背景オーバーレイ */}
        <div
          className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
          aria-hidden="true"
        />

        {/* モーダルコンテンツ */}
        <div
          ref={modalRef}
          className="relative transform overflow-hidden rounded-lg bg-white text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-2xl"
        >
          {/* ヘッダー */}
          <div className="bg-white px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-blue-600 rounded-lg">
                  {isEdit ? (
                    <User className="h-5 w-5 text-white" />
                  ) : (
                    <UserPlus className="h-5 w-5 text-white" />
                  )}
                </div>
                <h3 className="text-lg font-medium text-gray-900">
                  {isEdit ? "講師情報編集" : "新規講師追加"}
                </h3>
              </div>
              <button
                type="button"
                className="rounded-md bg-white text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                onClick={onClose}
                disabled={loading}
              >
                <span className="sr-only">閉じる</span>
                <X className="h-6 w-6" />
              </button>
            </div>
          </div>

          {/* フォーム */}
          <form onSubmit={handleSubmit} className="bg-white">
            <div className="px-6 py-6 space-y-6">
              {/* 基本情報 */}
              <div>
                <h4 className="text-sm font-medium text-gray-900 mb-4">
                  基本情報
                </h4>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  {/* ユーザー名 */}
                  <div>
                    <label
                      htmlFor="username"
                      className="block text-sm font-medium text-gray-700"
                    >
                      ユーザー名 <span className="text-red-500">*</span>
                    </label>
                    <div className="mt-1 relative">
                      <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <input
                        ref={firstInputRef}
                        type="text"
                        id="username"
                        name="username"
                        value={formData.username}
                        onChange={handleInputChange}
                        disabled={loading || isEdit} // 編集時は変更不可
                        className={`block w-full pl-10 pr-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed ${
                          errors.username ? "border-red-300" : "border-gray-300"
                        }`}
                        placeholder="ユーザー名を入力"
                      />
                    </div>
                    {errors.username && (
                      <div className="mt-1 flex items-center space-x-1">
                        <AlertCircle className="h-4 w-4 text-red-500" />
                        <p className="text-sm text-red-600">
                          {errors.username[0]}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* メールアドレス */}
                  <div>
                    <label
                      htmlFor="email"
                      className="block text-sm font-medium text-gray-700"
                    >
                      メールアドレス <span className="text-red-500">*</span>
                    </label>
                    <div className="mt-1 relative">
                      <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <input
                        type="email"
                        id="email"
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        disabled={loading}
                        className={`block w-full pl-10 pr-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed ${
                          errors.email ? "border-red-300" : "border-gray-300"
                        }`}
                        placeholder="example@email.com"
                      />
                    </div>
                    {errors.email && (
                      <div className="mt-1 flex items-center space-x-1">
                        <AlertCircle className="h-4 w-4 text-red-500" />
                        <p className="text-sm text-red-600">
                          {errors.email[0]}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* 姓 */}
                  <div>
                    <label
                      htmlFor="last_name"
                      className="block text-sm font-medium text-gray-700"
                    >
                      姓 <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      id="last_name"
                      name="last_name"
                      value={formData.last_name}
                      onChange={handleInputChange}
                      disabled={loading}
                      className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed ${
                        errors.last_name ? "border-red-300" : "border-gray-300"
                      }`}
                      placeholder="山田"
                    />
                    {errors.last_name && (
                      <div className="mt-1 flex items-center space-x-1">
                        <AlertCircle className="h-4 w-4 text-red-500" />
                        <p className="text-sm text-red-600">
                          {errors.last_name[0]}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* 名 */}
                  <div>
                    <label
                      htmlFor="first_name"
                      className="block text-sm font-medium text-gray-700"
                    >
                      名 <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      id="first_name"
                      name="first_name"
                      value={formData.first_name}
                      onChange={handleInputChange}
                      disabled={loading}
                      className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed ${
                        errors.first_name ? "border-red-300" : "border-gray-300"
                      }`}
                      placeholder="太郎"
                    />
                    {errors.first_name && (
                      <div className="mt-1 flex items-center space-x-1">
                        <AlertCircle className="h-4 w-4 text-red-500" />
                        <p className="text-sm text-red-600">
                          {errors.first_name[0]}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* パスワード（新規作成時のみ） */}
              {!isEdit && (
                <div>
                  <h4 className="text-sm font-medium text-gray-900 mb-4">
                    パスワード設定
                  </h4>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    {/* パスワード */}
                    <div>
                      <label
                        htmlFor="password"
                        className="block text-sm font-medium text-gray-700"
                      >
                        パスワード <span className="text-red-500">*</span>
                      </label>
                      <div className="mt-1 relative">
                        <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <input
                          type={showPassword ? "text" : "password"}
                          id="password"
                          name="password"
                          value={formData.password}
                          onChange={handleInputChange}
                          disabled={loading}
                          className={`block w-full pl-10 pr-10 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed ${
                            errors.password
                              ? "border-red-300"
                              : "border-gray-300"
                          }`}
                          placeholder="8文字以上"
                        />
                        <button
                          type="button"
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                          onClick={() => setShowPassword(!showPassword)}
                        >
                          {showPassword ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                      {errors.password && (
                        <div className="mt-1 flex items-center space-x-1">
                          <AlertCircle className="h-4 w-4 text-red-500" />
                          <p className="text-sm text-red-600">
                            {errors.password[0]}
                          </p>
                        </div>
                      )}
                    </div>

                    {/* パスワード確認 */}
                    <div>
                      <label
                        htmlFor="password_confirm"
                        className="block text-sm font-medium text-gray-700"
                      >
                        パスワード確認 <span className="text-red-500">*</span>
                      </label>
                      <div className="mt-1 relative">
                        <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <input
                          type={showPasswordConfirm ? "text" : "password"}
                          id="password_confirm"
                          name="password_confirm"
                          value={formData.password_confirm}
                          onChange={handleInputChange}
                          disabled={loading}
                          className={`block w-full pl-10 pr-10 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed ${
                            errors.password_confirm
                              ? "border-red-300"
                              : "border-gray-300"
                          }`}
                          placeholder="パスワードを再入力"
                        />
                        <button
                          type="button"
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                          onClick={() =>
                            setShowPasswordConfirm(!showPasswordConfirm)
                          }
                        >
                          {showPasswordConfirm ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                      {errors.password_confirm && (
                        <div className="mt-1 flex items-center space-x-1">
                          <AlertCircle className="h-4 w-4 text-red-500" />
                          <p className="text-sm text-red-600">
                            {errors.password_confirm[0]}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* 学校設定 */}
              <div>
                <h4 className="text-sm font-medium text-gray-900 mb-4">
                  学校設定
                </h4>
                <div className="space-y-4">
                  {/* 所属学校選択 */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      所属学校 <span className="text-red-500">*</span>
                    </label>
                    <div className="border rounded-md p-3 bg-gray-50 max-h-40 overflow-y-auto">
                      {!schools || schools.length === 0 ? (
                        <p className="text-sm text-gray-500">
                          学校が登録されていません
                        </p>
                      ) : (
                        <div className="space-y-2">
                          {schools.map((school) => (
                            <label
                              key={school.id}
                              className="flex items-center space-x-2 cursor-pointer"
                            >
                              <input
                                type="checkbox"
                                checked={formData.schools.includes(school.id)}
                                onChange={(e) =>
                                  handleSchoolChange(
                                    school.id,
                                    e.target.checked
                                  )
                                }
                                disabled={loading}
                                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 disabled:cursor-not-allowed"
                              />
                              <span className="text-sm text-gray-700">
                                {school.name}
                              </span>
                            </label>
                          ))}
                        </div>
                      )}
                    </div>
                    {errors.schools && (
                      <div className="mt-1 flex items-center space-x-1">
                        <AlertCircle className="h-4 w-4 text-red-500" />
                        <p className="text-sm text-red-600">
                          {errors.schools[0]}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* 指導場所選択 */}
                  {formData.schools.length > 0 && places.length > 0 && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        指導可能場所
                      </label>
                      <div className="border rounded-md p-3 bg-gray-50 max-h-40 overflow-y-auto">
                        <div className="space-y-2">
                          {places.map((place) => (
                            <label
                              key={place.id}
                              className="flex items-center space-x-2 cursor-pointer"
                            >
                              <input
                                type="checkbox"
                                checked={formData.place.includes(place.id)}
                                onChange={(e) =>
                                  handlePlaceChange(place.id, e.target.checked)
                                }
                                disabled={loading}
                                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 disabled:cursor-not-allowed"
                              />
                              <span className="text-sm text-gray-700">
                                {place.name}
                                <span className="text-xs text-gray-500 ml-1">
                                  (
                                  {
                                    schools.find((s) => s.id === place.school)
                                      ?.name
                                  }
                                  )
                                </span>
                              </span>
                            </label>
                          ))}
                        </div>
                      </div>
                      {errors.place && (
                        <div className="mt-1 flex items-center space-x-1">
                          <AlertCircle className="h-4 w-4 text-red-500" />
                          <p className="text-sm text-red-600">
                            {errors.place[0]}
                          </p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* 現在の学校選択 */}
                  {formData.schools.length > 0 && (
                    <div>
                      <label
                        htmlFor="current_school"
                        className="block text-sm font-medium text-gray-700"
                      >
                        現在の学校
                      </label>
                      <div className="mt-1 relative">
                        <School className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <select
                          id="current_school"
                          name="current_school"
                          value={formData.current_school || ""}
                          onChange={handleInputChange}
                          disabled={loading}
                          className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                        >
                          <option value="">選択してください</option>
                          {Array.isArray(schools) &&
                            schools
                              .filter((school) =>
                                formData.schools.includes(school.id)
                              )
                              .map((school) => (
                                <option key={school.id} value={school.id}>
                                  {school.name}
                                </option>
                              ))}
                        </select>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* ステータス設定（編集時のみ） */}
              {isEdit && (
                <div>
                  <h4 className="text-sm font-medium text-gray-900 mb-4">
                    ステータス設定
                  </h4>
                  <div className="flex items-center">
                    <input
                      id="is_active"
                      name="is_active"
                      type="checkbox"
                      checked={formData.is_active}
                      onChange={handleInputChange}
                      disabled={loading}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded disabled:cursor-not-allowed"
                    />
                    <label
                      htmlFor="is_active"
                      className="ml-2 block text-sm text-gray-900"
                    >
                      有効（ログイン可能）
                    </label>
                  </div>
                </div>
              )}
            </div>

            {/* フッター */}
            <div className="bg-gray-50 px-6 py-3 flex items-center justify-end space-x-3 border-t border-gray-200">
              <button
                type="button"
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={onClose}
                disabled={loading}
              >
                キャンセル
              </button>
              <button
                type="submit"
                disabled={loading}
                className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    {isEdit ? "更新中..." : "作成中..."}
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    {isEdit ? "更新" : "作成"}
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default TeacherModal;
