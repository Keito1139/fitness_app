// frontend/src/components/fixedShift/FixedShiftCreateModal.tsx

import React, { useState, useEffect, useCallback } from "react";
import { X, Clock, Users } from "lucide-react";
import { shiftApi } from "../../services/fixedShiftService";
import { useToast } from "../../contexts/ToastContext";
import type {
  AvailableTeacher,
  CreateFixedShiftRequest,
} from "../../types/fixedShift";

interface ShiftCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  schoolId: number;
  dayId: number;
  placeId: number;
  initialHour?: number;
  initialMinute?: number;
  schoolStartTime?: string;
  schoolEndTime?: string;
  onSuccess: () => void;
}

const ShiftCreateModal: React.FC<ShiftCreateModalProps> = ({
  isOpen,
  onClose,
  schoolId,
  dayId,
  placeId,
  initialHour = 9,
  initialMinute = 0,
  schoolStartTime,
  schoolEndTime,
  onSuccess,
}) => {
  const [formData, setFormData] = useState({
    startHour: initialHour,
    startMinute: initialMinute,
    endHour: initialHour + 1,
    endMinute: initialMinute,
    teacherIds: [] as number[],
    description: "",
  });

  const [availableTeachers, setAvailableTeachers] = useState<
    AvailableTeacher[]
  >([]);
  const [loading, setLoading] = useState(false);
  const [loadingTeachers, setLoadingTeachers] = useState(false);

  const { showError } = useToast();

  // 時間・分の選択肢を生成
  const generateHourOptions = () => {
    const options = [];
    let startHour = 0;
    let endHour = 23;

    if (schoolStartTime) {
      startHour = parseInt(schoolStartTime.split(":")[0]);
    }
    if (schoolEndTime) {
      endHour = parseInt(schoolEndTime.split(":")[0]);
    }

    for (let hour = startHour; hour <= endHour; hour++) {
      options.push(hour);
    }
    return options;
  };

  const generateMinuteOptions = (hour: number) => {
    const options = [];
    let startMinute = 0;
    let endMinute = 59;

    // 学校開始時間の時の場合
    if (schoolStartTime && hour === parseInt(schoolStartTime.split(":")[0])) {
      startMinute = parseInt(schoolStartTime.split(":")[1]);
    }

    // 学校終了時間の時の場合
    if (schoolEndTime && hour === parseInt(schoolEndTime.split(":")[0])) {
      endMinute = parseInt(schoolEndTime.split(":")[1]);
    }

    for (let minute = startMinute; minute <= endMinute; minute++) {
      options.push(minute);
    }
    return options;
  };

  const hourOptions = generateHourOptions();

  // 初期時間設定
  useEffect(() => {
    if (isOpen) {
      setFormData({
        startHour: initialHour,
        startMinute: initialMinute,
        endHour: initialHour + 1,
        endMinute: initialMinute,
        teacherIds: [],
        description: "",
      });
    }
  }, [isOpen, initialHour, initialMinute]);

  // 利用可能な講師を取得
  const loadAvailableTeachers = useCallback(async () => {
    const startTime = `${formData.startHour
      .toString()
      .padStart(2, "0")}:${formData.startMinute.toString().padStart(2, "0")}`;
    const endTime = `${formData.endHour
      .toString()
      .padStart(2, "0")}:${formData.endMinute.toString().padStart(2, "0")}`;

    setLoadingTeachers(true);
    try {
      const teachers = await shiftApi.getAvailableTeachers({
        school_id: schoolId,
        day_id: dayId,
        start_time: startTime,
        end_time: endTime,
        place_id: placeId,
      });
      setAvailableTeachers(teachers);
    } catch (error) {
      console.error("講師リスト取得エラー:", error);
      showError("講師リストの取得に失敗しました");
    } finally {
      setLoadingTeachers(false);
    }
  }, [
    schoolId,
    dayId,
    placeId,
    formData.startHour,
    formData.startMinute,
    formData.endHour,
    formData.endMinute,
    showError,
  ]);

  // 時間が変更されたときに講師リストを再取得
  useEffect(() => {
    loadAvailableTeachers();
  }, [
    formData.startHour,
    formData.startMinute,
    formData.endHour,
    formData.endMinute,
    loadAvailableTeachers,
  ]);

  // 時間のバリデーション
  const validateTimes = () => {
    const startTotalMinutes = formData.startHour * 60 + formData.startMinute;
    const endTotalMinutes = formData.endHour * 60 + formData.endMinute;

    return endTotalMinutes > startTotalMinutes;
  };

  // 時間の長さを計算
  const calculateDuration = () => {
    const startTotalMinutes = formData.startHour * 60 + formData.startMinute;
    const endTotalMinutes = formData.endHour * 60 + formData.endMinute;

    return Math.max(0, endTotalMinutes - startTotalMinutes);
  };

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

    // バリデーション
    if (!validateTimes()) {
      showError("終了時間は開始時間より後に設定してください");
      return;
    }

    const duration = calculateDuration();
    if (duration < 1) {
      showError("シフトは最低1分以上に設定してください");
      return;
    }

    setLoading(true);
    try {
      const requestData: CreateFixedShiftRequest = {
        day: dayId,
        start_time: `${formData.startHour
          .toString()
          .padStart(2, "0")}:${formData.startMinute
          .toString()
          .padStart(2, "0")}`,
        end_time: `${formData.endHour
          .toString()
          .padStart(2, "0")}:${formData.endMinute.toString().padStart(2, "0")}`,
        teacher_ids: formData.teacherIds,
        place: placeId,
        description: formData.description || undefined,
      };

      await shiftApi.createFixedShift(requestData);
      onSuccess();
    } catch (error) {
      console.error("シフト作成エラー:", error);
      showError("シフトの作成に失敗しました");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const duration = calculateDuration();
  const isValidTime = validateTimes();

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
                新規シフト作成
              </h3>

              <form onSubmit={handleSubmit} className="space-y-6">
                {/* 時間設定 */}
                <div className="space-y-4">
                  <h4 className="flex items-center text-sm font-medium text-gray-900">
                    <Clock className="h-4 w-4 mr-2" />
                    時間設定
                  </h4>

                  <div className="grid grid-cols-2 gap-4">
                    {/* 開始時間 */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        開始時間
                      </label>
                      <div className="flex space-x-2">
                        {/* 時 */}
                        <select
                          value={formData.startHour}
                          onChange={(e) =>
                            setFormData((prev) => ({
                              ...prev,
                              startHour: Number(e.target.value),
                            }))
                          }
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        >
                          {hourOptions.map((hour) => (
                            <option key={hour} value={hour}>
                              {hour.toString().padStart(2, "0")}
                            </option>
                          ))}
                        </select>
                        <span className="flex items-center text-gray-500">
                          :
                        </span>
                        {/* 分 */}
                        <select
                          value={formData.startMinute}
                          onChange={(e) =>
                            setFormData((prev) => ({
                              ...prev,
                              startMinute: Number(e.target.value),
                            }))
                          }
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        >
                          {generateMinuteOptions(formData.startHour).map(
                            (minute) => (
                              <option key={minute} value={minute}>
                                {minute.toString().padStart(2, "0")}
                              </option>
                            )
                          )}
                        </select>
                      </div>
                    </div>

                    {/* 終了時間 */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        終了時間
                      </label>
                      <div className="flex space-x-2">
                        {/* 時 */}
                        <select
                          value={formData.endHour}
                          onChange={(e) =>
                            setFormData((prev) => ({
                              ...prev,
                              endHour: Number(e.target.value),
                            }))
                          }
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        >
                          {hourOptions.map((hour) => (
                            <option key={hour} value={hour}>
                              {hour.toString().padStart(2, "0")}
                            </option>
                          ))}
                        </select>
                        <span className="flex items-center text-gray-500">
                          :
                        </span>
                        {/* 分 */}
                        <select
                          value={formData.endMinute}
                          onChange={(e) =>
                            setFormData((prev) => ({
                              ...prev,
                              endMinute: Number(e.target.value),
                            }))
                          }
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        >
                          {generateMinuteOptions(formData.endHour).map(
                            (minute) => (
                              <option key={minute} value={minute}>
                                {minute.toString().padStart(2, "0")}
                              </option>
                            )
                          )}
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* 時間表示・バリデーション */}
                  <div className="text-sm">
                    <div>
                      {isValidTime ? (
                        <div className="text-gray-600">
                          時間: {Math.floor(duration / 60)}時間{duration % 60}分
                        </div>
                      ) : (
                        <div className="text-red-600">
                          終了時間は開始時間より後に設定してください
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* 講師選択 */}
                <div className="space-y-4">
                  <h4 className="flex items-center text-sm font-medium text-gray-900">
                    <Users className="h-4 w-4 mr-2" />
                    講師選択
                  </h4>

                  {!isValidTime ? (
                    <div className="text-sm text-gray-500 py-4 text-center">
                      正しい時間を設定してください
                    </div>
                  ) : loadingTeachers ? (
                    <div className="flex items-center justify-center py-4">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                      <span className="ml-2 text-gray-600">読み込み中...</span>
                    </div>
                  ) : (
                    <div className="max-h-48 overflow-y-auto border border-gray-200 rounded-md">
                      {availableTeachers.length === 0 ? (
                        <div className="p-4 text-center text-gray-500 text-sm">
                          利用可能な講師がいません
                        </div>
                      ) : (
                        availableTeachers.map((teacher) => (
                          <label
                            key={teacher.id}
                            className={`flex items-center p-3 hover:bg-gray-50 cursor-pointer border-b last:border-b-0 ${
                              !teacher.is_available ? "bg-red-50" : ""
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={formData.teacherIds.includes(teacher.id)}
                              onChange={() => toggleTeacher(teacher.id)}
                              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                            />
                            <div className="ml-3 flex-1">
                              <div className="text-sm font-medium text-gray-900">
                                {teacher.full_name}
                              </div>
                              <div className="text-xs text-gray-500">
                                {teacher.role_display}
                              </div>
                              {!teacher.is_available && (
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
                        ))
                      )}
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
                    disabled={loading || !isValidTime}
                    className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? (
                      <div className="flex items-center justify-center">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        作成中...
                      </div>
                    ) : (
                      "作成"
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

export default ShiftCreateModal;
