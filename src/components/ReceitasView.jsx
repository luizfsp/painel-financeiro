import React, { useState } from 'react';
import { useFinancial, MONTH_NAMES } from '../context/FinancialContext';
import { 
  Plus, 
  Trash2, 
  Edit3, 
  RefreshCw, 
  X, 
  Globe, 
  Percent,
  Repeat,
  CheckCircle2,
  ArrowUpDown,
  Search
} from 'lucide-react';

export const ReceitasView = () => {
  const { 
    revenues, 
    addRevenue, 
    updateRevenue, 
    deleteRevenue, 
    propagateRevenueChannels,
    currentYear,
    currentMonthNum,
    currentMonthKey, 
    liveExchangeRate 
  } = useFinancial();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [successMsg, setSuccessMsg] = useState('');

  // Filtering & Sorting State
  const [sortBy, setSortBy] = useState('default');
  const [searchQuery, setSearchQuery] = useState('');

  // Form State
  const [formData, setFormData] = useState({
    channel: '',
    faturamentoUSD: '',
    cambio: liveExchangeRate,
    porcentagemViral: 100,
  });

  const activeMonthObj = MONTH_NAMES.find(m => m.num === currentMonthNum);
  const monthLabel = activeMonthObj ? `${activeMonthObj.full} / ${currentYear}` : currentMonthKey;

  const handleOpenAddModal = () => {
    setFormData({
      channel: '',
      faturamentoUSD: '',
      cambio: liveExchangeRate,
      porcentagemViral: 100,
    });
    setEditingId(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (item) => {
    setFormData({
      channel: item.channel,
      faturamentoUSD: item.faturamentoUSD,
      cambio: item.cambio,
      porcentagemViral: item.porcentagemViral !== undefined ? item.porcentagemViral : 100,
    });
    setEditingId(item.id);
    setIsModalOpen(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const payload = {
      channel: formData.channel,
      faturamentoUSD: parseFloat(formData.faturamentoUSD || 0),
      cambio: parseFloat(formData.cambio || liveExchangeRate),
      porcentagemViral: parseFloat(formData.porcentagemViral !== '' ? formData.porcentagemViral : 100),
    };

    if (editingId) {
      updateRevenue(currentMonthKey, editingId, payload);
    } else {
      addRevenue(currentMonthKey, payload);
    }

    setIsModalOpen(false);
  };

  const handleImportChannels = () => {
    const count = propagateRevenueChannels(currentMonthKey);
    if (count > 0) {
      setSuccessMsg(`${count} canais de receita foram importados do mês anterior com sucesso!`);
    } else {
      setSuccessMsg(`Todos os canais do mês anterior já estão cadastrados em ${monthLabel}.`);
    }
    setTimeout(() => setSuccessMsg(''), 4000);
  };

  const applyLiveRateToAll = () => {
    revenues.forEach(r => {
      updateRevenue(currentMonthKey, r.id, { cambio: liveExchangeRate });
    });
  };

  // Calculations
  const totalUSD = revenues.reduce((acc, r) => acc + (parseFloat(r.faturamentoUSD) || 0), 0);
  const totalBRL = revenues.reduce((acc, r) => acc + ((parseFloat(r.faturamentoUSD) || 0) * (parseFloat(r.cambio) || 0)), 0);
  const totalViralUSD = revenues.reduce((acc, r) => {
    const pct = (parseFloat(r.porcentagemViral) !== undefined ? parseFloat(r.porcentagemViral) : 100) / 100;
    return acc + ((parseFloat(r.faturamentoUSD) || 0) * pct);
  }, 0);
  const totalViralBRL = revenues.reduce((acc, r) => {
    const pct = (parseFloat(r.porcentagemViral) !== undefined ? parseFloat(r.porcentagemViral) : 100) / 100;
    return acc + ((parseFloat(r.faturamentoUSD) || 0) * pct * (parseFloat(r.cambio) || 0));
  }, 0);

  // Sorting & Filtering Revenues List
  const filteredAndSortedRevenues = [...revenues]
    .filter(r => r.channel.toLowerCase().includes(searchQuery.toLowerCase()))
    .sort((a, b) => {
      const fatUSD_A = parseFloat(a.faturamentoUSD) || 0;
      const fatUSD_B = parseFloat(b.faturamentoUSD) || 0;

      const pctA = (parseFloat(a.porcentagemViral) !== undefined ? parseFloat(a.porcentagemViral) : 100) / 100;
      const pctB = (parseFloat(b.porcentagemViral) !== undefined ? parseFloat(b.porcentagemViral) : 100) / 100;

      const viralUSD_A = fatUSD_A * pctA;
      const viralUSD_B = fatUSD_B * pctB;

      if (sortBy === 'name_asc') return a.channel.localeCompare(b.channel);
      if (sortBy === 'name_desc') return b.channel.localeCompare(a.channel);
      if (sortBy === 'val_desc') return fatUSD_B - fatUSD_A;
      if (sortBy === 'val_asc') return fatUSD_A - fatUSD_B;
      if (sortBy === 'viral_desc') return viralUSD_B - viralUSD_A;
      return 0;
    });

  const formatCurrencyBRL = (val) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val || 0);
  const formatCurrencyUSD = (val) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val || 0);

  // Computed values for preview in Modal
  const previewFatUSD = parseFloat(formData.faturamentoUSD || 0);
  const previewCambio = parseFloat(formData.cambio || liveExchangeRate);
  const previewPct = parseFloat(formData.porcentagemViral !== '' ? formData.porcentagemViral : 100);
  const previewParteUSD = previewFatUSD * (previewPct / 100);
  const previewParteBRL = previewParteUSD * previewCambio;

  return (
    <div className="space-y-8">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 glass-card p-6 rounded-3xl border border-slate-800">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-cyan-400">Controle de Ganhos</span>
          <h1 className="text-2xl sm:text-3xl font-black text-white">Receitas por Canal — {monthLabel}</h1>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={handleImportChannels}
            className="flex items-center gap-2 rounded-2xl border border-purple-500/30 bg-purple-500/10 px-4 py-2.5 text-xs font-bold text-purple-300 hover:bg-purple-500/20 transition-all shadow-md shadow-purple-500/10"
            title="Importar canais de receita do mês anterior"
          >
            <Repeat className="h-4 w-4 text-purple-400" />
            Importar Canais do Mês Anterior
          </button>

          <button
            onClick={applyLiveRateToAll}
            className="flex items-center gap-2 rounded-2xl border border-cyan-500/30 bg-cyan-500/10 px-4 py-2.5 text-xs font-bold text-cyan-300 hover:bg-cyan-500/20 transition-all"
            title="Aplicar cotação atual do dólar em todas as linhas"
          >
            <RefreshCw className="h-4 w-4" />
            Aplicar Dólar (R$ {liveExchangeRate.toFixed(2)})
          </button>

          <button
            onClick={handleOpenAddModal}
            className="flex items-center gap-2 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 px-5 py-2.5 text-xs font-bold text-white shadow-lg shadow-purple-600/30 hover:opacity-95 transition-all"
          >
            <Plus className="h-4 w-4" />
            Adicionar Canal
          </button>
        </div>
      </div>

      {/* Success Notification */}
      {successMsg && (
        <div className="flex items-center gap-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 p-4 text-sm font-semibold text-emerald-300">
          <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-400" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        
        <div className="glass-card p-5 rounded-3xl border border-slate-800">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Faturamento (USD)</span>
          <p className="mt-2 text-2xl font-black text-white">{formatCurrencyUSD(totalUSD)}</p>
        </div>

        <div className="glass-card p-5 rounded-3xl border border-slate-800">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Faturamento (BRL)</span>
          <p className="mt-2 text-2xl font-black text-cyan-400">{formatCurrencyBRL(totalBRL)}</p>
        </div>

        <div className="glass-card p-5 rounded-3xl border border-slate-800">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Parte Viral FX (USD)</span>
          <p className="mt-2 text-2xl font-black text-purple-300">{formatCurrencyUSD(totalViralUSD)}</p>
        </div>

        <div className="glass-card p-5 rounded-3xl border border-slate-800">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Parte Viral FX (BRL)</span>
          <p className="mt-2 text-2xl font-black text-emerald-400">{formatCurrencyBRL(totalViralBRL)}</p>
        </div>

      </div>

      {/* Search & Sort Filter Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 glass-card p-4 rounded-2xl border border-slate-800">
        <div className="relative flex-1 min-w-[200px] max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar por nome do canal / criador..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="glass-input w-full rounded-xl pl-10 pr-4 py-2 text-xs text-white placeholder-slate-500"
          />
        </div>

        <div className="flex items-center gap-2 text-xs font-medium">
          <ArrowUpDown className="h-4 w-4 text-purple-400" />
          <span className="text-slate-400">Ordenar por:</span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="glass-input rounded-xl px-3 py-2 text-xs text-white cursor-pointer font-semibold"
          >
            <option value="default" className="bg-slate-900">Ordem Padrão</option>
            <option value="name_asc" className="bg-slate-900">Nome (A → Z)</option>
            <option value="name_desc" className="bg-slate-900">Nome (Z → A)</option>
            <option value="val_desc" className="bg-slate-900">Faturamento (Alto → Baixo)</option>
            <option value="val_asc" className="bg-slate-900">Faturamento (Baixo → Alto)</option>
            <option value="viral_desc" className="bg-slate-900">Maior Parte Viral FX</option>
          </select>
        </div>
      </div>

      {/* Revenues Table */}
      <div className="glass-card rounded-3xl overflow-hidden border border-slate-800">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="bg-slate-950/80 text-xs font-bold uppercase tracking-wider text-slate-400 border-b border-slate-800">
              <tr>
                <th className="py-4 px-6">Mês</th>
                <th className="py-4 px-6">Canal / Fonte</th>
                <th className="py-4 px-6">Faturamento USD</th>
                <th className="py-4 px-6">Câmbio</th>
                <th className="py-4 px-6">Faturamento BRL</th>
                <th className="py-4 px-6">Participação %</th>
                <th className="py-4 px-6">Parte Viral FX (USD)</th>
                <th className="py-4 px-6">Parte Viral FX (BRL)</th>
                <th className="py-4 px-6 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-medium">
              {filteredAndSortedRevenues.length > 0 ? (
                filteredAndSortedRevenues.map((item) => {
                  const fatUSD = parseFloat(item.faturamentoUSD) || 0;
                  const cambio = parseFloat(item.cambio) || liveExchangeRate;
                  const pct = item.porcentagemViral !== undefined ? parseFloat(item.porcentagemViral) : 100;
                  
                  const fatBRL = fatUSD * cambio;
                  const parteUSD = fatUSD * (pct / 100);
                  const parteBRL = parteUSD * cambio;

                  return (
                    <tr key={item.id} className="hover:bg-slate-900/50 transition-colors">
                      <td className="py-4 px-6 text-xs font-bold text-slate-400">{currentMonthKey}</td>
                      <td className="py-4 px-6 font-bold text-white flex items-center gap-2">
                        <Globe className="h-4 w-4 text-cyan-400" />
                        {item.channel}
                      </td>
                      <td className="py-4 px-6 text-slate-200">{formatCurrencyUSD(fatUSD)}</td>
                      <td className="py-4 px-6 text-cyan-300 font-semibold">R$ {cambio.toFixed(2)}</td>
                      <td className="py-4 px-6 text-slate-200 font-semibold">{formatCurrencyBRL(fatBRL)}</td>
                      <td className="py-4 px-6">
                        <span className="inline-flex items-center gap-1 font-bold text-purple-300 bg-purple-500/10 border border-purple-500/30 px-2.5 py-0.5 rounded-full text-xs">
                          <Percent className="h-3 w-3 text-purple-400" />
                          {pct}%
                        </span>
                      </td>
                      <td className="py-4 px-6 text-purple-300">{formatCurrencyUSD(parteUSD)}</td>
                      <td className="py-4 px-6 text-emerald-400 font-bold">{formatCurrencyBRL(parteBRL)}</td>
                      <td className="py-4 px-6 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleOpenEditModal(item)}
                            className="p-2 rounded-xl text-slate-400 hover:text-cyan-400 hover:bg-cyan-500/10 transition-all"
                            title="Editar"
                          >
                            <Edit3 className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => deleteRevenue(currentMonthKey, item.id)}
                            className="p-2 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-all"
                            title="Excluir"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="9" className="py-8 text-center text-slate-500 font-medium">
                    {searchQuery ? 'Nenhum canal encontrado com este termo.' : `Nenhum canal de receita cadastrado para ${monthLabel}.`}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Add/Edit Revenue */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-md">
          <div className="w-full max-w-lg rounded-3xl border border-slate-800 bg-slate-900 p-6 shadow-2xl space-y-6">
            
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <h3 className="text-lg font-bold text-white">
                {editingId ? 'Editar Canal de Receita' : 'Adicionar Novo Canal de Receita'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              
              <div>
                <label className="block text-xs font-bold uppercase text-slate-400 mb-1">Nome do Canal / Fonte / Criador</label>
                <input
                  type="text"
                  placeholder="Ex: Gaebe BS, Geludo, Cliente X"
                  value={formData.channel}
                  onChange={(e) => setFormData({ ...formData, channel: e.target.value })}
                  className="glass-input w-full rounded-xl px-4 py-2.5 text-sm"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-400 mb-1">Faturamento USD ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={formData.faturamentoUSD}
                    onChange={(e) => setFormData({ ...formData, faturamentoUSD: e.target.value })}
                    className="glass-input w-full rounded-xl px-4 py-2.5 text-sm"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-slate-400 mb-1">Taxa Câmbio (USD-BRL)</label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder={liveExchangeRate.toString()}
                    value={formData.cambio}
                    onChange={(e) => setFormData({ ...formData, cambio: e.target.value })}
                    className="glass-input w-full rounded-xl px-4 py-2.5 text-sm"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-400 mb-1">
                  Porcentagem Viral FX (%) <span className="text-purple-400 font-bold">(Ex: 100%, 70%, 50%)</span>
                </label>
                <div className="relative">
                  <Percent className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-purple-400" />
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="1"
                    placeholder="100"
                    value={formData.porcentagemViral}
                    onChange={(e) => setFormData({ ...formData, porcentagemViral: e.target.value })}
                    className="glass-input w-full rounded-xl pl-10 pr-4 py-2.5 text-sm font-bold text-purple-300"
                    required
                  />
                </div>
              </div>

              {/* Real-time preview box */}
              <div className="rounded-2xl bg-purple-500/10 border border-purple-500/20 p-4 space-y-1 text-xs">
                <span className="font-bold uppercase text-purple-300 block">Cálculo Automático Viral FX ({previewPct}%):</span>
                <div className="flex items-center justify-between text-slate-300">
                  <span>Parte Viral (USD):</span>
                  <span className="font-bold text-white">{formatCurrencyUSD(previewParteUSD)}</span>
                </div>
                <div className="flex items-center justify-between text-slate-300">
                  <span>Parte Viral (BRL):</span>
                  <span className="font-bold text-emerald-400">{formatCurrencyBRL(previewParteBRL)}</span>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-xl border border-slate-700 px-4 py-2 text-sm text-slate-400 hover:bg-slate-800"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-purple-600 px-5 py-2 text-sm font-bold text-white hover:bg-purple-500 shadow-lg shadow-purple-600/30"
                >
                  {editingId ? 'Salvar Alterações' : 'Adicionar Canal'}
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

    </div>
  );
};
