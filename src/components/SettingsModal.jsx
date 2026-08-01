import React, { useState } from 'react';
import { useFinancial } from '../context/FinancialContext';
import { 
  X, 
  Download, 
  Upload, 
  RotateCcw, 
  Cloud, 
  Database, 
  Check, 
  ShieldAlert,
  ExternalLink,
  Wifi,
  WifiOff,
  Copy
} from 'lucide-react';

export const SettingsModal = ({ isOpen, onClose }) => {
  const { 
    exportData, 
    importData, 
    resetToDefaults, 
    isFirebaseConnected, 
    lastCloudSync, 
    firebaseConfig,
    updateFirebaseCredentials,
    disconnectFirebase 
  } = useFinancial();

  const [rawConfigText, setRawConfigText] = useState(
    firebaseConfig ? JSON.stringify(firebaseConfig, null, 2) : ''
  );
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const handleReset = () => {
    if (window.confirm('Tem certeza que deseja restaurar os dados padrões da planilha? Todos os lançamentos salvos localmente serão redefinidos.')) {
      resetToDefaults();
      onClose();
    }
  };

  const handleSaveFirebase = (e) => {
    e.preventDefault();
    setErrorMsg('');

    try {
      let configObj = null;
      const cleanText = rawConfigText.trim();

      if (cleanText.startsWith('{') && cleanText.endsWith('}')) {
        configObj = JSON.parse(cleanText);
      } else {
        // Try extracting keys using regex if user pasted JS object declaration
        const apiKeyMatch = cleanText.match(/apiKey:\s*["']([^"']+)["']/);
        const projectIdMatch = cleanText.match(/projectId:\s*["']([^"']+)["']/);
        const authDomainMatch = cleanText.match(/authDomain:\s*["']([^"']+)["']/);
        const appIdMatch = cleanText.match(/appId:\s*["']([^"']+)["']/);

        if (apiKeyMatch && projectIdMatch) {
          configObj = {
            apiKey: apiKeyMatch[1],
            projectId: projectIdMatch[1],
            authDomain: authDomainMatch ? authDomainMatch[1] : undefined,
            appId: appIdMatch ? appIdMatch[1] : undefined
          };
        }
      }

      if (configObj && configObj.apiKey && configObj.projectId) {
        updateFirebaseCredentials(configObj);
        alert('Conexão com o Firebase salva com sucesso! Os dados agora sincronizam em tempo real para Fábio e Luiz.');
      } else {
        setErrorMsg('Credenciais inválidas. Verifique se o texto possui "apiKey" e "projectId".');
      }
    } catch (err) {
      setErrorMsg('Formato de credenciais inválido. Cole o objeto JSON ou a constante firebaseConfig.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-md">
      <div className="w-full max-w-xl max-h-[90vh] overflow-y-auto rounded-3xl border border-slate-800 bg-slate-900 p-6 shadow-2xl space-y-6">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-2">
            <Cloud className="h-6 w-6 text-cyan-400" />
            <div>
              <h3 className="text-lg font-bold text-white">Sincronização em Nuvem (Firebase)</h3>
              <p className="text-xs text-slate-400">Conecte o banco de dados para Fábio e Luiz usarem juntos</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Status Badge */}
        <div className={`flex items-center justify-between p-4 rounded-2xl border ${
          isFirebaseConnected 
            ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300' 
            : 'bg-slate-950/80 border-slate-800 text-slate-400'
        }`}>
          <div className="flex items-center gap-3">
            {isFirebaseConnected ? (
              <Wifi className="h-5 w-5 text-emerald-400 animate-pulse" />
            ) : (
              <WifiOff className="h-5 w-5 text-slate-500" />
            )}
            <div>
              <span className="text-xs font-bold block">
                {isFirebaseConnected ? 'Firebase Conectado & Sincronizando' : 'Modo Offline / Armazenamento Local'}
              </span>
              <span className="text-[11px] text-slate-400">
                {isFirebaseConnected && lastCloudSync ? `Última sincronização: ${lastCloudSync}` : 'Dados salvos no navegador atual'}
              </span>
            </div>
          </div>

          {isFirebaseConnected && (
            <button
              onClick={disconnectFirebase}
              className="text-xs text-rose-400 hover:underline font-bold"
            >
              Desconectar
            </button>
          )}
        </div>

        {/* Firebase Tutorial & Form */}
        <div className="space-y-4">
          <div className="rounded-2xl bg-slate-950/60 p-4 border border-slate-800 space-y-2 text-xs text-slate-300">
            <div className="flex items-center justify-between font-bold text-white mb-1">
              <span>Como obter suas credenciais Firebase (1 minuto):</span>
              <a
                href="https://console.firebase.google.com/"
                target="_blank"
                rel="noreferrer"
                className="text-cyan-400 hover:underline flex items-center gap-1"
              >
                Abrir Firebase Console <ExternalLink className="h-3 w-3" />
              </a>
            </div>
            <ol className="list-decimal list-inside space-y-1 text-slate-400">
              <li>Acesse o Firebase Console e selecione seu projeto.</li>
              <li>Vá em <strong className="text-slate-200">Configurações do Projeto ⚙️</strong> &gt; <strong className="text-slate-200">Seus aplicativos</strong> &gt; adicione um App Web (<code className="text-cyan-300">&lt;/&gt;</code>).</li>
              <li>Copie a variável <code className="text-purple-300">const firebaseConfig = &#123; ... &#125;</code> e cole na caixa abaixo.</li>
              <li>Certifique-se de ter ativado o <strong className="text-slate-200">Build &gt; Firestore Database</strong>.</li>
            </ol>
          </div>

          <form onSubmit={handleSaveFirebase} className="space-y-3">
            <label className="block text-xs font-bold uppercase text-slate-400">
              Cole o objeto firebaseConfig aqui:
            </label>
            <textarea
              placeholder={`const firebaseConfig = {\n  apiKey: "AIzaSy...",\n  authDomain: "viralfx.firebaseapp.com",\n  projectId: "viralfx-1234",\n  storageBucket: "...",\n  messagingSenderId: "...",\n  appId: "..."\n};`}
              rows="6"
              value={rawConfigText}
              onChange={(e) => setRawConfigText(e.target.value)}
              className="glass-input w-full rounded-2xl p-3 text-xs font-mono text-cyan-300"
            ></textarea>

            {errorMsg && (
              <p className="text-xs text-rose-400 bg-rose-500/10 border border-rose-500/20 p-2.5 rounded-xl font-medium">
                {errorMsg}
              </p>
            )}

            <button
              type="submit"
              className="w-full rounded-2xl bg-gradient-to-r from-cyan-600 to-purple-600 py-3 text-xs font-bold text-white shadow-lg shadow-cyan-500/20 hover:opacity-95 transition-all"
            >
              Salvar Credenciais & Ativar Nuvem
            </button>
          </form>
        </div>

        {/* Backup & Restore */}
        <div className="space-y-3 border-t border-slate-800 pt-4">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Backup Manual dos Dados (JSON)</h4>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={exportData}
              className="flex items-center justify-center gap-2 rounded-2xl border border-slate-800 bg-slate-950/60 p-3 text-xs font-bold text-slate-200 hover:border-purple-500/50 hover:text-purple-300 transition-all"
            >
              <Download className="h-4 w-4 text-purple-400" />
              Exportar Arquivo JSON
            </button>

            <label className="flex items-center justify-center gap-2 rounded-2xl border border-slate-800 bg-slate-950/60 p-3 text-xs font-bold text-slate-200 hover:border-cyan-500/50 hover:text-cyan-300 transition-all cursor-pointer">
              <Upload className="h-4 w-4 text-cyan-400" />
              Importar Arquivo JSON
              <input
                type="file"
                accept=".json"
                onChange={(e) => {
                  const file = e.target.files[0];
                  if (file) {
                    const reader = new FileReader();
                    reader.onload = (event) => {
                      if (importData(event.target.result)) {
                        alert('Dados importados com sucesso!');
                        onClose();
                      }
                    };
                    reader.readAsText(file);
                  }
                }}
                className="hidden"
              />
            </label>
          </div>
        </div>

        {/* Reset Data */}
        <div className="space-y-3 border-t border-slate-800 pt-4">
          <h4 className="text-xs font-bold uppercase tracking-wider text-rose-400">Restaurar Dados da Planilha</h4>
          <button
            onClick={handleReset}
            className="flex w-full items-center justify-center gap-2 rounded-2xl border border-rose-500/30 bg-rose-500/10 p-3 text-xs font-bold text-rose-400 hover:bg-rose-500/20 transition-all"
          >
            <RotateCcw className="h-4 w-4" />
            Resetar tudo para o padrão inicial da planilha
          </button>
        </div>

      </div>
    </div>
  );
};
