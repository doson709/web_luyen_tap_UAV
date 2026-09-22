import React, { useState } from 'react';
import { ChevronDown, ChevronRight, BookOpen, Layers, GraduationCap, Wrench, CheckCircle2, MessageSquareQuote, Sparkles } from 'lucide-react';

export default function CurriculumSidebar({
  activeMode = 'practice',
  onSelectMode,
  tree = [],
  oralTopics = [],
  selectedModule,
  selectedTopic,
  selectedCategory,
  onSelectModule,
  onSelectTopic,
  onSelectCategory,
  totalMcq = 600,
  totalOral = 49
}) {
  const [expandedPrograms, setExpandedPrograms] = useState({});
  const [expandedCategories, setExpandedCategories] = useState({});
  const [expandedModules, setExpandedModules] = useState({});

  const isOralMode = activeMode === 'oral';

  const toggleProgram = (id) => {
    setExpandedPrograms(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const toggleCategory = (key) => {
    setExpandedCategories(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const toggleModule = (id) => {
    setExpandedModules(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const expandAll = () => {
    const progs = {};
    const cats = {};
    const mods = {};
    tree.forEach(p => {
      progs[p.id] = true;
      (p.categories || []).forEach(c => {
        cats[`${p.id}_${c.category}`] = true;
        (c.modules || []).forEach(m => {
          mods[m.id] = true;
        });
      });
    });
    setExpandedPrograms(progs);
    setExpandedCategories(cats);
    setExpandedModules(mods);
  };

  const collapseAll = () => {
    setExpandedPrograms({});
    setExpandedCategories({});
    setExpandedModules({});
  };

  return (
    <aside className="w-full bg-white border border-slate-200/90 rounded-2xl shadow-xs overflow-hidden flex flex-col max-h-[calc(100vh-6rem)]">
      
      {/* 1. Sidebar Top Header */}
      <div className="p-3.5 bg-slate-50 border-b border-slate-200 shrink-0">
        <div className="flex items-center justify-between mb-2.5">
          <div className="flex items-center space-x-2 text-slate-800">
            <Layers className="w-4 h-4 text-sky-600" />
            <span className="font-extrabold text-xs tracking-wide uppercase">PHÂN LOẠI CÂU HỎI</span>
          </div>
          <span className="text-[11px] font-bold px-2 py-0.5 bg-slate-200 text-slate-700 rounded-full">
            {isOralMode ? `${totalOral} câu vấn đáp` : `${totalMcq} câu trắc nghiệm`}
          </span>
        </div>

        {/* 2. Top Segmented Switch: Trắc nghiệm (600 câu) vs Vấn đáp (49 câu) */}
        <div className="grid grid-cols-2 gap-1.5 p-1 bg-slate-200/80 rounded-xl">
          <button
            type="button"
            onClick={() => {
              if (onSelectMode) onSelectMode('practice');
              onSelectModule(null);
              onSelectTopic(null);
            }}
            className={`h-9 flex items-center justify-center space-x-1.5 rounded-lg text-xs font-black transition-all cursor-pointer ${
              !isOralMode
                ? 'bg-white text-sky-700 shadow-xs border border-slate-200'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Trắc nghiệm ({totalMcq})</span>
          </button>

          <button
            type="button"
            onClick={() => {
              if (onSelectMode) onSelectMode('oral');
              onSelectModule(null);
              onSelectTopic(null);
            }}
            className={`h-9 flex items-center justify-center space-x-1.5 rounded-lg text-xs font-black transition-all cursor-pointer ${
              isOralMode
                ? 'bg-white text-amber-700 shadow-xs border border-amber-300'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0" />
            <span>Vấn đáp ({totalOral})</span>
          </button>
        </div>
      </div>

      {/* 3. Tree Content */}
      <div className="p-2.5 overflow-y-auto flex-1 space-y-2">
        
        {/* MODE 1: TRẮC NGHIỆM (600 CÂU) */}
        {!isOralMode ? (
          <>
            {/* Quick Action: Tất cả câu trắc nghiệm */}
            <button
              onClick={() => { onSelectModule(null); onSelectTopic(null); if (onSelectCategory) onSelectCategory(null); }}
              className={`w-full h-10 flex items-center justify-between px-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                !selectedModule && !selectedTopic && !selectedCategory
                  ? 'bg-sky-600 text-white shadow-xs'
                  : 'text-slate-700 hover:bg-slate-100'
              }`}
            >
              <div className="flex items-center space-x-2 truncate">
                <BookOpen className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">Tất cả câu trắc nghiệm</span>
              </div>
              <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded-md ${
                !selectedModule && !selectedTopic && !selectedCategory ? 'bg-sky-700 text-white font-bold' : 'bg-slate-100 text-slate-600'
              }`}>
                {totalMcq} câu
              </span>
            </button>

            {/* Expand / Collapse buttons */}
            <div className="flex items-center justify-between px-1 text-[11px] text-slate-400">
              <span>Học phần & đề mục:</span>
              <div className="flex items-center space-x-2">
                <button onClick={expandAll} type="button" className="text-sky-600 hover:text-sky-800 font-bold cursor-pointer">Mở tất cả</button>
                <span>•</span>
                <button onClick={collapseAll} type="button" className="text-slate-500 hover:text-slate-800 font-semibold cursor-pointer">Thu gọn</button>
              </div>
            </div>

            {/* Level 1: Programs (Hạng A, Hạng B) */}
            {tree.map(program => {
              const isProgExpanded = Boolean(expandedPrograms[program.id]);

              return (
                <div key={program.id} className="border border-slate-200 rounded-xl overflow-hidden bg-slate-50/60">
                  
                  {/* Program Header */}
                  <button
                    onClick={() => toggleProgram(program.id)}
                    className="w-full h-10 flex items-center justify-between px-3 text-left font-extrabold text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer border-b border-slate-200/70"
                  >
                    <div className="flex items-center space-x-1.5 text-xs truncate">
                      {isProgExpanded ? <ChevronDown className="w-3.5 h-3.5 text-sky-600 shrink-0" /> : <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />}
                      <span className="truncate">{program.name}</span>
                    </div>
                    <span className="text-[10px] font-bold px-1.5 py-0.5 bg-slate-200 text-slate-700 rounded-md shrink-0 ml-1">
                      {program.total_questions || 0}
                    </span>
                  </button>

                  {/* Level 2: Categories (Lý Thuyết & Thực Hành) */}
                  {isProgExpanded && (
                    <div className="p-1.5 space-y-1.5 bg-white">
                      {(program.categories || []).filter(catGroup => (catGroup.modules || []).length > 0).map(catGroup => {
                        const catKey = `${program.id}_${catGroup.category}`;
                        const isCatExpanded = Boolean(expandedCategories[catKey]);
                        const isTheory = catGroup.category === 'Lý Thuyết';
                        const catIcon = isTheory ? <GraduationCap className="w-3.5 h-3.5 text-sky-600 shrink-0" /> : <Wrench className="w-3.5 h-3.5 text-indigo-600 shrink-0" />;

                        return (
                          <div key={catKey} className="border border-slate-100 rounded-lg overflow-hidden bg-slate-50/40">
                            
                            {/* Category Row */}
                            <div
                              onClick={() => toggleCategory(catKey)}
                              className="w-full h-8 flex items-center justify-between px-2 py-1 text-left font-bold text-slate-800 hover:bg-slate-100 transition-colors cursor-pointer"
                            >
                              <div className="flex items-center space-x-1.5 text-xs truncate">
                                {isCatExpanded ? <ChevronDown className="w-3 h-3 text-slate-500" /> : <ChevronRight className="w-3 h-3 text-slate-400" />}
                                {catIcon}
                                <span className="truncate uppercase tracking-wide text-[10px] font-black text-slate-700">
                                  {catGroup.category}
                                </span>
                              </div>
                              <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded-md ${isTheory ? 'bg-sky-50 text-sky-700 border border-sky-200' : 'bg-indigo-50 text-indigo-700 border border-indigo-200'}`}>
                                {catGroup.total_questions || 0} câu
                              </span>
                            </div>

                            {/* Level 3: Modules (HP1, HP2, HP3...) */}
                            {isCatExpanded && (
                              <div className="pl-2 pr-1 pb-1 space-y-1 bg-white">
                                {catGroup.modules?.map(module => {
                                  const isModSelected = selectedModule?.id === module.id && !selectedTopic;
                                  const isModExpanded = Boolean(expandedModules[module.id]);

                                  return (
                                    <div key={module.id} className="rounded-md overflow-hidden">
                                      <div
                                        className={`flex items-center justify-between px-2 py-1.5 rounded-md text-xs cursor-pointer transition-all ${
                                          isModSelected
                                            ? 'bg-sky-100 text-sky-900 font-bold border border-sky-300'
                                            : selectedModule?.id === module.id
                                            ? 'bg-sky-50 text-sky-800 font-semibold'
                                            : 'text-slate-700 hover:bg-slate-100 font-medium'
                                        }`}
                                        onClick={() => {
                                          onSelectModule(module);
                                          onSelectTopic(null);
                                        }}
                                      >
                                        <div className="flex items-center space-x-1 flex-1 pr-1 truncate">
                                          <button
                                            type="button"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              toggleModule(module.id);
                                            }}
                                            className="p-0.5 hover:bg-slate-200 rounded text-slate-400"
                                          >
                                            {isModExpanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                                          </button>
                                          <span className="truncate" title={module.title}>
                                            {module.title}
                                          </span>
                                        </div>
                                        <span className="text-[10px] font-bold px-1.5 py-0.2 bg-slate-100 text-slate-600 rounded shrink-0">
                                          {module.total_questions}
                                        </span>
                                      </div>

                                      {/* Level 4: Topics (Mục 1, Mục 2, Mục 3...) */}
                                      {isModExpanded && module.topics && module.topics.length > 0 && (
                                        <div className="pl-4 pr-1 py-1 space-y-0.5">
                                          {module.topics.map(topic => {
                                            const isTopicSelected = selectedTopic?.id === topic.id;

                                            return (
                                              <button
                                                key={topic.id}
                                                onClick={() => {
                                                  onSelectModule(module);
                                                  onSelectTopic(topic);
                                                }}
                                                className={`w-full flex items-center justify-between text-left px-2 py-1.5 rounded-md text-[11px] transition-colors cursor-pointer ${
                                                  isTopicSelected
                                                    ? 'bg-sky-600 text-white font-bold shadow-2xs'
                                                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                                                }`}
                                                title={topic.title}
                                              >
                                                <span className="truncate pr-1">• {topic.title}</span>
                                                <span className={`text-[9px] px-1 rounded font-mono ${isTopicSelected ? 'bg-sky-700 text-white font-bold' : 'text-slate-400'}`}>
                                                  {topic.total_questions}
                                                </span>
                                              </button>
                                            );
                                          })}
                                        </div>
                                      )}
                                    </div>
                                  );
                                })}
                              </div>
                            )}

                          </div>
                        );
                      })}
                    </div>
                  )}

                </div>
              );
            })}
          </>
        ) : (
          /* MODE 2: CÂU HỎI VẤN ĐÁP (49 CÂU) */
          <div className="space-y-2">
            
            {/* Quick Action: Tất cả 49 câu vấn đáp */}
            <button
              onClick={() => { onSelectModule(null); onSelectTopic(null); }}
              className={`w-full h-10 flex items-center justify-between px-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                !selectedTopic
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'text-slate-700 hover:bg-slate-100'
              }`}
            >
              <div className="flex items-center space-x-2 truncate">
                <span className="w-2 h-2 rounded-full bg-white shrink-0" />
                <span className="truncate">Tất cả câu hỏi Vấn đáp</span>
              </div>
              <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded-md ${
                !selectedTopic ? 'bg-amber-700 text-white font-bold' : 'bg-slate-100 text-slate-600'
              }`}>
                {totalOral} câu
              </span>
            </button>

            <div className="px-1 pt-1 text-[11px] font-bold text-amber-900">
              6 Chuyên đề Vấn đáp thực hành:
            </div>

            {/* List of 6 Oral Topics */}
            {oralTopics.map((topic, idx) => {
              const isSelected = selectedTopic?.id === topic.id;

              return (
                <div
                  key={topic.id}
                  onClick={() => {
                    onSelectModule({ id: topic.module_id, title: topic.module_title });
                    onSelectTopic(topic);
                  }}
                  className={`p-3 rounded-xl border transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-amber-50/90 border-amber-400 ring-2 ring-amber-400/30 shadow-xs'
                      : 'bg-white border-slate-200 hover:border-amber-300 hover:bg-amber-50/30'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-start space-x-2">
                      <span className={`w-5 h-5 rounded-md text-[11px] font-black flex items-center justify-center shrink-0 mt-0.5 ${
                        isSelected ? 'bg-amber-600 text-white' : 'bg-amber-100 text-amber-900'
                      }`}>
                        {idx + 1}
                      </span>
                      <div>
                        <h4 className="text-xs font-bold text-slate-900 leading-snug">
                          {topic.title.replace(/^Vấn đáp:\s*/i, '')}
                        </h4>
                        <span className="text-[10px] text-slate-400 mt-0.5 block">
                          {topic.module_title.split(':')[0] || 'Học phần UAV'}
                        </span>
                      </div>
                    </div>
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md shrink-0 ${
                      isSelected ? 'bg-amber-600 text-white' : 'bg-slate-100 text-slate-700'
                    }`}>
                      {topic.total_questions} câu
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}

      </div>
    </aside>
  );
}
