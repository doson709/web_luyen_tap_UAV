import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { X, LogIn, Shield, GraduationCap, UserCheck, Lock, AlertCircle } from 'lucide-react';

export default function LoginModal({ isOpen, onClose }) {
  const { login } = useAuth();

  const [mode, setMode] = useState('quick'); // 'quick' | 'credentials'
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  if (!isOpen) return null;

  const handleCredentialsLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await login(username.trim(), password);
      onClose();
    } catch (err) {
      setError(err.message || 'Đăng nhập không thành công.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = async (presetUser, presetPass) => {
    setLoading(true);
    setError(null);
    try {
      await login(presetUser, presetPass);
      onClose();
    } catch (err) {
      setError(err.message || 'Đăng nhập thất bại.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
      <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
        
        {/* Modal Top Banner */}
        <div className="p-6 bg-linear-to-br from-sky-600 via-sky-700 to-indigo-800 text-white relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-full text-white/70 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-xs flex items-center justify-center mb-3">
            <Shield className="w-6 h-6 text-white" />
          </div>
          <h2 className="text-xl font-black tracking-tight">ĐĂNG NHẬP HỆ THỐNG</h2>
          <p className="text-xs text-sky-100/90 mt-0.5">
            Cổng Luyện Tập & Chữa Đề Thi UAV Toàn Quốc
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="p-2 bg-slate-100 flex items-center justify-center gap-1 border-b border-slate-200">
          <button
            onClick={() => { setMode('quick'); setError(null); }}
            className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
              mode === 'quick' ? 'bg-white text-sky-800 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Đăng Nhập 1-Click
          </button>
          <button
            onClick={() => { setMode('credentials'); setError(null); }}
            className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
              mode === 'credentials' ? 'bg-white text-sky-800 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Nhập Tài Khoản & Mật Khẩu
          </button>
        </div>

        {error && (
          <div className="m-4 p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs font-bold flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* 1. Quick 1-Click Login */}
        {mode === 'quick' ? (
          <div className="p-6 space-y-3">
            <p className="text-xs text-slate-500 font-medium mb-1">
              Chọn nhanh vai trò để vào hệ thống ngay:
            </p>

            {/* Admin button */}
            <button
              onClick={() => handleQuickLogin('admin', 'Ngangiang2026')}
              disabled={loading}
              className="w-full flex items-center justify-between p-3.5 rounded-2xl bg-rose-50 border border-rose-200 hover:bg-rose-100/80 hover:border-rose-300 transition-all cursor-pointer group text-left"
            >
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-rose-600 text-white flex items-center justify-center shadow-xs">
                  <Shield className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-sm font-bold text-slate-900 group-hover:text-rose-700">
                    Quản Trị Viên (Admin)
                  </div>
                  <div className="text-xs text-slate-500">
                    Quản lý tài khoản cán bộ, học phần & toàn quyền
                  </div>
                </div>
              </div>
              <span className="text-xs font-bold text-rose-600 bg-white px-2.5 py-1 rounded-lg border border-rose-200">
                Vào ngay
              </span>
            </button>

            {/* Teacher button */}
            <button
              onClick={() => handleQuickLogin('giaovien', 'Ngangiang2026')}
              disabled={loading}
              className="w-full flex items-center justify-between p-3.5 rounded-2xl bg-sky-50 border border-sky-200 hover:bg-sky-100/80 hover:border-sky-300 transition-all cursor-pointer group text-left"
            >
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-sky-600 text-white flex items-center justify-center shadow-xs">
                  <GraduationCap className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-sm font-bold text-slate-900 group-hover:text-sky-700">
                    Giảng Viên (Teacher)
                  </div>
                  <div className="text-xs text-slate-500">
                    Toàn quyền chữa đề & sửa câu giải thích
                  </div>
                </div>
              </div>
              <span className="text-xs font-bold text-sky-600 bg-white px-2.5 py-1 rounded-lg border border-sky-200">
                Vào ngay
              </span>
            </button>

            {/* Student button */}
            <button
              onClick={() => handleQuickLogin('hocvien', 'Ngangiang2026')}
              disabled={loading}
              className="w-full flex items-center justify-between p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 hover:bg-emerald-100/80 hover:border-emerald-300 transition-all cursor-pointer group text-left"
            >
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-xs">
                  <UserCheck className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-sm font-bold text-slate-900 group-hover:text-emerald-700">
                    Học Viên (Student)
                  </div>
                  <div className="text-xs text-slate-500">
                    Luyện tập, xem đáp án & chữa đề
                  </div>
                </div>
              </div>
              <span className="text-xs font-bold text-emerald-600 bg-white px-2.5 py-1 rounded-lg border border-emerald-200">
                Vào ngay
              </span>
            </button>
          </div>
        ) : (
          /* 2. Manual Credentials Form */
          <form onSubmit={handleCredentialsLogin} className="p-6 space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Tên đăng nhập
              </label>
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Nhập tên đăng nhập (ví dụ: admin)"
                className="w-full p-3 text-sm rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-sky-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Mật khẩu
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Nhập mật khẩu"
                autoComplete="new-password"
                className="w-full p-3 text-sm rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-sky-500"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-sky-600 hover:bg-sky-700 disabled:opacity-50 text-white font-bold text-sm rounded-xl shadow-md shadow-sky-600/20 transition-all cursor-pointer"
            >
              {loading ? 'Đang xác thực...' : 'ĐĂNG NHẬP'}
            </button>
          </form>
        )}

      </div>
    </div>
  );
}
