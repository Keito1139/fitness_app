// frontend/src/components/fixedShift/FixedShiftManagement.tsx

import React, { useState, useEffect } from "react";
import { Calendar, AlertTriangle, Copy, BarChart3 } from "lucide-react";
import { useToast } from "../../contexts/ToastContext";
import { shiftApi } from "../../services/fixedShiftService";
import type { User } from "../../types/user";
import FixedShiftScheduleGrid from "./FixedShiftScheduleGrid";

interface ShiftManagementProps {
  user: User;
}

interface Conflict {
  teacher_name: string;
  day_name: string;
  conflicting_shifts: Array<{
    // 変更
    shift_id: number;
    start_time: string; // 変更
    end_time: string; // 変更
    place_name: string;
    description: string;
  }>;
}

const ShiftManagement: React.FC<ShiftManagementProps> = ({ user }) => {
  const [selectedSchoolId, setSelectedSchoolId] = useState<number | null>(null);
  const [conflicts, setConflicts] = useState<Conflict[]>([]);
  const [showConflicts, setShowConflicts] = useState(false);
  const [loadingConflicts, setLoadingConflicts] = useState(false);
  const [showCopyModal, setShowCopyModal] = useState(false);
  const [copySettings, setCopySettings] = useState({
    fromSchoolId: null as number | null,
    toSchoolId: null as number | null,
    overwrite: false,
  });
  const [copying, setCopying] = useState(false);

  const { showSuccess, showError, showWarning } = useToast();

  // 初期選択学校設定
  useEffect(() => {
    if (user.current_school && !selectedSchoolId) {
      setSelectedSchoolId(user.current_school);
    } else if (user.schools.length > 0 && !selectedSchoolId) {
      setSelectedSchoolId(user.schools[0]);
    }
  }, [user, selectedSchoolId]);

  // 競合チェック
  const checkConflicts = async () => {
    if (!selectedSchoolId) return;

    setLoadingConflicts(true);
    try {
      const result = await shiftApi.checkConflicts(selectedSchoolId);
      setConflicts(result.conflicts);

      if (result.conflict_count > 0) {
        showWarning(`${result.conflict_count}件の競合が見つかりました`);
        setShowConflicts(true);
      } else {
        showSuccess("競合はありません");
      }
    } catch (error) {
      console.error("競合チェックエラー:", error);
      showError("競合チェックに失敗しました");
    } finally {
      setLoadingConflicts(false);
    }
  };

  // 週間スケジュールコピー
  const handleCopyWeek = async () => {
    if (!copySettings.fromSchoolId || !copySettings.toSchoolId) {
      showError("コピー元とコピー先を選択してください");
      return;
    }

    if (copySettings.fromSchoolId === copySettings.toSchoolId) {
      showError("同じ学校を選択することはできません");
      return;
    }

    setCopying(true);
    try {
      const result = await shiftApi.copyWeekSchedule({
        from_school_id: copySettings.fromSchoolId,
        to_school_id: copySettings.toSchoolId,
        overwrite: copySettings.overwrite,
      });

      showSuccess(`${result.copied_count}件のシフトをコピーしました`);
      setShowCopyModal(false);

      // 現在表示中の学校がコピー先の場合は再読み込み
      if (selectedSchoolId === copySettings.toSchoolId) {
        window.location.reload(); // または適切な再読み込み処理
      }
    } catch (error) {
      console.error("週間コピーエラー:", error);
      showError("週間スケジュールのコピーに失敗しました");
    } finally {
      setCopying(false);
    }
  };

  // 利用可能な学校リスト取得
  const getAvailableSchools = () => {
    // user.schoolsは学校IDの配列なので、実際には学校データを取得する必要があります
    // ここでは簡易的に実装
    return user.schools.map((schoolId) => ({
      id: schoolId,
      name:
        schoolId === user.current_school
          ? user.current_school_name || `学校 ${schoolId}`
          : `学校 ${schoolId}`,
    }));
  };

  const availableSchools = getAvailableSchools();

  if (availableSchools.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            学校が設定されていません
          </h3>
          <p className="text-gray-600">
            シフト管理を利用するには、学校を設定してください。
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* ヘッダー */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">シフト管理</h1>
              <p className="text-gray-600 mt-1">固定シフトの作成・編集・管理</p>
            </div>

            {/* アクションボタン */}
            <div className="flex items-center space-x-3">
              {/* 競合チェック */}
              <button
                onClick={checkConflicts}
                disabled={!selectedSchoolId || loadingConflicts}
                className="inline-flex items-center px-4 py-2 border border-orange-300 text-sm font-medium rounded-md text-orange-700 bg-orange-50 hover:bg-orange-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 disabled:opacity-50"
              >
                {loadingConflicts ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-orange-600 mr-2"></div>
                ) : (
                  <AlertTriangle className="h-4 w-4 mr-2" />
                )}
                競合チェック
              </button>

              {/* 週間コピー */}
              <button
                onClick={() => setShowCopyModal(true)}
                disabled={availableSchools.length < 2}
                className="inline-flex items-center px-4 py-2 border border-blue-300 text-sm font-medium rounded-md text-blue-700 bg-blue-50 hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
              >
                <Copy className="h-4 w-4 mr-2" />
                週間コピー
              </button>

              {/* 統計表示 */}
              <button
                onClick={() => showSuccess("統計機能は開発中です")}
                className="inline-flex items-center px-4 py-2 border border-purple-300 text-sm font-medium rounded-md text-purple-700 bg-purple-50 hover:bg-purple-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
              >
                <BarChart3 className="h-4 w-4 mr-2" />
                統計
              </button>
            </div>
          </div>

          {/* 学校選択 */}
          {availableSchools.length > 1 && (
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                学校選択
              </label>
              <select
                value={selectedSchoolId || ""}
                onChange={(e) => setSelectedSchoolId(Number(e.target.value))}
                className="max-w-xs px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">学校を選択してください</option>
                {availableSchools.map((school) => (
                  <option key={school.id} value={school.id}>
                    {school.name}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* メインコンテンツ */}
        {selectedSchoolId ? (
          <FixedShiftScheduleGrid schoolId={selectedSchoolId} />
        ) : (
          <div className="text-center py-12">
            <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              学校を選択してください
            </h3>
            <p className="text-gray-600">
              シフト管理を開始するには、上記から学校を選択してください。
            </p>
          </div>
        )}

        {/* 競合表示モーダル */}
        {showConflicts && (
          <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
              <div
                className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
                onClick={() => setShowConflicts(false)}
              />
              <div className="relative transform overflow-hidden rounded-lg bg-white px-4 pb-4 pt-5 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-2xl sm:p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">
                    シフト競合一覧
                  </h3>
                  <button
                    onClick={() => setShowConflicts(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    ×
                  </button>
                </div>

                <div className="max-h-96 overflow-y-auto">
                  {conflicts.map((conflict, index) => (
                    <div
                      key={index}
                      className="border border-red-200 rounded-lg p-4 mb-3 bg-red-50"
                    >
                      <div className="flex items-start space-x-3">
                        <AlertTriangle className="h-5 w-5 text-red-500 mt-0.5" />
                        <div className="flex-1">
                          <div className="font-medium text-red-900">
                            {conflict.teacher_name}
                          </div>
                          <div className="text-sm text-red-700">
                            {conflict.day_name}
                          </div>
                          <div className="mt-2 space-y-1">
                            {conflict.conflicting_shifts.map(
                              // 変更
                              (shift, idx: number) => (
                                <div key={idx} className="text-xs text-red-600">
                                  • {shift.start_time.slice(0, 5)}-
                                  {shift.end_time.slice(0, 5)}{" "}
                                  {shift.place_name}
                                  {shift.description &&
                                    ` (${shift.description})`}
                                </div>
                              )
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-4 flex justify-end">
                  <button
                    onClick={() => setShowConflicts(false)}
                    className="px-4 py-2 bg-gray-100 text-gray-900 rounded-md hover:bg-gray-200"
                  >
                    閉じる
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 週間コピーモーダル */}
        {showCopyModal && (
          <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
              <div
                className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
                onClick={() => setShowCopyModal(false)}
              />
              <div className="relative transform overflow-hidden rounded-lg bg-white px-4 pb-4 pt-5 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg sm:p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  週間スケジュールコピー
                </h3>

                <div className="space-y-4">
                  {/* コピー元 */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      コピー元学校
                    </label>
                    <select
                      value={copySettings.fromSchoolId || ""}
                      onChange={(e) =>
                        setCopySettings((prev) => ({
                          ...prev,
                          fromSchoolId: Number(e.target.value) || null,
                        }))
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">選択してください</option>
                      {availableSchools.map((school) => (
                        <option
                          key={school.id}
                          value={school.id}
                          disabled={school.id === copySettings.toSchoolId}
                        >
                          {school.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* コピー先 */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      コピー先学校
                    </label>
                    <select
                      value={copySettings.toSchoolId || ""}
                      onChange={(e) =>
                        setCopySettings((prev) => ({
                          ...prev,
                          toSchoolId: Number(e.target.value) || null,
                        }))
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">選択してください</option>
                      {availableSchools.map((school) => (
                        <option
                          key={school.id}
                          value={school.id}
                          disabled={school.id === copySettings.fromSchoolId}
                        >
                          {school.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* 上書きオプション */}
                  <div>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={copySettings.overwrite}
                        onChange={(e) =>
                          setCopySettings((prev) => ({
                            ...prev,
                            overwrite: e.target.checked,
                          }))
                        }
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <span className="ml-2 text-sm text-gray-700">
                        既存のシフトを上書きする
                      </span>
                    </label>
                    <p className="mt-1 text-xs text-gray-500">
                      チェックすると、コピー先の既存シフトが削除されます
                    </p>
                  </div>
                </div>

                <div className="mt-6 flex space-x-3">
                  <button
                    onClick={() => setShowCopyModal(false)}
                    className="flex-1 bg-gray-100 text-gray-900 px-4 py-2 rounded-md text-sm font-medium hover:bg-gray-200"
                  >
                    キャンセル
                  </button>
                  <button
                    onClick={handleCopyWeek}
                    disabled={
                      copying ||
                      !copySettings.fromSchoolId ||
                      !copySettings.toSchoolId
                    }
                    className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
                  >
                    {copying ? (
                      <div className="flex items-center justify-center">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        コピー中...
                      </div>
                    ) : (
                      "コピー実行"
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ShiftManagement;
