// frontend/src/components/fixedShift/FixedShiftScheduleGrid.tsx

import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  Plus,
  MapPin,
  Users,
  Edit2,
  Trash2,
  AlertTriangle,
} from "lucide-react";
import { shiftApi } from "../../services/fixedShiftService";
import { useToast } from "../../contexts/ToastContext";
import type {
  FixedShiftGrid,
  FixedShift,
  Day,
  Place,
  TimeSlot,
  ShiftPosition,
  DaySchedule,
} from "../../types/fixedShift";
import ShiftCreateModal from "./FixedShiftCreateModal";
import ShiftEditModal from "./FixedShiftEditModal";
import ConfirmModal from "../common/ConfirmModal";

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
  const generateTimeSlots = useCallback(
    (startHour: number, endHour: number): TimeSlot[] => {
      const slots: TimeSlot[] = [];
      const totalMinutes = (endHour - startHour) * 60;

      for (let hour = startHour; hour <= endHour; hour++) {
        const position = (((hour - startHour) * 60) / totalMinutes) * 100;
        slots.push({
          hour,
          minute: 0,
          displayTime: `${hour.toString().padStart(2, "0")}:00`,
          position,
        });
      }

      return slots;
    },
    []
  );

  // シフトの位置計算
  const calculateShiftPosition = useCallback(
    (shift: FixedShift, startHour: number, endHour: number): ShiftPosition => {
      const startTimeStr = shift.start_time.slice(0, 5); // HH:MM形式に変換
      const endTimeStr = shift.end_time.slice(0, 5); // HH:MM形式に変換
      const startTime = new Date(`2000-01-01T${startTimeStr}`);
      const endTime = new Date(`2000-01-01T${endTimeStr}`);

      const startMinutes = startTime.getHours() * 60 + startTime.getMinutes();
      const endMinutes = endTime.getHours() * 60 + endTime.getMinutes();
      const totalMinutes = (endHour - startHour) * 60;
      const baseMinutes = startHour * 60;

      const top = ((startMinutes - baseMinutes) / totalMinutes) * 100;
      const height = ((endMinutes - startMinutes) / totalMinutes) * 100;

      return {
        shift,
        top: Math.max(0, top),
        height: Math.max(3, height), // 最小高さを3%に縮小
        startHour: startTime.getHours(),
        endHour: endTime.getHours(),
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
      timeSlots: generateTimeSlots(gridData.start_hour, gridData.end_hour),
    };

    return [schedule];
  }, [gridData, selectedDay, generateTimeSlots]);

  // グリッドクリック処理（新規シフト作成）
  const handleGridClick = useCallback(
    (event: React.MouseEvent, place: Place, containerRef: HTMLDivElement) => {
      if (!gridData || !selectedDay) return;

      const rect = containerRef.getBoundingClientRect();
      const clickY = event.clientY - rect.top;
      const clickRatio = clickY / rect.height;

      const totalHours = gridData.end_hour - gridData.start_hour;
      const clickHour = gridData.start_hour + clickRatio * totalHours;
      const hour = Math.floor(clickHour);
      const minute = Math.floor((clickHour - hour) * 60);

      setCreatePosition({
        place_id: place.id,
        hour,
        minute: Math.round(minute / 15) * 15, // 15分単位に丸める
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
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-gray-600">読み込み中...</span>
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

          <div className="overflow-x-auto">
            <div className="min-w-full">
              {/* ヘッダー */}
              <div className="flex border-b border-gray-200">
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
                      className="p-3 bg-gray-50 border-r last:border-r-0 border-gray-200"
                      style={{
                        minWidth: `${placeWidth}px`,
                        width: `${placeWidth}px`,
                      }}
                    >
                      <div className="flex items-center space-x-1">
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

              {/* メイングリッド */}
              <div className="flex">
                {/* 時間軸 */}
                <div className="w-16 relative bg-gray-50 border-r border-gray-200 min-h-[800px]">
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
                      className="relative border-r last:border-r-0 border-gray-200 min-h-[800px] cursor-pointer hover:bg-gray-50"
                      style={{
                        minWidth: `${placeWidth}px`,
                        width: `${placeWidth}px`,
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
