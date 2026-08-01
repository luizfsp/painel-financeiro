import React, { useState } from 'react';
import { useFinancial } from '../context/FinancialContext';
import { ShieldCheck, UserCheck, KeyRound } from 'lucide-react';

export const LoginModal = () => {
  const { partners, login, masterPassword } = useFinancial();
  const [selectedPartner, setSelectedPartner] = useState('Fábio');
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');

  const handleLogin = (e) => {
    e.preventDefault();
    setError('');

    if (pin.trim() !== masterPassword) {
      setError('Senha incorreta! Digite a senha de acesso atual da ViralFX.');
      return;
    }

    login(selectedPartner);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/90 p-4 backdrop-blur-2xl">
      <div className="w-full max-w-md overflow-hidden rounded-3xl border border-slate-800 bg-slate-900/90 shadow-2xl shadow-purple-900/30">
        
        {/* Header Hero */}
        <div className="relative bg-gradient-to-br from-purple-900/60 via-slate-900 to-cyan-950/40 p-8 text-center border-b border-slate-800">
          <div className="mx-auto mb-4 flex h-24 w-24 items-center justify-center rounded-2xl bg-slate-950/80 p-2 border border-cyan-500/30 shadow-xl shadow-cyan-500/20">
            <img src="/viralfx_logo.png" alt="ViralFX Logo" className="h-full w-full object-contain" />
          </div>
          <h2 className="text-2xl font-black tracking-wider text-white">
            VIRAL<span className="text-cyan-400">FX</span>
          </h2>
          <p className="mt-1 text-xs font-semibold text-slate-400">
            Painel de controle financeiro
          </p>
        </div>

        {/* Login Body */}
        <form onSubmit={handleLogin} className="p-8 space-y-6">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
              Selecione seu Perfil
            </label>
            <div className="grid grid-cols-2 gap-3">
              {partners.map((partner) => (
                <button
                  type="button"
                  key={partner}
                  onClick={() => {
                    setSelectedPartner(partner);
                    setError('');
                  }}
                  className={`flex flex-col items-center justify-center p-4 rounded-2xl border transition-all ${
                    selectedPartner === partner
                      ? 'border-purple-500 bg-purple-500/10 text-white shadow-lg shadow-purple-500/20'
                      : 'border-slate-800 bg-slate-950/50 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                  }`}
                >
                  <UserCheck className={`h-6 w-6 mb-2 ${selectedPartner === partner ? 'text-purple-400' : 'text-slate-500'}`} />
                  <span className="font-bold text-sm">{partner}</span>
                  <span className="text-[10px] text-slate-500 font-medium">Sócio ViralFX</span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
              Senha de Acesso
            </label>
            <div className="relative">
              <KeyRound className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
              <input
                type="password"
                placeholder="Digite a senha de acesso"
                value={pin}
                onChange={(e) => {
                  setPin(e.target.value);
                  setError('');
                }}
                className="glass-input w-full rounded-xl pl-10 pr-4 py-3 text-sm text-slate-100 placeholder-slate-600 focus:outline-none"
                required
              />
            </div>
          </div>

          {error && (
            <p className="text-xs font-medium text-rose-400 bg-rose-500/10 border border-rose-500/20 rounded-xl p-3 text-center">
              {error}
            </p>
          )}

          <button
            type="submit"
            className="w-full rounded-2xl bg-gradient-to-r from-purple-600 via-indigo-600 to-cyan-500 py-3.5 text-sm font-bold text-white shadow-xl shadow-purple-600/30 hover:opacity-95 transition-all"
          >
            Entrar como {selectedPartner}
          </button>
        </form>

        <div className="bg-slate-950/80 px-8 py-4 text-center border-t border-slate-800/80">
          <p className="text-[11px] text-slate-500 flex items-center justify-center gap-1.5 font-medium">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
            Ambiente de acesso restrito
          </p>
        </div>

      </div>
    </div>
  );
};
