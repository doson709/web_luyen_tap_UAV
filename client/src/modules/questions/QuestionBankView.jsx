import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import { 
  Search, Plus, Edit, Trash2, CheckCircle2, Eye, Filter, 
  HelpCircle, BookOpen, Sparkles, Lock, GraduationCap 
} from 'lucide-react';
import ExplanationModal from './ExplanationModal';

export default function QuestionBankView({ selectedModule, selectedTopic }) {
  const { user, canEditExplanation, isAdmin, isTeacher } = useAuth();
  const isAuthorized = isAdmin || isTeacher;

  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [keyword, setKeyword] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [editingQuestion, setEditingQuestion] = useState(null);

  const loadQuestions = async () => {
    if (!isAuthorized) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const params = {};
      if (selectedModule) params.moduleId = selectedModule.id;
      if (selectedTopic) params.topicId = selectedTopic.id;
      if (typeFilter !== 'all') params.type = typeFilter;
      if (keyword.trim()) params.keyword = keyword.trim();

      const res = await api.questions.list(params);
      if (res.success) {
        setQuestions(res.data);
      }
    } catch (err) {
      console.error('Failed to load question bank:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthorized) {
      loadQuestions();
    } else {
      setLoading(false);
    }
  }, [selectedModule, selectedTopic, typeFilter, keyword, isAuthorized]);

  const handleExplanationSaved = (updatedQ) => {
    setQuestions(prev => prev.map(q => q.id === updatedQ.id ? updatedQ : q));
  };

  // If regular user/student: Display notice and do not show any questions
  if (!isAuthorized) {
    return (
      <div className="min-h-[420px] bg-white rounded-2xl border border-slate-200/90 shadow-xs p-8 sm:p-12 flex flex-col items-center justify-center text-center">
        <div className="w-16 h-16 rounded-2xl bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center mb-5 shadow-xs">
          <Lock className="w-8 h-8" />
        </div>
        <h3 className="text-xl sm:text-2xl font-black text-slate-900 mb-2">
          Tài Liệu Ngân Hàng Câu Hỏi
        </h3>
        <div className="max-w-md p-4 bg-amber-50/80 border border-amber-200/80 rounded-xl mb-4">
          <p className="text-sm sm:text-base font-bold text-amber-900">
            Bạn cần hoàn thành khóa học để lấy tài liệu Ngân hàng câu hỏi
          </p>
        </div>
        <p className="text-xs sm:text-sm text-slate-500 max-w-lg leading-relaxed">
          Vui lòng hoàn thành đầy đủ các bài luyện tập trắc nghiệm và câu hỏi vấn đáp trong chương trình huấn luyện để đủ điều kiện nhận tài liệu ngân hàng câu hỏi chính thức.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      
      {/* Title & Stats */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-900">
            Ngân Hàng Câu Hỏi Huấn Luyện UAV
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Quản lý, phân loại và cập nhật giải thích căn cứ pháp lý theo từng học phần
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <span className="px-3 py-1 bg-sky-100 text-sky-800 rounded-xl text-xs font-bold border border-sky-200">
            Tổng cộng: {questions.length} câu hỏi
          </span>
        </div>
      </div>

      {/* Filter and Search */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="relative flex-1 min-w-[260px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            placeholder="Tìm theo nội dung, mã câu hỏi hoặc căn cứ giải thích..."
            className="w-full pl-10 pr-4 py-2 text-sm rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-sky-500 bg-slate-50"
          />
        </div>

        <div className="flex items-center space-x-1.5 text-xs font-bold bg-slate-100 p-1 rounded-xl">
          <button
            onClick={() => setTypeFilter('all')}
            className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${typeFilter === 'all' ? 'bg-white text-sky-700 shadow-xs' : 'text-slate-600'}`}
          >
            Tất cả
          </button>
          <button
            onClick={() => setTypeFilter('mcq')}
            className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${typeFilter === 'mcq' ? 'bg-white text-sky-700 shadow-xs' : 'text-slate-600'}`}
          >
            Trắc nghiệm
          </button>
          <button
            onClick={() => setTypeFilter('true_false')}
            className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${typeFilter === 'true_false' ? 'bg-white text-sky-700 shadow-xs' : 'text-slate-600'}`}
          >
            Đúng/Sai
          </button>
          <button
            onClick={() => setTypeFilter('oral')}
            className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${typeFilter === 'oral' ? 'bg-white text-sky-700 shadow-xs' : 'text-slate-600'}`}
          >
            Vấn đáp
          </button>
        </div>
      </div>

      {/* Table view */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-400">
            <div className="w-8 h-8 border-4 border-sky-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-sm font-semibold">Đang tải danh sách câu hỏi...</p>
          </div>
        ) : questions.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            <HelpCircle className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <p className="text-sm font-bold">Không tìm thấy câu hỏi</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-600 text-xs font-bold uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4 w-14">STT</th>
                  <th className="py-3 px-4 w-32">Mã ID</th>
                  <th className="py-3 px-4 w-28">Loại</th>
                  <th className="py-3 px-4">Nội dung câu dẫn & Đáp án</th>
                  <th className="py-3 px-4 w-48">Giải thích & Căn cứ</th>
                  <th className="py-3 px-4 w-28 text-center">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {questions.map((q, idx) => (
                  <tr key={q.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4 text-xs font-bold text-slate-400">
                      {idx + 1}
                    </td>
                    <td className="py-3 px-4 font-mono text-xs font-bold text-slate-700">
                      {q.code}
                      {q.target_role && (
                        <span className="block text-[10px] text-indigo-600 font-sans font-semibold mt-0.5">
                          {q.target_role}
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`inline-block px-2 py-0.5 text-[11px] font-bold rounded-md ${
                        q.question_type === 'true_false'
                          ? 'bg-amber-100 text-amber-800'
                          : q.question_type === 'oral'
                          ? 'bg-purple-100 text-purple-800'
                          : 'bg-sky-100 text-sky-800'
                      }`}>
                        {q.question_type === 'true_false' ? 'Đúng/Sai' : q.question_type === 'oral' ? 'Vấn đáp' : 'Trắc nghiệm'}
                      </span>
                    </td>
                    <td className="py-3 px-4 max-w-md">
                      <p className="font-semibold text-slate-900 leading-snug line-clamp-2">
                        {q.stem}
                      </p>
                      <div className="mt-1 text-xs">
                        <span className="font-bold text-slate-600">Đáp án đúng: </span>
                        <span className="font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200">
                          {q.correct_answer}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-4 max-w-xs text-xs text-slate-600">
                      {q.explanation ? (
                        <p className="line-clamp-2 italic">{q.explanation}</p>
                      ) : (
                        <span className="text-slate-400">Chưa có giải thích</span>
                      )}
                      {q.updated_by_name && (
                        <span className="block text-[10px] text-sky-600 mt-1">
                          Đã sửa bởi: {q.updated_by_name}
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-center">
                      {canEditExplanation && (
                        <button
                          onClick={() => setEditingQuestion(q)}
                          className="px-2.5 py-1 text-xs font-bold text-sky-700 bg-sky-50 hover:bg-sky-100 border border-sky-200 rounded-lg transition-colors cursor-pointer"
                          title="Sửa lời giải thích"
                        >
                          Sửa giải thích
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Explanation Modal */}
      {editingQuestion && (
        <ExplanationModal
          question={editingQuestion}
          isOpen={!!editingQuestion}
          onClose={() => setEditingQuestion(null)}
          onSaveSuccess={handleExplanationSaved}
        />
      )}

    </div>
  );
}
