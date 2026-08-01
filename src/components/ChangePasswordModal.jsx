import React, { useState } from 'react';
import { useFinancial } from '../context/FinancialContext';
import { X, KeyRound, Lock, CheckCircle2, ShieldCheck } from 'lucide-react';

export const ChangePasswordModal = ({ isOpen, onClose }) => {
  const { changePassword, currentUser } = useFinancial();

  const [currentPass, setCurrentPass] = useState('');
  const [newPass, setNewPass] = useState('');
  const [confirmPass, setConfirmPass] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (newPass !== confirmPass) {
      setErrorMsg('A nova senha e a confirmação não coincidem.');
      return;
    }

    const res = changePassword(currentPass, newPass);
    if (!res.success) {
      setErrorMsg(res.error);
    } else {
      setSuccessMsg('Senha alterada com sucesso! A nova senha já está valendo.');
      setCurrentPass('');
      setNewPass('');
      setConfirmPass('');
      setTimeout(() => {
        setSuccessMsg('');
        onClose();
      }, 2000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-md">
      <div className="w-full max-w-md rounded-3xl border border-slate-800 bg-slate-900 p-6 shadow-2xl space-y-6">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-2">
            <KeyRound className="h-5 w-5 text-purple-400" />
            <h3 className="text-lg font-bold text-white">Alterar Senha do Perfil</h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <X className="h-5 w-5" />
          </button>
        </div>

        <p className="text-xs text-slate-400">
          Você está logado como <strong className="text-purple-300">{currentUser}</strong>. Ao alterar a senha, ela será atualizada para ambos os sócios.
        </p>

        {successMsg && (
          <div className="flex items-center gap-2 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 p-3 text-xs font-semibold text-emerald-300">
            <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />
            <span>{successMsg}</span>
          </div>
        )}

        {errorMsg && (
          <p className="text-xs font-medium text-rose-400 bg-rose-500/10 border border-rose-500/20 p-3 rounded-2xl text-center">
            {errorMsg}
          </p>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          
          <div>
            <label className="block text-xs font-bold uppercase text-slate-400 mb-1">
              Senha Atual
            </label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
              <input
                type="password"
                placeholder="Digite sua senha atual"
                value={currentPass}
                onChange={(e) => setCurrentPass(e.target.value)}
                className="glass-input w-full rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-100"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase text-slate-400 mb-1">
              Nova Senha
            </label>
            <div className="relative">
              <KeyRound className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
              <input
                type="password"
                placeholder="Digite a nova senha"
                value={newPass}
                onChange={(e) => setNewPass(e.target.value)}
                className="glass-input w-full rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-100"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase text-slate-400 mb-1">
              Confirmar Nova Senha
            </label>
            <div className="relative">
              <ShieldCheck className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
              <input
                type="password"
                placeholder="Repita a nova senha"
                value={confirmPass}
                onChange={(e) => setConfirmPass(e.target.value)}
                className="glass-input w-full rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-100"
                required
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-slate-700 px-4 py-2 text-sm text-slate-400 hover:bg-slate-800"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="rounded-xl bg-purple-600 px-5 py-2 text-sm font-bold text-white hover:bg-purple-500 shadow-lg shadow-purple-600/30"
            >
              Salvar Nova Senha
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
