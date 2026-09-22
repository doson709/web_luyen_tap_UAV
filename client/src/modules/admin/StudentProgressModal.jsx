import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { 
  X, CheckCircle, XCircle, AlertCircle, HelpCircle, 
  BookOpen, Mic, Award, Building, Mail, Phone, 
  BarChart3, ChevronDown, ChevronUp, Clock, CheckCheck
} from 'lucide-react';

export default function StudentProgressModal({ classId, studentId, onClose }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('theory'); // 'theory' | 'oral'
  const [expandedModules, setExpandedModules] = useState({});

  useEffect(() => {
    async function fetchDetail() {
      setLoading(true);
      setError(null);
      try {
        const res = await api.classes.getStudentProgressDetail(classId, studentId);
        if (res.success) {
          setData(res.data);
          // Expand all theory modules by default
          const exp = {};
          if (res.data.theory?.modules) {
            res.data.theory.modules.forEach(m => {
              exp[m.id] = true;
            });
          }
          setExpandedModules(exp);
        } else {
          setError(res.message || 'Không thể tải thông tin chi tiết tiến độ.');
        }
      } catch (err) {
        setError(err.message || 'Đã xảy ra lỗi khi tải dữ liệu.');
      } finally {
        setLoading(false);
      }
    }

    if (classId && studentId) {
      fetchDetail();
    }
  }, [classId, studentId]);

  const toggleModule = (modId) => {
    setExpandedModules(prev => ({
      ...prev,
      [modId]: !prev[modId]
    }));
  };

  if (!classId || !studentId) return null;

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center p-3 sm:p-5 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl shadow-2xl max-w-4xl w-full max-h-[92vh] flex flex-col overflow-hidden border border-slate-200">
        
        {/* Header */}
        <div className="p-5 sm:p-6 bg-gradient-to-r from-sky-700 via-sky-800 to-indigo-900 text-white relative flex items-start justify-between">
          <div className="space-y-1.5 pr-8">
            <div className="flex items-center space-x-2 flex-wrap gap-y-1">
              <span className="text-xs font-black uppercase px-2.5 py-0.5 bg-white/20 rounded-md backdrop-blur-xs">
                Chi tiết tiến độ học viên
              </span>
              {data?.student && (
                <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs font-bold rounded-full ${
                  data.student.is_online 
                    ? 'bg-emerald-500/30 text-emerald-200 border border-emerald-400/40' 
                    : 'bg-white/10 text-slate-300 border border-white/20'
                }`}>
                  <span className={`w-2 h-2 rounded-full ${data.student.is_online ? 'bg-emerald-400 animate-pulse' : 'bg-slate-400'}`} />
                  {data.student.is_online ? 'Đang hoạt động' : 'Chưa hoạt động'}
                </span>
              )}
            </div>

            <h2 className="text-lg sm:text-xl font-black tracking-tight">
              {data?.student ? data.student.full_name : 'Đang tải thông tin...'}
            </h2>

            {data?.student && (
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-sky-100/90 font-medium">
                {data.student.email && (
                  <span className="flex items-center space-x-1">
                    <Mail className="w-3.5 h-3.5 opacity-80" />
                    <span>{data.student.email}</span>
                  </span>
                )}
                {data.student.phone && (
                  <span className="flex items-center space-x-1">
                    <Phone className="w-3.5 h-3.5 opacity-80" />
                    <span>{data.student.phone}</span>
                  </span>
                )}
                {(data.student.department || data.student.unit) && (
                  <span className="flex items-center space-x-1">
                    <Building className="w-3.5 h-3.5 opacity-80" />
                    <span>{[data.student.department, data.student.unit].filter(Boolean).join(' - ')}</span>
                  </span>
                )}
              </div>
            )}
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-full text-white/70 hover:text-white hover:bg-white/10 transition-colors cursor-pointer shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">
          
          {loading && (
            <div className="py-16 text-center text-slate-500 space-y-3">
              <div className="w-10 h-10 border-4 border-sky-600 border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-sm font-semibold">Đang tổng hợp tiến độ câu hỏi học viên...</p>
            </div>
          )}

          {error && (
            <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 rounded-2xl text-sm font-semibold flex items-center space-x-3">
              <AlertCircle className="w-5 h-5 shrink-0 text-rose-600" />
              <span>{error}</span>
            </div>
          )}

          {!loading && data && (
            <>
              {/* Summary 4-Grid Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
                
                {/* 1. Tổng tiến độ */}
                <div className="p-4 rounded-2xl bg-gradient-to-br from-sky-50 to-indigo-50/50 border border-sky-100 flex flex-col justify-between">
                  <div className="flex items-center justify-between text-xs font-bold text-sky-800 uppercase tracking-wider mb-1">
                    <span>Tổng tiến độ</span>
                    <BarChart3 className="w-4 h-4 text-sky-600" />
                  </div>
                  <div>
                    <div className="text-xl sm:text-2xl font-black text-slate-900">
                      {data.summary.answered_count} <span className="text-xs font-semibold text-slate-500">/ 649 câu</span>
                    </div>
                    <div className="text-xs font-bold text-sky-600 mt-0.5">
                      Đạt {data.summary.progress_percent}% toàn khoá
                    </div>
                  </div>
                </div>

                {/* 2. Trắc nghiệm */}
                <div className="p-4 rounded-2xl bg-gradient-to-br from-blue-50 to-sky-50/50 border border-blue-100 flex flex-col justify-between">
                  <div className="flex items-center justify-between text-xs font-bold text-blue-800 uppercase tracking-wider mb-1">
                    <span>Trắc nghiệm</span>
                    <BookOpen className="w-4 h-4 text-blue-600" />
                  </div>
                  <div>
                    <div className="text-xl sm:text-2xl font-black text-slate-900">
                      {data.theory.answered} <span className="text-xs font-semibold text-slate-500">/ 600 câu</span>
                    </div>
                    <div className="text-xs font-bold text-blue-600 mt-0.5">
                      Đúng {data.theory.correct} - Sai {data.theory.wrong}
                    </div>
                  </div>
                </div>

                {/* 3. Vấn đáp */}
                <div className="p-4 rounded-2xl bg-gradient-to-br from-amber-50 to-orange-50/50 border border-amber-100 flex flex-col justify-between">
                  <div className="flex items-center justify-between text-xs font-bold text-amber-800 uppercase tracking-wider mb-1">
                    <span>Vấn đáp</span>
                    <Mic className="w-4 h-4 text-amber-600" />
                  </div>
                  <div>
                    <div className="text-xl sm:text-2xl font-black text-slate-900">
                      {data.oral.answered} <span className="text-xs font-semibold text-slate-500">/ 49 câu</span>
                    </div>
                    <div className="text-xs font-bold text-amber-700 mt-0.5">
                      Đã hoàn thành {data.oral.progress_percent}%
                    </div>
                  </div>
                </div>

                {/* 4. Tỷ lệ chính xác */}
                <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-50 to-teal-50/50 border border-emerald-100 flex flex-col justify-between">
                  <div className="flex items-center justify-between text-xs font-bold text-emerald-800 uppercase tracking-wider mb-1">
                    <span>Độ chính xác</span>
                    <Award className="w-4 h-4 text-emerald-600" />
                  </div>
                  <div>
                    <div className="text-xl sm:text-2xl font-black text-emerald-700">
                      {data.summary.accuracy_percent}%
                    </div>
                    <div className="text-xs font-medium text-slate-500 mt-0.5">
                      {data.summary.correct_count} câu đúng trên {data.summary.answered_count} câu đã làm
                    </div>
                  </div>
                </div>

              </div>

              {/* Tab Selector */}
              <div className="flex border-b border-slate-200">
                <button
                  onClick={() => setActiveTab('theory')}
                  className={`py-3 px-5 text-xs sm:text-sm font-black border-b-2 transition-all flex items-center space-x-2 cursor-pointer ${
                    activeTab === 'theory'
                      ? 'border-sky-600 text-sky-700 bg-sky-50/50 rounded-t-xl'
                      : 'border-transparent text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <BookOpen className="w-4 h-4" />
                  <span>Phần Lý Thuyết (Trắc nghiệm - 600 câu)</span>
                  <span className="px-2 py-0.5 text-xs font-bold rounded-full bg-sky-100 text-sky-800">
                    {data.theory.answered}/{data.theory.total}
                  </span>
                </button>

                <button
                  onClick={() => setActiveTab('oral')}
                  className={`py-3 px-5 text-xs sm:text-sm font-black border-b-2 transition-all flex items-center space-x-2 cursor-pointer ${
                    activeTab === 'oral'
                      ? 'border-amber-600 text-amber-700 bg-amber-50/50 rounded-t-xl'
                      : 'border-transparent text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <Mic className="w-4 h-4" />
                  <span>Phần Vấn Đáp (49 câu)</span>
                  <span className="px-2 py-0.5 text-xs font-bold rounded-full bg-amber-100 text-amber-800">
                    {data.oral.answered}/{data.oral.total}
                  </span>
                </button>
              </div>

              {/* Tab 1: Theory (Modules & Topics Detailed Breakdown) */}
              {activeTab === 'theory' && (
                <div className="space-y-4">
                  {data.theory.modules.map((m) => {
                    const isExpanded = !!expandedModules[m.id];
                    return (
                      <div key={m.id} className="border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
                        
                        {/* Module Header Bar */}
                        <div 
                          onClick={() => toggleModule(m.id)}
                          className="p-4 bg-slate-50 hover:bg-slate-100/80 transition-colors flex items-center justify-between cursor-pointer select-none"
                        >
                          <div className="flex items-center space-x-3 pr-4">
                            <span className="px-2.5 py-1 text-xs font-black rounded-lg bg-sky-700 text-white shadow-xs">
                              {m.code}
                            </span>
                            <div>
                              <h3 className="text-sm font-bold text-slate-900 leading-snug">
                                {m.title}
                              </h3>
                              <div className="flex items-center space-x-3 text-xs font-semibold text-slate-500 mt-1">
                                <span>Tổng: <strong className="text-slate-800">{m.total} câu</strong></span>
                                <span>•</span>
                                <span>Đã làm: <strong className="text-sky-700">{m.answered} câu</strong> ({m.progress_percent}%)</span>
                                <span>•</span>
                                <span className="text-emerald-700">Đúng: <strong>{m.correct}</strong></span>
                                <span>•</span>
                                <span className="text-rose-700">Sai: <strong>{m.wrong}</strong></span>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center space-x-3 shrink-0">
                            {/* Mini progress bar */}
                            <div className="w-24 h-2 bg-slate-200 rounded-full overflow-hidden hidden sm:block">
                              <div 
                                className="h-full bg-sky-600 rounded-full" 
                                style={{ width: `${m.progress_percent}%` }}
                              />
                            </div>
                            <span className="text-xs font-bold text-slate-600">{m.progress_percent}%</span>
                            {isExpanded ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                          </div>
                        </div>

                        {/* Topics Breakdown Table */}
                        {isExpanded && (
                          <div className="p-0 border-t border-slate-200 overflow-x-auto">
                            <table className="w-full text-left text-xs">
                              <thead className="bg-slate-100/70 text-slate-600 font-bold uppercase tracking-wider border-b border-slate-200">
                                <tr>
                                  <th className="py-2.5 px-4">Tên Mục / Chủ đề</th>
                                  <th className="py-2.5 px-3 text-center">Tổng câu</th>
                                  <th className="py-2.5 px-3 text-center">Đã làm</th>
                                  <th className="py-2.5 px-3 text-center text-emerald-700">Số câu đúng</th>
                                  <th className="py-2.5 px-3 text-center text-rose-700">Số câu sai</th>
                                  <th className="py-2.5 px-3 text-center">Chưa làm</th>
                                  <th className="py-2.5 px-4 text-center min-w-[140px]">Tiến độ</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-100 font-medium">
                                {m.topics.map((t, tIdx) => (
                                  <tr key={t.id} className="hover:bg-slate-50/80">
                                    <td className="py-3 px-4 text-slate-900 font-semibold">
                                      {t.title}
                                    </td>
                                    <td className="py-3 px-3 text-center font-bold text-slate-700">
                                      {t.total}
                                    </td>
                                    <td className="py-3 px-3 text-center font-bold text-sky-700">
                                      {t.answered}
                                    </td>
                                    <td className="py-3 px-3 text-center font-bold text-emerald-600">
                                      <span className="inline-flex items-center gap-1">
                                        <CheckCircle className="w-3.5 h-3.5" />
                                        {t.correct}
                                      </span>
                                    </td>
                                    <td className="py-3 px-3 text-center font-bold text-rose-600">
                                      <span className="inline-flex items-center gap-1">
                                        <XCircle className="w-3.5 h-3.5" />
                                        {t.wrong}
                                      </span>
                                    </td>
                                    <td className="py-3 px-3 text-center font-semibold text-slate-400">
                                      {t.unanswered}
                                    </td>
                                    <td className="py-3 px-4 text-center">
                                      <div className="flex items-center space-x-2">
                                        <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden border border-slate-200">
                                          <div 
                                            className="h-full bg-gradient-to-r from-sky-500 to-indigo-600 rounded-full" 
                                            style={{ width: `${t.progress_percent}%` }}
                                          />
                                        </div>
                                        <span className="text-[11px] font-bold text-slate-700 w-8 text-right">
                                          {t.progress_percent}%
                                        </span>
                                      </div>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )}

                      </div>
                    );
                  })}
                </div>
              )}

              {/* Tab 2: Oral Questions (49 Questions List & Status) */}
              {activeTab === 'oral' && (
                <div className="space-y-3">
                  <div className="p-4 bg-amber-50/70 border border-amber-200 rounded-2xl flex items-center justify-between text-xs font-bold text-amber-900">
                    <div className="flex items-center space-x-2">
                      <Mic className="w-4 h-4 text-amber-700" />
                      <span>Thống kê 49 câu hỏi vấn đáp sát hạch</span>
                    </div>
                    <div>
                      Đã ôn luyện: <strong className="text-amber-800">{data.oral.answered} / {data.oral.total} câu</strong> ({data.oral.progress_percent}%)
                    </div>
                  </div>

                  <div className="border border-slate-200 rounded-2xl overflow-hidden">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-100/80 text-slate-600 font-bold uppercase tracking-wider border-b border-slate-200">
                        <tr>
                          <th className="py-2.5 px-3 text-center w-12">STT</th>
                          <th className="py-2.5 px-3 w-28">Mã câu</th>
                          <th className="py-2.5 px-4">Nội dung câu hỏi vấn đáp</th>
                          <th className="py-2.5 px-3 text-center w-36">Trạng thái</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {data.oral.questions.map((q, qIdx) => (
                          <tr key={q.id} className={`hover:bg-slate-50/80 ${q.is_answered ? 'bg-emerald-50/30' : ''}`}>
                            <td className="py-3 px-3 text-center font-bold text-slate-400">
                              {qIdx + 1}
                            </td>
                            <td className="py-3 px-3 font-mono font-bold text-slate-700">
                              {q.code || `UAV-V-${q.id}`}
                            </td>
                            <td className="py-3 px-4 font-semibold text-slate-900 leading-relaxed">
                              {q.stem}
                            </td>
                            <td className="py-3 px-3 text-center">
                              {q.is_answered ? (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                                  <CheckCheck className="w-3 h-3 text-emerald-600" />
                                  Đã ôn luyện
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-500 border border-slate-200">
                                  Chưa ôn
                                </span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

            </>
          )}

        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold text-xs rounded-xl transition-colors cursor-pointer"
          >
            Đóng
          </button>
        </div>

      </div>
    </div>
  );
}
