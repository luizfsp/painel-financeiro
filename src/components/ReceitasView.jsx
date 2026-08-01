import React, { useState } from 'react';
import { useFinancial } from '../context/FinancialContext';
import { 
  Plus, 
  DollarSign, 
  Trash2, 
  Edit3, 
  RefreshCw, 
  Check, 
  X, 
  Globe, 
  ArrowUpRight 
} from 'lucide-react';

export const ReceitasView = () => {
  const { 
    revenues, 
    addRevenue, 
    updateRevenue, 
    deleteRevenue, 
    currentMonthKey, 
    months,
    liveExchangeRate 
  } = useFinancial();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);

  // Form State
  const [formData, setFormData] = useState({
    channel: '',
    faturamentoUSD: '',
    cambio: liveExchangeRate,
    parteViralUSD: '',
  });

  const activeMonthObj = months.find(m => m.key === currentMonthKey);
  const monthLabel = activeMonthObj ? activeMonthObj.label : currentMonthKey;

  const handleOpenAddModal = () => {
    setFormData({
      channel: '',
      faturamentoUSD: '',
      cambio: liveExchangeRate,
      parteViralUSD: '',
    });
    setEditingId(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (item) => {
    setFormData({
      channel: item.channel,
      faturamentoUSD: item.faturamentoUSD,
      cambio: item.cambio,
      parteViralUSD: item.parteViralUSD,
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
      parteViralUSD: parseFloat(formData.parteViralUSD !== '' ? formData.parteViralUSD : formData.faturamentoUSD || 0),
    };

    if (editingId) {
      updateRevenue(currentMonthKey, editingId, payload);
    } else {
      addRevenue(currentMonthKey, payload);
    }

    setIsModalOpen(false);
  };

  const applyLiveRateToAll = () => {
    revenues.forEach(r => {
      updateRevenue(currentMonthKey, r.id, { cambio: liveExchangeRate });
    });
  };

  // Calculations
  const totalUSD = revenues.reduce((acc, r) => acc + (r.faturamentoUSD || 0), 0);
  const totalBRL = revenues.reduce((acc, r) => acc + (r.faturamentoUSD * r.cambio), 0);
  const totalViralUSD = revenues.reduce((acc, r) => acc + (r.parteViralUSD || 0), 0);
  const totalViralBRL = revenues.reduce((acc, r) => acc + (r.parteViralUSD * r.cambio), 0);

  const formatCurrencyBRL = (val) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val || 0);
  const formatCurrencyUSD = (val) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val || 0);

  return (
    <div className="space-y-8">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 glass-card p-6 rounded-3xl border border-slate-800">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-cyan-400">Controle de Ganhos</span>
          <h1 className="text-2xl sm:text-3xl font-black text-white">Receitas por Canal — {monthLabel}</h1>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={applyLiveRateToAll}
            className="flex items-center gap-2 rounded-2xl border border-cyan-500/30 bg-cyan-500/10 px-4 py-2.5 text-xs font-bold text-cyan-300 hover:bg-cyan-500/20 transition-all"
            title="Aplicar cotação atual do dólar em todas as linhas"
          >
            <RefreshCw className="h-4 w-4" />
            Aplicar Dólar Atual (R$ {liveExchangeRate.toFixed(2)})
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
                <th className="py-4 px-6">Parte Viral FX (USD)</th>
                <th className="py-4 px-6">Parte Viral FX (BRL)</th>
                <th className="py-4 px-6 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-medium">
              {revenues.length > 0 ? (
                revenues.map((item) => {
                  const fatBRL = item.faturamentoUSD * item.cambio;
                  const viralBRL = item.parteViralUSD * item.cambio;

                  return (
                    <tr key={item.id} className="hover:bg-slate-900/50 transition-colors">
                      <td className="py-4 px-6 text-xs font-bold text-slate-400">{currentMonthKey}</td>
                      <td className="py-4 px-6 font-bold text-white flex items-center gap-2">
                        <Globe className="h-4 w-4 text-cyan-400" />
                        {item.channel}
                      </td>
                      <td className="py-4 px-6 text-slate-200">{formatCurrencyUSD(item.faturamentoUSD)}</td>
                      <td className="py-4 px-6 text-cyan-300 font-semibold">R$ {item.cambio?.toFixed(2)}</td>
                      <td className="py-4 px-6 text-slate-200 font-semibold">{formatCurrencyBRL(fatBRL)}</td>
                      <td className="py-4 px-6 text-purple-300">{formatCurrencyUSD(item.parteViralUSD)}</td>
                      <td className="py-4 px-6 text-emerald-400 font-bold">{formatCurrencyBRL(viralBRL)}</td>
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
                  <td colSpan="8" className="py-8 text-center text-slate-500 font-medium">
                    Nenhum canal de receita cadastrado para {monthLabel}.
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
                <label className="block text-xs font-bold uppercase text-slate-400 mb-1">Nome do Canal / Fonte</label>
                <input
                  type="text"
                  placeholder="Ex: Gaebe BS, Canal YT, Cliente X"
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
                  Parte Viral FX (USD) <span className="text-slate-500 font-normal">(Deixe em branco se for 100%)</span>
                </label>
                <input
                  type="number"
                  step="0.01"
                  placeholder={formData.faturamentoUSD || "0.00"}
                  value={formData.parteViralUSD}
                  onChange={(e) => setFormData({ ...formData, parteViralUSD: e.target.value })}
                  className="glass-input w-full rounded-xl px-4 py-2.5 text-sm"
                />
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
