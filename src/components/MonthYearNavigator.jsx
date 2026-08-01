import React from 'react';
import { useFinancial, MONTH_NAMES } from '../context/FinancialContext';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react';

export const MonthYearNavigator = () => {
  const { 
    currentYear, 
    currentMonthNum, 
    selectMonth, 
    changeYear, 
    allRevenues, 
    allExpenses 
  } = useFinancial();

  const parsedY = parseInt(currentYear);
  const safeYearNum = (!isNaN(parsedY) && parsedY >= 2020 && parsedY <= 2035) ? parsedY : 2026;

  const handlePrevYear = () => {
    changeYear((safeYearNum - 1).toString());
  };

  const handleNextYear = () => {
    changeYear((safeYearNum + 1).toString());
  };

  const yearsList = [2024, 2025, 2026, 2027, 2028, 2029, 2030];

  return (
    <div className="glass-card rounded-3xl p-4 sm:p-5 border border-slate-800 space-y-4 shadow-xl">
      
      {/* Year Bar Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        
        <div className="flex items-center gap-2">
          <CalendarIcon className="h-5 w-5 text-purple-400" />
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block">Navegação de Período</span>
            <span className="text-xs text-slate-500 font-medium">Selecione o ano e o mês desejado</span>
          </div>
        </div>

        {/* Year Controls */}
        <div className="flex items-center gap-2 bg-slate-950/90 rounded-2xl p-1.5 border border-slate-800 self-start sm:self-auto shadow-inner">
          <button
            onClick={handlePrevYear}
            className="flex h-9 w-9 items-center justify-center rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-all"
            title="Ano Anterior"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>

          <div className="flex items-center gap-1.5 px-2">
            <span className="text-xs font-bold text-slate-400 uppercase">Ano:</span>
            <select
              value={safeYearNum.toString()}
              onChange={(e) => changeYear(e.target.value)}
              className="bg-transparent text-base font-black text-cyan-400 focus:outline-none cursor-pointer text-center"
            >
              {yearsList.map(y => (
                <option key={y} value={y.toString()} className="bg-slate-900 text-slate-200 font-bold">
                  {y}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={handleNextYear}
            className="flex h-9 w-9 items-center justify-center rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-all"
            title="Próximo Ano"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>

      </div>

      {/* 12 Months Grid */}
      <div className="grid grid-cols-3 sm:grid-cols-6 lg:grid-cols-12 gap-2">
        {MONTH_NAMES.map((m) => {
          const isSelected = currentMonthNum === m.num;
          const monthKey = `${safeYearNum}-${m.num}`;
          
          const hasRevenues = (allRevenues[monthKey] || []).length > 0;
          const hasExpenses = (allExpenses[monthKey] || []).length > 0;
          const hasData = hasRevenues || hasExpenses;

          return (
            <button
              key={m.num}
              onClick={() => selectMonth(m.num, safeYearNum.toString())}
              className={`relative flex flex-col items-center justify-center p-3 rounded-2xl border transition-all ${
                isSelected
                  ? 'bg-gradient-to-b from-purple-600 to-indigo-600 border-purple-400 text-white shadow-lg shadow-purple-600/30 scale-105 z-10 font-bold'
                  : hasData
                    ? 'bg-slate-900/90 border-slate-700/80 text-slate-200 hover:border-purple-500/50 hover:bg-slate-800/80'
                    : 'bg-slate-950/40 border-slate-800/60 text-slate-500 hover:border-slate-700 hover:text-slate-300'
              }`}
            >
              <span className={`text-xs font-black tracking-wide ${isSelected ? 'text-white' : 'text-slate-300'}`}>
                {m.short}
              </span>
              <span className={`text-[10px] mt-0.5 font-medium ${isSelected ? 'text-purple-200' : 'text-slate-500'}`}>
                {m.num}
              </span>

              {/* Data indicator dot */}
              {hasData && (
                <div 
                  className={`absolute top-2 right-2 h-1.5 w-1.5 rounded-full ${isSelected ? 'bg-cyan-300' : 'bg-emerald-400'}`}
                  title="Possui lançamentos cadastrados"
                ></div>
              )}
            </button>
          );
        })}
      </div>

    </div>
  );
};
