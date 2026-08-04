import React from 'react';
import { useFinancial, MONTH_NAMES } from '../context/FinancialContext';
import { 
  TrendingUp, 
  DollarSign, 
  Receipt, 
  PieChart as PieIcon, 
  Wallet, 
  Users,
  HandCoins
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
    recipients,
    currentYear,
    currentMonthNum,
    currentMonthKey, 
    allRevenues, 
    allExpenses,
    allRecipients,
    liveExchangeRate
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

  // Recipients / Commissions Totals (Abatidos da Receita Viral FX)
  const totalRecebedoresBRL = recipients.reduce((acc, item) => {
    const matchedRev = revenues.find(r => r.channel.toLowerCase().trim() === (item.canal || '').toLowerCase().trim());
    if (!matchedRev) return acc;
    const fatUSD = parseFloat(matchedRev.faturamentoUSD) || 0;
    const cambio = parseFloat(matchedRev.cambio) || liveExchangeRate;
    const pctViral = (parseFloat(matchedRev.porcentagemViral) !== undefined ? parseFloat(matchedRev.porcentagemViral) : 100) / 100;
    const viralUSD = fatUSD * pctViral;
    const recPct = (parseFloat(item.porcentagem) || 0) / 100;
    const payoutBRL = viralUSD * recPct * cambio;
    return acc + (isNaN(payoutBRL) ? 0 : payoutBRL);
  }, 0);

  // Profit (Lucro Líquido = Receita Viral FX - Gastos - Recebedores)
  const lucroLiquidoBRL = receitaViralFXBRL - (totalGastosBRL + totalRecebedoresBRL);
  const margemLucro = (receitaViralFXBRL > 0 && !isNaN(lucroLiquidoBRL)) 
    ? (lucroLiquidoBRL / receitaViralFXBRL) * 100 
    : 0;

  // Acerto de Contas 50/50
  const gastosFabio = expenses
    .filter(e => e.pagoPor === 'Fabio' || e.pagoPor === 'Fábio')
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

  // Prepare monthly historical trend data strictly for currentYear
  const activeYear = currentYear || '2026';
  const shortYear = activeYear.substring(2);

  const monthlyTrendData = MONTH_NAMES.map(m => {
    const key = `${activeYear}-${m.num}`;
    const mRevenues = allRevenues[key] || [];
    const mExpenses = allExpenses[key] || [];
    const mRecipients = allRecipients[key] || [];

    const revBRL = mRevenues.reduce((acc, r) => {
      const val = (parseFloat(r.parteViralUSD) || 0) * (parseFloat(r.cambio) || 0);
      return acc + (isNaN(val) ? 0 : val);
    }, 0);

    const expBRL = mExpenses.reduce((acc, e) => {
      const val = parseFloat(e.valorBRL) || 0;
      return acc + (isNaN(val) ? 0 : val);
    }, 0);

    const recBRL = mRecipients.reduce((acc, item) => {
      const matchedRev = mRevenues.find(r => r.channel.toLowerCase().trim() === (item.canal || '').toLowerCase().trim());
      if (!matchedRev) return acc;
      const fatUSD = parseFloat(matchedRev.faturamentoUSD) || 0;
      const cambio = parseFloat(matchedRev.cambio) || liveExchangeRate;
      const pctViral = (parseFloat(matchedRev.porcentagemViral) !== undefined ? parseFloat(matchedRev.porcentagemViral) : 100) / 100;
      const viralUSD = fatUSD * pctViral;
      const recPct = (parseFloat(item.porcentagem) || 0) / 100;
      const payoutBRL = viralUSD * recPct * cambio;
      return acc + (isNaN(payoutBRL) ? 0 : payoutBRL);
    }, 0);

    const profitBRL = revBRL - (expBRL + recBRL);

    return {
      monthKey: key,
      label: `${m.short}/${shortYear}`,
      Receita: Math.round(isNaN(revBRL) ? 0 : revBRL),
      Saídas: Math.round((isNaN(expBRL) ? 0 : expBRL) + (isNaN(recBRL) ? 0 : recBRL)),
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
            Divisão Sócios: 50% Fabio / 50% Luiz
          </div>
        </div>
      </div>

      {/* Top KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
        
        {/* Faturamento Total */}
        <div className="glass-card glass-card-hover p-5 rounded-3xl relative overflow-hidden">
          <div className="absolute right-3 top-3 h-10 w-10 rounded-2xl bg-cyan-500/10 flex items-center justify-center border border-cyan-500/20">
            <DollarSign className="h-5 w-5 text-cyan-400" />
          </div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Faturamento Bruto</span>
          <p className="mt-2 text-xl font-black text-white">{formatCurrency(faturamentoTotalBRL)}</p>
          <p className="mt-1 text-[10px] font-semibold text-slate-400">Soma de todos canais</p>
        </div>

        {/* Receita Viral FX */}
        <div className="glass-card glass-card-hover p-5 rounded-3xl relative overflow-hidden">
          <div className="absolute right-3 top-3 h-10 w-10 rounded-2xl bg-purple-500/10 flex items-center justify-center border border-purple-500/20">
            <TrendingUp className="h-5 w-5 text-purple-400" />
          </div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Receita Viral FX</span>
          <p className="mt-2 text-xl font-black text-purple-300">{formatCurrency(receitaViralFXBRL)}</p>
          <p className="mt-1 text-[10px] font-semibold text-slate-400">Parte da empresa</p>
        </div>

        {/* Total Gastos */}
        <div className="glass-card glass-card-hover p-5 rounded-3xl relative overflow-hidden">
          <div className="absolute right-3 top-3 h-10 w-10 rounded-2xl bg-rose-500/10 flex items-center justify-center border border-rose-500/20">
            <Receipt className="h-5 w-5 text-rose-400" />
          </div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Total de Gastos</span>
          <p className="mt-2 text-xl font-black text-rose-400">{formatCurrency(totalGastosBRL)}</p>
          <p className="mt-1 text-[10px] font-semibold text-slate-400">Despesas operacionais</p>
        </div>

        {/* Total Recebedores */}
        <div className="glass-card glass-card-hover p-5 rounded-3xl relative overflow-hidden">
          <div className="absolute right-3 top-3 h-10 w-10 rounded-2xl bg-amber-500/10 flex items-center justify-center border border-amber-500/20">
            <HandCoins className="h-5 w-5 text-amber-400" />
          </div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Recebedores</span>
          <p className="mt-2 text-xl font-black text-amber-300">{formatCurrency(totalRecebedoresBRL)}</p>
          <p className="mt-1 text-[10px] font-semibold text-slate-400">Revenue share repassado</p>
        </div>

        {/* Lucro Líquido */}
        <div className="glass-card glass-card-hover p-5 rounded-3xl relative overflow-hidden">
          <div className="absolute right-3 top-3 h-10 w-10 rounded-2xl bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
            <Wallet className="h-5 w-5 text-emerald-400" />
          </div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Lucro Líquido</span>
          <p className={`mt-2 text-xl font-black ${lucroLiquidoBRL >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
            {formatCurrency(lucroLiquidoBRL)}
          </p>
          <p className="mt-1 text-[10px] font-semibold text-slate-400">
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
          <p className="text-xs text-slate-400 mt-1">Cálculo proporcional exato com base na receita Viral FX abatia de despesas e comissões</p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="bg-slate-950/80 text-xs font-bold uppercase tracking-wider text-slate-400 border-b border-slate-800">
              <tr>
                <th className="py-4 px-6">Sócio</th>
                <th className="py-4 px-6">Gastos Pagos</th>
                <th className="py-4 px-6">Parte Devida Gastos (50%)</th>
                <th className="py-4 px-6">Saldo Gastos</th>
                <th className="py-4 px-6">Lucro Devido (50%)</th>
                <th className="py-4 px-6 text-right">Resultado Final</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-medium">
              <tr className="hover:bg-slate-900/40 transition-colors">
                <td className="py-4 px-6 font-bold text-white flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full bg-purple-500"></div>
                  Fabio
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
            </tbody>
          </table>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Revenue Distribution Pie Chart */}
        <div className="glass-card p-6 rounded-3xl border border-slate-800 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <PieIcon className="h-5 w-5 text-purple-400" />
              <h3 className="text-lg font-bold text-white">Receita por Canal</h3>
            </div>
            <p className="text-xs text-slate-400 mb-4">Participação de cada canal na receita da empresa ({monthLabel})</p>
          </div>

          {pieChartData.length > 0 ? (
            <div className="h-64 w-full flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieChartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {pieChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value) => formatCurrency(value)}
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '1rem', color: '#fff' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-64 flex items-center justify-center text-xs text-slate-500">
              Nenhuma receita registrada neste mês
            </div>
          )}

          {/* Custom Legend */}
          <div className="grid grid-cols-2 gap-2 mt-4 pt-4 border-t border-slate-800 text-xs">
            {pieChartData.map((entry, index) => (
              <div key={entry.name} className="flex items-center gap-2">
                <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }}></div>
                <span className="text-slate-300 truncate font-semibold">{entry.name}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Monthly Financial Performance Trend Bar Chart */}
        <div className="glass-card p-6 rounded-3xl border border-slate-800 lg:col-span-2 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-cyan-400" />
                <h3 className="text-lg font-bold text-white">Evolução Mensal ({activeYear})</h3>
              </div>
              <span className="text-xs text-cyan-400 font-bold bg-cyan-500/10 border border-cyan-500/20 px-3 py-1 rounded-full">
                {activeYear}
              </span>
            </div>
            <p className="text-xs text-slate-400 mb-4">Comparativo histórico de Receita Viral FX vs Saídas vs Lucro em {activeYear}</p>
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyTrendData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                <XAxis dataKey="label" stroke="#64748b" fontSize={11} tickLine={false} />
                <YAxis stroke="#64748b" fontSize={11} tickFormatter={formatYAxis} tickLine={false} />
                <Tooltip 
                  formatter={(value) => formatCurrency(value)}
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '1rem', color: '#fff' }}
                />
                <Bar dataKey="Receita" fill="#a855f7" radius={[6, 6, 0, 0]} />
                <Bar dataKey="Saídas" fill="#f43f5e" radius={[6, 6, 0, 0]} />
                <Bar dataKey="Lucro" fill="#34d399" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="flex items-center justify-center gap-6 mt-4 pt-4 border-t border-slate-800 text-xs font-semibold">
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-md bg-purple-500"></div>
              <span className="text-slate-300">Receita Viral</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-md bg-rose-500"></div>
              <span className="text-slate-300">Total Saídas</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-md bg-emerald-400"></div>
              <span className="text-slate-300">Lucro Líquido</span>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
};
