import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { api } from './services/api';
import Navbar from './components/layout/Navbar';
import CurriculumSidebar from './components/layout/CurriculumSidebar';
import PracticeView from './modules/practice/PracticeView';
import QuestionBankView from './modules/questions/QuestionBankView';
import UserManagementView from './modules/admin/UserManagementView';
import ZoomPresentationView from './modules/presentation/ZoomPresentationView';
import LoginPage from './modules/auth/LoginPage';
import LoginModal from './modules/auth/LoginModal';

function MainAppContent() {
  const { user, isAuthenticated, isAdmin, loading } = useAuth();

  const [activeTab, setActiveTab] = useState('practice');
  const [curriculumTree, setCurriculumTree] = useState([]);
  const [selectedModule, setSelectedModule] = useState(null);
  const [selectedTopic, setSelectedTopic] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [totalQuestions, setTotalQuestions] = useState(649);
  const [filterType, setFilterType] = useState('all');


  // Zoom presentation state
  const [zoomState, setZoomState] = useState({
    isOpen: false,
    questions: [],
    initialIndex: 0,
    moduleTitle: '',
    topicTitle: ''
  });

  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);

  // Load curriculum tree
  useEffect(() => {
    async function loadTree() {
      try {
        const res = await api.curriculum.getTree();
        if (res.success) {
          setCurriculumTree(res.data);
          let count = 0;
          res.data.forEach(p => {
            p.modules?.forEach(m => {
              count += m.total_questions || 0;
            });
          });
          if (count > 0) setTotalQuestions(count);
        }
      } catch (err) {
        console.error('Failed to load curriculum tree:', err);
      }
    }
    loadTree();
  }, []);

  const handleLaunchZoom = (questionsToPresent, initialIndex = 0) => {
    setZoomState({
      isOpen: true,
      questions: questionsToPresent,
      initialIndex,
      moduleTitle: selectedModule ? selectedModule.title : 'Toàn bộ học phần',
      topicTitle: selectedTopic ? selectedTopic.title : ''
    });
  };

  const handleOpenGeneralZoom = async () => {
    try {
      const params = {};
      if (selectedModule) params.moduleId = selectedModule.id;
      if (selectedTopic) params.topicId = selectedTopic.id;
      const res = await api.questions.list(params);
      if (res.success && res.data.length > 0) {
        handleLaunchZoom(res.data, 0);
      } else {
        alert('Không có câu hỏi nào để trình chiếu trong mục này.');
      }
    } catch (err) {
      alert('Không thể tải bộ câu hỏi để trình chiếu.');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-slate-100">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-sky-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm font-bold text-slate-600">Đang khởi động hệ thống UAV...</p>
        </div>
      </div>
    );
  }

  // Strictly require authentication to view or use the system
  if (!isAuthenticated) {
    return <LoginPage onLoginSuccess={() => {}} />;
  }

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col w-full">
      
      {/* 1. Header Navbar (Wide, Edge-to-Edge) */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenZoom={handleOpenGeneralZoom}
        onOpenLogin={() => setIsLoginModalOpen(true)}
      />

      {/* 2. Main Full-Width Responsive Container: Maximizing space on wide displays */}
      <div className="w-full px-3 sm:px-6 lg:px-8 xl:px-10 py-5 flex-1 flex flex-col">
        <div className="flex flex-col lg:flex-row gap-5 items-start flex-1 w-full">
          
          {/* Left Sidebar: 4-Level Curriculum Tree (Sticky Fixed Position) */}
          <div className="w-full lg:w-84 xl:w-92 shrink-0 lg:sticky lg:top-20 z-20">
            <CurriculumSidebar
              tree={curriculumTree}
              selectedModule={selectedModule}
              selectedTopic={selectedTopic}
              selectedCategory={selectedCategory}
              filterType={filterType}
              onSelectFilterType={setFilterType}
              onSelectModule={(mod) => setSelectedModule(mod)}
              onSelectTopic={(top) => setSelectedTopic(top)}
              onSelectCategory={(cat) => setSelectedCategory(cat)}
              totalQuestions={totalQuestions}
            />
          </div>

          {/* Right Main Column: Full remaining width utilized */}
          <div className="flex-1 min-w-0 w-full">
            {activeTab === 'practice' && (
              <PracticeView
                selectedModule={selectedModule}
                selectedTopic={selectedTopic}
                selectedCategory={selectedCategory}
                filterType={filterType}
                onLaunchZoom={handleLaunchZoom}
              />
            )}

            {activeTab === 'questions' && (
              <QuestionBankView
                selectedModule={selectedModule}
                selectedTopic={selectedTopic}
              />
            )}

            {activeTab === 'admin' && isAdmin && (
              <UserManagementView />
            )}
          </div>

        </div>
      </div>

      {/* 3. Footer */}
      <footer className="bg-white border-t border-slate-200 py-3.5 px-4 text-center text-xs text-slate-500 shrink-0">
        Hệ thống Luyện tập & Chữa đề Sát hạch Huấn luyện UAV • Phục vụ giảng dạy trực tuyến Zoom • Căn cứ Quyết định 3906/QĐ-PKKQ & 2426/QĐ-BQP
      </footer>

      {/* 4. Fullscreen Zoom Presentation View */}
      {zoomState.isOpen && (
        <ZoomPresentationView
          questions={zoomState.questions}
          initialIndex={zoomState.initialIndex}
          moduleTitle={zoomState.moduleTitle}
          topicTitle={zoomState.topicTitle}
          onClose={() => setZoomState(prev => ({ ...prev, isOpen: false }))}
        />
      )}

      {/* 5. Switch Account / Login Modal */}
      <LoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
      />

    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MainAppContent />
    </AuthProvider>
  );
}
