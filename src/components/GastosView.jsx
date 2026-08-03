import React, { useState, useEffect } from 'react';
import { useFinancial } from '../context/FinancialContext';
import { 
  Plus, 
  Trash2, 
  Edit3, 
  X, 
  Filter, 
  Repeat, 
  CheckCircle2,
  ArrowUpDown,
  Search
} from 'lucide-react';

export const GastosView = () => {
  const { 
    expenses, 
    addExpense, 
    updateExpense, 
    deleteExpense, 
    propagateFixedExpenses,
    partners, 
    currentUser,
    months,
    currentMonthKey 
  } = useFinancial();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [filterCategory, setFilterCategory] = useState('Todos');
  const [filterPayer, setFilterPayer] = useState('Todos');
  
  // Per-user sort preference persistence
  const sortStorageKey = `viralfx_sort_gastos_${currentUser || 'guest'}`;

  const [sortBy, setSortBy] = useState(() => {
    return localStorage.getItem(sortStorageKey) || 'default';
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Synchronize sort state when switching user profiles
  useEffect(() => {
    const savedSort = localStorage.getItem(sortStorageKey);
    setSortBy(savedSort || 'default');
  }, [currentUser]);

  const handleSortChange = (newSort) => {
    setSortBy(newSort);
    localStorage.setItem(sortStorageKey, newSort);
  };

  const [formData, setFormData] = useState({
    vencimento: `${currentMonthKey}-01`,
    descricao: '',
    categoria: 'Fixo',
    pagoPor: currentUser || 'Fabio',
    valorBRL: '',
  });

  const activeMonthObj = months.find(m => m.key === currentMonthKey);
  const monthLabel = activeMonthObj ? activeMonthObj.label : currentMonthKey;

  const handleOpenAddModal = () => {
    setFormData({
      vencimento: `${currentMonthKey}-01`,
      descricao: '',
      categoria: 'Fixo',
      pagoPor: currentUser || 'Fabio',
      valorBRL: '',
    });
    setEditingId(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (item) => {
    setFormData({
      vencimento: item.vencimento,
      descricao: item.descricao,
      categoria: item.categoria,
      pagoPor: item.pagoPor,
      valorBRL: item.valorBRL,
    });
    setEditingId(item.id);
    setIsModalOpen(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const payload = {
      vencimento: formData.vencimento,
      descricao: formData.descricao,
      categoria: formData.categoria,
      pagoPor: formData.pagoPor,
      valorBRL: parseFloat(formData.valorBRL || 0),
    };

    if (editingId) {
      updateExpense(currentMonthKey, editingId, payload);
    } else {
      addExpense(currentMonthKey, payload);
    }

    setIsModalOpen(false);
  };

  const handleReplicateFixedCosts = () => {
    const count = propagateFixedExpenses(currentMonthKey);
    if (count > 0) {
      setSuccessMessage(`${count} custos fixos foram importados do mês anterior com sucesso!`);
    } else {
      setSuccessMessage(`Todos os custos fixos do mês anterior já estão cadastrados em ${monthLabel}.`);
    }
    setTimeout(() => setSuccessMessage(''), 4000);
  };

  // Filter & Sort Logic
  const filteredAndSortedExpenses = expenses
    .filter(e => {
      const matchCategory = filterCategory === 'Todos' || e.categoria === filterCategory;
      const matchPayer = filterPayer === 'Todos' || e.pagoPor === filterPayer || (filterPayer === 'Fabio' && e.pagoPor === 'Fábio');
      const matchSearch = e.descricao.toLowerCase().includes(searchQuery.toLowerCase());
      return matchCategory && matchPayer && matchSearch;
    })
    .sort((a, b) => {
      const valA = parseFloat(a.valorBRL) || 0;
      const valB = parseFloat(b.valorBRL) || 0;

      if (sortBy === 'name_asc') return a.descricao.localeCompare(b.descricao);
      if (sortBy === 'name_desc') return b.descricao.localeCompare(a.descricao);
      if (sortBy === 'val_desc') return valB - valA;
      if (sortBy === 'val_asc') return valA - valB;
      if (sortBy === 'date_asc') return (a.vencimento || '').localeCompare(b.vencimento || '');
      if (sortBy === 'date_desc') return (b.vencimento || '').localeCompare(a.vencimento || '');
      return 0;
    });

  // KPI Calculations
  const totalBRL = expenses.reduce((acc, e) => acc + e.valorBRL, 0);
  const totalFixosBRL = expenses.filter(e => e.categoria === 'Fixo').reduce((acc, e) => acc + e.valorBRL, 0);
  const totalVariaveisBRL = expenses.filter(e => e.categoria === 'Variável').reduce((acc, e) => acc + e.valorBRL, 0);
  const totalFabioBRL = expenses.filter(e => e.pagoPor === 'Fabio' || e.pagoPor === 'Fábio').reduce((acc, e) => acc + e.valorBRL, 0);
  const totalLuizBRL = expenses.filter(e => e.pagoPor === 'Luiz').reduce((acc, e) => acc + e.valorBRL, 0);

  const formatCurrencyBRL = (val) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val || 0);

  return (
    <div className="space-y-8">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 glass-card p-6 rounded-3xl border border-slate-800">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-rose-400">Controle de Saídas</span>
          <h1 className="text-2xl sm:text-3xl font-black text-white">Gastos & Despesas — {monthLabel}</h1>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleReplicateFixedCosts}
            className="flex items-center gap-2 rounded-2xl border border-purple-500/30 bg-purple-500/10 px-4 py-2.5 text-xs font-bold text-purple-300 hover:bg-purple-500/20 transition-all shadow-md shadow-purple-500/10"
            title="Copiar custos fixos do mês anterior para o mês atual"
          >
            <Repeat className="h-4 w-4 text-purple-400" />
            Importar Custos Fixos Recorrentes
          </button>

          <button
            onClick={handleOpenAddModal}
            className="flex items-center gap-2 rounded-2xl bg-gradient-to-r from-rose-600 to-purple-600 px-5 py-2.5 text-xs font-bold text-white shadow-lg shadow-rose-600/30 hover:opacity-95 transition-all"
          >
            <Plus className="h-4 w-4" />
            Nova Despesa
          </button>
        </div>
      </div>

      {/* Success Notification */}
      {successMessage && (
        <div className="flex items-center gap-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 p-4 text-sm font-semibold text-emerald-300">
          <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-400" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
        
        <div className="glass-card p-5 rounded-3xl border border-slate-800">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Total de Despesas</span>
          <p className="mt-2 text-2xl font-black text-white">{formatCurrencyBRL(totalBRL)}</p>
        </div>

        <div className="glass-card p-5 rounded-3xl border border-slate-800">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Custos Fixos</span>
          <p className="mt-2 text-2xl font-black text-purple-300">{formatCurrencyBRL(totalFixosBRL)}</p>
        </div>

        <div className="glass-card p-5 rounded-3xl border border-slate-800">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Custos Variáveis</span>
          <p className="mt-2 text-2xl font-black text-amber-400">{formatCurrencyBRL(totalVariaveisBRL)}</p>
        </div>

        <div className="glass-card p-5 rounded-3xl border border-slate-800">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Pago por Fabio</span>
          <p className="mt-2 text-2xl font-black text-purple-400">{formatCurrencyBRL(totalFabioBRL)}</p>
        </div>

        <div className="glass-card p-5 rounded-3xl border border-slate-800">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Pago por Luiz</span>
          <p className="mt-2 text-2xl font-black text-cyan-400">{formatCurrencyBRL(totalLuizBRL)}</p>
        </div>

      </div>

      {/* Filter & Sort Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 glass-card p-4 rounded-2xl border border-slate-800">
        
        {/* Search Input */}
        <div className="relative flex-1 min-w-[200px] max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar por descrição do gasto / serviço..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="glass-input w-full rounded-xl pl-10 pr-4 py-2 text-xs text-white placeholder-slate-500"
          />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-4 text-xs font-medium">
          
          {/* Categoria */}
          <div className="flex items-center gap-2">
            <Filter className="h-3.5 w-3.5 text-purple-400" />
            <span className="text-slate-400">Categoria:</span>
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="glass-input rounded-xl px-3 py-1.5 text-xs text-white cursor-pointer"
            >
              <option value="Todos" className="bg-slate-900">Todas Categorias</option>
              <option value="Fixo" className="bg-slate-900">Apenas Fixos</option>
              <option value="Variável" className="bg-slate-900">Apenas Variáveis</option>
            </select>
          </div>

          {/* Pago Por */}
          <div className="flex items-center gap-2">
            <span className="text-slate-400">Pago Por:</span>
            <select
              value={filterPayer}
              onChange={(e) => setFilterPayer(e.target.value)}
              className="glass-input rounded-xl px-3 py-1.5 text-xs text-white cursor-pointer"
            >
              <option value="Todos" className="bg-slate-900">Todos Sócios</option>
              <option value="Fabio" className="bg-slate-900">Fabio</option>
              <option value="Luiz" className="bg-slate-900">Luiz</option>
            </select>
          </div>

          {/* Ordenação */}
          <div className="flex items-center gap-2">
            <ArrowUpDown className="h-3.5 w-3.5 text-purple-400" />
            <span className="text-slate-400">Ordenar por:</span>
            <select
              value={sortBy}
              onChange={(e) => handleSortChange(e.target.value)}
              className="glass-input rounded-xl px-3 py-1.5 text-xs text-white cursor-pointer font-semibold"
            >
              <option value="default" className="bg-slate-900">Ordem Padrão</option>
              <option value="name_asc" className="bg-slate-900">Descrição (A → Z)</option>
              <option value="name_desc" className="bg-slate-900">Descrição (Z → A)</option>
              <option value="val_desc" className="bg-slate-900">Valor (Alto → Baixo)</option>
              <option value="val_asc" className="bg-slate-900">Valor (Baixo → Alto)</option>
              <option value="date_asc" className="bg-slate-900">Vencimento (Mais Antigo)</option>
              <option value="date_desc" className="bg-slate-900">Vencimento (Mais Recente)</option>
            </select>
          </div>

        </div>
      </div>

      {/* Expenses Table */}
      <div className="glass-card rounded-3xl overflow-hidden border border-slate-800">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="bg-slate-950/80 text-xs font-bold uppercase tracking-wider text-slate-400 border-b border-slate-800">
              <tr>
                <th className="py-4 px-6">Vencimento</th>
                <th className="py-4 px-6">Descrição</th>
                <th className="py-4 px-6">Categoria</th>
                <th className="py-4 px-6">Pago Por</th>
                <th className="py-4 px-6">Valor (BRL)</th>
                <th className="py-4 px-6 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-medium">
              {filteredAndSortedExpenses.length > 0 ? (
                filteredAndSortedExpenses.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-900/50 transition-colors">
                    <td className="py-4 px-6 text-xs text-slate-400 font-semibold">{item.vencimento}</td>
                    <td className="py-4 px-6 font-bold text-white">{item.descricao}</td>
                    <td className="py-4 px-6">
                      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-bold border ${
                        item.categoria === 'Fixo'
                          ? 'bg-purple-500/10 text-purple-300 border-purple-500/30'
                          : 'bg-amber-500/10 text-amber-300 border-amber-500/30'
                      }`}>
                        {item.categoria}
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      <span className={`inline-flex items-center gap-1.5 font-bold ${
                        item.pagoPor === 'Fabio' || item.pagoPor === 'Fábio' ? 'text-purple-400' : 'text-cyan-400'
                      }`}>
                        <div className={`h-2.5 w-2.5 rounded-full ${item.pagoPor === 'Fabio' || item.pagoPor === 'Fábio' ? 'bg-purple-500' : 'bg-cyan-400'}`}></div>
                        {item.pagoPor}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-rose-400 font-bold">{formatCurrencyBRL(item.valorBRL)}</td>
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
                          onClick={() => deleteExpense(currentMonthKey, item.id)}
                          className="p-2 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-all"
                          title="Excluir"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="py-8 text-center text-slate-500 font-medium">
                    {searchQuery ? 'Nenhuma despesa encontrada com este termo.' : `Nenhuma despesa encontrada com os filtros selecionados para ${monthLabel}.`}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add/Edit Expense Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-md">
          <div className="w-full max-w-lg rounded-3xl border border-slate-800 bg-slate-900 p-6 shadow-2xl space-y-6">
            
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <h3 className="text-lg font-bold text-white">
                {editingId ? 'Editar Despesa' : 'Adicionar Nova Despesa'}
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
                <label className="block text-xs font-bold uppercase text-slate-400 mb-1">Descrição do Gasto / Serviço</label>
                <input
                  type="text"
                  placeholder="Ex: Contabilidade, Heygen, ADS Power"
                  value={formData.descricao}
                  onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                  className="glass-input w-full rounded-xl px-4 py-2.5 text-sm"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-400 mb-1">Valor (BRL)</label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={formData.valorBRL}
                    onChange={(e) => setFormData({ ...formData, valorBRL: e.target.value })}
                    className="glass-input w-full rounded-xl px-4 py-2.5 text-sm"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-slate-400 mb-1">Vencimento / Data</label>
                  <input
                    type="date"
                    value={formData.vencimento}
                    onChange={(e) => setFormData({ ...formData, vencimento: e.target.value })}
                    className="glass-input w-full rounded-xl px-4 py-2.5 text-sm"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-400 mb-1">Categoria</label>
                  <select
                    value={formData.categoria}
                    onChange={(e) => setFormData({ ...formData, categoria: e.target.value })}
                    className="glass-input w-full rounded-xl px-4 py-2.5 text-sm"
                  >
                    <option value="Fixo" className="bg-slate-900">Fixo (Recorrente)</option>
                    <option value="Variável" className="bg-slate-900">Variável</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-slate-400 mb-1">Pago Por</label>
                  <select
                    value={formData.pagoPor}
                    onChange={(e) => setFormData({ ...formData, pagoPor: e.target.value })}
                    className="glass-input w-full rounded-xl px-4 py-2.5 text-sm"
                  >
                    {partners.map(p => (
                      <option key={p} value={p} className="bg-slate-900">{p}</option>
                    ))}
                  </select>
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
                  {editingId ? 'Salvar Alterações' : 'Adicionar Despesa'}
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

    </div>
  );
};
