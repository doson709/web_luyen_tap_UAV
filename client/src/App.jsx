import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { api } from './services/api';
import Navbar from './components/layout/Navbar';
import CurriculumSidebar from './components/layout/CurriculumSidebar';
import PracticeView from './modules/practice/PracticeView';
import QuestionBankView from './modules/questions/QuestionBankView';
import UserManagementView from './modules/admin/UserManagementView';
import LoginPage from './modules/auth/LoginPage';
import LoginModal from './modules/auth/LoginModal';

function MainAppContent() {
  const { user, isAuthenticated, isAdmin, loading } = useAuth();

  const [activeTab, setActiveTab] = useState('practice'); // 'practice' (Trắc nghiệm - 600 câu) | 'oral' (Vấn đáp - 49 câu) | 'questions' | 'admin'
  const [curriculumTree, setCurriculumTree] = useState([]);
  const [oralTopics, setOralTopics] = useState([]);
  const [stats, setStats] = useState({ totalMcq: 600, totalOral: 49, totalAll: 649 });

  const [selectedModule, setSelectedModule] = useState(null);
  const [selectedTopic, setSelectedTopic] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState(null);

  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);

  // Load curriculum tree & oral sections
  useEffect(() => {
    async function loadTree() {
      try {
        const res = await api.curriculum.getTree();
        if (res.success && res.data) {
          if (Array.isArray(res.data)) {
            setCurriculumTree(res.data);
          } else {
            setCurriculumTree(res.data.tree || []);
            setOralTopics(res.data.oralTopics || []);
            if (res.data.stats) {
              setStats(res.data.stats);
            }
          }
        }
      } catch (err) {
        console.error('Failed to load curriculum tree:', err);
      }
    }
    loadTree();
  }, []);

  // When switching between 'practice' (Trắc nghiệm) and 'oral' (Vấn đáp), reset selections
  const handleSelectMode = (newMode) => {
    setActiveTab(newMode);
    setSelectedModule(null);
    setSelectedTopic(null);
    setSelectedCategory(null);
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
        setActiveTab={(tab) => {
          setActiveTab(tab);
          setSelectedModule(null);
          setSelectedTopic(null);
          setSelectedCategory(null);
        }}
        onOpenLogin={() => setIsLoginModalOpen(true)}
      />

      {/* 2. Main Full-Width Responsive Container */}
      <div className="w-full px-3 sm:px-6 lg:px-8 xl:px-10 py-5 flex-1 flex flex-col">
        <div className="flex flex-col lg:flex-row gap-5 items-start flex-1 w-full">
          
          {/* Left Sidebar: Filter tree for MCQ (600 câu) vs Oral (49 câu) */}
          {(activeTab === 'practice' || activeTab === 'oral' || activeTab === 'questions') && (
            <div className="w-full lg:w-84 xl:w-92 shrink-0 lg:sticky lg:top-20 z-20">
              <CurriculumSidebar
                activeMode={activeTab === 'oral' ? 'oral' : 'practice'}
                onSelectMode={handleSelectMode}
                tree={curriculumTree}
                oralTopics={oralTopics}
                selectedModule={selectedModule}
                selectedTopic={selectedTopic}
                selectedCategory={selectedCategory}
                onSelectModule={(mod) => setSelectedModule(mod)}
                onSelectTopic={(top) => setSelectedTopic(top)}
                onSelectCategory={(cat) => setSelectedCategory(cat)}
                totalMcq={stats.totalMcq}
                totalOral={stats.totalOral}
              />
            </div>
          )}

          {/* Right Main Column: Full remaining width utilized */}
          <div className="flex-1 min-w-0 w-full">
            {activeTab === 'practice' && (
              <PracticeView
                mode="practice"
                selectedModule={selectedModule}
                selectedTopic={selectedTopic}
                selectedCategory={selectedCategory}
              />
            )}

            {activeTab === 'oral' && (
              <PracticeView
                mode="oral"
                selectedModule={selectedModule}
                selectedTopic={selectedTopic}
                selectedCategory={selectedCategory}
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
        Hệ thống Luyện tập & Sát hạch Huấn luyện UAV • Căn cứ Quyết định 3906/QĐ-PKKQ & 2426/QĐ-BQP
      </footer>

      {/* 4. Switch Account / Login Modal */}
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
