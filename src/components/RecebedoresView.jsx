import React, { useState, useEffect } from 'react';
import { useFinancial, MONTH_NAMES } from '../context/FinancialContext';
import { 
  Plus, 
  Trash2, 
  Edit3, 
  X, 
  Repeat, 
  CheckCircle2,
  ArrowUpDown,
  Search,
  Users,
  Percent,
  DollarSign,
  Globe
} from 'lucide-react';

export const RecebedoresView = () => {
  const { 
    recipients, 
    revenues,
    addRecipient, 
    updateRecipient, 
    deleteRecipient, 
    propagateRecipients,
    currentUser,
    currentYear,
    currentMonthNum,
    currentMonthKey, 
    liveExchangeRate 
  } = useFinancial();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [successMsg, setSuccessMsg] = useState('');

  // Per-user sort preference persistence
  const sortStorageKey = `viralfx_sort_recebedores_${currentUser || 'guest'}`;

  const [sortBy, setSortBy] = useState(() => {
    return localStorage.getItem(sortStorageKey) || 'default';
  });

  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const savedSort = localStorage.getItem(sortStorageKey);
    setSortBy(savedSort || 'default');
  }, [currentUser]);

  const handleSortChange = (newSort) => {
    setSortBy(newSort);
    localStorage.setItem(sortStorageKey, newSort);
  };

  // Form State
  const [formData, setFormData] = useState({
    nome: '',
    canal: revenues.length > 0 ? revenues[0].channel : '',
    porcentagem: 10,
    observacao: '',
  });

  const activeMonthObj = MONTH_NAMES.find(m => m.num === currentMonthNum);
  const monthLabel = activeMonthObj ? `${activeMonthObj.full} / ${currentYear}` : currentMonthKey;

  const handleOpenAddModal = () => {
    setFormData({
      nome: '',
      canal: revenues.length > 0 ? revenues[0].channel : '',
      porcentagem: 10,
      observacao: '',
    });
    setEditingId(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (item) => {
    setFormData({
      nome: item.nome,
      canal: item.canal || '',
      porcentagem: item.porcentagem || 10,
      observacao: item.observacao || '',
    });
    setEditingId(item.id);
    setIsModalOpen(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const payload = {
      nome: formData.nome,
      canal: formData.canal,
      porcentagem: parseFloat(formData.porcentagem || 0),
      observacao: formData.observacao,
    };

    if (editingId) {
      updateRecipient(currentMonthKey, editingId, payload);
    } else {
      addRecipient(currentMonthKey, payload);
    }

    setIsModalOpen(false);
  };

  const handleImportRecipients = () => {
    const count = propagateRecipients(currentMonthKey);
    if (count > 0) {
      setSuccessMsg(`${count} recebedores foram importados do mês anterior com sucesso!`);
    } else {
      setSuccessMsg(`Todos os recebedores do mês anterior já estão cadastrados em ${monthLabel}.`);
    }
    setTimeout(() => setSuccessMsg(''), 4000);
  };

  // Helper to compute payout for a recipient item
  const calculateRecipientPayout = (item) => {
    const matchedRev = revenues.find(r => r.channel.toLowerCase().trim() === (item.canal || '').toLowerCase().trim());
    
    if (!matchedRev) {
      return { channelViralUSD: 0, channelViralBRL: 0, payoutUSD: 0, payoutBRL: 0 };
    }

    const fatUSD = parseFloat(matchedRev.faturamentoUSD) || 0;
    const cambio = parseFloat(matchedRev.cambio) || liveExchangeRate;
    const pctViral = (parseFloat(matchedRev.porcentagemViral) !== undefined ? parseFloat(matchedRev.porcentagemViral) : 100) / 100;
    
    const channelViralUSD = fatUSD * pctViral;
    const channelViralBRL = channelViralUSD * cambio;

    const pctRec = (parseFloat(item.porcentagem) || 0) / 100;
    const payoutUSD = channelViralUSD * pctRec;
    const payoutBRL = payoutUSD * cambio;

    return { channelViralUSD, channelViralBRL, payoutUSD, payoutBRL };
  };

  // KPI Calculations
  const totalPayoutUSD = recipients.reduce((acc, r) => acc + calculateRecipientPayout(r).payoutUSD, 0);
  const totalPayoutBRL = recipients.reduce((acc, r) => acc + calculateRecipientPayout(r).payoutBRL, 0);

  // Sorting & Filtering Recipients
  const filteredAndSortedRecipients = [...recipients]
    .filter(r => {
      const query = searchQuery.toLowerCase();
      return r.nome.toLowerCase().includes(query) || (r.canal || '').toLowerCase().includes(query);
    })
    .sort((a, b) => {
      const payoutA = calculateRecipientPayout(a).payoutBRL;
      const payoutB = calculateRecipientPayout(b).payoutBRL;

      const pctA = parseFloat(a.porcentagem) || 0;
      const pctB = parseFloat(b.porcentagem) || 0;

      if (sortBy === 'name_asc') return a.nome.localeCompare(b.nome);
      if (sortBy === 'name_desc') return b.nome.localeCompare(a.nome);
      if (sortBy === 'pct_desc') return pctB - pctA;
      if (sortBy === 'pct_asc') return pctA - pctB;
      if (sortBy === 'val_desc') return payoutB - payoutA;
      if (sortBy === 'val_asc') return payoutA - payoutB;
      return 0;
    });

  const formatCurrencyBRL = (val) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val || 0);
  const formatCurrencyUSD = (val) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val || 0);

  // Computed preview for Modal
  const modalMatchedRev = revenues.find(r => r.channel.toLowerCase().trim() === (formData.canal || '').toLowerCase().trim());
  const modalFatUSD = modalMatchedRev ? (parseFloat(modalMatchedRev.faturamentoUSD) || 0) : 0;
  const modalCambio = modalMatchedRev ? (parseFloat(modalMatchedRev.cambio) || liveExchangeRate) : liveExchangeRate;
  const modalPctViral = modalMatchedRev ? ((parseFloat(modalMatchedRev.porcentagemViral) !== undefined ? parseFloat(modalMatchedRev.porcentagemViral) : 100) / 100) : 1;
  const modalViralUSD = modalFatUSD * modalPctViral;
  const modalViralBRL = modalViralUSD * modalCambio;
  
  const modalRecPct = (parseFloat(formData.porcentagem) || 0) / 100;
  const modalPayoutUSD = modalViralUSD * modalRecPct;
  const modalPayoutBRL = modalPayoutUSD * modalCambio;

  return (
    <div className="space-y-8">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 glass-card p-6 rounded-3xl border border-slate-800">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-amber-400">Comissões & Parcerias</span>
          <h1 className="text-2xl sm:text-3xl font-black text-white">Recebedores — {monthLabel}</h1>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={handleImportRecipients}
            className="flex items-center gap-2 rounded-2xl border border-purple-500/30 bg-purple-500/10 px-4 py-2.5 text-xs font-bold text-purple-300 hover:bg-purple-500/20 transition-all shadow-md shadow-purple-500/10"
            title="Importar recebedores do mês anterior"
          >
            <Repeat className="h-4 w-4 text-purple-400" />
            Importar Recebedores do Mês Anterior
          </button>

          <button
            onClick={handleOpenAddModal}
            className="flex items-center gap-2 rounded-2xl bg-gradient-to-r from-amber-500 to-purple-600 px-5 py-2.5 text-xs font-bold text-white shadow-lg shadow-amber-500/20 hover:opacity-95 transition-all"
          >
            <Plus className="h-4 w-4" />
            Novo Recebedor
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

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        
        <div className="glass-card p-5 rounded-3xl border border-slate-800">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Pago a Recebedores (USD)</span>
          <p className="mt-2 text-2xl font-black text-amber-300">{formatCurrencyUSD(totalPayoutUSD)}</p>
        </div>

        <div className="glass-card p-5 rounded-3xl border border-slate-800">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Pago a Recebedores (BRL)</span>
          <p className="mt-2 text-2xl font-black text-rose-400">{formatCurrencyBRL(totalPayoutBRL)}</p>
          <span className="text-[10px] text-slate-400 font-semibold mt-1 block">Abatido diretamente do lucro total</span>
        </div>

        <div className="glass-card p-5 rounded-3xl border border-slate-800">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Total de Recebedores Ativos</span>
          <p className="mt-2 text-2xl font-black text-purple-300">{recipients.length}</p>
        </div>

      </div>

      {/* Search & Sort Filter Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 glass-card p-4 rounded-2xl border border-slate-800">
        <div className="relative flex-1 min-w-[200px] max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar por nome do recebedor ou canal..."
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
            onChange={(e) => handleSortChange(e.target.value)}
            className="glass-input rounded-xl px-3 py-2 text-xs text-white cursor-pointer font-semibold"
          >
            <option value="default" className="bg-slate-900">Ordem Padrão</option>
            <option value="name_asc" className="bg-slate-900">Nome (A → Z)</option>
            <option value="name_desc" className="bg-slate-900">Nome (Z → A)</option>
            <option value="val_desc" className="bg-slate-900">Valor Pago (Alto → Baixo)</option>
            <option value="val_asc" className="bg-slate-900">Valor Pago (Baixo → Alto)</option>
            <option value="pct_desc" className="bg-slate-900">Porcentagem (Maior → Menor)</option>
            <option value="pct_asc" className="bg-slate-900">Porcentagem (Menor → Maior)</option>
          </select>
        </div>
      </div>

      {/* Recipients Table */}
      <div className="glass-card rounded-3xl overflow-hidden border border-slate-800">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="bg-slate-950/80 text-xs font-bold uppercase tracking-wider text-slate-400 border-b border-slate-800">
              <tr>
                <th className="py-4 px-6">Nome do Recebedor</th>
                <th className="py-4 px-6">Canal Associado</th>
                <th className="py-4 px-6">Receita Viral FX do Canal</th>
                <th className="py-4 px-6">Comissão %</th>
                <th className="py-4 px-6">Valor Pago (USD)</th>
                <th className="py-4 px-6">Valor Pago (BRL)</th>
                <th className="py-4 px-6">Observação</th>
                <th className="py-4 px-6 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-medium">
              {filteredAndSortedRecipients.length > 0 ? (
                filteredAndSortedRecipients.map((item) => {
                  const { channelViralUSD, channelViralBRL, payoutUSD, payoutBRL } = calculateRecipientPayout(item);

                  return (
                    <tr key={item.id} className="hover:bg-slate-900/50 transition-colors">
                      <td className="py-4 px-6 font-bold text-white flex items-center gap-2">
                        <Users className="h-4 w-4 text-purple-400" />
                        {item.nome}
                      </td>
                      <td className="py-4 px-6 text-slate-300 font-semibold">
                        {item.canal ? (
                          <span className="flex items-center gap-1.5 text-cyan-300">
                            <Globe className="h-3.5 w-3.5" />
                            {item.canal}
                          </span>
                        ) : (
                          <span className="text-slate-500 italic">Nenhum canal</span>
                        )}
                      </td>
                      <td className="py-4 px-6 text-slate-400 text-xs">
                        {formatCurrencyUSD(channelViralUSD)} ({formatCurrencyBRL(channelViralBRL)})
                      </td>
                      <td className="py-4 px-6">
                        <span className="inline-flex items-center gap-1 font-bold text-amber-300 bg-amber-500/10 border border-amber-500/30 px-2.5 py-0.5 rounded-full text-xs">
                          <Percent className="h-3 w-3 text-amber-400" />
                          {item.porcentagem}%
                        </span>
                      </td>
                      <td className="py-4 px-6 text-amber-300 font-bold">{formatCurrencyUSD(payoutUSD)}</td>
                      <td className="py-4 px-6 text-rose-400 font-black">{formatCurrencyBRL(payoutBRL)}</td>
                      <td className="py-4 px-6 text-xs text-slate-400 max-w-[200px] truncate">{item.observacao || '—'}</td>
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
                            onClick={() => deleteRecipient(currentMonthKey, item.id)}
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
                    {searchQuery ? 'Nenhum recebedor encontrado com este termo.' : `Nenhum recebedor cadastrado para ${monthLabel}.`}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Add/Edit Recipient */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-md">
          <div className="w-full max-w-lg rounded-3xl border border-slate-800 bg-slate-900 p-6 shadow-2xl space-y-6">
            
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <h3 className="text-lg font-bold text-white">
                {editingId ? 'Editar Recebedor' : 'Adicionar Novo Recebedor'}
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
                <label className="block text-xs font-bold uppercase text-slate-400 mb-1">Nome da Pessoa / Parceiro</label>
                <input
                  type="text"
                  placeholder="Ex: Carlos Silva, Indicação Pedro"
                  value={formData.nome}
                  onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                  className="glass-input w-full rounded-xl px-4 py-2.5 text-sm"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-400 mb-1">Canal Associado</label>
                {revenues.length > 0 ? (
                  <select
                    value={formData.canal}
                    onChange={(e) => setFormData({ ...formData, canal: e.target.value })}
                    className="glass-input w-full rounded-xl px-4 py-2.5 text-sm cursor-pointer"
                  >
                    <option value="" className="bg-slate-900">Nenhum / Não associado</option>
                    {revenues.map(r => (
                      <option key={r.id} value={r.channel} className="bg-slate-900">
                        {r.channel}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="text"
                    placeholder="Digite o nome do canal"
                    value={formData.canal}
                    onChange={(e) => setFormData({ ...formData, canal: e.target.value })}
                    className="glass-input w-full rounded-xl px-4 py-2.5 text-sm"
                  />
                )}
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-400 mb-1">
                  Porcentagem da Comissão (%) <span className="text-amber-400 font-bold">(Ex: 10%, 15%, 5%)</span>
                </label>
                <div className="relative">
                  <Percent className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-amber-400" />
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="0.5"
                    placeholder="10"
                    value={formData.porcentagem}
                    onChange={(e) => setFormData({ ...formData, porcentagem: e.target.value })}
                    className="glass-input w-full rounded-xl pl-10 pr-4 py-2.5 text-sm font-bold text-amber-300"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-400 mb-1">Observação / Motivo (Opcional)</label>
                <input
                  type="text"
                  placeholder="Ex: Recomendação inicial, prospecção canal"
                  value={formData.observacao}
                  onChange={(e) => setFormData({ ...formData, observacao: e.target.value })}
                  className="glass-input w-full rounded-xl px-4 py-2.5 text-sm"
                />
              </div>

              {/* Real-time calculation preview box */}
              <div className="rounded-2xl bg-amber-500/10 border border-amber-500/20 p-4 space-y-1 text-xs">
                <span className="font-bold uppercase text-amber-300 block">Cálculo da Comissão da ViralFX ({formData.porcentagem || 0}%):</span>
                <div className="flex items-center justify-between text-slate-300">
                  <span>Receita Viral FX do Canal:</span>
                  <span className="font-bold text-white">{formatCurrencyUSD(modalViralUSD)} ({formatCurrencyBRL(modalViralBRL)})</span>
                </div>
                <div className="flex items-center justify-between text-slate-300">
                  <span>Comissão Devida ({formData.porcentagem || 0}%):</span>
                  <span className="font-bold text-rose-400">{formatCurrencyUSD(modalPayoutUSD)} ({formatCurrencyBRL(modalPayoutBRL)})</span>
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
                  className="rounded-xl bg-amber-500 px-5 py-2 text-sm font-bold text-slate-950 hover:bg-amber-400 shadow-lg shadow-amber-500/20"
                >
                  {editingId ? 'Salvar Alterações' : 'Adicionar Recebedor'}
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

    </div>
  );
};
