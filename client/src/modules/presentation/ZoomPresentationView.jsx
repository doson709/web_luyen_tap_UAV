import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { 
  X, ChevronLeft, ChevronRight, CheckCircle2, XCircle, 
  HelpCircle, Lightbulb, Edit3, Maximize, Minimize, 
  Grid, Eye, EyeOff, Sparkles, BookOpen, RotateCcw
} from 'lucide-react';
import ExplanationModal from '../questions/ExplanationModal';

export default function ZoomPresentationView({ 
  questions = [], 
  initialIndex = 0, 
  onClose,
  moduleTitle,
  topicTitle
}) {
  const { canEditExplanation } = useAuth();

  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [showAnswer, setShowAnswer] = useState(false);
  const [showExplanation, setShowExplanation] = useState(false);
  const [fontSizeLevel, setFontSizeLevel] = useState(1); // 0: Normal, 1: Large (Zoom default), 2: Extra Large
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showGridModal, setShowGridModal] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState(null);

  const [questionList, setQuestionList] = useState(questions);

  useEffect(() => {
    setQuestionList(questions);
    setCurrentIndex(initialIndex);
  }, [questions, initialIndex]);

  const currentQ = questionList[currentIndex] || null;

  const goToQuestion = useCallback((idx) => {
    if (idx >= 0 && idx < questionList.length) {
      setCurrentIndex(idx);
      setSelectedAnswer(null);
      setShowAnswer(false);
      setShowExplanation(false);
    }
  }, [questionList.length]);

  const handleNext = useCallback(() => {
    if (currentIndex < questionList.length - 1) {
      goToQuestion(currentIndex + 1);
    }
  }, [currentIndex, questionList.length, goToQuestion]);

  const handlePrev = useCallback(() => {
    if (currentIndex > 0) {
      goToQuestion(currentIndex - 1);
    }
  }, [currentIndex, goToQuestion]);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
    }
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (['INPUT', 'TEXTAREA'].includes(e.target.tagName)) return;

      if (e.key === 'ArrowRight' || e.key === ' ') {
        e.preventDefault();
        handleNext();
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        handlePrev();
      } else if (e.key === 'r' || e.key === 'R') {
        e.preventDefault();
        setShowAnswer(prev => !prev);
      } else if (e.key === 'e' || e.key === 'E') {
        e.preventDefault();
        setShowExplanation(prev => !prev);
      } else if (e.key === 'f' || e.key === 'F') {
        e.preventDefault();
        toggleFullscreen();
      } else if (e.key === 'Escape') {
        if (showGridModal) {
          setShowGridModal(false);
        } else if (!document.fullscreenElement) {
          onClose();
        }
      } else if (currentQ) {
        if (currentQ.question_type === 'true_false') {
          if (e.key === '1' || e.key === 't' || e.key === 'T') setSelectedAnswer('Đúng');
          if (e.key === '2' || e.key === 'f' || e.key === 'F') setSelectedAnswer('Sai');
        } else if (currentQ.question_type === 'mcq') {
          if (e.key === '1' || e.key === 'a' || e.key === 'A') setSelectedAnswer('A');
          if (e.key === '2' || e.key === 'b' || e.key === 'B') setSelectedAnswer('B');
          if (e.key === '3' || e.key === 'c' || e.key === 'C') setSelectedAnswer('C');
          if (e.key === '4' || e.key === 'd' || e.key === 'D') setSelectedAnswer('D');
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleNext, handlePrev, onClose, showGridModal, currentQ]);

  const handleExplanationSaved = (updatedQ) => {
    setQuestionList(prev => prev.map(q => q.id === updatedQ.id ? updatedQ : q));
    setShowExplanation(true);
  };

  if (!currentQ) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900 text-white p-6">
        <div className="text-center">
          <p className="text-lg">Không có câu hỏi nào để trình chiếu.</p>
          <button onClick={onClose} className="mt-4 h-11 px-6 bg-sky-600 rounded-xl font-bold">Đóng</button>
        </div>
      </div>
    );
  }

  const fontSizes = {
    0: { stem: 'text-xl sm:text-2xl', option: 'text-base sm:text-lg' },
    1: { stem: 'text-2xl sm:text-3xl lg:text-3.5xl', option: 'text-lg sm:text-xl lg:text-2xl' },
    2: { stem: 'text-3xl sm:text-4xl lg:text-5xl', option: 'text-xl sm:text-2xl lg:text-3xl' },
  }[fontSizeLevel];

  const isTrueFalse = currentQ.question_type === 'true_false';
  const isOral = currentQ.question_type === 'oral';

  const mcqOptions = [
    { key: 'A', text: currentQ.option_a },
    { key: 'B', text: currentQ.option_b },
    { key: 'C', text: currentQ.option_c },
    { key: 'D', text: currentQ.option_d },
  ].filter(opt => opt.text);

  const tfOptions = [
    { key: 'Đúng', text: 'Đúng (Nhận định chính xác theo quy chuẩn)' },
    { key: 'Sai', text: 'Sai (Nhận định không chính xác theo quy chuẩn)' },
  ];

  const currentOptions = isTrueFalse ? tfOptions : mcqOptions;

  const checkIsCorrect = (key) => {
    const rawCorrect = String(currentQ.correct_answer || '').trim();
    return rawCorrect.toLowerCase() === key.toLowerCase() || 
           (key === 'A' && rawCorrect.startsWith('A')) ||
           (key === 'B' && rawCorrect.startsWith('B')) ||
           (key === 'C' && rawCorrect.startsWith('C')) ||
           (key === 'D' && rawCorrect.startsWith('D'));
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950 flex flex-col text-slate-100 overflow-hidden select-none w-screen h-screen">
      
      {/* 1. TOP HEADER TOOLBAR: Full Width, Synchronized Button Heights */}
      <header className="w-full px-4 sm:px-6 lg:px-8 py-3 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between shadow-lg shrink-0 gap-4">
        
        {/* Left: Breadcrumbs & Counter */}
        <div className="flex items-center space-x-3 truncate">
          <div className="flex items-center space-x-2 bg-sky-500/20 border border-sky-500/40 text-sky-300 h-10 px-3.5 rounded-xl font-black text-xs shrink-0">
            <span className="w-2 h-2 rounded-full bg-sky-400 animate-ping" />
            <span>ZOOM TRÌNH CHIẾU</span>
          </div>

          <div className="text-xs sm:text-sm font-semibold text-slate-300 truncate">
            <span className="text-sky-400 font-bold">{moduleTitle || 'Tất cả học phần'}</span>
            {topicTitle && <span className="text-slate-500 mx-2">•</span>}
            <span className="text-slate-300 truncate">{topicTitle}</span>
          </div>
        </div>

        {/* Right: Zoom controls, Grid, Fullscreen, Close (Synchronized H-10) */}
        <div className="flex items-center space-x-2 shrink-0">
          
          {/* Question Grid Navigator */}
          <button
            onClick={() => setShowGridModal(true)}
            className="h-10 flex items-center space-x-2 px-3.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-all cursor-pointer border border-slate-700"
            title="Xem danh sách tất cả câu hỏi"
          >
            <Grid className="w-4 h-4 text-sky-400" />
            <span className="hidden md:inline">Lưới câu hỏi ({currentIndex + 1}/{questionList.length})</span>
          </button>

          {/* Font Size Adjusters */}
          <div className="flex items-center h-10 bg-slate-800 border border-slate-700 rounded-xl p-1">
            <button
              onClick={() => setFontSizeLevel(prev => Math.max(0, prev - 1))}
              className="h-8 px-2.5 text-xs font-bold text-slate-300 hover:text-white hover:bg-slate-700 rounded-lg transition-colors cursor-pointer"
              title="Thu nhỏ chữ (A-)"
            >
              A-
            </button>
            <button
              onClick={() => setFontSizeLevel(1)}
              className="h-8 px-2.5 text-xs font-bold text-sky-400 hover:text-sky-300 hover:bg-slate-700 rounded-lg transition-colors cursor-pointer"
              title="Đặt lại cỡ chữ chuẩn Zoom"
            >
              Chuẩn
            </button>
            <button
              onClick={() => setFontSizeLevel(prev => Math.min(2, prev + 1))}
              className="h-8 px-2.5 text-xs font-bold text-slate-300 hover:text-white hover:bg-slate-700 rounded-lg transition-colors cursor-pointer"
              title="Phóng to chữ (A+)"
            >
              A+
            </button>
          </div>

          {/* Fullscreen Button */}
          <button
            onClick={toggleFullscreen}
            className="h-10 w-10 flex items-center justify-center rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer border border-slate-700"
            title="Bật/Tắt Toàn màn hình (Phím F)"
          >
            {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
          </button>

          {/* Close Presenter Mode */}
          <button
            onClick={onClose}
            className="h-10 flex items-center space-x-1.5 px-4 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition-all shadow-sm cursor-pointer"
            title="Thoát chế độ trình chiếu (Phím Esc)"
          >
            <X className="w-4 h-4" />
            <span>Đóng</span>
          </button>
        </div>
      </header>

      {/* Progress Bar */}
      <div className="w-full h-1.5 bg-slate-800 shrink-0">
        <div 
          className="h-full bg-linear-to-r from-sky-500 to-indigo-500 transition-all duration-300"
          style={{ width: `${((currentIndex + 1) / questionList.length) * 100}%` }}
        />
      </div>

      {/* 2. MAIN PRESENTATION CANVAS: Wide layout, fully utilizing width */}
      <main className="flex-1 overflow-y-auto px-4 sm:px-8 lg:px-12 xl:px-16 py-6 flex flex-col justify-center w-full">
        
        {/* Question Header Badge & Type */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div className="flex items-center space-x-2.5">
            <span className="h-9 px-4 rounded-xl bg-sky-500 text-slate-950 font-black text-sm flex items-center tracking-wide shadow-lg shadow-sky-500/20">
              CÂU HỎI {currentIndex + 1} / {questionList.length}
            </span>
            <span className="h-9 px-3 rounded-xl bg-slate-800 border border-slate-700 text-slate-300 text-xs font-bold flex items-center font-mono">
              {currentQ.code}
            </span>
            {currentQ.target_role && (
              <span className="h-9 px-3 rounded-xl bg-indigo-900/60 border border-indigo-700 text-indigo-300 text-xs font-bold flex items-center">
                {currentQ.target_role}
              </span>
            )}
            {currentQ.bloom_level && (
              <span className="h-9 px-3 rounded-xl bg-slate-800/80 border border-slate-700 text-slate-400 text-xs font-medium hidden sm:flex items-center">
                Bậc: {currentQ.bloom_level}
              </span>
            )}
          </div>

          <div className="flex items-center">
            <span className="h-9 px-3 rounded-xl bg-slate-800 text-slate-300 border border-slate-700 text-xs font-bold flex items-center">
              {isTrueFalse ? 'Câu hỏi Đúng / Sai' : isOral ? 'Câu hỏi Vấn đáp' : 'Trắc nghiệm nhiều lựa chọn'}
            </span>
          </div>
        </div>

        {/* Question Stem: Spacious, Ultra-readable */}
        <div className="mb-5 p-6 sm:p-8 rounded-3xl bg-slate-900/95 border border-slate-800 shadow-2xl">
          <p className={`${fontSizes.stem} font-extrabold text-white leading-relaxed tracking-tight`}>
            {currentQ.stem}
          </p>
        </div>

        {/* 3. OPTIONS: Specialized True/False vs MCQ */}
        {!isOral ? (
          isTrueFalse ? (
            /* True / False: Centered, beautifully proportioned interactive cards */
            <div className="max-w-3xl mx-auto w-full grid grid-cols-2 gap-5 sm:gap-8 my-4">
              {/* Option ĐÚNG */}
              {(() => {
                const isSelected = selectedAnswer === 'Đúng';
                const isCorrect = checkIsCorrect('Đúng');
                let cardStyle = 'bg-slate-900/80 border-slate-800 text-slate-200 hover:bg-slate-800/90 hover:border-slate-700';
                let iconColor = 'text-slate-400';

                if (showAnswer) {
                  if (isCorrect) {
                    cardStyle = 'bg-emerald-950/90 border-emerald-500 text-emerald-100 ring-4 ring-emerald-500/40 shadow-2xl shadow-emerald-950/80 scale-[1.02]';
                    iconColor = 'text-emerald-400';
                  } else if (isSelected) {
                    cardStyle = 'bg-rose-950/90 border-rose-500 text-rose-100 ring-2 ring-rose-500/40';
                    iconColor = 'text-rose-400';
                  }
                } else if (isSelected) {
                  cardStyle = 'bg-sky-950/90 border-sky-400 text-sky-100 ring-4 ring-sky-500/40 scale-[1.01]';
                  iconColor = 'text-sky-400';
                }

                return (
                  <div
                    onClick={() => setSelectedAnswer('Đúng')}
                    className={`flex flex-col items-center justify-center p-6 sm:p-8 rounded-3xl border-2 transition-all duration-150 cursor-pointer text-center relative ${cardStyle}`}
                  >
                    <CheckCircle2 className={`w-12 h-12 sm:w-16 sm:h-16 mb-2 transition-transform duration-150 ${iconColor} ${isSelected ? 'scale-110' : ''}`} />
                    <span className="text-3xl sm:text-5xl font-black tracking-wider uppercase">
                      ĐÚNG
                    </span>
                    <span className="text-xs sm:text-sm font-semibold opacity-70 mt-1">
                      Nhận định chính xác
                    </span>

                    {showAnswer && isCorrect && (
                      <span className="absolute top-3 right-3 sm:top-4 sm:right-4 px-2.5 py-1 rounded-lg bg-emerald-500 text-slate-950 text-[11px] font-black tracking-wider uppercase shadow-md">
                        Đáp án đúng
                      </span>
                    )}
                    {showAnswer && !isCorrect && isSelected && (
                      <span className="absolute top-3 right-3 sm:top-4 sm:right-4 px-2.5 py-1 rounded-lg bg-rose-500 text-white text-[11px] font-black tracking-wider uppercase shadow-md">
                        Chọn sai
                      </span>
                    )}
                  </div>
                );
              })()}

              {/* Option SAI */}
              {(() => {
                const isSelected = selectedAnswer === 'Sai';
                const isCorrect = checkIsCorrect('Sai');
                let cardStyle = 'bg-slate-900/80 border-slate-800 text-slate-200 hover:bg-slate-800/90 hover:border-slate-700';
                let iconColor = 'text-slate-400';

                if (showAnswer) {
                  if (isCorrect) {
                    cardStyle = 'bg-emerald-950/90 border-emerald-500 text-emerald-100 ring-4 ring-emerald-500/40 shadow-2xl shadow-emerald-950/80 scale-[1.02]';
                    iconColor = 'text-emerald-400';
                  } else if (isSelected) {
                    cardStyle = 'bg-rose-950/90 border-rose-500 text-rose-100 ring-2 ring-rose-500/40';
                    iconColor = 'text-rose-400';
                  }
                } else if (isSelected) {
                  cardStyle = 'bg-sky-950/90 border-sky-400 text-sky-100 ring-4 ring-sky-500/40 scale-[1.01]';
                  iconColor = 'text-sky-400';
                }

                return (
                  <div
                    onClick={() => setSelectedAnswer('Sai')}
                    className={`flex flex-col items-center justify-center p-6 sm:p-8 rounded-3xl border-2 transition-all duration-150 cursor-pointer text-center relative ${cardStyle}`}
                  >
                    <XCircle className={`w-12 h-12 sm:w-16 sm:h-16 mb-2 transition-transform duration-150 ${iconColor} ${isSelected ? 'scale-110' : ''}`} />
                    <span className="text-3xl sm:text-5xl font-black tracking-wider uppercase">
                      SAI
                    </span>
                    <span className="text-xs sm:text-sm font-semibold opacity-70 mt-1">
                      Nhận định không chính xác
                    </span>

                    {showAnswer && isCorrect && (
                      <span className="absolute top-3 right-3 sm:top-4 sm:right-4 px-2.5 py-1 rounded-lg bg-emerald-500 text-slate-950 text-[11px] font-black tracking-wider uppercase shadow-md">
                        Đáp án đúng
                      </span>
                    )}
                    {showAnswer && !isCorrect && isSelected && (
                      <span className="absolute top-3 right-3 sm:top-4 sm:right-4 px-2.5 py-1 rounded-lg bg-rose-500 text-white text-[11px] font-black tracking-wider uppercase shadow-md">
                        Chọn sai
                      </span>
                    )}
                  </div>
                );
              })()}
            </div>
          ) : (
            /* MCQ Options: Grid */
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 mb-5">
              {currentOptions.map((opt) => {
                const isSelected = selectedAnswer === opt.key;
                const isCorrect = checkIsCorrect(opt.key);
                
                let cardClasses = 'bg-slate-900/70 border-slate-800 text-slate-200 hover:bg-slate-800/80 hover:border-slate-700';
                let badgeClasses = 'bg-slate-800 text-slate-300 border-slate-700';

                if (showAnswer) {
                  if (isCorrect) {
                    cardClasses = 'bg-emerald-950/80 border-emerald-500 text-emerald-100 ring-2 ring-emerald-500/50 shadow-lg shadow-emerald-950/50';
                    badgeClasses = 'bg-emerald-500 text-slate-950 border-emerald-400 font-black';
                  } else if (isSelected) {
                    cardClasses = 'bg-rose-950/80 border-rose-500 text-rose-100 ring-2 ring-rose-500/50';
                    badgeClasses = 'bg-rose-500 text-white border-rose-400';
                  }
                } else if (isSelected) {
                  cardClasses = 'bg-sky-950/70 border-sky-400 text-sky-100 ring-2 ring-sky-500/50';
                  badgeClasses = 'bg-sky-500 text-slate-950 border-sky-400 font-bold';
                }

                return (
                  <div
                    key={opt.key}
                    onClick={() => setSelectedAnswer(opt.key)}
                    className={`flex items-center space-x-4 p-4 sm:p-5 rounded-2xl border transition-all duration-150 cursor-pointer min-h-[72px] ${cardClasses}`}
                  >
                    <div className={`w-11 h-11 rounded-xl flex items-center justify-center text-lg sm:text-xl font-black shrink-0 border shadow-xs ${badgeClasses}`}>
                      {opt.key}
                    </div>

                    <div className="flex-1 min-w-0">
                      <span className={`${fontSizes.option} font-semibold block leading-snug`}>
                        {opt.text}
                      </span>
                    </div>

                    {showAnswer && isCorrect && (
                      <div className="flex items-center space-x-1 px-3 py-1 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 text-xs font-black shrink-0">
                        <CheckCircle2 className="w-4 h-4" />
                        <span className="hidden sm:inline">ĐÁP ÁN ĐÚNG</span>
                      </div>
                    )}

                    {showAnswer && !isCorrect && isSelected && (
                      <div className="flex items-center space-x-1 px-3 py-1 rounded-lg bg-rose-500/20 text-rose-400 border border-rose-500/40 text-xs font-black shrink-0">
                        <XCircle className="w-4 h-4" />
                        <span className="hidden sm:inline">LỰA CHỌN SAI</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )
        ) : (

          <div className="p-6 rounded-2xl bg-amber-950/30 border border-amber-500/40 mb-5">
            <h4 className="text-sm font-bold text-amber-400 uppercase tracking-wider mb-2 flex items-center space-x-2">
              <BookOpen className="w-4 h-4" />
              <span>Đáp án mẫu & Tiêu chí chấm vấn đáp:</span>
            </h4>
            <div className={`${fontSizes.option} text-amber-100 font-medium leading-relaxed mb-4`}>
              {currentQ.correct_answer || 'Chưa có đáp án mẫu.'}
            </div>
            {currentQ.passing_criteria && (
              <div className="mt-3 p-3 bg-slate-900/80 rounded-xl border border-slate-700 text-xs text-slate-300">
                <strong className="text-sky-300">Tiêu chí đạt: </strong> {currentQ.passing_criteria}
              </div>
            )}
          </div>
        )}

        {/* 4. EXPLANATION BOX */}
        {showExplanation && (
          <div className="p-6 sm:p-7 rounded-3xl bg-linear-to-br from-amber-950/40 via-slate-900 to-slate-900 border-2 border-amber-500/60 shadow-xl mb-5 animate-in fade-in slide-in-from-top-3 duration-200">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-2 text-amber-400">
                <Lightbulb className="w-5 h-5 animate-pulse" />
                <span className="font-extrabold text-sm sm:text-base tracking-wide uppercase">CĂN CỨ PHÁP LÝ & LỜI GIẢI THÍCH CHI TIẾT</span>
              </div>

              {canEditExplanation && (
                <button
                  onClick={() => setEditingQuestion(currentQ)}
                  className="h-8 flex items-center space-x-1 px-3 bg-amber-500/20 hover:bg-amber-500/40 text-amber-300 rounded-lg text-xs font-bold border border-amber-500/50 transition-all cursor-pointer"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>Sửa giải thích</span>
                </button>
              )}
            </div>

            <p className="text-base sm:text-lg text-amber-100 leading-relaxed whitespace-pre-line font-normal">
              {currentQ.explanation || 'Chưa có giải thích chi tiết. Giảng viên có thể bấm "Sửa giải thích" để bổ sung.'}
            </p>

            {currentQ.updated_by_name && (
              <div className="mt-3 text-xs text-amber-300/70 italic flex items-center space-x-1">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Giảng viên cập nhật: {currentQ.updated_by_name} ({new Date(currentQ.updated_at).toLocaleDateString('vi-VN')})</span>
              </div>
            )}
          </div>
        )}

      </main>

      {/* 5. BOTTOM CONTROL BAR: SYNCHRONIZED HEIGHT (H-12) FOR ALL ACTION BUTTONS */}
      <footer className="w-full px-4 sm:px-8 py-3.5 bg-slate-900 border-t border-slate-800 shadow-2xl flex flex-wrap items-center justify-between gap-3 shrink-0">
        
        {/* Navigation buttons: Uniform H-12 */}
        <div className="flex items-center space-x-2.5">
          <button
            onClick={handlePrev}
            disabled={currentIndex === 0}
            className="h-12 flex items-center space-x-2 px-5 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-30 text-white font-bold text-sm transition-all border border-slate-700 cursor-pointer active:scale-95"
          >
            <ChevronLeft className="w-5 h-5" />
            <span>Câu trước</span>
          </button>

          <button
            onClick={handleNext}
            disabled={currentIndex === questionList.length - 1}
            className="h-12 flex items-center space-x-2 px-6 rounded-xl bg-sky-600 hover:bg-sky-500 disabled:opacity-30 text-white font-bold text-sm shadow-md shadow-sky-600/30 transition-all cursor-pointer active:scale-95"
          >
            <span>Câu tiếp theo</span>
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        {/* Action buttons: Uniform H-12 */}
        <div className="flex items-center space-x-3 flex-wrap">
          
          {/* Answer Toggle: H-12 */}
          <button
            onClick={() => setShowAnswer(prev => !prev)}
            className={`h-12 flex items-center space-x-2 px-5 rounded-xl font-bold text-sm transition-all shadow-md cursor-pointer ${
              showAnswer
                ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/30'
                : 'bg-slate-800 hover:bg-slate-700 text-emerald-400 border border-emerald-500/40'
            }`}
          >
            {showAnswer ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            <span>{showAnswer ? 'Ẩn đáp án' : 'Hiện đáp án (Phím R)'}</span>
          </button>

          {/* Explanation Toggle: H-12 */}
          <button
            onClick={() => setShowExplanation(prev => !prev)}
            className={`h-12 flex items-center space-x-2 px-5 rounded-xl font-bold text-sm transition-all shadow-md cursor-pointer ${
              showExplanation
                ? 'bg-amber-600 hover:bg-amber-500 text-white shadow-amber-600/30'
                : 'bg-slate-800 hover:bg-slate-700 text-amber-400 border border-amber-500/40'
            }`}
          >
            <Lightbulb className="w-4 h-4" />
            <span>{showExplanation ? 'Ẩn giải thích' : 'Hiện giải thích (Phím E)'}</span>
          </button>

          {/* Teacher Edit Explanation: H-12 */}
          {canEditExplanation && (
            <button
              onClick={() => setEditingQuestion(currentQ)}
              className="h-12 flex items-center space-x-2 px-5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm shadow-md transition-all cursor-pointer border border-indigo-400/40"
              title="Giáo viên bổ sung kinh nghiệm bay hoặc căn cứ pháp lý mới"
            >
              <Edit3 className="w-4 h-4" />
              <span>Sửa giải thích</span>
            </button>
          )}
        </div>

        {/* Hotkeys Quick Helper */}
        <div className="hidden 2xl:flex items-center space-x-3 text-xs font-semibold text-slate-400 bg-slate-950/60 h-10 px-4 rounded-xl border border-slate-800">
          <span>[Space/→] Tiếp</span>
          <span>•</span>
          <span>[←] Lùi</span>
          <span>•</span>
          <span>[1..4/A..D] Chọn</span>
          <span>•</span>
          <span>[R] Đáp án</span>
          <span>•</span>
          <span>[E] Giải thích</span>
          <span>•</span>
          <span>[F] Toàn màn hình</span>
        </div>

      </footer>

      {/* Grid Modal */}
      {showGridModal && (
        <div className="fixed inset-0 z-60 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-4xl w-full shadow-2xl flex flex-col max-h-[85vh]">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div className="flex items-center space-x-2">
                <Grid className="w-5 h-5 text-sky-400" />
                <h3 className="font-bold text-lg text-white">Chuyển Nhanh Đến Câu Hỏi Bất Kỳ</h3>
              </div>
              <button
                onClick={() => setShowGridModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 overflow-y-auto flex-1 grid grid-cols-6 sm:grid-cols-10 md:grid-cols-12 lg:grid-cols-15 gap-2">
              {questionList.map((q, idx) => (
                <button
                  key={q.id}
                  onClick={() => {
                    goToQuestion(idx);
                    setShowGridModal(false);
                  }}
                  className={`h-11 rounded-xl font-bold text-sm flex items-center justify-center transition-all cursor-pointer ${
                    currentIndex === idx
                      ? 'bg-sky-500 text-slate-950 ring-2 ring-sky-300 font-black scale-105'
                      : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
                  }`}
                >
                  {idx + 1}
                </button>
              ))}
            </div>

            <div className="pt-4 border-t border-slate-800 flex justify-end">
              <button
                onClick={() => setShowGridModal(false)}
                className="h-10 px-5 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold rounded-xl"
              >
                Đóng lưới
              </button>
            </div>
          </div>
        </div>
      )}

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
