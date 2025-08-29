// frontend/src/components/fixedShift/FixedShiftScheduleGrid.tsx

import React, {
  useState,
  useEffect,
  useMemo,
  useCallback,
  useRef,
} from "react";
import {
  Plus,
  MapPin,
  Users,
  Edit2,
  Trash2,
  AlertTriangle,
  Clock,
} from "lucide-react";
import { shiftApi } from "@/services/fixedShiftService";
import { useToast } from "@/contexts/ToastContext";
import type {
  FixedShiftGrid,
  FixedShift,
  TimeSlot,
  ShiftPosition,
  DaySchedule,
} from "@/types/fixedShift";
import type { Day, Place } from "@/types/config";
import ShiftCreateModal from "./FixedShiftCreateModal";
import ShiftEditModal from "./FixedShiftEditModal";
import ConfirmModal from "../common/ConfirmModal";
import LoadingSpinner from "../common/LoadingSpinner";

interface FixedShiftScheduleGridProps {
  schoolId: number;
}

const FixedShiftScheduleGrid: React.FC<FixedShiftScheduleGridProps> = ({
  schoolId,
}) => {
  const [gridData, setGridData] = useState<FixedShiftGrid | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedDay, setSelectedDay] = useState<Day | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingShift, setEditingShift] = useState<FixedShift | null>(null);
  const [deletingShift, setDeletingShift] = useState<FixedShift | null>(null);
  const [createPosition, setCreatePosition] = useState<{
    place_id: number;
    hour: number;
    minute: number;
  } | null>(null);

  const headerScrollRef = useRef<HTMLDivElement>(null);
  const bodyScrollRef = useRef<HTMLDivElement>(null);

  const { showSuccess, showError } = useToast();

  // データ読み込み
  const loadGridData = useCallback(async () => {
    if (!schoolId) return;

    setLoading(true);
    try {
      const data = await shiftApi.getFixedShiftGrid(schoolId);
      setGridData(data);

      // 最初の曜日を選択
      if (data.days.length > 0 && !selectedDay) {
        setSelectedDay(data.days[0]);
      }
    } catch (error) {
      console.error("グリッドデータの読み込みエラー:", error);
      showError("シフトデータの読み込みに失敗しました");
    } finally {
      setLoading(false);
    }
  }, [schoolId, selectedDay, showError]);

  useEffect(() => {
    loadGridData();
  }, [loadGridData]);

  // 時間スロットの生成
  const generateTimeSlots = useCallback((): TimeSlot[] => {
    if (!gridData) return [];

    const slots: TimeSlot[] = [];
    let startHour = gridData.start_hour;
    let endHour = gridData.end_hour;

    if (gridData.school_start_time && gridData.school_end_time) {
      startHour = parseInt(gridData.school_start_time.split(":")[0]);
      endHour = parseInt(gridData.school_end_time.split(":")[0]);
      const endMinute = parseInt(gridData.school_end_time.split(":")[1]);
      if (endMinute > 0) {
        endHour += 1;
      }
    }

    // 30分間隔でスロットを生成（より細かく）
    for (let hour = startHour; hour <= endHour; hour++) {
      // 毎時00分
      const position = ((hour - startHour) / (endHour - startHour)) * 100;
      slots.push({
        hour,
        minute: 0,
        displayTime: `${hour.toString().padStart(2, "0")}:00`,
        position,
      });

      // 毎時30分も追加（より詳細な表示のため）
      if (hour < endHour) {
        const halfPosition =
          ((hour + 0.5 - startHour) / (endHour - startHour)) * 100;
        slots.push({
          hour,
          minute: 30,
          displayTime: `${hour.toString().padStart(2, "0")}:30`,
          position: halfPosition,
        });
      }
    }

    return slots;
  }, [gridData]);

  // スクロール同期処理
  const handleHeaderScroll = useCallback(() => {
    if (headerScrollRef.current && bodyScrollRef.current) {
      bodyScrollRef.current.scrollLeft = headerScrollRef.current.scrollLeft;
    }
  }, []);

  const handleBodyScroll = useCallback(() => {
    if (headerScrollRef.current && bodyScrollRef.current) {
      headerScrollRef.current.scrollLeft = bodyScrollRef.current.scrollLeft;
    }
  }, []);

  // シフトの位置計算
  // シフトの位置計算
  const calculateShiftPosition = useCallback(
    (shift: FixedShift, startHour: number, endHour: number): ShiftPosition => {
      // 時間文字列をHH:MM:SS形式から時間と分に分解
      const [startHour_str, startMinute_str] = shift.start_time.split(":");
      const [endHour_str, endMinute_str] = shift.end_time.split(":");

      const startTotalMinutes =
        parseInt(startHour_str) * 60 + parseInt(startMinute_str);
      const endTotalMinutes =
        parseInt(endHour_str) * 60 + parseInt(endMinute_str);

      // 修正: gridStartMinutes を startHour * 60 に変更
      const gridStartMinutes = startHour * 60;
      const gridEndMinutes = endHour * 60;
      const gridTotalMinutes = gridEndMinutes - gridStartMinutes;

      const top =
        ((startTotalMinutes - gridStartMinutes) / gridTotalMinutes) * 100;
      const height =
        ((endTotalMinutes - startTotalMinutes) / gridTotalMinutes) * 100;

      return {
        shift,
        top: Math.max(0, top),
        height: Math.max(3, height),
        startHour: parseInt(startHour_str),
        endHour: parseInt(endHour_str),
      };
    },
    []
  );

  // 重複チェックと位置調整（最小化版）
  const adjustOverlappingShifts = useCallback(
    (
      shifts: FixedShift[],
      startHour: number,
      endHour: number
    ): ShiftPosition[] => {
      const positions = shifts.map((shift) =>
        calculateShiftPosition(shift, startHour, endHour)
      );

      // 重複グループを特定（マージンを1%に縮小）
      const overlapGroups: number[][] = [];
      const processed = new Set<number>();

      for (let i = 0; i < positions.length; i++) {
        if (processed.has(i)) continue;

        const group = [i];
        processed.add(i);

        for (let j = i + 1; j < positions.length; j++) {
          if (processed.has(j)) continue;

          // 重複判定（上下1%のマージンに縮小）
          const overlap = !(
            positions[i].top + positions[i].height + 1 <= positions[j].top ||
            positions[j].top + positions[j].height + 1 <= positions[i].top
          );

          if (overlap) {
            group.push(j);
            processed.add(j);
          }
        }

        if (group.length > 1) {
          overlapGroups.push(group);
        }
      }

      // 各重複グループの位置を調整（最大2列まで）
      overlapGroups.forEach((group) => {
        if (group.length <= 2) {
          // 2つまでなら左右に分割
          const columnWidth = 100 / group.length;
          group.forEach((index, colIndex) => {
            positions[index] = {
              ...positions[index],
              leftOffset: colIndex * columnWidth,
              width: columnWidth - 0.5, // 境界線分を最小化
              column: colIndex,
              totalColumns: group.length,
              isOverlapped: true,
            };
          });
        } else {
          // 3つ以上は時間をずらして表示することを前提に、最初の2つだけ分割
          const firstTwo = group.slice(0, 2);
          firstTwo.forEach((index, colIndex) => {
            positions[index] = {
              ...positions[index],
              leftOffset: colIndex * 50,
              width: 49.5,
              column: colIndex,
              totalColumns: 2,
              isOverlapped: true,
            };
          });

          // 残りは警告として目立たせる
          for (let i = 2; i < group.length; i++) {
            positions[group[i]] = {
              ...positions[group[i]],
              leftOffset: 0,
              width: 98,
              isOverlapped: true,
              hasConflict: true, // 競合フラグ
            };
          }
        }
      });

      return positions;
    },
    [calculateShiftPosition]
  );

  // 場所ごとの最大重複数を計算（最大2まで）
  const getMaxOverlapForPlace = useCallback(
    (placeShifts: FixedShift[], startHour: number, endHour: number): number => {
      const positions = adjustOverlappingShifts(
        placeShifts,
        startHour,
        endHour
      );
      const maxColumns = Math.max(
        1,
        ...positions.map((p) => p.totalColumns || 1)
      );
      return Math.min(maxColumns, 2); // 最大2列まで
    },
    [adjustOverlappingShifts]
  );

  const daySchedules = useMemo((): DaySchedule[] => {
    if (!gridData || !selectedDay) return [];

    const schedule: DaySchedule = {
      day: selectedDay,
      places: gridData.places,
      shifts: gridData.shifts.filter((shift) => shift.day === selectedDay.id),
      timeSlots: generateTimeSlots(), // パラメータを削除
    };

    return [schedule];
  }, [gridData, selectedDay, generateTimeSlots]);

  // グリッドクリック処理（新規シフト作成）
  const handleGridClick = useCallback(
    (event: React.MouseEvent, place: Place, containerRef: HTMLDivElement) => {
      if (!gridData || !selectedDay) return;

      const rect = containerRef.getBoundingClientRect();
      const clickY = event.clientY - rect.top;
      const clickRatio = Math.max(0, Math.min(1, clickY / rect.height)); // 0-1の範囲に制限

      // 学校の時間範囲を取得
      let startHour = gridData.start_hour;
      let endHour = gridData.end_hour;

      if (gridData.school_start_time && gridData.school_end_time) {
        startHour = parseInt(gridData.school_start_time.split(":")[0]);
        endHour = parseInt(gridData.school_end_time.split(":")[0]);
        const endMinute = parseInt(gridData.school_end_time.split(":")[1]);
        if (endMinute > 0) {
          endHour += 1;
        }
      }

      const totalHours = endHour - startHour;
      const clickHour = startHour + clickRatio * totalHours;
      let hour = Math.floor(clickHour);
      let minute = Math.floor((clickHour - hour) * 60);

      // 時間と分の範囲を制限
      hour = Math.max(startHour, Math.min(endHour - 1, hour)); // 最大でもendHour-1
      minute = Math.max(0, Math.min(55, Math.round(minute / 5) * 5)); // 5分刻みで0-55分

      // 最終時刻（学校終了時間）の場合は1時間前に調整
      if (gridData.school_end_time) {
        const schoolEndHour = parseInt(gridData.school_end_time.split(":")[0]);

        if (hour >= schoolEndHour) {
          hour = schoolEndHour - 1;
          minute = Math.min(minute, 55);
        }
      }

      setCreatePosition({
        place_id: place.id,
        hour,
        minute,
      });
      setShowCreateModal(true);
    },
    [gridData, selectedDay]
  );

  // シフト作成完了
  const handleShiftCreated = useCallback(() => {
    setShowCreateModal(false);
    setCreatePosition(null);
    loadGridData();
    showSuccess("シフトを作成しました");
  }, [loadGridData, showSuccess]);

  // シフト編集完了
  const handleShiftUpdated = useCallback(() => {
    setEditingShift(null);
    loadGridData();
    showSuccess("シフトを更新しました");
  }, [loadGridData, showSuccess]);

  // シフト削除
  const handleDeleteShift = useCallback(async () => {
    if (!deletingShift) return;

    try {
      await shiftApi.deleteFixedShift(deletingShift.id);
      setDeletingShift(null);
      loadGridData();
      showSuccess("シフトを削除しました");
    } catch (error) {
      console.error("シフト削除エラー:", error);
      showError("シフトの削除に失敗しました");
    }
  }, [deletingShift, loadGridData, showSuccess, showError]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner text="読み込み中..." />
      </div>
    );
  }

  if (!gridData) {
    return (
      <div className="text-center py-8">
        <AlertTriangle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-600">シフトデータを読み込めませんでした</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* ヘッダー */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-900">固定シフト管理</h2>
        <div className="flex items-center space-x-4">
          {/* 曜日選択 */}
          <div className="flex border rounded-lg overflow-hidden">
            {gridData.days.map((day) => (
              <button
                key={day.id}
                onClick={() => setSelectedDay(day)}
                className={`px-4 py-2 text-sm font-medium border-r last:border-r-0 transition-colors ${
                  selectedDay?.id === day.id
                    ? "bg-blue-600 text-white"
                    : "bg-white text-gray-700 hover:bg-gray-50"
                }`}
              >
                {day.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 時間割グリッド */}
      {daySchedules.map((schedule) => (
        <div
          key={schedule.day.id}
          className="bg-white rounded-lg shadow-sm border"
        >
          <div className="p-4 border-b border-gray-200">
            <h3 className="font-medium text-gray-900">{schedule.day.name}</h3>
          </div>

          <div>
            <div className="min-w-full">
              {/* ヘッダー */}
              <div className="flex border-b border-gray-200">
                {/* 時間軸のヘッダー部分 */}
                <div
                  className="w-16 bg-gray-100 border-r border-gray-200 flex items-center justify-center flex-shrink-0 sticky left-0 z-10"
                  style={{ height: "48px" }}
                >
                  <Clock className="h-4 w-4 text-gray-600" />
                </div>

                <div
                  className="flex overflow-x-auto"
                  ref={headerScrollRef}
                  onScroll={handleHeaderScroll}
                >
                  {schedule.places.map((place) => {
                    const placeShifts = schedule.shifts.filter(
                      (shift) => shift.place === place.id
                    );
                    const maxOverlap = getMaxOverlapForPlace(
                      placeShifts,
                      gridData.start_hour,
                      gridData.end_hour
                    );
                    const placeWidth = maxOverlap > 1 ? 200 : 160;

                    return (
                      <div
                        key={place.id}
                        className="p-3 bg-gray-50 border-r last:border-r-0 border-gray-200"
                        style={{
                          minWidth: `${placeWidth}px`,
                          width: `${placeWidth}px`,
                          height: "48px", // 時間軸ヘッダーと同じ高さに調整
                        }}
                      >
                        <div className="flex items-center space-x-1 h-full">
                          <MapPin className="h-4 w-4 text-gray-500" />
                          <span className="font-medium text-gray-900 text-sm">
                            {place.name}
                          </span>
                          {maxOverlap > 1 && (
                            <span className="text-xs text-orange-600 bg-orange-100 px-1 rounded">
                              重複
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* メイングリッド */}
              <div className="flex h-[800px]">
                {" "}
                {/* 固定高さを設定 */}
                {/* 時間軸 */}
                <div className="w-16 relative bg-gray-50 border-r border-gray-200 flex-shrink-0 sticky left-0 z-10">
                  {/* 時間スロット */}
                  {schedule.timeSlots.map((slot) => (
                    <div
                      key={`${slot.hour}-${slot.minute}`}
                      className="absolute text-xs text-gray-500 pr-2 text-right"
                      style={{
                        top: `${slot.position}%`,
                        transform: "translateY(-50%)",
                        right: "4px",
                      }}
                    >
                      {slot.displayTime}
                    </div>
                  ))}
                </div>
                {/* 場所別グリッド */}
                <div
                  className="flex overflow-x-auto flex-1 overflow-y-auto"
                  ref={bodyScrollRef}
                  onScroll={handleBodyScroll}
                >
                  {schedule.places.map((place) => {
                    const placeShifts = schedule.shifts.filter(
                      (shift) => shift.place === place.id
                    );
                    const maxOverlap = getMaxOverlapForPlace(
                      placeShifts,
                      gridData.start_hour,
                      gridData.end_hour
                    );
                    const placeWidth = maxOverlap > 1 ? 200 : 160; // 重複時のみ少し拡張

                    return (
                      <div
                        key={place.id}
                        className="relative border-r last:border-r-0 border-gray-200 h-full cursor-pointer hover:bg-gray-50"
                        style={{
                          minWidth: `${placeWidth}px`,
                          width: `${placeWidth}px`,
                          minHeight: "1000px",
                        }}
                        onClick={(e) => {
                          const container = e.currentTarget;
                          handleGridClick(e, place, container);
                        }}
                      >
                        {/* 時間グリッドライン */}
                        {schedule.timeSlots.map((slot) => (
                          <div
                            key={`${place.id}-${slot.hour}-${slot.minute}`}
                            className="absolute w-full border-t border-gray-100"
                            style={{ top: `${slot.position}%` }}
                          />
                        ))}

                        {/* シフトブロック */}
                        {(() => {
                          const adjustedPositions = adjustOverlappingShifts(
                            placeShifts,
                            gridData.start_hour,
                            gridData.end_hour
                          );

                          return adjustedPositions.map((position) => {
                            return (
                              <div
                                key={position.shift.id}
                                className={`absolute border rounded-md p-1 cursor-pointer hover:bg-opacity-80 transition-colors group ${
                                  position.hasConflict
                                    ? "bg-red-100 border-red-400 animate-pulse"
                                    : position.isOverlapped
                                    ? "bg-blue-50 border-blue-300"
                                    : "bg-blue-100 border-blue-300"
                                }`}
                                style={{
                                  top: `${position.top}%`,
                                  height: `${position.height}%`,
                                  left: `${position.leftOffset || 1}%`,
                                  width: `${position.width || 98}%`,
                                  zIndex: position.hasConflict
                                    ? 20
                                    : position.column !== undefined
                                    ? 10 + position.column
                                    : 1,
                                }}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setEditingShift(position.shift);
                                }}
                              >
                                <div className="h-full flex flex-col justify-between">
                                  <div className="space-y-0.5">
                                    <div
                                      className={`text-xs font-medium ${
                                        position.hasConflict
                                          ? "text-red-900"
                                          : "text-blue-900"
                                      }`}
                                    >
                                      {position.shift.start_time.slice(0, 5)} -{" "}
                                      {position.shift.end_time.slice(0, 5)}
                                    </div>
                                    {position.shift.teacher.length > 0 && (
                                      <div className="flex items-center space-x-1">
                                        <Users
                                          className={`h-2.5 w-2.5 ${
                                            position.hasConflict
                                              ? "text-red-700"
                                              : "text-blue-700"
                                          }`}
                                        />
                                        <span
                                          className={`text-xs ${
                                            position.hasConflict
                                              ? "text-red-700"
                                              : "text-blue-700"
                                          }`}
                                        >
                                          {position.shift.teacher.length}名
                                        </span>
                                      </div>
                                    )}
                                    {position.shift.description &&
                                      position.height > 8 && (
                                        <div
                                          className={`text-xs truncate ${
                                            position.hasConflict
                                              ? "text-red-800"
                                              : "text-blue-800"
                                          }`}
                                        >
                                          {position.shift.description}
                                        </div>
                                      )}
                                    {/* 競合警告 */}
                                    {position.hasConflict && (
                                      <div className="text-[9px] text-red-600 font-bold">
                                        競合あり
                                      </div>
                                    )}
                                    {/* 重複表示時の列番号 */}
                                    {position.column !== undefined &&
                                      position.totalColumns &&
                                      position.totalColumns > 1 &&
                                      !position.hasConflict && (
                                        <div className="text-[9px] text-blue-600 font-bold">
                                          {position.column + 1}/
                                          {position.totalColumns}
                                        </div>
                                      )}
                                  </div>

                                  {/* ホバー時のアクション */}
                                  <div className="opacity-0 group-hover:opacity-100 flex space-x-1 mt-0.5">
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setEditingShift(position.shift);
                                      }}
                                      className="p-0.5 bg-blue-600 text-white rounded text-xs hover:bg-blue-700"
                                    >
                                      <Edit2 className="h-2.5 w-2.5" />
                                    </button>
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setDeletingShift(position.shift);
                                      }}
                                      className="p-0.5 bg-red-600 text-white rounded text-xs hover:bg-red-700"
                                    >
                                      <Trash2 className="h-2.5 w-2.5" />
                                    </button>
                                  </div>
                                </div>
                              </div>
                            );
                          });
                        })()}

                        {/* 空の場所にプラスアイコン */}
                        {placeShifts.length === 0 && (
                          <div className="absolute inset-0 flex items-center justify-center">
                            <Plus className="h-6 w-6 text-gray-400" />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      ))}

      {/* 新規作成モーダル */}
      {showCreateModal && selectedDay && createPosition && (
        <ShiftCreateModal
          isOpen={showCreateModal}
          onClose={() => {
            setShowCreateModal(false);
            setCreatePosition(null);
          }}
          schoolId={schoolId}
          dayId={selectedDay.id}
          placeId={createPosition.place_id}
          initialHour={createPosition.hour}
          initialMinute={createPosition.minute}
          schoolStartTime={gridData.school_start_time} // 追加（バックエンドから取得）
          schoolEndTime={gridData.school_end_time}
          onSuccess={handleShiftCreated}
        />
      )}

      {/* 編集モーダル */}
      {editingShift && (
        <ShiftEditModal
          isOpen={!!editingShift}
          onClose={() => setEditingShift(null)}
          shift={editingShift}
          schoolId={schoolId}
          onSuccess={handleShiftUpdated}
        />
      )}

      {/* 削除確認モーダル */}
      {deletingShift && (
        <ConfirmModal
          isOpen={!!deletingShift}
          title="シフト削除"
          message={`${deletingShift.day_name} ${deletingShift.start_time}-${deletingShift.end_time} (${deletingShift.place_name}) のシフトを削除しますか？`}
          confirmText="削除"
          cancelText="キャンセル"
          confirmButtonColor="#ef4444"
          onConfirm={handleDeleteShift}
          onCancel={() => setDeletingShift(null)}
        />
      )}
    </div>
  );
};

export default FixedShiftScheduleGrid;
