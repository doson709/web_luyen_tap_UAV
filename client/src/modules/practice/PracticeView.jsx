import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import { 
  CheckCircle2, XCircle, Lightbulb, Edit3, MonitorPlay, 
  Search, Filter, Sparkles, Award, ArrowRight, RotateCcw, HelpCircle, BookOpen
} from 'lucide-react';
import ExplanationModal from '../questions/ExplanationModal';

export default function PracticeView({ 
  selectedModule, 
  selectedTopic, 
  selectedCategory,
  onLaunchZoom 
}) {
  const { canEditExplanation } = useAuth();

  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [filterType, setFilterType] = useState('all');

  const [userAnswers, setUserAnswers] = useState({});
  const [revealedAnswers, setRevealedAnswers] = useState({});
  const [revealedExplanations, setRevealedExplanations] = useState({});
  const [editingQuestion, setEditingQuestion] = useState(null);

  const [scoreStats, setScoreStats] = useState({ totalDone: 0, correct: 0 });

  useEffect(() => {
    async function loadQuestions() {
      setLoading(true);
      try {
        const params = {};
        if (selectedModule) params.moduleId = selectedModule.id;
        if (selectedTopic) params.topicId = selectedTopic.id;
        if (filterType !== 'all') params.type = filterType;
        if (searchKeyword.trim()) params.keyword = searchKeyword.trim();

        const res = await api.questions.list(params);
        if (res.success) {
          setQuestions(res.data);
          setUserAnswers({});
          setRevealedAnswers({});
          setRevealedExplanations({});
          setScoreStats({ totalDone: 0, correct: 0 });
        }
      } catch (err) {
        console.error('Failed to load questions:', err);
      } finally {
        setLoading(false);
      }
    }
    loadQuestions();
  }, [selectedModule, selectedTopic, filterType, searchKeyword]);

  const handleSelectOption = (questionId, optionKey) => {
    setUserAnswers(prev => ({ ...prev, [questionId]: optionKey }));
  };

  const handleCheckAnswer = (q) => {
    const isAlreadyChecked = revealedAnswers[q.id];
    if (!isAlreadyChecked) {
      const userAns = userAnswers[q.id];
      const isCorrect = userAns && (
        String(userAns).trim().toLowerCase() === String(q.correct_answer).trim().toLowerCase() ||
        (userAns === 'A' && String(q.correct_answer).startsWith('A')) ||
        (userAns === 'B' && String(q.correct_answer).startsWith('B')) ||
        (userAns === 'C' && String(q.correct_answer).startsWith('C')) ||
        (userAns === 'D' && String(q.correct_answer).startsWith('D'))
      );

      setScoreStats(prev => ({
        totalDone: prev.totalDone + 1,
        correct: prev.correct + (isCorrect ? 1 : 0)
      }));
    }

    setRevealedAnswers(prev => ({ ...prev, [q.id]: true }));
    setRevealedExplanations(prev => ({ ...prev, [q.id]: true }));
  };

  const toggleExplanation = (qId) => {
    setRevealedExplanations(prev => ({ ...prev, [qId]: !prev[qId] }));
  };

  const handleExplanationSaved = (updatedQ) => {
    setQuestions(prev => prev.map(q => q.id === updatedQ.id ? updatedQ : q));
    setRevealedExplanations(prev => ({ ...prev, [updatedQ.id]: true }));
  };

  return (
    <div className="space-y-5 w-full">
      
      {/* 1. Header & Quick Actions - Synchronized Height Buttons */}
      <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200/90 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-xs font-bold text-sky-600 uppercase tracking-wide">
            <span>{selectedModule ? selectedModule.title : 'Tất Cả Học Phần'}</span>
            {selectedTopic && <span>• {selectedTopic.title}</span>}
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 mt-1">
            Luyện Tập & Chữa Đề Trực Tiếp
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Chọn đáp án, kiểm tra ngay tại chỗ và xem giải thích căn cứ pháp lý
          </p>
        </div>

        {/* Buttons: Synchronized H-11 */}
        <div className="flex items-center space-x-3 flex-wrap">
          <button
            onClick={() => onLaunchZoom(questions, 0)}
            disabled={questions.length === 0}
            className="h-11 flex items-center space-x-2 px-5 bg-linear-to-r from-sky-600 to-indigo-600 hover:from-sky-500 hover:to-indigo-500 disabled:opacity-50 text-white rounded-xl text-xs sm:text-sm font-bold shadow-md shadow-sky-600/25 transition-all hover:scale-[1.02] cursor-pointer"
          >
            <MonitorPlay className="w-4 h-4" />
            <span>Chiếu Zoom danh sách này ({questions.length})</span>
          </button>

          {scoreStats.totalDone > 0 && (
            <div className="h-11 flex items-center space-x-2 px-4 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-xl text-xs font-bold">
              <Award className="w-4 h-4 text-emerald-600" />
              <span>Đúng: {scoreStats.correct}/{scoreStats.totalDone} ({Math.round((scoreStats.correct / scoreStats.totalDone) * 100)}%)</span>
            </div>
          )}
        </div>
      </div>

      {/* 2. Filter Bar: Search & Type Filter - Synchronized Height */}
      <div className="bg-white p-3.5 rounded-2xl border border-slate-200/90 shadow-xs flex flex-wrap items-center justify-between gap-3">
        {/* Search Input: H-11 */}
        <div className="relative flex-1 min-w-[260px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchKeyword}
            onChange={(e) => setSearchKeyword(e.target.value)}
            placeholder="Tìm kiếm nội dung câu hỏi, mã ID, từ khóa..."
            className="w-full h-11 pl-10 pr-4 text-xs sm:text-sm rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-sky-500 focus:border-sky-500 bg-slate-50 text-slate-900"
          />
        </div>

        {/* Type Tabs: H-11 */}
        <div className="flex items-center space-x-1 bg-slate-100 p-1 rounded-xl text-xs font-bold h-11">
          <button
            onClick={() => setFilterType('all')}
            className={`h-9 px-3.5 rounded-lg transition-colors cursor-pointer flex items-center ${
              filterType === 'all' ? 'bg-white text-sky-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Tất cả ({questions.length})
          </button>
          <button
            onClick={() => setFilterType('mcq')}
            className={`h-9 px-3.5 rounded-lg transition-colors cursor-pointer flex items-center ${
              filterType === 'mcq' ? 'bg-white text-sky-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Trắc nghiệm
          </button>
          <button
            onClick={() => setFilterType('true_false')}
            className={`h-9 px-3.5 rounded-lg transition-colors cursor-pointer flex items-center ${
              filterType === 'true_false' ? 'bg-white text-sky-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Đúng / Sai
          </button>
          <button
            onClick={() => setFilterType('oral')}
            className={`h-9 px-3.5 rounded-lg transition-colors cursor-pointer flex items-center ${
              filterType === 'oral' ? 'bg-white text-sky-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Vấn đáp
          </button>
        </div>
      </div>

      {/* 3. Questions List Cards */}
      {loading ? (
        <div className="p-16 text-center text-slate-400 bg-white rounded-2xl border border-slate-200">
          <div className="w-8 h-8 border-4 border-sky-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm font-semibold">Đang tải bộ câu hỏi từ cơ sở dữ liệu...</p>
        </div>
      ) : questions.length === 0 ? (
        <div className="p-16 text-center text-slate-500 bg-white rounded-2xl border border-slate-200">
          <HelpCircle className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-base font-bold text-slate-700">Không tìm thấy câu hỏi phù hợp</p>
          <p className="text-xs text-slate-400 mt-1">Hãy thử xóa bộ lọc hoặc chọn đề mục khác trong danh mục bên trái.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {questions.map((q, idx) => {
            const isRevealed = revealedAnswers[q.id];
            const isExplRevealed = revealedExplanations[q.id];
            const selectedOpt = userAnswers[q.id];
            const isTrueFalse = q.question_type === 'true_false';
            const isOral = q.question_type === 'oral';

            const options = isTrueFalse
              ? [{ key: 'Đúng', text: 'Đúng (Nhận định chính xác)' }, { key: 'Sai', text: 'Sai (Nhận định không chính xác)' }]
              : [
                  { key: 'A', text: q.option_a },
                  { key: 'B', text: q.option_b },
                  { key: 'C', text: q.option_c },
                  { key: 'D', text: q.option_d },
                ].filter(opt => opt.text);

            return (
              <div 
                key={q.id}
                className="bg-white rounded-2xl border border-slate-200 shadow-xs hover:shadow-md transition-shadow p-5 sm:p-6"
              >
                {/* Question Top Info */}
                <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                  <div className="flex items-center space-x-2">
                    <span className="w-8 h-8 rounded-xl bg-sky-100 text-sky-800 font-black text-xs flex items-center justify-center">
                      {idx + 1}
                    </span>
                    <span className="text-xs font-bold text-slate-500 px-2.5 py-1 bg-slate-100 rounded-lg font-mono">
                      {q.code}
                    </span>
                    {q.target_role && (
                      <span className="text-xs font-bold text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-lg border border-indigo-200">
                        {q.target_role}
                      </span>
                    )}
                    {q.bloom_level && (
                      <span className="text-xs text-slate-500">
                        Bậc: {q.bloom_level}
                      </span>
                    )}
                  </div>

                  {/* Launch Zoom Directly from this Question */}
                  <button
                    onClick={() => onLaunchZoom(questions, idx)}
                    className="h-9 flex items-center space-x-1.5 text-xs font-bold text-sky-700 hover:text-sky-900 hover:bg-sky-50 px-3 rounded-xl transition-colors cursor-pointer border border-sky-200"
                    title="Chiếu ngay câu này lên màn hình Zoom"
                  >
                    <MonitorPlay className="w-4 h-4" />
                    <span>Chiếu Zoom</span>
                  </button>
                </div>

                {/* Stem */}
                <h3 className="text-base sm:text-lg font-bold text-slate-900 mb-4 leading-snug">
                  {q.stem}
                </h3>

                {/* Options: Specialized True/False vs MCQ */}
                {!isOral ? (
                  isTrueFalse ? (
                    <div className="max-w-sm mx-auto w-full grid grid-cols-2 gap-3.5 my-3">
                      {/* Button ĐÚNG */}
                      {(() => {
                        const isSelected = selectedOpt === 'Đúng';
                        const isCorrect = String(q.correct_answer || '').trim().toLowerCase() === 'đúng';
                        let btnClass = 'bg-slate-50 border-slate-300 text-slate-800 hover:bg-slate-100';
                        if (isRevealed) {
                          if (isCorrect) {
                            btnClass = 'bg-emerald-50 border-emerald-500 text-emerald-950 ring-2 ring-emerald-400 font-black shadow-xs';
                          } else if (isSelected) {
                            btnClass = 'bg-rose-50 border-rose-500 text-rose-950 ring-2 ring-rose-400 font-bold';
                          }
                        } else if (isSelected) {
                          btnClass = 'bg-sky-50 border-sky-500 text-sky-950 ring-2 ring-sky-400 font-bold';
                        }

                        return (
                          <button
                            type="button"
                            onClick={() => handleSelectOption(q.id, 'Đúng')}
                            className={`h-13 px-4 rounded-xl border-2 flex items-center justify-center space-x-2 text-sm sm:text-base font-extrabold transition-all cursor-pointer ${btnClass}`}
                          >
                            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                            <span>ĐÚNG</span>
                          </button>
                        );
                      })()}

                      {/* Button SAI */}
                      {(() => {
                        const isSelected = selectedOpt === 'Sai';
                        const isCorrect = String(q.correct_answer || '').trim().toLowerCase() === 'sai';
                        let btnClass = 'bg-slate-50 border-slate-300 text-slate-800 hover:bg-slate-100';
                        if (isRevealed) {
                          if (isCorrect) {
                            btnClass = 'bg-emerald-50 border-emerald-500 text-emerald-950 ring-2 ring-emerald-400 font-black shadow-xs';
                          } else if (isSelected) {
                            btnClass = 'bg-rose-50 border-rose-500 text-rose-950 ring-2 ring-rose-400 font-bold';
                          }
                        } else if (isSelected) {
                          btnClass = 'bg-sky-50 border-sky-500 text-sky-950 ring-2 ring-sky-400 font-bold';
                        }

                        return (
                          <button
                            type="button"
                            onClick={() => handleSelectOption(q.id, 'Sai')}
                            className={`h-13 px-4 rounded-xl border-2 flex items-center justify-center space-x-2 text-sm sm:text-base font-extrabold transition-all cursor-pointer ${btnClass}`}
                          >
                            <XCircle className="w-5 h-5 text-rose-600 shrink-0" />
                            <span>SAI</span>
                          </button>
                        );
                      })()}
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                      {options.map((opt) => {
                        const isSelected = selectedOpt === opt.key;
                        const isCorrect = String(q.correct_answer || '').trim().toLowerCase() === opt.key.toLowerCase() ||
                                          (opt.key === 'A' && String(q.correct_answer).startsWith('A')) ||
                                          (opt.key === 'B' && String(q.correct_answer).startsWith('B')) ||
                                          (opt.key === 'C' && String(q.correct_answer).startsWith('C')) ||
                                          (opt.key === 'D' && String(q.correct_answer).startsWith('D'));

                        let btnStyle = 'bg-slate-50/80 border-slate-200 text-slate-700 hover:bg-slate-100';
                        let keyBadgeStyle = 'bg-white text-slate-700 border-slate-300';

                        if (isRevealed) {
                          if (isCorrect) {
                            btnStyle = 'bg-emerald-50 border-emerald-400 text-emerald-900 font-bold ring-2 ring-emerald-400/40';
                            keyBadgeStyle = 'bg-emerald-600 text-white border-emerald-500 font-black';
                          } else if (isSelected) {
                            btnStyle = 'bg-rose-50 border-rose-400 text-rose-900 ring-2 ring-rose-400/40';
                            keyBadgeStyle = 'bg-rose-600 text-white border-rose-500 font-bold';
                          }
                        } else if (isSelected) {
                          btnStyle = 'bg-sky-50 border-sky-400 text-sky-900 ring-2 ring-sky-400/40';
                          keyBadgeStyle = 'bg-sky-600 text-white border-sky-500 font-bold';
                        }

                        return (
                          <div
                            key={opt.key}
                            onClick={() => handleSelectOption(q.id, opt.key)}
                            className={`flex items-center space-x-3 p-3.5 rounded-xl border transition-all cursor-pointer min-h-[58px] ${btnStyle}`}
                          >
                            <span className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-black shrink-0 border ${keyBadgeStyle}`}>
                              {opt.key}
                            </span>
                            <span className="text-sm font-medium leading-snug flex-1">
                              {opt.text}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  )
                ) : (

                  <div className="p-4 bg-amber-50/70 border border-amber-200 rounded-xl mb-4 text-xs sm:text-sm">
                    <strong className="text-amber-800 block mb-1">Đáp án & Hướng dẫn trả lời mẫu:</strong>
                    <p className="text-slate-800 leading-relaxed">{q.correct_answer}</p>
                    {q.passing_criteria && (
                      <div className="mt-2 text-xs text-slate-600">
                        <strong>Tiêu chí đạt:</strong> {q.passing_criteria}
                      </div>
                    )}
                  </div>
                )}

                {/* Question Actions: Synchronized H-10 */}
                <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100">
                  <div className="flex items-center space-x-2">
                    {!isOral && (
                      <button
                        onClick={() => handleCheckAnswer(q)}
                        className="h-10 flex items-center space-x-1.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs transition-all cursor-pointer"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Kiểm tra đáp án</span>
                      </button>
                    )}

                    <button
                      onClick={() => toggleExplanation(q.id)}
                      className="h-10 flex items-center space-x-1.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all cursor-pointer"
                    >
                      <Lightbulb className="w-4 h-4 text-amber-500" />
                      <span>{isExplRevealed ? 'Ẩn giải thích' : 'Xem giải thích'}</span>
                    </button>
                  </div>

                  {canEditExplanation && (
                    <button
                      onClick={() => setEditingQuestion(q)}
                      className="h-10 flex items-center space-x-1.5 px-4 text-xs font-bold text-sky-700 hover:bg-sky-50 rounded-xl border border-sky-200 transition-colors cursor-pointer"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>Sửa giải thích</span>
                    </button>
                  )}
                </div>

                {/* Explanation Content Box */}
                {isExplRevealed && (
                  <div className="mt-3 p-4.5 bg-linear-to-r from-amber-50/90 to-amber-100/50 border border-amber-300 rounded-xl text-sm animate-in fade-in duration-150">
                    <div className="flex items-center space-x-1.5 text-amber-800 font-bold text-xs uppercase tracking-wide mb-1.5">
                      <Lightbulb className="w-4 h-4" />
                      <span>Căn cứ pháp lý & Lời giải thích:</span>
                    </div>
                    <p className="text-slate-800 leading-relaxed whitespace-pre-line text-xs sm:text-sm">
                      {q.explanation || 'Chưa có giải thích chi tiết. Giảng viên có thể bấm "Sửa giải thích" để cập nhật.'}
                    </p>
                    {q.updated_by_name && (
                      <div className="mt-2 text-[11px] text-amber-700 italic">
                        Cập nhật bởi: {q.updated_by_name} ({new Date(q.updated_at).toLocaleDateString('vi-VN')})
                      </div>
                    )}
                  </div>
                )}

              </div>
            );
          })}
        </div>
      )}

      {/* Teacher Explanation Modal */}
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
