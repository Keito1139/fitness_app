// frontend/src/components/fixedShift/ShiftEditModal.tsx

import React, { useState, useEffect, useCallback } from "react";
import { X, Users, Save } from "lucide-react";
import { shiftApi } from "../../services/fixedShiftService";
import { useToast } from "../../contexts/ToastContext";
import type { FixedShift, AvailableTeacher } from "../../types/fixedShift";

interface ShiftEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  shift: FixedShift;
  schoolId: number;
  onSuccess: () => void;
}

const ShiftEditModal: React.FC<ShiftEditModalProps> = ({
  isOpen,
  onClose,
  shift,
  schoolId,
  onSuccess,
}) => {
  const [formData, setFormData] = useState({
    teacherIds: [] as number[],
    description: "",
  });

  const [availableTeachers, setAvailableTeachers] = useState<
    AvailableTeacher[]
  >([]);
  const [loading, setLoading] = useState(false);
  const [loadingTeachers, setLoadingTeachers] = useState(false);

  const { showError } = useToast();

  // フォームデータを初期化
  useEffect(() => {
    if (isOpen && shift) {
      setFormData({
        teacherIds: shift.teacher.map((t) => t.id),
        description: shift.description || "",
      });
    }
  }, [isOpen, shift]);

  // 利用可能な講師を取得
  const loadAvailableTeachers = useCallback(async () => {
    setLoadingTeachers(true);
    try {
      const teachers = await shiftApi.getAvailableTeachers({
        school_id: schoolId,
        day_id: shift.day,
        start_time: shift.start_time.slice(0, 5), // HH:MM形式に変換
        end_time: shift.end_time.slice(0, 5), // HH:MM形式に変換
        place_id: shift.place,
      });

      // 現在割り当てられている講師も含める
      const allTeachers = [...teachers];

      // 現在の講師で利用可能リストにない場合は追加
      for (const currentTeacher of shift.teacher) {
        if (!teachers.find((t) => t.id === currentTeacher.id)) {
          allTeachers.push({
            id: currentTeacher.id,
            username: currentTeacher.username,
            first_name: currentTeacher.first_name,
            last_name: currentTeacher.last_name,
            full_name: currentTeacher.full_name,
            email: currentTeacher.email,
            is_available: false, // 重複している可能性
            current_shifts: [],
            can_teach_at_place: true,
            available_places: [],
            role_display: currentTeacher.role_display,
            is_teacher: currentTeacher.is_teacher,
            is_owner: currentTeacher.is_owner,
          });
        }
      }

      setAvailableTeachers(allTeachers);
    } catch (error) {
      console.error("講師リスト取得エラー:", error);
      showError("講師リストの取得に失敗しました");
    } finally {
      setLoadingTeachers(false);
    }
  }, [schoolId, shift, showError]);

  useEffect(() => {
    if (isOpen) {
      loadAvailableTeachers();
    }
  }, [isOpen, loadAvailableTeachers]);

  // 講師の選択/選択解除
  const toggleTeacher = (teacherId: number) => {
    setFormData((prev) => ({
      ...prev,
      teacherIds: prev.teacherIds.includes(teacherId)
        ? prev.teacherIds.filter((id) => id !== teacherId)
        : [...prev.teacherIds, teacherId],
    }));
  };

  // フォーム送信
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setLoading(true);
    try {
      await shiftApi.updateFixedShift(shift.id, {
        teacher_ids: formData.teacherIds,
        description: formData.description || undefined,
      });
      onSuccess();
    } catch (error) {
      console.error("シフト更新エラー:", error);
      showError("シフトの更新に失敗しました");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
        {/* 背景オーバーレイ */}
        <div
          className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
          onClick={onClose}
        />

        {/* モーダルコンテンツ */}
        <div className="relative transform overflow-hidden rounded-lg bg-white px-4 pb-4 pt-5 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg sm:p-6">
          <div className="absolute right-0 top-0 hidden pr-4 pt-4 sm:block">
            <button
              type="button"
              className="rounded-md bg-white text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              onClick={onClose}
            >
              <span className="sr-only">閉じる</span>
              <X className="h-6 w-6" />
            </button>
          </div>

          <div className="sm:flex sm:items-start">
            <div className="mt-3 w-full text-center sm:mt-0 sm:text-left">
              <h3 className="text-lg font-semibold leading-6 text-gray-900 mb-4">
                シフト編集
              </h3>

              {/* シフト情報表示 */}
              <div className="bg-gray-50 rounded-lg p-4 mb-6">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">曜日:</span>
                    <span className="ml-2 font-medium">{shift.day_name}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">場所:</span>
                    <span className="ml-2 font-medium">{shift.place_name}</span>
                  </div>
                  <div className="col-span-2">
                    <span className="text-gray-600">時間:</span>
                    <span className="ml-2 font-medium">
                      {shift.start_time.slice(0, 5)} -{" "}
                      {shift.end_time.slice(0, 5)}
                      <span className="text-gray-500 ml-2">
                        ({shift.duration_minutes}分)
                      </span>
                    </span>
                  </div>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                {/* 講師選択 */}
                <div className="space-y-4">
                  <h4 className="flex items-center text-sm font-medium text-gray-900">
                    <Users className="h-4 w-4 mr-2" />
                    講師選択
                  </h4>

                  {loadingTeachers ? (
                    <div className="flex items-center justify-center py-4">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                      <span className="ml-2 text-gray-600">読み込み中...</span>
                    </div>
                  ) : (
                    <div className="max-h-48 overflow-y-auto border border-gray-200 rounded-md">
                      {availableTeachers.map((teacher) => {
                        const isCurrentlyAssigned = shift.teacher.some(
                          (t) => t.id === teacher.id
                        );
                        const isSelected = formData.teacherIds.includes(
                          teacher.id
                        );

                        return (
                          <label
                            key={teacher.id}
                            className={`flex items-center p-3 hover:bg-gray-50 cursor-pointer border-b last:border-b-0 ${
                              !teacher.is_available && !isCurrentlyAssigned
                                ? "bg-red-50"
                                : ""
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => toggleTeacher(teacher.id)}
                              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                            />
                            <div className="ml-3 flex-1">
                              <div className="text-sm font-medium text-gray-900">
                                {teacher.full_name}
                                {isCurrentlyAssigned && (
                                  <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                                    現在の講師
                                  </span>
                                )}
                              </div>
                              <div className="text-xs text-gray-500">
                                {teacher.role_display}
                              </div>
                              {!teacher.is_available &&
                                !isCurrentlyAssigned && (
                                  <div className="text-xs text-red-600">
                                    他のシフトと重複しています
                                  </div>
                                )}
                              {teacher.current_shifts.length > 0 && (
                                <div className="text-xs text-orange-600">
                                  同時間帯:{" "}
                                  {teacher.current_shifts
                                    .map((s) => s.place_name)
                                    .join(", ")}
                                </div>
                              )}
                            </div>
                          </label>
                        );
                      })}
                    </div>
                  )}

                  {formData.teacherIds.length > 0 && (
                    <div className="text-sm text-gray-600">
                      選択中: {formData.teacherIds.length}名
                    </div>
                  )}
                </div>

                {/* 説明 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    説明（任意）
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        description: e.target.value,
                      }))
                    }
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="シフトの説明を入力してください"
                  />
                </div>

                {/* 変更点の表示 */}
                <div className="bg-blue-50 rounded-lg p-3">
                  <h5 className="text-sm font-medium text-blue-900 mb-2">
                    変更内容
                  </h5>
                  <div className="text-sm text-blue-800">
                    {/* 講師の変更 */}
                    <div>
                      <span className="font-medium">講師:</span>
                      <div className="ml-2">
                        {formData.teacherIds.length === 0 ? (
                          <span className="text-gray-600">なし</span>
                        ) : (
                          availableTeachers
                            .filter((t) => formData.teacherIds.includes(t.id))
                            .map((t) => t.full_name)
                            .join(", ")
                        )}
                      </div>
                    </div>

                    {/* 説明の変更 */}
                    {formData.description !== (shift.description || "") && (
                      <div className="mt-2">
                        <span className="font-medium">説明:</span>
                        <div className="ml-2">
                          {formData.description || "(なし)"}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* ボタン */}
                <div className="flex space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={onClose}
                    className="flex-1 bg-gray-100 text-gray-900 px-4 py-2 rounded-md text-sm font-medium hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
                  >
                    キャンセル
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? (
                      <div className="flex items-center justify-center">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        更新中...
                      </div>
                    ) : (
                      <div className="flex items-center justify-center">
                        <Save className="h-4 w-4 mr-2" />
                        更新
                      </div>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ShiftEditModal;
