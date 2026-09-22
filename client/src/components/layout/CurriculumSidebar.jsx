import React, { useState } from 'react';
import { ChevronDown, ChevronRight, BookOpen, Layers, GraduationCap, Wrench, CheckCircle2 } from 'lucide-react';

export default function CurriculumSidebar({
  tree,
  selectedModule,
  selectedTopic,
  selectedCategory,
  filterType,
  onSelectFilterType,
  onSelectModule,
  onSelectTopic,
  onSelectCategory,
  totalQuestions
}) {
  // Mặc định không bung các mục: khởi tạo rỗng để cây được thu gọn gọn gàng
  const [expandedPrograms, setExpandedPrograms] = useState({});
  const [expandedCategories, setExpandedCategories] = useState({});
  const [expandedModules, setExpandedModules] = useState({});

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
      
      {/* Sidebar Header */}
      <div className="p-4 bg-slate-50 border-b border-slate-200 shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2 text-slate-800">
            <Layers className="w-5 h-5 text-sky-600" />
            <span className="font-extrabold text-sm tracking-wide uppercase">CẤU TRÚC HỌC PHẦN</span>
          </div>
          <span className="text-xs font-bold px-2.5 py-0.5 bg-sky-100 text-sky-800 rounded-full border border-sky-200">
            {totalQuestions || 649} câu
          </span>
        </div>

        {/* Action controls: Collapse all / Expand all */}
        <div className="flex items-center justify-between mt-2.5 pt-2 border-t border-slate-200/70 text-[11px]">
          <span className="text-slate-400 font-medium">Cấu trúc học phần</span>
          <div className="flex items-center space-x-2">
            <button
              onClick={expandAll}
              type="button"
              className="text-sky-600 hover:text-sky-800 font-bold hover:underline cursor-pointer"
            >
              Mở tất cả
            </button>
            <span className="text-slate-300">•</span>
            <button
              onClick={collapseAll}
              type="button"
              className="text-slate-500 hover:text-slate-800 font-semibold hover:underline cursor-pointer"
            >
              Thu gọn
            </button>
          </div>
        </div>
      </div>

      {/* Tree Content: Independent vertical scroll within viewport */}
      <div className="p-2.5 overflow-y-auto flex-1 space-y-2.5">
        
        {/* All Questions Quick Filter */}
        <button
          onClick={() => { onSelectModule(null); onSelectTopic(null); if (onSelectCategory) onSelectCategory(null); }}
          className={`w-full h-11 flex items-center justify-between px-3.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            !selectedModule && !selectedTopic && !selectedCategory
              ? 'bg-sky-600 text-white shadow-xs'
              : 'text-slate-700 hover:bg-slate-100'
          }`}
        >
          <div className="flex items-center space-x-2.5">
            <BookOpen className="w-4 h-4 shrink-0" />
            <span>Tất cả học phần ({totalQuestions || 649} câu)</span>
          </div>
        </button>

        {/* Question Type Filter (Trắc nghiệm / Vấn đáp) */}
        <div>
          <span className="block text-[10px] font-black text-slate-400 uppercase tracking-wide px-1 mb-1">
            Loại câu hỏi
          </span>
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
            <button
              type="button"
              onClick={() => onSelectFilterType(filterType === 'mcq' ? 'all' : 'mcq')}
              className={`flex-1 h-9 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                filterType === 'mcq' ? 'bg-white text-sky-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Trắc nghiệm
            </button>
            <button
              type="button"
              onClick={() => onSelectFilterType(filterType === 'oral' ? 'all' : 'oral')}
              className={`flex-1 h-9 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                filterType === 'oral' ? 'bg-white text-sky-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Vấn đáp
            </button>
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
                className="w-full h-11 flex items-center justify-between px-3 text-left font-extrabold text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer border-b border-slate-200/70"
              >
                <div className="flex items-center space-x-2 text-xs truncate">
                  {isProgExpanded ? <ChevronDown className="w-4 h-4 text-sky-600 shrink-0" /> : <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />}
                  <span className="truncate">{program.name}</span>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 bg-slate-200 text-slate-700 rounded-md shrink-0 ml-1">
                  {program.total_questions || 0}
                </span>
              </button>

              {/* Level 2: Categories (Lý Thuyết & Thực Hành) */}
              {isProgExpanded && (
                <div className="p-1.5 space-y-1.5 bg-white">
                  {(program.categories || [
                    { category: 'Lý Thuyết', modules: program.modules?.filter(m => m.category === 'Lý Thuyết') || [] },
                    { category: 'Thực Hành', modules: program.modules?.filter(m => m.category === 'Thực Hành') || [] }
                  ]).filter(catGroup => (catGroup.modules || []).length > 0).map(catGroup => {
                    const catKey = `${program.id}_${catGroup.category}`;
                    const isCatExpanded = Boolean(expandedCategories[catKey]);
                    const isTheory = catGroup.category === 'Lý Thuyết';
                    const catIcon = isTheory ? <GraduationCap className="w-3.5 h-3.5 text-sky-600 shrink-0" /> : <Wrench className="w-3.5 h-3.5 text-indigo-600 shrink-0" />;

                    return (
                      <div key={catKey} className="border border-slate-100 rounded-lg overflow-hidden bg-slate-50/40">
                        
                        {/* Category Row */}
                        <div
                          onClick={() => toggleCategory(catKey)}
                          className="w-full h-9 flex items-center justify-between px-2.5 py-1 text-left font-bold text-slate-800 hover:bg-slate-100 transition-colors cursor-pointer"
                        >
                          <div className="flex items-center space-x-1.5 text-xs truncate">
                            {isCatExpanded ? <ChevronDown className="w-3 h-3 text-slate-500" /> : <ChevronRight className="w-3 h-3 text-slate-400" />}
                            {catIcon}
                            <span className="truncate uppercase tracking-wide text-[11px] font-black text-slate-700">
                              {catGroup.category}
                            </span>
                          </div>
                          <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded-md ${isTheory ? 'bg-sky-50 text-sky-700 border border-sky-200' : 'bg-indigo-50 text-indigo-700 border border-indigo-200'}`}>
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

                                  {/* Level 4: Topics (Phần 1, Phần 2, Phần 3...) */}
                                  {isModExpanded && module.topics && module.topics.length > 0 && (
                                    <div className="pl-5 pr-1 py-1 space-y-0.5">
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

      </div>
    </aside>
  );
}
