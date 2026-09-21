import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { 
  Users, UserPlus, Shield, Key, Search, Edit2, 
  Trash2, CheckCircle, XCircle, AlertCircle, Building, Mail, ShieldAlert 
} from 'lucide-react';

export default function UserManagementView() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  
  // Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [formError, setFormError] = useState(null);
  const [actionSuccess, setActionSuccess] = useState(null);

  // Form states
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    full_name: '',
    role: 'student',
    email: '',
    department: '',
    sso_id: ''
  });

  const loadUsers = async () => {
    setLoading(true);
    try {
      const params = {};
      if (search.trim()) params.search = search.trim();
      if (roleFilter) params.role = roleFilter;
      const res = await api.users.list(params);
      if (res.success) {
        setUsers(res.data);
      }
    } catch (err) {
      console.error('Failed to load users:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, [search, roleFilter]);

  const handleCreateUser = async (e) => {
    e.preventDefault();
    setFormError(null);
    try {
      const res = await api.users.create(formData);
      if (res.success) {
        setActionSuccess('Thêm người dùng thành công!');
        setShowAddModal(false);
        setFormData({ username: '', password: '', full_name: '', role: 'student', email: '', department: '', sso_id: '' });
        loadUsers();
        setTimeout(() => setActionSuccess(null), 3000);
      }
    } catch (err) {
      setFormError(err.message || 'Thêm người dùng thất bại.');
    }
  };

  const handleUpdateUser = async (e) => {
    e.preventDefault();
    setFormError(null);
    try {
      const payload = {
        full_name: editingUser.full_name,
        role: editingUser.role,
        email: editingUser.email,
        department: editingUser.department,
        sso_id: editingUser.sso_id,
        is_active: editingUser.is_active
      };
      if (editingUser.new_password) {
        payload.new_password = editingUser.new_password;
      }

      const res = await api.users.update(editingUser.id, payload);
      if (res.success) {
        setActionSuccess('Cập nhật người dùng thành công!');
        setEditingUser(null);
        loadUsers();
        setTimeout(() => setActionSuccess(null), 3000);
      }
    } catch (err) {
      setFormError(err.message || 'Cập nhật thất bại.');
    }
  };

  const handleDeleteUser = async (user) => {
    if (!window.confirm(`Bạn có chắc chắn muốn xóa tài khoản [${user.username} - ${user.full_name}]?`)) return;
    try {
      const res = await api.users.delete(user.id);
      if (res.success) {
        setActionSuccess(res.message);
        loadUsers();
        setTimeout(() => setActionSuccess(null), 3000);
      }
    } catch (err) {
      alert(err.message || 'Xóa tài khoản thất bại.');
    }
  };

  const roleLabels = {
    admin: { label: 'Quản Trị Viên', bg: 'bg-rose-100 text-rose-800 border-rose-200' },
    teacher: { label: 'Giảng Viên', bg: 'bg-sky-100 text-sky-800 border-sky-200' },
    student: { label: 'Học Viên', bg: 'bg-emerald-100 text-emerald-800 border-emerald-200' }
  };

  return (
    <div className="space-y-6">
      
      {/* Page Header */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-rose-600 font-bold text-xs uppercase tracking-wide">
            <Shield className="w-4 h-4" />
            <span>Phân Hệ Quản Trị Hệ Thống</span>
          </div>
          <h2 className="text-xl font-black text-slate-900 mt-1">
            Quản Lý Cán Bộ & Phân Quyền Người Dùng
          </h2>
          <p className="text-xs text-slate-500">
            Thêm mới, phân quyền Giảng viên/Học viên và quản lý tài khoản người dùng
          </p>
        </div>

        <button
          onClick={() => {
            setFormData({ username: '', password: '', full_name: '', role: 'student', email: '', department: '', sso_id: '' });
            setFormError(null);
            setShowAddModal(true);
          }}
          className="flex items-center space-x-2 px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-sm font-bold shadow-md shadow-rose-600/20 transition-all hover:scale-[1.02] cursor-pointer"
        >
          <UserPlus className="w-4 h-4" />
          <span>Thêm người dùng mới</span>
        </button>
      </div>

      {actionSuccess && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl text-sm font-bold flex items-center space-x-2">
          <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{actionSuccess}</span>
        </div>
      )}

      {/* Filter and Search */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="relative flex-1 min-w-[260px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm theo tên cán bộ, tài khoản, đơn vị..."
            className="w-full pl-10 pr-4 py-2 text-sm rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-rose-500 bg-slate-50"
          />
        </div>

        <div className="flex items-center space-x-2">
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 bg-slate-50 font-semibold text-slate-700"
          >
            <option value="">Tất cả vai trò</option>
            <option value="admin">Quản trị viên (Admin)</option>
            <option value="teacher">Giảng viên (Teacher)</option>
            <option value="student">Học viên (Student)</option>
          </select>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-400">
            <div className="w-8 h-8 border-4 border-rose-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-sm font-semibold">Đang tải danh sách người dùng...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-600 text-xs font-bold uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-3.5 px-4">Tài khoản & Tên</th>
                  <th className="py-3.5 px-4">Vai trò</th>
                  <th className="py-3.5 px-4">Đơn vị công tác</th>
                  <th className="py-3.5 px-4">Trạng thái</th>
                  <th className="py-3.5 px-4 text-center">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {users.map(u => {
                  const roleInfo = roleLabels[u.role] || roleLabels.student;

                  return (
                    <tr key={u.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900">{u.full_name}</div>
                        <div className="text-xs text-slate-500 font-mono">@{u.username}</div>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className={`inline-block px-2.5 py-1 text-xs font-bold rounded-lg border ${roleInfo.bg}`}>
                          {roleInfo.label}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-xs text-slate-700">
                        <div className="flex items-center space-x-1 font-medium">
                          <Building className="w-3.5 h-3.5 text-slate-400" />
                          <span>{u.department || 'Chưa phân bổ'}</span>
                        </div>
                        {u.email && (
                          <div className="flex items-center space-x-1 text-slate-400 mt-0.5">
                            <Mail className="w-3.5 h-3.5" />
                            <span>{u.email}</span>
                          </div>
                        )}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className={`inline-block px-2 py-0.5 text-xs font-bold rounded-full ${
                          u.is_active ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                        }`}>
                          {u.is_active ? 'Hoạt động' : 'Đang khóa'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <div className="flex items-center justify-center space-x-2">
                          <button
                            onClick={() => {
                              setEditingUser({ ...u, new_password: '' });
                              setFormError(null);
                            }}
                            className="p-1.5 text-slate-500 hover:text-sky-600 hover:bg-sky-50 rounded-lg transition-colors cursor-pointer"
                            title="Sửa thông tin / Đổi quyền"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteUser(u)}
                            className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                            title="Xóa người dùng"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add User Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="px-6 py-4 bg-rose-600 text-white flex items-center justify-between">
              <h3 className="font-bold text-lg">Thêm Cán Bộ / Người Dùng Mới</h3>
              <button onClick={() => setShowAddModal(false)} className="text-white/80 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleCreateUser} className="p-6 space-y-4">
              {formError && (
                <div className="p-3 bg-rose-50 text-rose-700 text-xs rounded-xl border border-rose-200 font-bold">
                  {formError}
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Tên đăng nhập (*)</label>
                <input
                  type="text"
                  required
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  placeholder="ví dụ: gv_nguyenvanan"
                  className="w-full p-2.5 text-sm rounded-xl border border-slate-200 focus:ring-2 focus:ring-rose-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Họ và tên (*)</label>
                <input
                  type="text"
                  required
                  value={formData.full_name}
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                  placeholder="ví dụ: Nguyễn Văn An"
                  className="w-full p-2.5 text-sm rounded-xl border border-slate-200 focus:ring-2 focus:ring-rose-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Mật khẩu ban đầu (*)</label>
                  <input
                    type="password"
                    required
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    placeholder="Mật khẩu"
                    className="w-full p-2.5 text-sm rounded-xl border border-slate-200 focus:ring-2 focus:ring-rose-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Phân quyền vai trò (*)</label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    className="w-full p-2.5 text-sm rounded-xl border border-slate-200 font-bold"
                  >
                    <option value="student">Học viên</option>
                    <option value="teacher">Giảng viên (Được sửa giải thích)</option>
                    <option value="admin">Quản trị viên (Toàn quyền)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Đơn vị / Phòng ban</label>
                <input
                  type="text"
                  value={formData.department}
                  onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                  placeholder="ví dụ: Trung tâm Huấn luyện Bay UAV"
                  className="w-full p-2.5 text-sm rounded-xl border border-slate-200"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Địa chỉ Email liên hệ</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="canbo@uav.edu.vn"
                  className="w-full p-2.5 text-sm rounded-xl border border-slate-200"
                />
              </div>

              <div className="pt-3 flex justify-end space-x-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold bg-rose-600 text-white rounded-xl shadow-md hover:bg-rose-700 cursor-pointer"
                >
                  Lưu cán bộ
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="px-6 py-4 bg-sky-600 text-white flex items-center justify-between">
              <h3 className="font-bold text-lg">Chỉnh Sửa & Phân Quyền: @{editingUser.username}</h3>
              <button onClick={() => setEditingUser(null)} className="text-white/80 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleUpdateUser} className="p-6 space-y-4">
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

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Phân quyền</label>
                  <select
                    value={editingUser.role}
                    onChange={(e) => setEditingUser({ ...editingUser, role: e.target.value })}
                    className="w-full p-2.5 text-sm rounded-xl border border-slate-200 font-bold"
                  >
                    <option value="student">Học viên</option>
                    <option value="teacher">Giảng viên (Sửa giải thích)</option>
                    <option value="admin">Quản trị viên (Toàn quyền)</option>
                  </select>
                </div>

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

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Đổi mật khẩu mới (bỏ trống nếu không đổi)</label>
                <input
                  type="password"
                  value={editingUser.new_password || ''}
                  onChange={(e) => setEditingUser({ ...editingUser, new_password: e.target.value })}
                  placeholder="Nhập mật khẩu mới nếu muốn đặt lại"
                  className="w-full p-2.5 text-sm rounded-xl border border-slate-200"
                />
              </div>

              <div className="pt-3 flex justify-end space-x-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
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

    </div>
  );
}
