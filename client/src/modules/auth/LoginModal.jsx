import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { X, LogIn, Shield, Lock, Mail, AlertCircle } from 'lucide-react';

export default function LoginModal({ isOpen, onClose }) {
  const { login } = useAuth();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await login(username.trim(), password);
      onClose();
    } catch (err) {
      setError(err.message || 'Sai thông tin');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
      <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
        
        {/* Modal Top Banner */}
        <div className="p-6 bg-gradient-to-r from-sky-600 via-sky-700 to-indigo-700 text-white relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-full text-white/70 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-xs flex items-center justify-center mb-3">
            <Shield className="w-6 h-6 text-white" />
          </div>
          <h2 className="text-lg font-black tracking-tight uppercase">ĐĂNG NHẬP HỆ THỐNG</h2>
          <p className="text-xs text-sky-100/90 mt-0.5">
            Cổng Luyện Tập & Chữa Đề Thi UAV
          </p>
        </div>

        {/* Error Notice */}
        {error && (
          <div className="m-4 mb-0 p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs font-bold flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Credentials Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
              Tài khoản
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Mail className="w-4 h-4" />
              </div>
              <input
                type="text"
                required
                value={username}
                onChange={(e) => { setUsername(e.target.value); setError(null); }}
                placeholder="Nhập tên tài khoản"
                className="w-full h-11 pl-10 pr-4 text-sm font-semibold rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-sky-500 focus:border-sky-500 bg-slate-50/50 text-slate-900 transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
              Mật khẩu
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Lock className="w-4 h-4" />
              </div>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => { setPassword(e.target.value); setError(null); }}
                placeholder="Nhập mật khẩu"
                autoComplete="current-password"
                className="w-full h-11 pl-10 pr-4 text-sm font-semibold rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-sky-500 focus:border-sky-500 bg-slate-50/50 text-slate-900 transition-all"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full h-11 bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-500 hover:to-indigo-500 disabled:opacity-50 text-white font-bold text-sm rounded-xl shadow-md shadow-sky-600/25 transition-all flex items-center justify-center space-x-2 cursor-pointer active:scale-[0.99] mt-2"
          >
            <LogIn className="w-4 h-4" />
            <span>{loading ? 'Đang xác thực...' : 'ĐĂNG NHẬP'}</span>
          </button>
        </form>

      </div>
    </div>
  );
}
