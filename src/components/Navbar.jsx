import React from 'react';
import { useFinancial, MONTH_NAMES } from '../context/FinancialContext';
import { 
  Calendar, 
  RefreshCw, 
  User, 
  LogOut, 
  LayoutDashboard,
  DollarSign,
  Receipt,
  KeyRound
} from 'lucide-react';

export const Navbar = ({ activeTab, setActiveTab, openChangePasswordModal }) => {
  const {
    currentUser,
    logout,
    currentYear,
    currentMonthNum,
    liveExchangeRate,
    exchangeRateLoading,
    fetchExchangeRate,
    isFirebaseConnected
  } = useFinancial();

  const activeMonthObj = MONTH_NAMES.find(m => m.num === currentMonthNum);
  const activeMonthLabel = activeMonthObj ? `${activeMonthObj.full} / ${currentYear}` : currentYear;

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-xl">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between gap-4">
          
          {/* Logo & Brand */}
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-900 border border-cyan-500/30 p-1 shadow-lg shadow-cyan-500/10">
              <img src="/viralfx_logo.png" alt="ViralFX Logo" className="h-full w-full object-contain" />
            </div>
            <div>
              <span className="text-lg font-black tracking-wider text-white">
                VIRAL<span className="text-cyan-400">FX</span>
              </span>
              <span className="hidden sm:inline-block ml-2 rounded-full bg-purple-500/10 px-2 py-0.5 text-[10px] font-semibold text-purple-400 border border-purple-500/20">
                50/50 Financials
              </span>
            </div>
          </div>

          {/* Navigation Tabs */}
          <nav className="hidden md:flex items-center gap-1 bg-slate-900/90 p-1 rounded-xl border border-slate-800">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg transition-all ${
                activeTab === 'dashboard'
                  ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md shadow-purple-500/20'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <LayoutDashboard className="h-4 w-4" />
              Resumo & Acerto
            </button>
            <button
              onClick={() => setActiveTab('receitas')}
              className={`flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg transition-all ${
                activeTab === 'receitas'
                  ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md shadow-purple-500/20'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <DollarSign className="h-4 w-4" />
              Receitas
            </button>
            <button
              onClick={() => setActiveTab('gastos')}
              className={`flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg transition-all ${
                activeTab === 'gastos'
                  ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md shadow-purple-500/20'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <Receipt className="h-4 w-4" />
              Gastos
            </button>
          </nav>

          {/* Right Tools & Active Month Display */}
          <div className="flex items-center gap-2 sm:gap-3">

            {/* Firebase Cloud Status Indicator */}
            <div className={`hidden sm:flex items-center gap-2 rounded-xl border px-3 py-1.5 text-xs font-semibold ${
              isFirebaseConnected
                ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300'
                : 'border-slate-800 bg-slate-900/60 text-slate-400'
            }`}>
              <div className={`h-2 w-2 rounded-full ${isFirebaseConnected ? 'bg-emerald-400 animate-ping' : 'bg-slate-500'}`}></div>
              <span>{isFirebaseConnected ? 'Firebase Conectado' : 'Modo Local'}</span>
            </div>

            {/* Exchange Rate Badge */}
            <div className="hidden lg:flex items-center gap-2 rounded-xl border border-slate-800 bg-slate-900/60 px-3 py-1.5 text-xs font-medium text-slate-300">
              <span className="text-slate-400">USD/BRL:</span>
              <span className="font-bold text-cyan-400">R$ {liveExchangeRate.toFixed(2)}</span>
              <button 
                onClick={fetchExchangeRate} 
                className="text-slate-400 hover:text-cyan-400 transition-colors"
                title="Atualizar cotação"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${exchangeRateLoading ? 'animate-spin text-cyan-400' : ''}`} />
              </button>
            </div>

            {/* Active Month Badge */}
            <div className="flex items-center rounded-xl border border-purple-500/30 bg-purple-500/10 px-3 py-1.5 text-xs font-bold text-purple-300 shadow-sm">
              <Calendar className="mr-2 h-4 w-4 text-purple-400" />
              <span>{activeMonthLabel}</span>
            </div>

            {/* User Profile & Password Change */}
            {currentUser && (
              <div className="flex items-center gap-2 border-l border-slate-800 pl-2">
                <div className="flex items-center gap-1.5 rounded-xl border border-purple-500/30 bg-purple-500/10 px-2.5 py-1 text-xs font-bold text-purple-300">
                  <User className="h-3.5 w-3.5" />
                  <span>{currentUser}</span>
                </div>

                <button
                  onClick={openChangePasswordModal}
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:text-purple-300 hover:bg-purple-500/10 transition-all border border-transparent hover:border-purple-500/20"
                  title="Alterar Senha do Perfil"
                >
                  <KeyRound className="h-4 w-4 text-purple-400" />
                </button>

                <button
                  onClick={logout}
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-all"
                  title="Sair"
                >
                  <LogOut className="h-4 w-4" />
                </button>
              </div>
            )}

          </div>

        </div>
      </div>

      {/* Mobile Tab Navigation */}
      <div className="flex md:hidden border-t border-slate-800/60 bg-slate-950 px-4 py-2 justify-around">
        <button
          onClick={() => setActiveTab('dashboard')}
          className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg ${
            activeTab === 'dashboard' ? 'bg-purple-600 text-white' : 'text-slate-400'
          }`}
        >
          <LayoutDashboard className="h-3.5 w-3.5" />
          Resumo
        </button>
        <button
          onClick={() => setActiveTab('receitas')}
          className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg ${
            activeTab === 'receitas' ? 'bg-purple-600 text-white' : 'text-slate-400'
          }`}
        >
          <DollarSign className="h-3.5 w-3.5" />
          Receitas
        </button>
        <button
          onClick={() => setActiveTab('gastos')}
          className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg ${
            activeTab === 'gastos' ? 'bg-purple-600 text-white' : 'text-slate-400'
          }`}
        >
          <Receipt className="h-3.5 w-3.5" />
          Gastos
        </button>
      </div>
    </header>
  );
};
