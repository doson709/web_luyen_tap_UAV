import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { BookOpen, Database, Users, LogIn, LogOut, User } from 'lucide-react';

export default function Navbar({ activeTab, setActiveTab, onOpenLogin }) {
  const { user, isAuthenticated, isAdmin, isTeacher, logout } = useAuth();

  const getRoleBadge = (role) => {
    switch (role) {
      case 'admin':
        return { label: 'Quản Trị Viên', bg: 'bg-rose-100 text-rose-800 border-rose-300' };
      case 'teacher':
        return { label: 'Giảng Viên', bg: 'bg-sky-100 text-sky-800 border-sky-300' };
      default:
        return { label: 'Học Viên', bg: 'bg-emerald-100 text-emerald-800 border-emerald-300' };
    }
  };

  const badge = user ? getRoleBadge(user.role) : null;

  return (
    <header className="bg-white border-b border-slate-200/90 sticky top-0 z-30 shadow-xs w-full select-none">
      <div className="w-full px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-3">
          
          {/* 1. Brand Logo & Title (Strictly Single Line, Never Wraps) */}
          <div 
            className="flex items-center space-x-3 cursor-pointer shrink-0" 
            onClick={() => setActiveTab('practice')}
          >
            <div className="w-10 h-10 rounded-xl bg-linear-to-tr from-sky-600 via-sky-700 to-indigo-700 flex items-center justify-center text-white shadow-md shadow-sky-500/20 shrink-0">
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
              </svg>
            </div>
            <div className="flex flex-col">
              <div className="flex items-center space-x-2">
                <span className="text-base font-black text-slate-900 tracking-tight whitespace-nowrap">
                  UAV EXAM & PRACTICE
                </span>
                <span className="px-1.5 py-0.2 text-[10px] font-bold bg-sky-50 text-sky-700 rounded-md border border-sky-200 whitespace-nowrap hidden sm:inline-block">
                  Chuẩn 2026
                </span>
              </div>
              <span className="text-[11px] font-semibold text-slate-400 whitespace-nowrap hidden sm:inline-block">
                Hệ Thống Luyện Tập & Sát Hạch UAV
              </span>
            </div>
          </div>

          {/* 2. Navigation Tabs (Uniform Height H-10, whitespace-nowrap, No Wrap) */}
          <nav className="flex items-center space-x-1 shrink-0">
            <button
              onClick={() => setActiveTab('practice')}
              className={`h-10 flex items-center space-x-2 px-4 rounded-xl text-sm font-bold whitespace-nowrap transition-all cursor-pointer ${
                activeTab === 'practice' || activeTab === 'oral'
                  ? 'bg-sky-50 text-sky-700 border border-sky-200 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <BookOpen className="w-4 h-4 shrink-0 text-sky-600" />
              <span>Luyện tập & Sát hạch</span>
            </button>

            <button
              onClick={() => setActiveTab('questions')}
              className={`h-10 flex items-center space-x-2 px-4 rounded-xl text-sm font-bold whitespace-nowrap transition-all cursor-pointer ${
                activeTab === 'questions'
                  ? 'bg-indigo-50 text-indigo-700 border border-indigo-200 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Database className="w-4 h-4 shrink-0 text-indigo-600" />
              <span>Ngân hàng câu hỏi</span>
            </button>

            {isAdmin && (
              <button
                onClick={() => setActiveTab('admin')}
                className={`h-10 flex items-center space-x-2 px-3.5 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all cursor-pointer ${
                  activeTab === 'admin'
                    ? 'bg-rose-50 text-rose-700 border border-rose-200 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <Users className="w-4 h-4 shrink-0 text-rose-600" />
                <span>Quản lý người dùng</span>
              </button>
            )}
          </nav>

          {/* 3. User Profile & Auth (Synchronized H-10) */}
          <div className="flex items-center space-x-2.5 shrink-0">

            {/* Auth User Info / Log out */}
            {isAuthenticated ? (
              <div className="flex items-center space-x-2 shrink-0">
                <div className="h-10 px-3 rounded-xl bg-slate-100 border border-slate-200 flex items-center space-x-2.5">
                  <div className="w-6 h-6 rounded-lg bg-sky-600 text-white flex items-center justify-center text-xs font-black">
                    <User className="w-3.5 h-3.5" />
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-bold text-slate-800 whitespace-nowrap max-w-[120px] truncate">
                      {user.full_name}
                    </span>
                    <span className={`px-1.5 py-0.5 text-[9px] font-bold rounded-md border whitespace-nowrap ${badge?.bg}`}>
                      {badge?.label}
                    </span>
                  </div>
                </div>

                <button
                  onClick={logout}
                  className="h-10 w-10 flex items-center justify-center text-slate-500 hover:text-rose-600 bg-slate-100 hover:bg-rose-50 border border-slate-200 hover:border-rose-200 rounded-xl transition-colors cursor-pointer shrink-0"
                  title="Đăng xuất"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                onClick={onOpenLogin}
                className="h-10 flex items-center space-x-1.5 px-4 text-sm font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all whitespace-nowrap cursor-pointer border border-slate-200"
              >
                <LogIn className="w-4 h-4 text-slate-600 shrink-0" />
                <span>Đăng nhập</span>
              </button>
            )}
          </div>

        </div>
      </div>
    </header>
  );
}
