// frontend/src/components/teacher/TeacherManagement.tsx

import React, { useState, useEffect, useCallback } from "react";
import {
  Users,
  Search,
  Filter,
  Plus,
  Edit3,
  Trash2,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
  MoreVertical,
  UserCheck,
  UserX,
  School,
  Mail,
} from "lucide-react";
import { useToast } from "@/contexts/ToastContext";
import teacherService from "@/services/teacherService";
import TeacherModal from "./TeacherModal";
import ConfirmModal from "./../common/ConfirmModal";
import { PageSpinner } from "../common/LoadingSpinner";
import type {
  Teacher,
  PaginationInfo,
  TeacherListResponse,
  TeacherFilterParams,
} from "@/types/teacher";

const TeacherManagement: React.FC = () => {
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [pagination, setPagination] = useState<PaginationInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedTeacher, setSelectedTeacher] = useState<Teacher | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [actionType, setActionType] = useState<"delete" | "activate">("delete");
  const [dropdownOpen, setDropdownOpen] = useState<number | null>(null);

  const [filters, setFilters] = useState<TeacherFilterParams>({
    search: "",
    is_active: "",
    current_school: "",
    page: 1,
    page_size: 20,
    ordering: "-date_joined",
  });

  const { showToast } = useToast();

  // 講師一覧取得
  const fetchTeachers = useCallback(async () => {
    try {
      setLoading(true);
      const response: TeacherListResponse = await teacherService.getTeachers(
        filters
      );
      setTeachers(response.results);
      setPagination(response.pagination);
    } catch (error) {
      console.error("講師一覧取得エラー:", error);
      showToast("講師一覧の取得に失敗しました", "error");
    } finally {
      setLoading(false);
    }
  }, [filters, showToast]);

  useEffect(() => {
    fetchTeachers();
  }, [fetchTeachers]);

  // 講師削除（論理削除）
  const handleDelete = async () => {
    if (!selectedTeacher) return;

    try {
      await teacherService.deleteTeacher(selectedTeacher.id);
      showToast("講師を無効化しました", "success");
      fetchTeachers();
    } catch (error) {
      console.error("講師削除エラー:", error);
      showToast("講師の無効化に失敗しました", "error");
    } finally {
      setShowConfirmModal(false);
      setSelectedTeacher(null);
    }
  };

  // 講師有効化
  const handleActivate = async () => {
    if (!selectedTeacher) return;

    try {
      await teacherService.activateTeacher(selectedTeacher.id);
      showToast("講師を有効化しました", "success");
      fetchTeachers();
    } catch (error) {
      console.error("講師有効化エラー:", error);
      showToast("講師の有効化に失敗しました", "error");
    } finally {
      setShowConfirmModal(false);
      setSelectedTeacher(null);
    }
  };

  // 確認モーダルを開く
  const openConfirmModal = (teacher: Teacher, type: "delete" | "activate") => {
    setSelectedTeacher(teacher);
    setActionType(type);
    setShowConfirmModal(true);
    setDropdownOpen(null);
  };

  // 編集モーダルを開く
  const openEditModal = (teacher: Teacher) => {
    setSelectedTeacher(teacher);
    setShowModal(true);
    setDropdownOpen(null);
  };

  // ページ変更
  const handlePageChange = (page: number) => {
    setFilters((prev) => ({ ...prev, page }));
  };

  // フィルター変更
  const handleFilterChange = (
    key: keyof TeacherFilterParams,
    value: string | number
  ) => {
    setFilters((prev) => ({ ...prev, [key]: value, page: 1 }));
  };

  // 検索ハンドラー
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setFilters((prev) => ({ ...prev, page: 1 }));
  };

  // 日付フォーマット
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("ja-JP", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
  };

  if (loading && !teachers.length) {
    return <PageSpinner text="講師一覧を読み込み中..." />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* ヘッダー */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-600 rounded-lg">
                <Users className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">講師管理</h1>
                <p className="text-gray-600">講師の一覧・編集・管理</p>
              </div>
            </div>
            <button
              onClick={() => {
                setSelectedTeacher(null);
                setShowModal(true);
              }}
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 shadow-sm"
            >
              <Plus className="h-4 w-4 mr-2" />
              新規講師追加
            </button>
          </div>
        </div>

        {/* フィルター・検索エリア */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <form onSubmit={handleSearch} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {/* 検索 */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="名前・ユーザー名・メールで検索..."
                  value={filters.search || ""}
                  onChange={(e) => handleFilterChange("search", e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* ステータス */}
              <div className="relative">
                <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <select
                  value={filters.is_active || ""}
                  onChange={(e) =>
                    handleFilterChange("is_active", e.target.value)
                  }
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none"
                >
                  <option value="">すべてのステータス</option>
                  <option value="true">有効</option>
                  <option value="false">無効</option>
                </select>
              </div>

              {/* 並び順 */}
              <select
                value={filters.ordering || "-date_joined"}
                onChange={(e) => handleFilterChange("ordering", e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="-date_joined">登録日（新しい順）</option>
                <option value="date_joined">登録日（古い順）</option>
                <option value="first_name">名前（昇順）</option>
                <option value="-first_name">名前（降順）</option>
                <option value="username">ユーザー名（昇順）</option>
                <option value="-username">ユーザー名（降順）</option>
              </select>

              {/* ページサイズ */}
              <select
                value={filters.page_size || 20}
                onChange={(e) =>
                  handleFilterChange("page_size", parseInt(e.target.value))
                }
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value={10}>10件表示</option>
                <option value={20}>20件表示</option>
                <option value={50}>50件表示</option>
                <option value={100}>100件表示</option>
              </select>
            </div>
          </form>
        </div>

        {/* 講師一覧 */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-visible">
          {teachers.length === 0 ? (
            <div className="text-center py-12">
              <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                講師が見つかりません
              </h3>
              <p className="text-gray-600">
                {filters.search || filters.is_active || filters.current_school
                  ? "検索条件を変更して再度お試しください"
                  : "新しい講師を追加してください"}
              </p>
            </div>
          ) : (
            <>
              {/* テーブルヘッダー */}
              <div className="bg-gray-50 px-6 py-3 border-b border-gray-200">
                <div className="grid grid-cols-12 gap-4 text-sm font-medium text-gray-700">
                  <div className="col-span-3">講師情報</div>
                  <div className="col-span-3">連絡先</div>
                  <div className="col-span-2">所属学校</div>
                  <div className="col-span-2">ステータス</div>
                  <div className="col-span-1">登録日</div>
                  <div className="col-span-1">操作</div>
                </div>
              </div>

              {/* テーブルボディ */}
              <div className="divide-y divide-gray-200 overflow-visible">
                {teachers.map((teacher) => (
                  <div
                    key={teacher.id}
                    className="px-6 py-4 hover:bg-gray-50 transition-colors duration-200"
                  >
                    <div className="grid grid-cols-12 gap-4 items-center">
                      {/* 講師情報 */}
                      <div className="col-span-3">
                        <div className="flex items-center space-x-3">
                          <div className="flex-shrink-0">
                            <div className="h-10 w-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                              <span className="text-white font-medium text-sm">
                                {teacher.full_name.charAt(0).toUpperCase()}
                              </span>
                            </div>
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium text-gray-900 truncate">
                              {teacher.full_name}
                            </p>
                            <p className="text-sm text-gray-500 truncate">
                              @{teacher.username}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* 連絡先 */}
                      <div className="col-span-3">
                        <div className="flex items-center space-x-1 text-sm text-gray-600">
                          <Mail className="h-4 w-4" />
                          <span className="truncate">{teacher.email}</span>
                        </div>
                      </div>

                      {/* 所属学校 */}
                      <div className="col-span-2">
                        <div className="flex items-center space-x-1">
                          <School className="h-4 w-4 text-gray-400" />
                          <span className="text-sm text-gray-600 truncate">
                            {teacher.current_school_name || "未設定"}
                          </span>
                        </div>
                        {teacher.schools_info &&
                          teacher.schools_info.length > 1 && (
                            <span className="text-xs text-blue-600">
                              +{teacher.schools_info.length - 1}校
                            </span>
                          )}
                      </div>

                      {/* ステータス */}
                      <div className="col-span-2">
                        <div className="flex items-center space-x-2">
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              teacher.is_active
                                ? "bg-green-100 text-green-800"
                                : "bg-red-100 text-red-800"
                            }`}
                          >
                            {teacher.is_active ? (
                              <>
                                <UserCheck className="h-3 w-3 mr-1" />
                                有効
                              </>
                            ) : (
                              <>
                                <UserX className="h-3 w-3 mr-1" />
                                無効
                              </>
                            )}
                          </span>
                        </div>
                      </div>

                      {/* 登録日 */}
                      <div className="col-span-1">
                        <div className="flex items-center space-x-1 text-sm text-gray-600">
                          <span>{formatDate(teacher.date_joined)}</span>
                        </div>
                      </div>

                      {/* 操作 */}
                      <div className="col-span-1">
                        <div className="relative">
                          <button
                            onClick={() =>
                              setDropdownOpen(
                                dropdownOpen === teacher.id ? null : teacher.id
                              )
                            }
                            className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors duration-200"
                          >
                            <MoreVertical className="h-4 w-4" />
                          </button>

                          {dropdownOpen === teacher.id && (
                            <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-10">
                              <div className="py-1">
                                <button
                                  onClick={() => openEditModal(teacher)}
                                  className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                >
                                  <Edit3 className="h-4 w-4 mr-3" />
                                  編集
                                </button>
                                {teacher.is_active ? (
                                  <button
                                    onClick={() =>
                                      openConfirmModal(teacher, "delete")
                                    }
                                    className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                                  >
                                    <Trash2 className="h-4 w-4 mr-3" />
                                    無効化
                                  </button>
                                ) : (
                                  <button
                                    onClick={() =>
                                      openConfirmModal(teacher, "activate")
                                    }
                                    className="flex items-center w-full px-4 py-2 text-sm text-green-600 hover:bg-green-50"
                                  >
                                    <RotateCcw className="h-4 w-4 mr-3" />
                                    有効化
                                  </button>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* ページネーション */}
        {pagination && pagination.total_pages > 1 && (
          <div className="mt-6 flex items-center justify-between">
            <div className="flex items-center text-sm text-gray-700">
              <span>
                {pagination.count}件中{" "}
                {(pagination.current_page - 1) * pagination.page_size + 1}-
                {Math.min(
                  pagination.current_page * pagination.page_size,
                  pagination.count
                )}
                件を表示
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => handlePageChange(pagination.current_page - 1)}
                disabled={!pagination.has_previous}
                className="p-2 text-gray-400 hover:text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg hover:bg-gray-100 transition-colors duration-200"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>

              <div className="flex items-center space-x-1">
                {Array.from(
                  { length: Math.min(5, pagination.total_pages) },
                  (_, i) => {
                    let pageNum;
                    if (pagination.total_pages <= 5) {
                      pageNum = i + 1;
                    } else if (pagination.current_page <= 3) {
                      pageNum = i + 1;
                    } else if (
                      pagination.current_page >=
                      pagination.total_pages - 2
                    ) {
                      pageNum = pagination.total_pages - 4 + i;
                    } else {
                      pageNum = pagination.current_page - 2 + i;
                    }

                    return (
                      <button
                        key={pageNum}
                        onClick={() => handlePageChange(pageNum)}
                        className={`px-3 py-2 text-sm rounded-lg transition-colors duration-200 ${
                          pageNum === pagination.current_page
                            ? "bg-blue-600 text-white"
                            : "text-gray-700 hover:bg-gray-100"
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  }
                )}
              </div>

              <button
                onClick={() => handlePageChange(pagination.current_page + 1)}
                disabled={!pagination.has_next}
                className="p-2 text-gray-400 hover:text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg hover:bg-gray-100 transition-colors duration-200"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 外部クリックでドロップダウンを閉じる */}
      {dropdownOpen && (
        <div
          className="fixed inset-0 z-0"
          onClick={() => setDropdownOpen(null)}
        />
      )}

      {/* 講師編集・追加モーダル */}
      {showModal && (
        <TeacherModal
          teacher={selectedTeacher}
          onClose={() => {
            setShowModal(false);
            setSelectedTeacher(null);
          }}
          onSuccess={() => {
            setShowModal(false);
            setSelectedTeacher(null);
            fetchTeachers();
          }}
        />
      )}

      {/* 確認モーダル */}
      {showConfirmModal && selectedTeacher && (
        <ConfirmModal
          isOpen={showConfirmModal}
          title={actionType === "delete" ? "講師を無効化" : "講師を有効化"}
          message={
            actionType === "delete"
              ? `${selectedTeacher.full_name}を無効化しますか？無効化された講師はログインできなくなります。`
              : `${selectedTeacher.full_name}を有効化しますか？有効化された講師はログインできるようになります。`
          }
          confirmText={actionType === "delete" ? "無効化" : "有効化"}
          cancelText="キャンセル"
          onConfirm={actionType === "delete" ? handleDelete : handleActivate}
          onCancel={() => {
            setShowConfirmModal(false);
            setSelectedTeacher(null);
          }}
          confirmButtonColor={actionType === "delete" ? "#ef4444" : "#10b981"}
        />
      )}
    </div>
  );
};

export default TeacherManagement;
