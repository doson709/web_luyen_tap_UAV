import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import {
  CheckCircle2, XCircle, Award, HelpCircle, RotateCcw, Target, BookOpen, BarChart3, CheckCheck,
  Eye, EyeOff, Check, AlertCircle, Filter, Sparkles
} from 'lucide-react';

export default function PracticeView({
  selectedModule,
  selectedTopic,
  selectedCategory,
  mode = 'practice' // 'practice' (Trắc nghiệm - 600 câu) | 'oral' (Vấn đáp - 49 câu)
}) {
  const isOralMode = mode === 'oral';

  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);

  const [userAnswers, setUserAnswers] = useState({});
  const [revealedAnswers, setRevealedAnswers] = useState({});
  const [userAnswersMap, setUserAnswersMap] = useState({});
  const [showOralAnswers, setShowOralAnswers] = useState({});

  // Filter wrong questions state
  const [filterWrongOnly, setFilterWrongOnly] = useState(false);
  const [showResetConfirmModal, setShowResetConfirmModal] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);

  const [progress, setProgress] = useState({
    answered: 0,
    correct: 0,
    total: isOralMode ? 49 : 600,
    scoped: {
      answered: 0,
      correct: 0,
      total: 0,
      name: isOralMode ? 'Tất cả câu hỏi Vấn đáp (49 câu)' : 'Tất cả học phần Trắc nghiệm (600 câu)',
      isFiltered: false
    }
  });

  const loadProgressData = useCallback(async () => {
    try {
      const params = {
        filterType: isOralMode ? 'oral' : 'mcq'
      };
      if (selectedModule) params.moduleId = selectedModule.id;
      if (selectedTopic) params.topicId = selectedTopic.id;

      const res = await api.practice.getProgress(params);
      if (res.success && res.data) {
        setProgress(res.data);
        if (res.data.userAnswersMap) {
          setUserAnswersMap(res.data.userAnswersMap);
        }
      }
    } catch (err) {
      console.error('Failed to load progress:', err);
    }
  }, [selectedModule, selectedTopic, isOralMode]);

  // Reset wrong-filter when switching sections
  useEffect(() => {
    setFilterWrongOnly(false);
  }, [selectedModule, selectedTopic, mode]);

  useEffect(() => {
    async function loadQuestions() {
      setLoading(true);
      try {
        const params = {
          type: isOralMode ? 'oral' : 'mcq'
        };
        if (selectedModule) params.moduleId = selectedModule.id;
        if (selectedTopic) params.topicId = selectedTopic.id;

        const res = await api.questions.list(params);
        if (res.success) {
          setQuestions(res.data);
          setUserAnswers({});
          setRevealedAnswers({});
        }
      } catch (err) {
        console.error('Failed to load questions:', err);
      } finally {
        setLoading(false);
      }
    }
    loadQuestions();
    loadProgressData();
  }, [selectedModule, selectedTopic, isOralMode, loadProgressData]);

  const handleSelectOption = (questionId, optionKey) => {
    if (revealedAnswers[questionId] || userAnswersMap[questionId]) return;
    setUserAnswers(prev => ({ ...prev, [questionId]: optionKey }));
  };

  const handleCheckAnswer = async (q) => {
    if (revealedAnswers[q.id]) return;
    const userAns = userAnswers[q.id];
    const isCorrect = Boolean(userAns && (
      String(userAns).trim().toLowerCase() === String(q.correct_answer).trim().toLowerCase() ||
      (userAns === 'A' && String(q.correct_answer).startsWith('A')) ||
      (userAns === 'B' && String(q.correct_answer).startsWith('B')) ||
      (userAns === 'C' && String(q.correct_answer).startsWith('C')) ||
      (userAns === 'D' && String(q.correct_answer).startsWith('D'))
    ));

    setRevealedAnswers(prev => ({ ...prev, [q.id]: true }));
    setUserAnswersMap(prev => ({ ...prev, [q.id]: { isCorrect, selectedAnswer: userAns } }));

    try {
      const payload = {
        questionId: q.id,
        isCorrect,
        selectedAnswer: userAns,
        moduleId: selectedModule?.id,
        topicId: selectedTopic?.id,
        filterType: isOralMode ? 'oral' : 'mcq'
      };
      const res = await api.practice.recordAnswer(payload);
      if (res.success && res.data) {
        setProgress(res.data);
        if (res.data.userAnswersMap) {
          setUserAnswersMap(res.data.userAnswersMap);
        }
      }
    } catch (err) {
      console.error('Failed to record answer:', err);
    }
  };

  // Mark oral question as reviewed/mastered
  const handleMarkOralReviewed = async (q) => {
    const isAlreadyDone = userAnswersMap[q.id] !== undefined;
    if (isAlreadyDone) {
      await handleResetQuestion(q.id);
      return;
    }

    setUserAnswersMap(prev => ({ ...prev, [q.id]: { isCorrect: true, selectedAnswer: 'Đã ôn tập' } }));

    try {
      const payload = {
        questionId: q.id,
        isCorrect: true,
        selectedAnswer: 'Đã ôn tập',
        moduleId: selectedModule?.id,
        topicId: selectedTopic?.id,
        filterType: 'oral'
      };
      const res = await api.practice.recordAnswer(payload);
      if (res.success && res.data) {
        setProgress(res.data);
        if (res.data.userAnswersMap) {
          setUserAnswersMap(res.data.userAnswersMap);
        }
      }
    } catch (err) {
      console.error('Failed to record oral progress:', err);
    }
  };

  const handleResetQuestion = async (qId) => {
    setUserAnswers(prev => { const next = { ...prev }; delete next[qId]; return next; });
    setRevealedAnswers(prev => { const next = { ...prev }; delete next[qId]; return next; });
    setUserAnswersMap(prev => { const next = { ...prev }; delete next[qId]; return next; });

    try {
      const params = {
        filterType: isOralMode ? 'oral' : 'mcq'
      };
      if (selectedModule) params.moduleId = selectedModule.id;
      if (selectedTopic) params.topicId = selectedTopic.id;

      const res = await api.practice.deleteAnswer(qId, params);
      if (res.success && res.data) {
        setProgress(res.data);
        if (res.data.userAnswersMap) {
          setUserAnswersMap(res.data.userAnswersMap);
        }
      }
    } catch (err) {
      console.error('Failed to reset answer:', err);
    }
  };

  // Reset ALL questions in the current selected scope (sidebar item)
  const handleResetAllInScope = async () => {
    setResetting(true);
    try {
      const payload = {
        moduleId: selectedModule?.id,
        topicId: selectedTopic?.id,
        filterType: isOralMode ? 'oral' : 'mcq'
      };
      const res = await api.practice.resetScope(payload);
      if (res.success && res.data) {
        setProgress(res.data);
        if (res.data.userAnswersMap) {
          setUserAnswersMap(res.data.userAnswersMap);
        }
      }

      // Clear local states
      setUserAnswers({});
      setRevealedAnswers({});
      setFilterWrongOnly(false);
      setShowResetConfirmModal(false);

      setToastMessage({
        type: 'success',
        text: `Đã xóa lưu câu trả lời và làm mới toàn bộ câu hỏi trong "${currentSectionName}"!`
      });
      setTimeout(() => setToastMessage(null), 4000);
    } catch (err) {
      console.error('Failed to reset scope:', err);
      setToastMessage({
        type: 'error',
        text: err.message || 'Không thể làm lại tất cả câu hỏi trong mục này.'
      });
      setTimeout(() => setToastMessage(null), 4000);
    } finally {
      setResetting(false);
    }
  };

  // Scoped calculation metrics evaluated strictly for the active questions list
  const scopedTotal = questions.length || progress.scoped?.total || 0;
  const scopedAnswered = questions.length > 0
    ? questions.filter(q => userAnswersMap[q.id] !== undefined || revealedAnswers[q.id]).length
    : (progress.scoped?.answered || 0);

  const scopedCorrect = questions.length > 0
    ? questions.filter(q => {
        if (userAnswersMap[q.id] !== undefined) return Boolean(userAnswersMap[q.id].isCorrect);
        if (revealedAnswers[q.id]) {
          const userAns = userAnswers[q.id];
          return Boolean(userAns && (
            String(userAns).trim().toLowerCase() === String(q.correct_answer).trim().toLowerCase() ||
            (userAns === 'A' && String(q.correct_answer).startsWith('A')) ||
            (userAns === 'B' && String(q.correct_answer).startsWith('B')) ||
            (userAns === 'C' && String(q.correct_answer).startsWith('C')) ||
            (userAns === 'D' && String(q.correct_answer).startsWith('D'))
          ));
        }
        return false;
      }).length
    : (progress.scoped?.correct || 0);

  const scopedPctDone = scopedTotal > 0 ? Math.round((scopedAnswered / scopedTotal) * 100) : 0;
  const scopedPctAccuracy = scopedAnswered > 0 ? Math.round((scopedCorrect / scopedAnswered) * 100) : 0;

  // Filter wrong questions strictly in current scope
  const wrongQuestionsInScope = questions.filter(q => {
    if (isOralMode) return false;
    const userAnsObj = userAnswersMap[q.id];
    if (userAnsObj !== undefined) {
      return !userAnsObj.isCorrect;
    }
    if (revealedAnswers[q.id]) {
      const userAns = userAnswers[q.id];
      const isCorrect = Boolean(userAns && (
        String(userAns).trim().toLowerCase() === String(q.correct_answer).trim().toLowerCase() ||
        (userAns === 'A' && String(q.correct_answer).startsWith('A')) ||
        (userAns === 'B' && String(q.correct_answer).startsWith('B')) ||
        (userAns === 'C' && String(q.correct_answer).startsWith('C')) ||
        (userAns === 'D' && String(q.correct_answer).startsWith('D'))
      ));
      return !isCorrect;
    }
    return false;
  });

  const wrongCount = wrongQuestionsInScope.length;

  const handleToggleFilterWrong = () => {
    if (!filterWrongOnly && wrongCount === 0) {
      setToastMessage({
        type: 'info',
        text: 'Tuyệt vời! Mục đang chọn hiện không có câu hỏi nào bị làm sai.'
      });
      setTimeout(() => setToastMessage(null), 3500);
      return;
    }
    setFilterWrongOnly(prev => !prev);
  };

  // List of questions to display (all or only wrong)
  const displayedQuestions = filterWrongOnly ? wrongQuestionsInScope : questions;

  // Overall metrics
  const overallTotal = isOralMode ? (progress.total || 49) : (progress.total || 600);
  const overallAnswered = progress.answered || 0;
  const overallCorrect = progress.correct || 0;
  const overallPctDone = overallTotal > 0 ? Math.round((overallAnswered / overallTotal) * 100) : 0;

  const currentSectionName = selectedTopic?.title
    ? selectedTopic.title
    : selectedModule?.title
    ? selectedModule.title
    : isOralMode
    ? 'Tất cả câu hỏi Vấn đáp (49 câu)'
    : 'Tất cả học phần Trắc nghiệm (600 câu)';

  return (
    <div className="w-full space-y-3">
      
      {/* Toast Notification */}
      {toastMessage && (
        <div className={`fixed top-20 right-6 z-50 px-4 py-3 rounded-xl shadow-lg border text-sm font-bold flex items-center space-x-2 transition-all animate-in fade-in slide-in-from-top-4 ${
          toastMessage.type === 'success'
            ? 'bg-emerald-50 text-emerald-900 border-emerald-300'
            : toastMessage.type === 'error'
            ? 'bg-rose-50 text-rose-900 border-rose-300'
            : 'bg-sky-50 text-sky-900 border-sky-300'
        }`}>
          {toastMessage.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          ) : toastMessage.type === 'error' ? (
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
          ) : (
            <Sparkles className="w-5 h-5 text-sky-600 shrink-0" />
          )}
          <span>{toastMessage.text}</span>
        </div>
      )}

      {/* 1. Compact Progress Statistics Banner (Sticky Pinned to Top) */}
      <div className="sticky top-[4.25rem] z-20 bg-white/95 backdrop-blur-md border border-slate-200/90 rounded-xl p-2.5 sm:p-3 shadow-xs">
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
          
          {/* Card 1: Thống kê mục / học phần đang chọn */}
          <div className={`p-2.5 sm:p-3 rounded-lg border shadow-2xs flex flex-col justify-between ${
            isOralMode
              ? 'bg-gradient-to-br from-amber-50/90 to-orange-50/70 border-amber-200/80'
              : 'bg-gradient-to-br from-sky-50/90 to-indigo-50/70 border-sky-200/80'
          }`}>
            <div className="flex items-center justify-between gap-2 mb-1.5">
              <div className="flex items-center space-x-1.5 truncate">
                <div className={`w-6 h-6 rounded-md text-white flex items-center justify-center shrink-0 shadow-xs ${
                  isOralMode ? 'bg-amber-600' : 'bg-sky-600'
                }`}>
                  <Target className="w-3.5 h-3.5" />
                </div>
                <div className="truncate">
                  <span className={`text-[9px] font-extrabold uppercase tracking-wider block ${
                    isOralMode ? 'text-amber-700' : 'text-sky-700'
                  }`}>
                    {isOralMode ? 'Tiến độ chuyên đề vấn đáp:' : 'Tiến độ mục đang chọn:'}
                  </span>
                  <span className="text-xs font-bold text-slate-900 truncate block" title={currentSectionName}>
                    {currentSectionName}
                  </span>
                </div>
              </div>
              <span className={`text-[11px] font-black px-1.5 py-0.2 rounded-md text-white shrink-0 ${
                isOralMode ? 'bg-amber-600' : 'bg-sky-600'
              }`}>
                {scopedPctDone}%
              </span>
            </div>

            {/* Metrics */}
            <div className={`grid grid-cols-2 gap-1.5 mt-1 pt-1.5 border-t text-[11px] ${
              isOralMode ? 'border-amber-200/60' : 'border-sky-200/60'
            }`}>
              <div className="flex items-center space-x-1">
                <CheckCheck className={`w-3.5 h-3.5 shrink-0 ${isOralMode ? 'text-amber-600' : 'text-sky-600'}`} />
                <span>
                  {isOralMode ? 'Đã ôn: ' : 'Đã làm: '}
                  <strong className="text-slate-900 font-extrabold">{scopedAnswered}</strong> / {scopedTotal}
                </span>
              </div>
              <div className="flex items-center space-x-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>
                  {isOralMode ? 'Đạt: ' : 'Đúng: '}
                  <strong className="text-emerald-700 font-extrabold">{scopedCorrect}</strong>
                  {scopedAnswered > 0 && !isOralMode && <span className="text-[10px] text-emerald-600 font-bold ml-1">({scopedPctAccuracy}%)</span>}
                </span>
              </div>
            </div>

            {/* Mini Progress Bar */}
            <div className={`w-full h-1 rounded-full overflow-hidden mt-1.5 ${
              isOralMode ? 'bg-amber-200/60' : 'bg-sky-200/60'
            }`}>
              <div
                className={`h-full rounded-full transition-all duration-300 ${
                  isOralMode ? 'bg-gradient-to-r from-amber-500 to-orange-600' : 'bg-gradient-to-r from-sky-500 to-indigo-600'
                }`}
                style={{ width: `${scopedPctDone}%` }}
              />
            </div>
          </div>

          {/* Card 2: Thống kê tổng quan */}
          <div className="p-2.5 sm:p-3 rounded-lg bg-slate-50 border border-slate-200 shadow-2xs flex flex-col justify-between">
            <div className="flex items-center justify-between gap-2 mb-1.5">
              <div className="flex items-center space-x-1.5">
                <div className="w-6 h-6 rounded-md bg-slate-800 text-white flex items-center justify-center shrink-0 shadow-xs">
                  <Award className="w-3.5 h-3.5 text-amber-300" />
                </div>
                <div>
                  <span className="text-[9px] font-extrabold uppercase tracking-wider text-slate-500 block">
                    {isOralMode ? 'Tổng tích lũy 49 câu vấn đáp:' : 'Tổng tích lũy 600 câu trắc nghiệm:'}
                  </span>
                  <span className="text-xs font-bold text-slate-800 block">
                    {isOralMode ? 'Toàn bộ 49 câu vấn đáp UAV' : 'Toàn bộ 600 câu trắc nghiệm UAV'}
                  </span>
                </div>
              </div>
              <span className="text-[11px] font-black px-1.5 py-0.2 rounded-md bg-slate-700 text-slate-100 shrink-0">
                {overallPctDone}%
              </span>
            </div>

            {/* Metrics */}
            <div className="grid grid-cols-2 gap-1.5 mt-1 pt-1.5 border-t border-slate-200 text-[11px]">
              <div className="flex items-center space-x-1">
                <CheckCheck className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                <span>
                  {isOralMode ? 'Đã ôn: ' : 'Đã làm: '}
                  <strong className="text-slate-900 font-extrabold">{overallAnswered}</strong> / {overallTotal}
                </span>
              </div>
              <div className="flex items-center space-x-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>
                  {isOralMode ? 'Đạt: ' : 'Đúng: '}
                  <strong className="text-emerald-700 font-extrabold">{overallCorrect}</strong>
                  {overallAnswered > 0 && !isOralMode && <span className="text-[10px] text-emerald-600 font-bold ml-1">({Math.round((overallCorrect / overallAnswered) * 100)}%)</span>}
                </span>
              </div>
            </div>

            {/* Mini Progress Bar */}
            <div className="w-full h-1 bg-slate-200 rounded-full overflow-hidden mt-1.5">
              <div
                className="h-full bg-slate-700 rounded-full transition-all duration-300"
                style={{ width: `${overallPctDone}%` }}
              />
            </div>
          </div>

        </div>

        {/* Action Toolbar: "Làm lại câu sai" & "Làm lại tất cả" strictly scoped to current selection */}
        <div className="flex flex-wrap items-center justify-between gap-2 mt-2 pt-2 border-t border-slate-200/80">
          
          <div className="flex items-center space-x-2">
            <span className="text-xs font-bold text-slate-600">Thao tác mục đang chọn:</span>
            {filterWrongOnly && (
              <span className="px-2 py-0.5 rounded-md bg-rose-100 text-rose-800 text-[11px] font-bold border border-rose-300 flex items-center space-x-1">
                <span>Đang lọc {wrongCount} câu sai</span>
              </span>
            )}
          </div>

          <div className="flex items-center space-x-2">
            
            {/* Nút 1: Làm lại câu sai */}
            {!isOralMode && (
              <button
                type="button"
                onClick={handleToggleFilterWrong}
                className={`h-8 sm:h-8.5 px-3 rounded-lg text-xs font-bold flex items-center space-x-1.5 transition-all cursor-pointer shadow-xs active:scale-95 ${
                  filterWrongOnly
                    ? 'bg-rose-600 text-white hover:bg-rose-700 ring-2 ring-rose-300'
                    : wrongCount > 0
                    ? 'bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200'
                    : 'bg-slate-100 text-slate-400 border border-slate-200'
                }`}
                title={wrongCount === 0 ? 'Mục này hiện không có câu sai' : 'Chỉ hiển thị các câu đã trả lời sai trong mục'}
              >
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{filterWrongOnly ? 'Xem tất cả câu hỏi' : 'Làm lại câu sai'}</span>
                <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-extrabold ${
                  filterWrongOnly ? 'bg-white text-rose-700' : 'bg-rose-200 text-rose-800'
                }`}>
                  {wrongCount}
                </span>
              </button>
            )}

            {/* Nút 2: Làm lại tất cả */}
            <button
              type="button"
              onClick={() => setShowResetConfirmModal(true)}
              className="h-8 sm:h-8.5 px-3 rounded-lg text-xs font-bold flex items-center space-x-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 transition-all cursor-pointer shadow-xs active:scale-95"
              title="Xóa kết quả đã làm và làm lại tất cả câu trong mục đang chọn"
            >
              <RotateCcw className="w-3.5 h-3.5 shrink-0 text-slate-600" />
              <span>Làm lại tất cả</span>
            </button>

          </div>
        </div>

      </div>

      {/* 2. Questions List Cards (Reduced 30% height for dense, comfortable overview) */}
      {loading ? (
        <div className="p-12 text-center text-slate-400 bg-white rounded-xl border border-slate-200">
          <div className="w-7 h-7 border-3 border-sky-500 border-t-transparent rounded-full animate-spin mx-auto mb-2.5" />
          <p className="text-xs font-semibold">Đang tải bộ câu hỏi từ cơ sở dữ liệu...</p>
        </div>
      ) : displayedQuestions.length === 0 ? (
        filterWrongOnly ? (
          <div className="p-10 text-center bg-white rounded-xl border border-emerald-200 shadow-xs space-y-3">
            <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-7 h-7" />
            </div>
            <div>
              <h4 className="text-sm font-black text-slate-900">Không có câu hỏi nào bị sai trong mục này!</h4>
              <p className="text-xs text-slate-500 mt-1">Bạn đã hoàn thành chính xác tất cả các câu hỏi đã làm trong mục này.</p>
            </div>
            <button
              type="button"
              onClick={() => setFilterWrongOnly(false)}
              className="px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-lg text-xs font-bold transition-all shadow-xs cursor-pointer"
            >
              Quay lại xem tất cả câu hỏi
            </button>
          </div>
        ) : (
          <div className="p-12 text-center text-slate-500 bg-white rounded-xl border border-slate-200">
            <HelpCircle className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <p className="text-sm font-bold text-slate-700">Không tìm thấy câu hỏi phù hợp</p>
            <p className="text-xs text-slate-400 mt-0.5">Hãy thử chọn đề mục khác trong danh mục bên trái.</p>
          </div>
        )
      ) : (
        <div className="space-y-2.5">
          {displayedQuestions.map((q, idx) => {
            const hasAnsweredInMap = userAnswersMap[q.id] !== undefined;
            const isRevealed = revealedAnswers[q.id] || hasAnsweredInMap;
            const selectedOpt = userAnswers[q.id] || userAnswersMap[q.id]?.selectedAnswer;
            const isTrueFalse = q.question_type === 'true_false';
            const isOral = q.question_type === 'oral';

            const isAnswerCorrect = isOral
              ? (hasAnsweredInMap ? Boolean(userAnswersMap[q.id]?.isCorrect) : false)
              : (selectedOpt && (
                  String(selectedOpt).trim().toLowerCase() === String(q.correct_answer).trim().toLowerCase() ||
                  (selectedOpt === 'A' && String(q.correct_answer).startsWith('A')) ||
                  (selectedOpt === 'B' && String(q.correct_answer).startsWith('B')) ||
                  (selectedOpt === 'C' && String(q.correct_answer).startsWith('C')) ||
                  (selectedOpt === 'D' && String(q.correct_answer).startsWith('D'))
                ));

            // Dynamic Card Background
            let cardBgClass = 'bg-white border-slate-200 shadow-xs hover:border-slate-300';
            if (isOral) {
              if (hasAnsweredInMap) {
                cardBgClass = 'bg-emerald-50/75 border-emerald-300 ring-1 ring-emerald-400/40 shadow-xs';
              }
            } else if (isRevealed) {
              if (isAnswerCorrect) {
                cardBgClass = 'bg-emerald-50/75 border-emerald-300 ring-1 ring-emerald-400/40 shadow-xs';
              } else {
                cardBgClass = 'bg-rose-50/75 border-rose-300 ring-1 ring-rose-400/40 shadow-xs';
              }
            }

            const options = isTrueFalse
              ? [{ key: 'Đúng', text: 'Đúng (Nhận định chính xác)' }, { key: 'Sai', text: 'Sai (Nhận định không chính xác)' }]
              : [
                  { key: 'A', text: q.option_a },
                  { key: 'B', text: q.option_b },
                  { key: 'C', text: q.option_c },
                  { key: 'D', text: q.option_d },
                ].filter(opt => opt.text);

            const isOralAnswerShown = Boolean(showOralAnswers[q.id]);

            return (
              <div 
                key={q.id}
                className={`rounded-xl border transition-all duration-200 p-3.5 sm:p-4 ${cardBgClass}`}
              >
                {/* Question Top Info & Status Badge (Compact) */}
                <div className="flex flex-wrap items-center justify-between gap-1.5 mb-2">
                  <div className="flex items-center space-x-1.5">
                    <span className={`w-6 h-6 rounded-md font-black text-[11px] flex items-center justify-center transition-colors ${
                      isOral
                        ? (hasAnsweredInMap ? 'bg-emerald-600 text-white shadow-xs' : 'bg-amber-100 text-amber-900')
                        : isRevealed
                        ? isAnswerCorrect ? 'bg-emerald-600 text-white shadow-xs' : 'bg-rose-600 text-white shadow-xs'
                        : 'bg-sky-100 text-sky-800'
                    }`}>
                      {idx + 1}
                    </span>
                    <span className="text-[11px] font-bold text-slate-500 px-2 py-0.5 bg-slate-100/90 rounded-md font-mono">
                      {q.code}
                    </span>
                    {q.target_role && (
                      <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded-md border border-indigo-200">
                        {q.target_role}
                      </span>
                    )}
                    {q.bloom_level && (
                      <span className="text-[11px] text-slate-500 font-medium hidden sm:inline-block">
                        Bậc: {q.bloom_level}
                      </span>
                    )}
                  </div>

                  {/* Status Indicator Badge */}
                  <div>
                    {isOral ? (
                      hasAnsweredInMap ? (
                        <span className="px-2 py-0.5 rounded-lg bg-emerald-100 text-emerald-800 text-[10px] font-black border border-emerald-300 flex items-center space-x-1 shadow-2xs">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600 shrink-0" />
                          <span>ĐÃ ÔN TẬP ĐẠT</span>
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-lg bg-amber-50 text-amber-700 text-[10px] font-bold border border-amber-200 flex items-center space-x-1">
                          <span>Chưa ôn</span>
                        </span>
                      )
                    ) : isRevealed ? (
                      isAnswerCorrect ? (
                        <span className="px-2 py-0.5 rounded-lg bg-emerald-100 text-emerald-800 text-[10px] font-black border border-emerald-300 flex items-center space-x-1 shadow-2xs">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600 shrink-0" />
                          <span>ĐÃ LÀM (ĐÚNG)</span>
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-lg bg-rose-100 text-rose-800 text-[10px] font-black border border-rose-300 flex items-center space-x-1 shadow-2xs">
                          <XCircle className="w-3 h-3 text-rose-600 shrink-0" />
                          <span>ĐÃ LÀM (SAI)</span>
                        </span>
                      )
                    ) : (
                      <span className="px-2 py-0.5 rounded-lg bg-slate-100 text-slate-600 text-[10px] font-medium border border-slate-200">
                        Chưa làm
                      </span>
                    )}
                  </div>
                </div>

                {/* Question Stem (Reduced 30% padding and spacing) */}
                <div className="text-[13px] sm:text-sm font-semibold text-slate-900 leading-snug mb-2.5">
                  {q.stem}
                </div>

                {/* Content: Specialized for Oral vs MCQ */}
                {isOral ? (
                  <div className="space-y-2 my-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-amber-800 flex items-center space-x-1">
                        <BookOpen className="w-3.5 h-3.5 text-amber-600" />
                        <span>Nội dung gợi ý & Đáp án chuẩn:</span>
                      </span>
                      <button
                        type="button"
                        onClick={() => setShowOralAnswers(prev => ({ ...prev, [q.id]: !prev[q.id] }))}
                        className="text-xs font-bold text-amber-700 hover:text-amber-900 flex items-center space-x-1 bg-amber-100/80 px-2.5 py-1 rounded-md transition-colors cursor-pointer"
                      >
                        {isOralAnswerShown ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                        <span>{isOralAnswerShown ? 'Ẩn đáp án' : 'Xem đáp án gợi ý'}</span>
                      </button>
                    </div>

                    {isOralAnswerShown && (
                      <div className="p-3 bg-amber-50/80 border border-amber-200 rounded-lg text-xs leading-relaxed text-slate-800 animate-in fade-in duration-200">
                        <div className="font-bold text-amber-950 mb-1">Nội dung trả lời chuẩn:</div>
                        <div className="whitespace-pre-line text-slate-700 font-medium">
                          {q.correct_answer || q.explanation || 'Đang cập nhật nội dung chi tiết...'}
                        </div>
                      </div>
                    )}
                  </div>
                ) : isTrueFalse ? (
                  <div className="max-w-xs mx-auto w-full grid grid-cols-2 gap-2.5 my-2">
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
                          disabled={isRevealed}
                          onClick={() => handleSelectOption(q.id, 'Đúng')}
                          className={`h-9 sm:h-10 px-3 rounded-lg border-2 flex items-center justify-center space-x-1.5 text-xs sm:text-sm font-extrabold transition-all cursor-pointer disabled:cursor-not-allowed ${btnClass}`}
                        >
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
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
                          disabled={isRevealed}
                          onClick={() => handleSelectOption(q.id, 'Sai')}
                          className={`h-9 sm:h-10 px-3 rounded-lg border-2 flex items-center justify-center space-x-1.5 text-xs sm:text-sm font-extrabold transition-all cursor-pointer disabled:cursor-not-allowed ${btnClass}`}
                        >
                          <XCircle className="w-4 h-4 text-rose-600 shrink-0" />
                          <span>SAI</span>
                        </button>
                      );
                    })()}
                  </div>
                ) : (
                  /* Standard 4-Option MCQ (2-column on md+ screens to drastically reduce height) */
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-1.5 my-2">
                    {options.map((opt) => {
                      const isSelected = selectedOpt === opt.key;
                      const isCorrect = isRevealed && (
                        (opt.key === 'A' && String(q.correct_answer).startsWith('A')) ||
                        (opt.key === 'B' && String(q.correct_answer).startsWith('B')) ||
                        (opt.key === 'C' && String(q.correct_answer).startsWith('C')) ||
                        (opt.key === 'D' && String(q.correct_answer).startsWith('D'))
                      );

                      let btnStyle = 'bg-slate-50/80 border-slate-200 text-slate-700 hover:bg-slate-100';
                      let keyBadgeStyle = 'bg-white text-slate-700 border-slate-300';

                      if (isRevealed) {
                        if (isCorrect) {
                          btnStyle = 'bg-emerald-50 border-emerald-400 text-emerald-900 font-bold ring-1.5 ring-emerald-400/40';
                          keyBadgeStyle = 'bg-emerald-600 text-white border-emerald-500 font-black';
                        } else if (isSelected) {
                          btnStyle = 'bg-rose-50 border-rose-400 text-rose-900 ring-1.5 ring-rose-400/40';
                          keyBadgeStyle = 'bg-rose-600 text-white border-rose-500 font-bold';
                        }
                      } else if (isSelected) {
                        btnStyle = 'bg-sky-50 border-sky-400 text-sky-900 ring-1.5 ring-sky-400/40';
                        keyBadgeStyle = 'bg-sky-600 text-white border-sky-500 font-bold';
                      }

                      return (
                        <div
                          key={opt.key}
                          onClick={() => handleSelectOption(q.id, opt.key)}
                          className={`flex items-center space-x-2.5 py-2 px-3 rounded-lg border transition-all min-h-[42px] ${isRevealed ? 'cursor-not-allowed' : 'cursor-pointer'} ${btnStyle}`}
                        >
                          <span className={`w-6 h-6 rounded-md flex items-center justify-center text-[11px] font-black shrink-0 border ${keyBadgeStyle}`}>
                            {opt.key}
                          </span>
                          <span className="text-xs sm:text-[13px] font-medium leading-tight flex-1">
                            {opt.text}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Question Actions (Compact) */}
                <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-200/50">
                  <div className="flex items-center space-x-2">
                    {isOral ? (
                      <div className="flex items-center space-x-1.5">
                        <button
                          type="button"
                          onClick={() => handleMarkOralReviewed(q)}
                          className={`h-8 flex items-center space-x-1.5 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                            hasAnsweredInMap
                              ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs'
                              : 'bg-slate-100 hover:bg-emerald-50 text-slate-700 hover:text-emerald-700 border border-slate-200 hover:border-emerald-300'
                          }`}
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>{hasAnsweredInMap ? 'Đã hoàn thành ôn câu này' : 'Đánh dấu: Đã ôn câu này'}</span>
                        </button>

                        {hasAnsweredInMap && (
                          <button
                            onClick={() => handleResetQuestion(q.id)}
                            className="h-8 flex items-center space-x-1 px-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg text-xs font-semibold transition-all cursor-pointer"
                            title="Bỏ đánh dấu ôn lại"
                          >
                            <RotateCcw className="w-3 h-3" />
                            <span>Ôn lại</span>
                          </button>
                        )}
                      </div>
                    ) : (
                      <>
                        {!isRevealed && (
                          <button
                            onClick={() => handleCheckAnswer(q)}
                            className="h-8 sm:h-8.5 flex items-center space-x-1.5 px-3.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow-xs transition-all cursor-pointer active:scale-95"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Kiểm tra đáp án</span>
                          </button>
                        )}

                        {isRevealed && (
                          <button
                            onClick={() => handleResetQuestion(q.id)}
                            className="h-8 sm:h-8.5 flex items-center space-x-1.5 px-3.5 bg-sky-600 hover:bg-sky-700 text-white rounded-lg text-xs font-bold shadow-xs transition-all cursor-pointer active:scale-95"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                            <span>Làm lại</span>
                          </button>
                        )}
                      </>
                    )}
                  </div>

                  {/* Feedback summary */}
                  {isRevealed && !isOral && (
                    <div className="text-xs font-bold">
                      {isAnswerCorrect ? (
                        <span className="text-emerald-700">✓ Chính xác!</span>
                      ) : (
                        <span className="text-rose-700">
                          ✗ Chưa chính xác (Đáp án đúng: <strong className="font-extrabold">{q.correct_answer}</strong>)
                        </span>
                      )}
                    </div>
                  )}
                </div>

              </div>
            );
          })}
        </div>
      )}

      {/* 3. Modal Confirm: "Làm lại tất cả" */}
      {showResetConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95">
            <div className="w-12 h-12 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center mb-4 mx-auto">
              <RotateCcw className="w-6 h-6" />
            </div>
            
            <h3 className="text-lg font-black text-slate-900 text-center">
              Xác nhận làm lại tất cả?
            </h3>
            
            <p className="text-xs sm:text-sm text-slate-600 text-center mt-2 leading-relaxed">
              Bạn có chắc chắn muốn xóa toàn bộ lịch sử câu trả lời đã làm trong phần:
            </p>
            
            <div className="my-3 p-3 bg-slate-50 rounded-xl border border-slate-200 text-center">
              <span className="text-xs sm:text-sm font-extrabold text-sky-800">
                {currentSectionName}
              </span>
            </div>

            <p className="text-[11px] text-slate-400 text-center italic">
              * Lưu ý: Thao tác này chỉ làm mới các câu hỏi trong mục đang chọn, không làm ảnh hưởng đến các học phần khác.
            </p>

            <div className="flex items-center space-x-3 mt-5">
              <button
                type="button"
                disabled={resetting}
                onClick={() => setShowResetConfirmModal(false)}
                className="flex-1 py-2.5 px-4 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-100 text-xs font-bold transition-all cursor-pointer"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                disabled={resetting}
                onClick={handleResetAllInScope}
                className="flex-1 py-2.5 px-4 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-md shadow-rose-500/20 transition-all cursor-pointer flex items-center justify-center space-x-1.5"
              >
                {resetting ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <RotateCcw className="w-4 h-4" />
                    <span>Làm lại tất cả</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
