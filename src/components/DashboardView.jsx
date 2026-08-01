import React from 'react';
import { useFinancial, MONTH_NAMES } from '../context/FinancialContext';
import { 
  TrendingUp, 
  DollarSign, 
  Receipt, 
  PieChart as PieIcon, 
  ArrowRightLeft, 
  Wallet, 
  CheckCircle2, 
  AlertCircle,
  Users
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell 
} from 'recharts';

const COLORS = ['#a855f7', '#38bdf8', '#818cf8', '#34d399', '#f43f5e', '#fbbf24'];

export const DashboardView = () => {
  const { 
    revenues, 
    expenses, 
    currentYear,
    currentMonthNum,
    currentMonthKey, 
    allRevenues, 
    allExpenses 
  } = useFinancial();

  // Active month label
  const activeMonthObj = MONTH_NAMES.find(m => m.num === currentMonthNum);
  const monthLabel = activeMonthObj ? `${activeMonthObj.full} / ${currentYear}` : currentMonthKey;

  // Revenue Totals
  const faturamentoTotalBRL = revenues.reduce((acc, item) => {
    const brl = (parseFloat(item.faturamentoUSD) || 0) * (parseFloat(item.cambio) || 0);
    return acc + (isNaN(brl) ? 0 : brl);
  }, 0);

  const receitaViralFXBRL = revenues.reduce((acc, item) => {
    const brl = (parseFloat(item.parteViralUSD) || 0) * (parseFloat(item.cambio) || 0);
    return acc + (isNaN(brl) ? 0 : brl);
  }, 0);

  // Expense Totals
  const totalGastosBRL = expenses.reduce((acc, item) => acc + (parseFloat(item.valorBRL) || 0), 0);

  // Profit
  const lucroLiquidoBRL = receitaViralFXBRL - totalGastosBRL;
  const margemLucro = (receitaViralFXBRL > 0 && !isNaN(lucroLiquidoBRL)) 
    ? (lucroLiquidoBRL / receitaViralFXBRL) * 100 
    : 0;

  // Acerto de Contas 50/50
  const gastosFabio = expenses
    .filter(e => e.pagoPor === 'Fábio')
    .reduce((acc, e) => acc + (parseFloat(e.valorBRL) || 0), 0);

  const gastosLuiz = expenses
    .filter(e => e.pagoPor === 'Luiz')
    .reduce((acc, e) => acc + (parseFloat(e.valorBRL) || 0), 0);

  const parteDevidaGastos = totalGastosBRL / 2;

  const saldoGastosFabio = gastosFabio - parteDevidaGastos;
  const saldoGastosLuiz = gastosLuiz - parteDevidaGastos;

  const lucroFabio = lucroLiquidoBRL / 2;
  const lucroLuiz = lucroLiquidoBRL / 2;

  const resultadoFabio = saldoGastosFabio + lucroFabio;
  const resultadoLuiz = saldoGastosLuiz + lucroLuiz;

  // Transfer Settlement logic
  const difGastos = gastosFabio - gastosLuiz;

  // Prepare chart data for revenues by channel
  const channelDataMap = {};
  revenues.forEach(r => {
    const brl = (parseFloat(r.parteViralUSD) || 0) * (parseFloat(r.cambio) || 0);
    if (!isNaN(brl) && brl > 0) {
      channelDataMap[r.channel] = (channelDataMap[r.channel] || 0) + brl;
    }
  });
  const pieChartData = Object.keys(channelDataMap).map(channel => ({
    name: channel,
    value: channelDataMap[channel]
  }));

  // Prepare monthly historical trend data strictly for the 12 months of currentYear
  const activeYear = currentYear || '2026';
  const shortYear = activeYear.substring(2);

  const monthlyTrendData = MONTH_NAMES.map(m => {
    const key = `${activeYear}-${m.num}`;
    const mRevenues = allRevenues[key] || [];
    const mExpenses = allExpenses[key] || [];

    const revBRL = mRevenues.reduce((acc, r) => {
      const val = (parseFloat(r.parteViralUSD) || 0) * (parseFloat(r.cambio) || 0);
      return acc + (isNaN(val) ? 0 : val);
    }, 0);

    const expBRL = mExpenses.reduce((acc, e) => {
      const val = parseFloat(e.valorBRL) || 0;
      return acc + (isNaN(val) ? 0 : val);
    }, 0);

    const profitBRL = revBRL - expBRL;

    return {
      monthKey: key,
      label: `${m.short}/${shortYear}`,
      Receita: Math.round(isNaN(revBRL) ? 0 : revBRL),
      Gastos: Math.round(isNaN(expBRL) ? 0 : expBRL),
      Lucro: Math.round(isNaN(profitBRL) ? 0 : profitBRL)
    };
  });

  const formatCurrency = (val) => {
    const safeVal = (isNaN(val) || val === null || val === undefined) ? 0 : val;
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(safeVal);
  };

  const formatYAxis = (val) => {
    if (val === 0) return 'R$ 0';
    if (Math.abs(val) >= 1000) return `R$ ${(val / 1000).toFixed(0)}k`;
    return `R$ ${val}`;
  };

  return (
    <div className="space-y-8">

      {/* Month Title Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 glass-card p-6 rounded-3xl border border-slate-800">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-purple-400">Resumo Financeiro Mensal</span>
          <h1 className="text-2xl sm:text-3xl font-black text-white">{monthLabel}</h1>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 rounded-2xl bg-purple-500/10 border border-purple-500/20 px-4 py-2 text-xs font-bold text-purple-300">
            <Users className="h-4 w-4 text-purple-400" />
            Divisão Sócios: 50% Fábio / 50% Luiz
          </div>
        </div>
      </div>

      {/* Top KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        
        {/* Faturamento Total */}
        <div className="glass-card glass-card-hover p-6 rounded-3xl relative overflow-hidden">
          <div className="absolute right-3 top-3 h-12 w-12 rounded-2xl bg-cyan-500/10 flex items-center justify-center border border-cyan-500/20">
            <DollarSign className="h-6 w-6 text-cyan-400" />
          </div>
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Faturamento Total (Bruto)</span>
          <p className="mt-2 text-2xl font-black text-white">{formatCurrency(faturamentoTotalBRL)}</p>
          <p className="mt-1 text-xs font-semibold text-slate-400">Soma de todos os canais (USD convertidos)</p>
        </div>

        {/* Receita Viral FX */}
        <div className="glass-card glass-card-hover p-6 rounded-3xl relative overflow-hidden">
          <div className="absolute right-3 top-3 h-12 w-12 rounded-2xl bg-purple-500/10 flex items-center justify-center border border-purple-500/20">
            <TrendingUp className="h-6 w-6 text-purple-400" />
          </div>
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Receita Viral FX</span>
          <p className="mt-2 text-2xl font-black text-purple-300">{formatCurrency(receitaViralFXBRL)}</p>
          <p className="mt-1 text-xs font-semibold text-slate-400">Parte devida à empresa</p>
        </div>

        {/* Total Gastos */}
        <div className="glass-card glass-card-hover p-6 rounded-3xl relative overflow-hidden">
          <div className="absolute right-3 top-3 h-12 w-12 rounded-2xl bg-rose-500/10 flex items-center justify-center border border-rose-500/20">
            <Receipt className="h-6 w-6 text-rose-400" />
          </div>
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Total de Gastos</span>
          <p className="mt-2 text-2xl font-black text-rose-400">{formatCurrency(totalGastosBRL)}</p>
          <p className="mt-1 text-xs font-semibold text-slate-400">Custos Fixos + Variáveis do mês</p>
        </div>

        {/* Lucro Líquido */}
        <div className="glass-card glass-card-hover p-6 rounded-3xl relative overflow-hidden">
          <div className="absolute right-3 top-3 h-12 w-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
            <Wallet className="h-6 w-6 text-emerald-400" />
          </div>
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Lucro Líquido</span>
          <p className={`mt-2 text-2xl font-black ${lucroLiquidoBRL >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
            {formatCurrency(lucroLiquidoBRL)}
          </p>
          <p className="mt-1 text-xs font-semibold text-slate-400">
            Margem: <span className="text-emerald-400 font-bold">{isNaN(margemLucro) ? '0.0' : margemLucro.toFixed(1)}%</span>
          </p>
        </div>

      </div>



      {/* 50/50 Detailed Table */}
      <div className="glass-card rounded-3xl overflow-hidden border border-slate-800">
        <div className="p-6 border-b border-slate-800 bg-slate-900/60">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <Users className="h-5 w-5 text-purple-400" />
            Detalhamento do Acerto de Contas (50/50)
          </h3>
          <p className="text-xs text-slate-400 mt-1">Cálculo proporcional exato com base no faturamento e despesas do mês</p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="bg-slate-950/80 text-xs font-bold uppercase tracking-wider text-slate-400 border-b border-slate-800">
              <tr>
                <th className="py-4 px-6">Sócio</th>
                <th className="py-4 px-6">Gastos Pagos</th>
                <th className="py-4 px-6">Parte Devida (50%)</th>
                <th className="py-4 px-6">Saldo Gastos</th>
                <th className="py-4 px-6">Lucro Devido (50%)</th>
                <th className="py-4 px-6 text-right">Resultado Final</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-medium">
              <tr className="hover:bg-slate-900/40 transition-colors">
                <td className="py-4 px-6 font-bold text-white flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full bg-purple-500"></div>
                  Fábio
                </td>
                <td className="py-4 px-6 text-purple-300">{formatCurrency(gastosFabio)}</td>
                <td className="py-4 px-6 text-slate-400">{formatCurrency(parteDevidaGastos)}</td>
                <td className={`py-4 px-6 font-bold ${saldoGastosFabio >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {formatCurrency(saldoGastosFabio)}
                </td>
                <td className="py-4 px-6 text-emerald-400">{formatCurrency(lucroFabio)}</td>
                <td className="py-4 px-6 text-right font-black text-purple-300 text-base">
                  {formatCurrency(resultadoFabio)}
                </td>
              </tr>

              <tr className="hover:bg-slate-900/40 transition-colors">
                <td className="py-4 px-6 font-bold text-white flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full bg-cyan-400"></div>
                  Luiz
                </td>
                <td className="py-4 px-6 text-cyan-300">{formatCurrency(gastosLuiz)}</td>
                <td className="py-4 px-6 text-slate-400">{formatCurrency(parteDevidaGastos)}</td>
                <td className={`py-4 px-6 font-bold ${saldoGastosLuiz >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {formatCurrency(saldoGastosLuiz)}
                </td>
                <td className="py-4 px-6 text-emerald-400">{formatCurrency(lucroLuiz)}</td>
                <td className="py-4 px-6 text-right font-black text-cyan-300 text-base">
                  {formatCurrency(resultadoLuiz)}
                </td>
              </tr>

              <tr className="bg-slate-950 font-bold border-t-2 border-slate-800 text-white">
                <td className="py-4 px-6">Total Empresa</td>
                <td className="py-4 px-6 text-slate-200">{formatCurrency(totalGastosBRL)}</td>
                <td className="py-4 px-6 text-slate-200">{formatCurrency(totalGastosBRL)}</td>
                <td className="py-4 px-6 text-slate-400">R$ 0,00</td>
                <td className="py-4 px-6 text-emerald-400">{formatCurrency(lucroLiquidoBRL)}</td>
                <td className="py-4 px-6 text-right font-black text-white text-base">
                  {formatCurrency(lucroLiquidoBRL)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Visual Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Monthly Trend Bar Chart */}
        <div className="glass-card p-6 rounded-3xl border border-slate-800 lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-white">Evolução Mensal do Ano ({activeYear})</h3>
              <p className="text-xs text-slate-400">Comparativo cronológico de Jan/{shortYear} a Dez/{shortYear}</p>
            </div>
          </div>
          <div className="h-64 w-full pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyTrendData}>
                <XAxis dataKey="label" stroke="#64748b" fontSize={11} tickLine={false} />
                <YAxis stroke="#64748b" fontSize={11} tickLine={false} tickFormatter={formatYAxis} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '16px', color: '#fff' }}
                  formatter={(val) => formatCurrency(val)}
                />
                <Bar dataKey="Receita" fill="#a855f7" radius={[6, 6, 0, 0]} />
                <Bar dataKey="Gastos" fill="#f43f5e" radius={[6, 6, 0, 0]} />
                <Bar dataKey="Lucro" fill="#34d399" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Revenues by Channel Pie Chart */}
        <div className="glass-card p-6 rounded-3xl border border-slate-800 space-y-4 flex flex-col justify-between">
          <div>
            <h3 className="text-base font-bold text-white">Distribuição por Canal</h3>
            <p className="text-xs text-slate-400">Participação na receita do mês atual</p>
          </div>
          {pieChartData.length > 0 ? (
            <div className="h-56 w-full relative">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieChartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={80}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {pieChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '16px', color: '#fff' }}
                    formatter={(val) => formatCurrency(val)}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-56 flex items-center justify-center text-xs text-slate-500 font-medium">
              Nenhuma receita cadastrada neste mês
            </div>
          )}

          <div className="space-y-1.5 max-h-32 overflow-y-auto pr-1">
            {pieChartData.map((item, idx) => (
              <div key={item.name} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: COLORS[idx % COLORS.length] }}></div>
                  <span className="text-slate-300 font-medium">{item.name}</span>
                </div>
                <span className="font-bold text-white">{formatCurrency(item.value)}</span>
              </div>
            ))}
          </div>
        </div>

      </div>

    </div>
  );
};
