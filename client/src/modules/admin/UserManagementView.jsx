import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { 
  Users, UserPlus, Shield, Key, Search, Edit2, 
  Trash2, CheckCircle, XCircle, AlertCircle, Building, Mail, 
  FolderPlus, ArrowLeft, GraduationCap, Award, ChevronRight,
  Clock, BarChart3, CheckCheck, Eye, Phone, RefreshCw
} from 'lucide-react';
import StudentProgressModal from './StudentProgressModal';

export default function UserManagementView() {
  const [classes, setClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState(null);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [studentsLoading, setStudentsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Modals
  const [showAddClassModal, setShowAddClassModal] = useState(false);
  const [editingClass, setEditingClass] = useState(null);
  const [showAddStudentModal, setShowAddStudentModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [viewingStudentProgress, setViewingStudentProgress] = useState(null);
  
  const [formError, setFormError] = useState(null);
  const [actionSuccess, setActionSuccess] = useState(null);

  // Forms
  const [classForm, setClassForm] = useState({ name: '', description: '' });
  const [studentForm, setStudentForm] = useState({
    username: '',
    password: '',
    full_name: '',
    department: '',
    email: ''
  });

  // Load all classes
  const loadClasses = async () => {
    setLoading(true);
    try {
      const res = await api.classes.list();
      if (res.success) {
        setClasses(res.data);
      }
    } catch (err) {
      console.error('Failed to load classes:', err);
    } finally {
      setLoading(false);
    }
  };

  // Load students of selected class (silent mode prevents flickering spinner on background polls)
  const loadClassStudents = async (classId, silent = false) => {
    if (!silent) setStudentsLoading(true);
    try {
      const res = await api.classes.getStudents(classId);
      if (res.success) {
        setSelectedClass(res.data.class);
        setStudents(res.data.students || []);
      }
    } catch (err) {
      console.error('Failed to load class students:', err);
    } finally {
      if (!silent) setStudentsLoading(false);
    }
  };

  useEffect(() => {
    loadClasses();
  }, []);

  // Real-time background sync: update online/offline status & progress every 10s when viewing class
  useEffect(() => {
    if (selectedClass && selectedClass.id) {
      const interval = setInterval(() => {
        loadClassStudents(selectedClass.id, true);
      }, 10000);
      return () => clearInterval(interval);
    }
  }, [selectedClass?.id]);

  const handleSelectClass = (cls) => {
    setSelectedClass(cls);
    loadClassStudents(cls.id);
  };

  const handleBackToClasses = () => {
    setSelectedClass(null);
    setStudents([]);
    loadClasses();
  };

  // Create new class
  const handleCreateClass = async (e) => {
    e.preventDefault();
    setFormError(null);
    try {
      const res = await api.classes.create(classForm);
      if (res.success) {
        setActionSuccess('Tạo lớp học mới thành công!');
        setShowAddClassModal(false);
        setClassForm({ name: '', description: '' });
        loadClasses();
        setTimeout(() => setActionSuccess(null), 3000);
      }
    } catch (err) {
      setFormError(err.message || 'Tạo lớp học thất bại.');
    }
  };

  // Update class
  const handleUpdateClass = async (e) => {
    e.preventDefault();
    setFormError(null);
    try {
      const res = await api.classes.update(editingClass.id, {
        name: editingClass.name,
        description: editingClass.description
      });
      if (res.success) {
        setActionSuccess('Cập nhật thông tin lớp học thành công!');
        setEditingClass(null);
        if (selectedClass && selectedClass.id === editingClass.id) {
          setSelectedClass(res.data);
        }
        loadClasses();
        setTimeout(() => setActionSuccess(null), 3000);
      }
    } catch (err) {
      setFormError(err.message || 'Cập nhật lớp học thất bại.');
    }
  };

  // Delete class
  const handleDeleteClass = async (cls, e) => {
    if (e) e.stopPropagation();
    if (!window.confirm(`Bạn có chắc chắn muốn xóa lớp học [${cls.name}]? Các học viên trong lớp sẽ được giữ nguyên tài khoản.`)) return;
    try {
      const res = await api.classes.delete(cls.id);
      if (res.success) {
        setActionSuccess(res.message);
        if (selectedClass && selectedClass.id === cls.id) {
          setSelectedClass(null);
        }
        loadClasses();
        setTimeout(() => setActionSuccess(null), 3000);
      }
    } catch (err) {
      alert(err.message || 'Xóa lớp học thất bại.');
    }
  };

  // Add student to class
  const handleAddStudent = async (e) => {
    e.preventDefault();
    setFormError(null);
    try {
      const res = await api.classes.addStudent(selectedClass.id, studentForm);
      if (res.success) {
        setActionSuccess('Thêm học viên vào lớp thành công!');
        setShowAddStudentModal(false);
        setStudentForm({ username: '', password: '', full_name: '', department: '', email: '' });
        loadClassStudents(selectedClass.id);
        setTimeout(() => setActionSuccess(null), 3000);
      }
    } catch (err) {
      setFormError(err.message || 'Thêm học viên thất bại.');
    }
  };

  // Update student
  const handleUpdateUser = async (e) => {
    e.preventDefault();
    setFormError(null);
    try {
      const payload = {
        full_name: editingUser.full_name,
        role: editingUser.role,
        email: editingUser.email,
        department: editingUser.department,
        is_active: editingUser.is_active
      };
      if (editingUser.new_password) {
        payload.new_password = editingUser.new_password;
      }

      const res = await api.users.update(editingUser.id, payload);
      if (res.success) {
        setActionSuccess('Cập nhật học viên thành công!');
        setEditingUser(null);
        if (selectedClass) {
          loadClassStudents(selectedClass.id);
        }
        setTimeout(() => setActionSuccess(null), 3000);
      }
    } catch (err) {
      setFormError(err.message || 'Cập nhật thất bại.');
    }
  };

  // Remove student from class
  const handleRemoveStudent = async (student) => {
    if (!window.confirm(`Bạn có chắc muốn xóa học viên [${student.full_name}] khỏi lớp ${selectedClass.name}?`)) return;
    try {
      const res = await api.classes.removeStudent(selectedClass.id, student.id);
      if (res.success) {
        setActionSuccess(res.message);
        loadClassStudents(selectedClass.id);
        setTimeout(() => setActionSuccess(null), 3000);
      }
    } catch (err) {
      alert(err.message || 'Xóa học viên thất bại.');
    }
  };

  // Filter students
  const filteredStudents = students.filter(s => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      (s.full_name && s.full_name.toLowerCase().includes(q)) ||
      (s.username && s.username.toLowerCase().includes(q)) ||
      (s.department && s.department.toLowerCase().includes(q))
    );
  });

  return (
    <div className="space-y-5">
      
      {/* 1. Header & Navigation Actions */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/90 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center space-x-2 text-rose-600 font-bold text-xs uppercase tracking-wide">
            <Shield className="w-4 h-4" />
            <span>Phân Hệ Quản Trị Hệ Thống</span>
          </div>
          
          <div className="flex items-center space-x-2 mt-1">
            {selectedClass ? (
              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={handleBackToClasses}
                  className="flex items-center space-x-1 text-xs font-bold text-slate-500 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 px-2.5 py-1 rounded-lg transition-colors cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Danh sách lớp học</span>
                </button>
                <span className="text-slate-300">/</span>
                <h2 className="text-lg sm:text-xl font-black text-slate-900 truncate">
                  {selectedClass.name}
                </h2>
              </div>
            ) : (
              <h2 className="text-lg sm:text-xl font-black text-slate-900">
                Quản Lý Danh Sách Lớp Học & Học Viên
              </h2>
            )}
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            {selectedClass
              ? `Theo dõi danh sách và tiến độ làm bài (trên tổng số 649 câu) của từng học viên trong lớp`
              : `Quản lý các lớp huấn luyện UAV, thêm lớp mới và theo dõi tiến độ học viên`}
          </p>
        </div>

        {/* Action Button */}
        <div>
          {selectedClass ? (
            <button
              onClick={() => {
                setStudentForm({ username: '', password: '', full_name: '', department: '', email: '' });
                setFormError(null);
                setShowAddStudentModal(true);
              }}
              className="flex items-center space-x-2 px-3.5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs sm:text-sm font-bold shadow-md shadow-rose-600/20 transition-all hover:scale-[1.02] cursor-pointer"
            >
              <UserPlus className="w-4 h-4" />
              <span>Thêm học viên vào lớp</span>
            </button>
          ) : (
            <button
              onClick={() => {
                setClassForm({ name: '', description: '' });
                setFormError(null);
                setShowAddClassModal(true);
              }}
              className="flex items-center space-x-2 px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs sm:text-sm font-bold shadow-md shadow-rose-600/20 transition-all hover:scale-[1.02] cursor-pointer"
            >
              <FolderPlus className="w-4 h-4" />
              <span>+ Thêm lớp học</span>
            </button>
          )}
        </div>
      </div>

      {actionSuccess && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-bold flex items-center space-x-2">
          <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{actionSuccess}</span>
        </div>
      )}

      {/* 2. LEVEL 1: LIST OF CLASSES */}
      {!selectedClass && (
        <>
          {loading ? (
            <div className="p-16 text-center text-slate-400 bg-white rounded-2xl border border-slate-200">
              <div className="w-8 h-8 border-4 border-rose-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
              <p className="text-sm font-semibold">Đang tải danh sách lớp học...</p>
            </div>
          ) : classes.length === 0 ? (
            <div className="p-16 text-center text-slate-500 bg-white rounded-2xl border border-slate-200">
              <GraduationCap className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="text-base font-bold text-slate-700">Chưa có lớp học nào được tạo</p>
              <p className="text-xs text-slate-400 mt-1">Bấm nút "+ Thêm lớp học" phía trên để tạo lớp học đầu tiên.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {classes.map(cls => (
                <div
                  key={cls.id}
                  onClick={() => handleSelectClass(cls)}
                  className="bg-white rounded-2xl border border-slate-200/90 hover:border-sky-300 p-5 shadow-xs hover:shadow-md transition-all cursor-pointer flex flex-col justify-between group"
                >
                  <div>
                    {/* Header */}
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <div className="w-10 h-10 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center shrink-0 border border-sky-200">
                        <GraduationCap className="w-5 h-5" />
                      </div>
                      <div className="flex items-center space-x-1" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => {
                            setEditingClass({ ...cls });
                            setFormError(null);
                          }}
                          className="p-1.5 text-slate-400 hover:text-sky-600 hover:bg-sky-50 rounded-lg transition-colors cursor-pointer"
                          title="Sửa tên lớp học"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={(e) => handleDeleteClass(cls, e)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                          title="Xóa lớp học"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <h3 className="text-base font-black text-slate-900 group-hover:text-sky-600 transition-colors leading-snug mb-1">
                      {cls.name}
                    </h3>
                    <p className="text-xs text-slate-500 line-clamp-2 mb-3 leading-relaxed">
                      {cls.description || 'Chưa có thông tin mô tả chi tiết cho lớp học này.'}
                    </p>
                  </div>

                  {/* Class Stats */}
                  <div className="pt-3 border-t border-slate-100 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-slate-600">Sĩ số học viên:</span>
                      <span className="font-extrabold px-2 py-0.5 bg-slate-100 text-slate-800 rounded-md">
                        {cls.total_students || 0} học viên
                      </span>
                    </div>

                    <div>
                      <div className="flex items-center justify-between text-[11px] mb-1">
                        <span className="text-slate-400">Tiến độ TB (trên 649 câu):</span>
                        <span className="font-bold text-sky-700">
                          {cls.avg_answered ? Math.round(cls.avg_answered) : 0}/649 câu ({cls.avg_progress_percent || 0}%)
                        </span>
                      </div>
                      <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-linear-to-r from-sky-500 to-indigo-600 rounded-full"
                          style={{ width: `${cls.avg_progress_percent || 0}%` }}
                        />
                      </div>
                    </div>

                    <div className="pt-2 flex items-center justify-between text-xs font-bold text-sky-600 group-hover:translate-x-1 transition-transform">
                      <span>Xem danh sách học viên</span>
                      <ChevronRight className="w-4 h-4" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* 3. LEVEL 2: STUDENTS LIST INSIDE SELECTED CLASS */}
      {selectedClass && (
        <div className="space-y-4">
          
          {/* Class Summary Bar & Search */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-xs flex flex-wrap items-center justify-between gap-3">
            <div className="relative flex-1 min-w-[240px]">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Tìm kiếm theo tên học viên, số điện thoại, đơn vị công tác..."
                className="w-full pl-10 pr-4 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-rose-500 bg-slate-50"
              />
            </div>

            <div className="flex items-center space-x-2 text-xs font-bold">
              <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-700 rounded-xl border border-emerald-200" title="Trạng thái online/offline và tiến độ tự động làm mới mỗi 10 giây">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                Đồng bộ trực tiếp
              </span>
              <span className="px-3 py-1.5 bg-sky-50 text-sky-800 rounded-xl border border-sky-200">
                Sĩ số: <strong>{students.length}</strong> học viên
              </span>
              <button
                onClick={() => selectedClass && loadClassStudents(selectedClass.id)}
                className="p-1.5 hover:bg-slate-100 text-slate-600 rounded-xl transition-colors cursor-pointer border border-slate-200"
                title="Làm mới ngay lập tức"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Students Table */}
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
            {studentsLoading ? (
              <div className="p-12 text-center text-slate-400">
                <div className="w-8 h-8 border-4 border-rose-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                <p className="text-sm font-semibold">Đang tải danh sách học viên của lớp...</p>
              </div>
            ) : filteredStudents.length === 0 ? (
              <div className="p-12 text-center text-slate-500">
                <Users className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                <p className="text-sm font-bold text-slate-700">Lớp học này chưa có học viên nào</p>
                <p className="text-xs text-slate-400 mt-1">Bấm nút "Thêm học viên vào lớp" phía trên để thêm học viên.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs sm:text-sm">
                  <thead className="bg-slate-50 text-slate-600 text-[11px] font-bold uppercase tracking-wider border-b border-slate-200">
                    <tr>
                      <th className="py-3 px-3.5 w-12 text-center">STT</th>
                      <th className="py-3 px-4">Tài khoản & Họ tên</th>
                      <th className="py-3 px-4">Số điện thoại</th>
                      <th className="py-3 px-4">Phòng ban & Đơn vị</th>
                      <th className="py-3 px-4 text-center min-w-[220px]">Tiến độ luyện tập (trên 649 câu)</th>
                      <th className="py-3 px-3 text-center">Trạng thái</th>
                      <th className="py-3 px-3 text-center w-24">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredStudents.map((s, idx) => (
                      <tr key={s.id} className="hover:bg-slate-50/80 transition-colors">
                        
                        {/* STT */}
                        <td className="py-3 px-3.5 text-center font-bold text-slate-400">
                          {idx + 1}
                        </td>

                        {/* Tài khoản & Tên (Clickable to view detail progress) */}
                        <td className="py-3 px-4">
                          <button
                            onClick={() => setViewingStudentProgress(s)}
                            className="text-left group cursor-pointer block"
                            title="Bấm để xem chi tiết tiến độ luyện tập"
                          >
                            <div className="font-bold text-slate-900 text-xs sm:text-sm group-hover:text-sky-600 transition-colors flex items-center space-x-1.5">
                              <span>{s.full_name}</span>
                              <ChevronRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-sky-600 group-hover:translate-x-0.5 transition-all shrink-0" />
                            </div>
                            <div className="text-[11px] text-slate-500 font-mono">@{s.username}</div>
                            {s.email && <div className="text-[10px] text-slate-400">{s.email}</div>}
                          </button>
                        </td>

                        {/* Số điện thoại */}
                        <td className="py-3 px-4 text-xs font-mono font-bold text-slate-800">
                          {s.phone ? (
                            <span className="px-2 py-0.5 bg-slate-100 rounded-md border border-slate-200">
                              {s.phone}
                            </span>
                          ) : (
                            <span className="text-slate-400 italic">Chưa có SĐT</span>
                          )}
                        </td>

                        {/* Phòng ban & Đơn vị công tác */}
                        <td className="py-3 px-4 text-xs text-slate-700">
                          <div className="space-y-0.5">
                            {s.department && (
                              <div className="font-semibold text-slate-900 flex items-center space-x-1">
                                <Building className="w-3 h-3 text-sky-600 shrink-0" />
                                <span>{s.department}</span>
                              </div>
                            )}
                            {s.unit && (
                              <div className="text-[11px] text-slate-500">
                                {s.unit}
                              </div>
                            )}
                            {!s.department && !s.unit && (
                              <span className="text-slate-400 italic">Chưa cập nhật đơn vị</span>
                            )}
                          </div>
                        </td>

                        {/* Tiến độ luyện tập (Thống kê số câu đã làm trên tổng số 649 câu) */}
                        <td className="py-3 px-4 text-center">
                          <div className="flex flex-col items-center">
                            <div className="flex items-center justify-between w-full max-w-[220px] text-xs font-bold mb-1">
                              <span className="text-slate-800">
                                <strong className="text-sky-700 font-black">{s.answered_count || 0}</strong> / 649 câu
                              </span>
                              <span className="text-[11px] font-black px-1.5 py-0.2 bg-sky-100 text-sky-800 rounded">
                                {s.progress_percent || 0}%
                              </span>
                            </div>

                            {/* Mini Progress Bar */}
                            <div className="w-full max-w-[220px] h-2 bg-slate-100 rounded-full overflow-hidden border border-slate-200">
                              <div
                                className="h-full bg-linear-to-r from-sky-500 to-indigo-600 rounded-full transition-all"
                                style={{ width: `${s.progress_percent || 0}%` }}
                              />
                            </div>

                            {/* Correct Count */}
                            <div className="flex items-center justify-between w-full max-w-[220px] text-[10px] text-slate-500 mt-1">
                              <span>Số câu đúng: <strong className="text-emerald-600 font-bold">{s.correct_count || 0}</strong> câu</span>
                              {s.answered_count > 0 && (
                                <span className="text-emerald-600 font-semibold">Độ chính xác: {s.accuracy_percent}%</span>
                              )}
                            </div>
                          </div>
                        </td>

                        {/* Trạng thái thực tế: Hoạt động (nếu đang đăng nhập) vs Chưa hoạt động (nếu không đăng nhập) */}
                        <td className="py-3 px-3 text-center">
                          {s.is_online ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-bold rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                              Hoạt động
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-medium rounded-full bg-slate-100 text-slate-500 border border-slate-200">
                              <span className="w-2 h-2 rounded-full bg-slate-400" />
                              Chưa hoạt động
                            </span>
                          )}
                        </td>

                        {/* Thao tác */}
                        <td className="py-3 px-3 text-center">
                          <div className="flex items-center justify-center space-x-1">
                            <button
                              onClick={() => setViewingStudentProgress(s)}
                              className="p-1.5 text-slate-400 hover:text-sky-600 hover:bg-sky-50 rounded-lg transition-colors cursor-pointer"
                              title="Xem chi tiết tiến độ câu hỏi"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => {
                                setEditingUser({ ...s, new_password: '' });
                                setFormError(null);
                              }}
                              className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors cursor-pointer"
                              title="Sửa thông tin / Đổi mật khẩu"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleRemoveStudent(s)}
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                              title="Xóa khỏi lớp học"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 4. MODAL: CREATE NEW CLASS */}
      {showAddClassModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="px-6 py-4 bg-rose-600 text-white flex items-center justify-between">
              <h3 className="font-bold text-base sm:text-lg flex items-center space-x-2">
                <FolderPlus className="w-5 h-5" />
                <span>Thêm Lớp Học Mới</span>
              </h3>
              <button onClick={() => setShowAddClassModal(false)} className="text-white/80 hover:text-white cursor-pointer font-bold">✕</button>
            </div>

            <form onSubmit={handleCreateClass} className="p-6 space-y-4">
              {formError && (
                <div className="p-3 bg-rose-50 text-rose-700 text-xs rounded-xl border border-rose-200 font-bold">
                  {formError}
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Tên lớp học (*)</label>
                <input
                  type="text"
                  required
                  value={classForm.name}
                  onChange={(e) => setClassForm({ ...classForm, name: e.target.value })}
                  placeholder="ví dụ: Lớp Huấn Luyện UAV Khóa 02 - 2026"
                  className="w-full p-2.5 text-sm rounded-xl border border-slate-200 focus:ring-2 focus:ring-rose-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Mô tả / Ghi chú về lớp học</label>
                <textarea
                  rows={3}
                  value={classForm.description}
                  onChange={(e) => setClassForm({ ...classForm, description: e.target.value })}
                  placeholder="Nhập thông tin khóa đào tạo, đơn vị phụ trách, quyết định liên quan..."
                  className="w-full p-2.5 text-sm rounded-xl border border-slate-200 focus:ring-2 focus:ring-rose-500"
                />
              </div>

              <div className="pt-3 flex justify-end space-x-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddClassModal(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold bg-rose-600 text-white rounded-xl shadow-md hover:bg-rose-700 cursor-pointer"
                >
                  Tạo lớp học
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 5. MODAL: EDIT CLASS */}
      {editingClass && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="px-6 py-4 bg-sky-600 text-white flex items-center justify-between">
              <h3 className="font-bold text-base sm:text-lg">Chỉnh Sửa Lớp Học</h3>
              <button onClick={() => setEditingClass(null)} className="text-white/80 hover:text-white cursor-pointer font-bold">✕</button>
            </div>

            <form onSubmit={handleUpdateClass} className="p-6 space-y-4">
              {formError && (
                <div className="p-3 bg-rose-50 text-rose-700 text-xs rounded-xl border border-rose-200 font-bold">
                  {formError}
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Tên lớp học (*)</label>
                <input
                  type="text"
                  required
                  value={editingClass.name}
                  onChange={(e) => setEditingClass({ ...editingClass, name: e.target.value })}
                  className="w-full p-2.5 text-sm rounded-xl border border-slate-200 focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Mô tả / Ghi chú</label>
                <textarea
                  rows={3}
                  value={editingClass.description || ''}
                  onChange={(e) => setEditingClass({ ...editingClass, description: e.target.value })}
                  className="w-full p-2.5 text-sm rounded-xl border border-slate-200 focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <div className="pt-3 flex justify-end space-x-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingClass(null)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold bg-sky-600 text-white rounded-xl shadow-md hover:bg-sky-700 cursor-pointer"
                >
                  Lưu thay đổi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 6. MODAL: ADD STUDENT TO CLASS (Họ tên, SĐT, Phòng ban, Đơn vị, Email) */}
      {showAddStudentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="px-6 py-4 bg-rose-600 text-white flex items-center justify-between">
              <div>
                <h3 className="font-bold text-base sm:text-lg">Thêm Học Viên Mới Vào Lớp</h3>
                <p className="text-xs text-rose-100 mt-0.5 truncate">{selectedClass?.name}</p>
              </div>
              <button onClick={() => setShowAddStudentModal(false)} className="text-white/80 hover:text-white cursor-pointer font-bold">✕</button>
            </div>

            <form onSubmit={handleAddStudent} className="p-6 space-y-3.5">
              {formError && (
                <div className="p-3 bg-rose-50 text-rose-700 text-xs rounded-xl border border-rose-200 font-bold">
                  {formError}
                </div>
              )}

              {/* 1. Họ và tên */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Họ và tên học viên (*)</label>
                <input
                  type="text"
                  required
                  value={studentForm.full_name}
                  onChange={(e) => setStudentForm({ ...studentForm, full_name: e.target.value })}
                  placeholder="ví dụ: Nguyễn Văn A"
                  className="w-full p-2.5 text-sm rounded-xl border border-slate-200 focus:ring-2 focus:ring-rose-500 font-semibold"
                />
              </div>

              {/* 2. Số điện thoại */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Số điện thoại (* - dùng làm tài khoản đăng nhập)</label>
                <input
                  type="tel"
                  required
                  value={studentForm.phone}
                  onChange={(e) => setStudentForm({ ...studentForm, phone: e.target.value })}
                  placeholder="ví dụ: 0912345678"
                  className="w-full p-2.5 text-sm rounded-xl border border-slate-200 focus:ring-2 focus:ring-rose-500 font-mono"
                />
              </div>

              {/* 3. Phòng ban */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Phòng ban / Xí nghiệp / Tổ đội</label>
                <input
                  type="text"
                  value={studentForm.department}
                  onChange={(e) => setStudentForm({ ...studentForm, department: e.target.value })}
                  placeholder="ví dụ: Xí nghiệp Lưới điện Cao thế An Giang"
                  className="w-full p-2.5 text-sm rounded-xl border border-slate-200 focus:ring-2 focus:ring-rose-500"
                />
              </div>

              {/* 4. Đơn vị */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Đơn vị công tác / Tổng công ty</label>
                <input
                  type="text"
                  value={studentForm.unit}
                  onChange={(e) => setStudentForm({ ...studentForm, unit: e.target.value })}
                  placeholder="ví dụ: Công ty Điện lực An Giang / Tổng công ty Điện lực Miền Nam"
                  className="w-full p-2.5 text-sm rounded-xl border border-slate-200 focus:ring-2 focus:ring-rose-500"
                />
              </div>

              {/* 5. Email */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Email liên hệ</label>
                <input
                  type="email"
                  value={studentForm.email}
                  onChange={(e) => setStudentForm({ ...studentForm, email: e.target.value })}
                  placeholder="ví dụ: nguyenvana@evnspc.vn"
                  className="w-full p-2.5 text-sm rounded-xl border border-slate-200 focus:ring-2 focus:ring-rose-500"
                />
              </div>

              <div className="pt-3 flex justify-end space-x-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddStudentModal(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold bg-rose-600 text-white rounded-xl shadow-md hover:bg-rose-700 cursor-pointer"
                >
                  Thêm học viên
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 7. MODAL: EDIT STUDENT */}
      {editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="px-6 py-4 bg-sky-600 text-white flex items-center justify-between">
              <h3 className="font-bold text-base sm:text-lg">Chỉnh Sửa Học Viên: @{editingUser.username}</h3>
              <button onClick={() => setEditingUser(null)} className="text-white/80 hover:text-white cursor-pointer font-bold">✕</button>
            </div>

            <form onSubmit={handleUpdateUser} className="p-6 space-y-3.5">
              {formError && (
                <div className="p-3 bg-rose-50 text-rose-700 text-xs rounded-xl border border-rose-200 font-bold">
                  {formError}
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Họ và tên</label>
                <input
                  type="text"
                  required
                  value={editingUser.full_name}
                  onChange={(e) => setEditingUser({ ...editingUser, full_name: e.target.value })}
                  className="w-full p-2.5 text-sm rounded-xl border border-slate-200"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Đơn vị công tác</label>
                <input
                  type="text"
                  value={editingUser.department || ''}
                  onChange={(e) => setEditingUser({ ...editingUser, department: e.target.value })}
                  className="w-full p-2.5 text-sm rounded-xl border border-slate-200"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Trạng thái</label>
                  <select
                    value={editingUser.is_active}
                    onChange={(e) => setEditingUser({ ...editingUser, is_active: Number(e.target.value) })}
                    className="w-full p-2.5 text-sm rounded-xl border border-slate-200 font-bold"
                  >
                    <option value={1}>Đang hoạt động</option>
                    <option value={0}>Khóa tài khoản</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Email</label>
                  <input
                    type="email"
                    value={editingUser.email || ''}
                    onChange={(e) => setEditingUser({ ...editingUser, email: e.target.value })}
                    className="w-full p-2.5 text-sm rounded-xl border border-slate-200"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Đặt lại mật khẩu mới (bỏ trống nếu không đổi)</label>
                <input
                  type="password"
                  value={editingUser.new_password || ''}
                  onChange={(e) => setEditingUser({ ...editingUser, new_password: e.target.value })}
                  placeholder="Nhập mật khẩu mới nếu muốn đổi"
                  className="w-full p-2.5 text-sm rounded-xl border border-slate-200"
                />
              </div>

              <div className="pt-3 flex justify-end space-x-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold bg-sky-600 text-white rounded-xl shadow-md hover:bg-sky-700 cursor-pointer"
                >
                  Lưu thay đổi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Student Detailed Progress Modal */}
      {viewingStudentProgress && selectedClass && (
        <StudentProgressModal
          classId={selectedClass.id}
          studentId={viewingStudentProgress.id}
          onClose={() => setViewingStudentProgress(null)}
        />
      )}

    </div>
  );
}
