import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { X, Save, Sparkles, Check, AlertCircle } from 'lucide-react';

export default function ExplanationModal({ question, isOpen, onClose, onSaveSuccess }) {
  const [explanation, setExplanation] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (question) {
      setExplanation(question.explanation || '');
      setError(null);
    }
  }, [question]);

  if (!isOpen || !question) return null;

  const handleSave = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.questions.updateExplanation(question.id, explanation);
      if (res.success) {
        onSaveSuccess(res.data);
        onClose();
      }
    } catch (err) {
      setError(err.message || 'Lưu lời giải thích thất bại. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  const insertSuggestion = (snippet) => {
    setExplanation(prev => {
      const prefix = prev.trim() ? prev.trim() + '\n\n' : '';
      return prefix + snippet;
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full overflow-hidden border border-slate-200 flex flex-col animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-linear-to-r from-sky-600 to-indigo-700 text-white">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-sky-100" />
            </div>
            <div>
              <h3 className="font-bold text-lg leading-tight">Chỉnh Sửa Lời Giải Thích & Căn Cứ</h3>
              <p className="text-xs text-sky-100/90">Mã câu hỏi: {question.code}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Question Context Preview */}
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 text-sm">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">
            Nội dung câu hỏi:
          </span>
          <p className="font-semibold text-slate-800 line-clamp-3">
            {question.stem}
          </p>
          <div className="mt-2 flex items-center space-x-2">
            <span className="text-xs font-bold text-slate-600">Đáp án đúng:</span>
            <span className="text-xs font-black px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-md border border-emerald-300">
              {question.correct_answer}
            </span>
          </div>
        </div>

        {/* Editor Body */}
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase">
              Lời giải thích cho học viên (Hiện khi chữa đề trên Zoom):
            </label>
            <textarea
              rows={6}
              value={explanation}
              onChange={(e) => setExplanation(e.target.value)}
              placeholder="Nhập căn cứ pháp lý, công thức tính toán hoặc lưu ý kinh nghiệm bay thực tế..."
              className="w-full p-4 text-sm rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-sky-500 focus:border-sky-500 bg-white text-slate-900 shadow-inner"
            />
          </div>

          {/* Quick Legal & Practical Snippet Chips */}
          <div>
            <span className="text-xs font-bold text-slate-500 block mb-1.5">
              Gợi ý chèn nhanh căn cứ văn bản:
            </span>
            <div className="flex flex-wrap gap-1.5">
              <button
                type="button"
                onClick={() => insertSuggestion("Căn cứ Luật Phòng không nhân dân số 49/2024/QH15 quy định về quản lý tàu bay không người lái.")}
                className="text-xs px-2.5 py-1 rounded-lg bg-sky-50 text-sky-700 hover:bg-sky-100 border border-sky-200 transition-colors"
              >
                + Luật PKND 49/2024
              </button>
              <button
                type="button"
                onClick={() => insertSuggestion("Căn cứ Nghị định 288/2025/NĐ-CP quy định chi tiết phân loại phương tiện bay và cấp phép bay UAV.")}
                className="text-xs px-2.5 py-1 rounded-lg bg-sky-50 text-sky-700 hover:bg-sky-100 border border-sky-200 transition-colors"
              >
                + Nghị định 288/2025
              </button>
              <button
                type="button"
                onClick={() => insertSuggestion("Quy chuẩn an toàn: Trong điều kiện thời tiết xấu hoặc gió giật cấp 5 trở lên, nghiêm cấm cất cánh phương tiện.")}
                className="text-xs px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 transition-colors"
              >
                + Quy chuẩn gió/thời tiết
              </button>
              <button
                type="button"
                onClick={() => insertSuggestion("Định nghĩa VLOS: Người điều khiển luôn nhìn thấy phương tiện bay bằng mắt thường trong suốt chuyến bay.")}
                className="text-xs px-2.5 py-1 rounded-lg bg-purple-50 text-purple-700 hover:bg-purple-100 border border-purple-200 transition-colors"
              >
                + Định nghĩa VLOS
              </button>
            </div>
          </div>

          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-end space-x-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-200 rounded-xl transition-colors"
          >
            Hủy bỏ
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={loading}
            className="flex items-center space-x-2 px-5 py-2.5 bg-sky-600 hover:bg-sky-700 text-white text-sm font-bold rounded-xl shadow-md shadow-sky-600/25 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>{loading ? 'Đang lưu...' : 'Lưu lời giải thích'}</span>
          </button>
        </div>

      </div>
    </div>
  );
}
