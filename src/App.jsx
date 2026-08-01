import React, { useState } from 'react';
import { FinancialProvider, useFinancial } from './context/FinancialContext';
import { Navbar } from './components/Navbar';
import { MonthYearNavigator } from './components/MonthYearNavigator';
import { LoginModal } from './components/LoginModal';
import { DashboardView } from './components/DashboardView';
import { ReceitasView } from './components/ReceitasView';
import { GastosView } from './components/GastosView';
import { ChangePasswordModal } from './components/ChangePasswordModal';
import { Heart } from 'lucide-react';

const MainContent = () => {
  const { currentUser } = useFinancial();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isChangePassOpen, setIsChangePassOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#080c14] text-slate-100 flex flex-col justify-between">
      
      {/* Login Modal Overlay if not authenticated */}
      {!currentUser && <LoginModal />}

      <div>
        {/* Navigation Header */}
        <Navbar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          openChangePasswordModal={() => setIsChangePassOpen(true)}
        />

        {/* Main Body Container */}
        <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6 space-y-6">
          
          {/* Intuitive 12-Month & Year Selector Grid */}
          <MonthYearNavigator />

          {/* Active Tab View */}
          {activeTab === 'dashboard' && <DashboardView />}
          {activeTab === 'receitas' && <ReceitasView />}
          {activeTab === 'gastos' && <GastosView />}
        </main>
      </div>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 bg-slate-950/80 py-6 text-center text-xs text-slate-500 mt-8">
        <div className="mx-auto max-w-7xl px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-400">ViralFX Financeiro</span>
            <span>• Controle 50/50 Fábio & Luiz</span>
          </div>
          <p className="flex items-center gap-1">
            Desenvolvido com <Heart className="h-3.5 w-3.5 text-rose-500 fill-rose-500" /> para a equipe ViralFX
          </p>
        </div>
      </footer>

      {/* Change Password Modal */}
      <ChangePasswordModal
        isOpen={isChangePassOpen}
        onClose={() => setIsChangePassOpen(false)}
      />

    </div>
  );
};

export default function App() {
  return (
    <FinancialProvider>
      <MainContent />
    </FinancialProvider>
  );
}
