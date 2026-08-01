import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { 
  INITIAL_PARTNERS, 
  DEFAULT_EXCHANGE_RATE, 
  INITIAL_MONTHS, 
  INITIAL_REVENUES, 
  INITIAL_EXPENSES 
} from '../data/initialData';
import { 
  getStoredFirebaseConfig, 
  saveFirebaseConfig, 
  clearFirebaseConfig, 
  initializeFirebaseService, 
  subscribeToViralFXData, 
  pushDataToFirestore 
} from '../firebase/firestoreService';

const FinancialContext = createContext();

export const MONTH_NAMES = [
  { num: '01', short: 'Jan', full: 'Janeiro' },
  { num: '02', short: 'Fev', full: 'Fevereiro' },
  { num: '03', short: 'Mar', full: 'Março' },
  { num: '04', short: 'Abr', full: 'Abril' },
  { num: '05', short: 'Mai', full: 'Maio' },
  { num: '06', short: 'Jun', full: 'Junho' },
  { num: '07', short: 'Jul', full: 'Julho' },
  { num: '08', short: 'Ago', full: 'Agosto' },
  { num: '09', short: 'Set', full: 'Setembro' },
  { num: '10', short: 'Out', full: 'Outubro' },
  { num: '11', short: 'Nov', full: 'Novembro' },
  { num: '12', short: 'Dez', full: 'Dezembro' },
];

const isMonthKey = (k) => /^\d{4}-\d{2}$/.test(k);

const sanitizeDataMap = (mapObj, defaultData) => {
  if (!mapObj || typeof mapObj !== 'object') return defaultData;
  const clean = {};
  Object.keys(mapObj).forEach(k => {
    if (isMonthKey(k)) {
      clean[k] = mapObj[k];
    }
  });
  return Object.keys(clean).length > 0 ? clean : defaultData;
};

const parseSavedMonthKey = (savedKey) => {
  if (!savedKey || typeof savedKey !== 'string') return { year: '2026', monthNum: '09' };
  const parts = savedKey.split('-');
  if (parts.length >= 2) {
    const y = parseInt(parts[0]);
    const m = parseInt(parts[1]);
    const safeYear = (!isNaN(y) && y >= 2026 && y <= 2035) ? y.toString() : '2026';
    const safeMonth = (!isNaN(m) && m >= 1 && m <= 12) ? m.toString().padStart(2, '0') : '09';
    return { year: safeYear, monthNum: safeMonth };
  }
  const parsedY = parseInt(savedKey);
  const safeYear = (!isNaN(parsedY) && parsedY >= 2026 && parsedY <= 2035) ? parsedY.toString() : '2026';
  return { year: safeYear, monthNum: '09' };
};

export const FinancialProvider = ({ children }) => {
  // Authentication & Password State
  const [currentUser, setCurrentUser] = useState(() => {
    return localStorage.getItem('viralfx_user') || null;
  });

  const [masterPassword, setMasterPassword] = useState(() => {
    return localStorage.getItem('viralfx_master_password') || 'Viral420*';
  });

  // Always maintain up-to-date ref to prevent closure staleness during background sync
  const masterPasswordRef = useRef(masterPassword);
  useEffect(() => {
    masterPasswordRef.current = masterPassword;
    localStorage.setItem('viralfx_master_password', masterPassword);
  }, [masterPassword]);

  // Selected Year & Month Number
  const [currentYear, setCurrentYear] = useState(() => {
    const saved = localStorage.getItem('viralfx_current_month');
    return parseSavedMonthKey(saved).year;
  });

  const [currentMonthNum, setCurrentMonthNum] = useState(() => {
    const saved = localStorage.getItem('viralfx_current_month');
    return parseSavedMonthKey(saved).monthNum;
  });

  const currentMonthKey = `${currentYear}-${currentMonthNum}`;

  // Months Map / Active list
  const [months, setMonths] = useState(() => {
    const saved = localStorage.getItem('viralfx_months');
    return saved ? JSON.parse(saved) : INITIAL_MONTHS;
  });

  // Revenues Data Map by month key (e.g., '2026-09')
  const [revenues, setRevenues] = useState(() => {
    const saved = localStorage.getItem('viralfx_revenues');
    if (!saved) return INITIAL_REVENUES;
    try {
      return sanitizeDataMap(JSON.parse(saved), INITIAL_REVENUES);
    } catch (e) {
      return INITIAL_REVENUES;
    }
  });

  // Expenses Data Map by month key (e.g., '2026-09')
  const [expenses, setExpenses] = useState(() => {
    const saved = localStorage.getItem('viralfx_expenses');
    if (!saved) return INITIAL_EXPENSES;
    try {
      return sanitizeDataMap(JSON.parse(saved), INITIAL_EXPENSES);
    } catch (e) {
      return INITIAL_EXPENSES;
    }
  });

  // Live Exchange Rate
  const [liveExchangeRate, setLiveExchangeRate] = useState(DEFAULT_EXCHANGE_RATE);
  const [exchangeRateLoading, setExchangeRateLoading] = useState(false);
  const [exchangeRateLastUpdated, setExchangeRateLastUpdated] = useState(null);

  // Firebase Cloud Sync State
  const [firebaseConfig, setFirebaseConfig] = useState(getStoredFirebaseConfig());
  const [isFirebaseConnected, setIsFirebaseConnected] = useState(false);
  const [lastCloudSync, setLastCloudSync] = useState(null);
  const dbRef = useRef(null);

  // Sync state to Firestore with ref-guaranteed current password
  const syncToCloud = async (newMonths, newRevenues, newExpenses, explicitPass = null) => {
    if (dbRef.current) {
      const activePass = explicitPass || masterPasswordRef.current || localStorage.getItem('viralfx_master_password') || 'Viral420*';
      const success = await pushDataToFirestore(dbRef.current, {
        months: newMonths,
        revenues: newRevenues,
        expenses: newExpenses,
        masterPassword: activePass
      }, currentUser || 'Sócio');

      if (success) {
        setLastCloudSync(new Date().toLocaleTimeString('pt-BR'));
      }
    }
  };

  // Initialize Firebase when config changes
  useEffect(() => {
    if (firebaseConfig) {
      const res = initializeFirebaseService(firebaseConfig);
      if (res && res.db) {
        dbRef.current = res.db;
        setIsFirebaseConnected(true);

        const unsubscribe = subscribeToViralFXData(res.db, (remoteData) => {
          if (remoteData) {
            if (remoteData.months) setMonths(remoteData.months);
            if (remoteData.revenues) setRevenues(sanitizeDataMap(remoteData.revenues, INITIAL_REVENUES));
            if (remoteData.expenses) setExpenses(sanitizeDataMap(remoteData.expenses, INITIAL_EXPENSES));
            
            // Respect remote password if present, otherwise push local custom password
            if (remoteData.masterPassword && remoteData.masterPassword.trim() !== '') {
              setMasterPassword(remoteData.masterPassword);
              localStorage.setItem('viralfx_master_password', remoteData.masterPassword);
            } else {
              // Ensure custom local password gets synced up to cloud if remote was empty
              const localSaved = localStorage.getItem('viralfx_master_password');
              if (localSaved && localSaved !== 'Viral420*') {
                pushDataToFirestore(res.db, {
                  months: remoteData.months || months,
                  revenues: remoteData.revenues || revenues,
                  expenses: remoteData.expenses || expenses,
                  masterPassword: localSaved
                }, 'Sistema');
              }
            }
            setLastCloudSync(new Date().toLocaleTimeString('pt-BR'));
          }
        });

        return () => unsubscribe();
      } else {
        setIsFirebaseConnected(false);
      }
    } else {
      dbRef.current = null;
      setIsFirebaseConnected(false);
    }
  }, [firebaseConfig]);

  // Sync to LocalStorage
  useEffect(() => {
    if (currentUser) localStorage.setItem('viralfx_user', currentUser);
    else localStorage.removeItem('viralfx_user');
  }, [currentUser]);

  useEffect(() => {
    localStorage.setItem('viralfx_current_month', currentMonthKey);
  }, [currentMonthKey]);

  useEffect(() => {
    localStorage.setItem('viralfx_months', JSON.stringify(months));
  }, [months]);

  useEffect(() => {
    localStorage.setItem('viralfx_revenues', JSON.stringify(revenues));
  }, [revenues]);

  useEffect(() => {
    localStorage.setItem('viralfx_expenses', JSON.stringify(expenses));
  }, [expenses]);

  // Change Password Action
  const changePassword = (currentPass, newPass) => {
    const activeCurrent = masterPasswordRef.current || localStorage.getItem('viralfx_master_password') || 'Viral420*';

    if (currentPass !== activeCurrent) {
      return { success: false, error: 'A senha atual está incorreta.' };
    }
    if (!newPass || newPass.trim().length < 4) {
      return { success: false, error: 'A nova senha deve ter pelo menos 4 caracteres.' };
    }

    const cleanPass = newPass.trim();
    setMasterPassword(cleanPass);
    masterPasswordRef.current = cleanPass;
    localStorage.setItem('viralfx_master_password', cleanPass);
    
    syncToCloud(months, revenues, expenses, cleanPass);
    return { success: true };
  };

  // Fetch live USD/BRL rate
  const fetchExchangeRate = async () => {
    setExchangeRateLoading(true);
    try {
      const res = await fetch('https://economia.awesomeapi.com.br/json/last/USD-BRL');
      const data = await res.json();
      if (data && data.USDBRL) {
        const rate = parseFloat(data.USDBRL.bid);
        if (!isNaN(rate) && rate > 0) {
          setLiveExchangeRate(rate);
          setExchangeRateLastUpdated(new Date().toLocaleTimeString('pt-BR'));
        }
      }
    } catch (err) {
      console.warn('Não foi possível buscar câmbio online, usando valor padrão', err);
    } finally {
      setExchangeRateLoading(false);
    }
  };

  useEffect(() => {
    fetchExchangeRate();
  }, []);

  // Helper: Find previous month key for expenses
  const getPreviousAvailableMonthKey = (targetKey, dataMap) => {
    const allKeys = Object.keys(dataMap).filter(k => isMonthKey(k) && (dataMap[k] || []).length > 0).sort();
    const idx = allKeys.indexOf(targetKey);
    if (idx > 0) return allKeys[idx - 1];
    const earlierKeys = Object.keys(dataMap).filter(k => isMonthKey(k) && k < targetKey && (dataMap[k] || []).length > 0).sort();
    if (earlierKeys.length > 0) return earlierKeys[earlierKeys.length - 1];
    return '2026-07';
  };

  // Helper: Propagate fixed expenses from previous month
  const propagateFixedExpenses = (targetMonthKey, sourceMonthKey = null) => {
    const srcKey = sourceMonthKey || getPreviousAvailableMonthKey(targetMonthKey, expenses);
    const sourceExpenses = expenses[srcKey] || [];
    const fixedOnly = sourceExpenses.filter(e => e.categoria === 'Fixo');

    if (fixedOnly.length === 0) return 0;

    const existingTargetExpenses = expenses[targetMonthKey] || [];
    const targetDescriptions = new Set(existingTargetExpenses.map(e => e.descricao.toLowerCase().trim()));

    const newFixedItems = [];
    fixedOnly.forEach(item => {
      if (!targetDescriptions.has(item.descricao.toLowerCase().trim())) {
        newFixedItems.push({
          ...item,
          id: `exp-${targetMonthKey}-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          vencimento: `${targetMonthKey}-01`,
        });
      }
    });

    if (newFixedItems.length > 0) {
      const updatedExpenses = {
        ...expenses,
        [targetMonthKey]: [...(expenses[targetMonthKey] || []), ...newFixedItems]
      };
      setExpenses(updatedExpenses);
      syncToCloud(months, revenues, updatedExpenses);
    }

    return newFixedItems.length;
  };

  // Helper: Propagate revenue channels from previous month
  const propagateRevenueChannels = (targetMonthKey, sourceMonthKey = null) => {
    const srcKey = sourceMonthKey || getPreviousAvailableMonthKey(targetMonthKey, revenues);
    const sourceRevenues = revenues[srcKey] || [];

    if (sourceRevenues.length === 0) return 0;

    const existingTargetRevenues = revenues[targetMonthKey] || [];
    const targetChannels = new Set(existingTargetRevenues.map(r => r.channel.toLowerCase().trim()));

    const newChannelItems = [];
    sourceRevenues.forEach(item => {
      if (!targetChannels.has(item.channel.toLowerCase().trim())) {
        newChannelItems.push({
          id: `rev-${targetMonthKey}-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          channel: item.channel,
          faturamentoUSD: 0,
          cambio: liveExchangeRate,
          porcentagemViral: item.porcentagemViral !== undefined ? item.porcentagemViral : 100,
          parteViralUSD: 0
        });
      }
    });

    if (newChannelItems.length > 0) {
      const updatedRevenues = {
        ...revenues,
        [targetMonthKey]: [...(revenues[targetMonthKey] || []), ...newChannelItems]
      };
      setRevenues(updatedRevenues);
      syncToCloud(months, updatedRevenues, expenses);
    }

    return newChannelItems.length;
  };

  // Select Month by Month Number ('01' to '12') and Year ('2026')
  const selectMonth = (monthNum, year = currentYear) => {
    const safeY = (year && !isNaN(parseInt(year))) ? parseInt(year).toString() : '2026';
    const safeM = (monthNum && !isNaN(parseInt(monthNum))) ? parseInt(monthNum).toString().padStart(2, '0') : '09';
    const monthKey = `${safeY}-${safeM}`;

    const monthObj = MONTH_NAMES.find(m => m.num === safeM) || MONTH_NAMES[8];
    const label = `${monthObj.full} / ${safeY}`;

    let updatedMonths = [...months];
    if (!months.some(m => m.key === monthKey)) {
      updatedMonths = [...months, { key: monthKey, label }].sort((a, b) => a.key.localeCompare(b.key));
      setMonths(updatedMonths);
    }

    if (!expenses[monthKey] || expenses[monthKey].length === 0) {
      propagateFixedExpenses(monthKey);
    }

    if (!revenues[monthKey] || revenues[monthKey].length === 0) {
      propagateRevenueChannels(monthKey);
    }

    setCurrentYear(safeY);
    setCurrentMonthNum(safeM);
    syncToCloud(updatedMonths, revenues, expenses);
  };

  const changeYear = (newYear) => {
    const parsedY = parseInt(newYear);
    const safeY = (!isNaN(parsedY) && parsedY >= 2026 && parsedY <= 2035) ? parsedY.toString() : '2026';
    selectMonth(currentMonthNum, safeY);
  };

  // Actions for Revenues
  const addRevenue = (monthKey, revenueItem) => {
    const fatUSD = parseFloat(revenueItem.faturamentoUSD || 0);
    const pctViral = parseFloat(revenueItem.porcentagemViral !== undefined ? revenueItem.porcentagemViral : 100);
    const parteUSD = fatUSD * (pctViral / 100);

    const newItem = {
      id: `rev-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      channel: revenueItem.channel || 'Novo Canal',
      faturamentoUSD: fatUSD,
      cambio: parseFloat(revenueItem.cambio || liveExchangeRate),
      porcentagemViral: pctViral,
      parteViralUSD: parteUSD,
    };
    const updated = {
      ...revenues,
      [monthKey]: [...(revenues[monthKey] || []), newItem]
    };
    setRevenues(updated);
    syncToCloud(months, updated, expenses);
  };

  const updateRevenue = (monthKey, id, updatedFields) => {
    const updated = {
      ...revenues,
      [monthKey]: (revenues[monthKey] || []).map(item => {
        if (item.id !== id) return item;

        const merged = { ...item, ...updatedFields };
        const fatUSD = parseFloat(merged.faturamentoUSD || 0);
        const pctViral = parseFloat(merged.porcentagemViral !== undefined ? merged.porcentagemViral : 100);
        const parteUSD = fatUSD * (pctViral / 100);

        return {
          ...merged,
          faturamentoUSD: fatUSD,
          porcentagemViral: pctViral,
          parteViralUSD: parteUSD
        };
      })
    };
    setRevenues(updated);
    syncToCloud(months, updated, expenses);
  };

  const deleteRevenue = (monthKey, id) => {
    const updated = {
      ...revenues,
      [monthKey]: (revenues[monthKey] || []).filter(item => item.id !== id)
    };
    setRevenues(updated);
    syncToCloud(months, updated, expenses);
  };

  // Actions for Expenses
  const addExpense = (monthKey, expenseItem) => {
    const newItem = {
      id: `exp-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      vencimento: expenseItem.vencimento || `${monthKey}-01`,
      descricao: expenseItem.descricao || 'Nova Despesa',
      categoria: expenseItem.categoria || 'Variável',
      pagoPor: expenseItem.pagoPor || currentUser || 'Fábio',
      valorBRL: parseFloat(expenseItem.valorBRL || 0),
    };
    const updated = {
      ...expenses,
      [monthKey]: [...(expenses[monthKey] || []), newItem]
    };
    setExpenses(updated);
    syncToCloud(months, revenues, updated);
  };

  const updateExpense = (monthKey, id, updatedFields) => {
    const updated = {
      ...expenses,
      [monthKey]: (expenses[monthKey] || []).map(item => item.id === id ? { ...item, ...updatedFields } : item)
    };
    setExpenses(updated);
    syncToCloud(months, revenues, updated);
  };

  const deleteExpense = (monthKey, id) => {
    const updated = {
      ...expenses,
      [monthKey]: (expenses[monthKey] || []).filter(item => item.id !== id)
    };
    setExpenses(updated);
    syncToCloud(months, revenues, updated);
  };

  // Configure Firebase Credentials
  const updateFirebaseCredentials = (configObj) => {
    saveFirebaseConfig(configObj);
    setFirebaseConfig(configObj);
  };

  const disconnectFirebase = () => {
    clearFirebaseConfig();
    setFirebaseConfig(null);
  };

  // Login / Logout
  const login = (partnerName) => setCurrentUser(partnerName);
  const logout = () => setCurrentUser(null);

  // Reset to default data
  const resetToDefaults = () => {
    localStorage.removeItem('viralfx_revenues');
    localStorage.removeItem('viralfx_expenses');
    localStorage.removeItem('viralfx_months');
    setMonths(INITIAL_MONTHS);
    setRevenues(INITIAL_REVENUES);
    setExpenses(INITIAL_EXPENSES);
    setCurrentYear('2026');
    setCurrentMonthNum('09');
  };

  // Export / Import
  const exportData = () => {
    const dataObj = {
      months,
      revenues,
      expenses,
      exportDate: new Date().toISOString()
    };
    const jsonStr = JSON.stringify(dataObj, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `viralfx_financeiro_${currentMonthKey}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const importData = (jsonData) => {
    try {
      const parsed = typeof jsonData === 'string' ? JSON.parse(jsonData) : jsonData;
      if (parsed.months && parsed.revenues && parsed.expenses) {
        setMonths(parsed.months);
        setRevenues(sanitizeDataMap(parsed.revenues, INITIAL_REVENUES));
        setExpenses(sanitizeDataMap(parsed.expenses, INITIAL_EXPENSES));
        syncToCloud(parsed.months, parsed.revenues, parsed.expenses);
        return true;
      }
    } catch (e) {
      console.error('Erro ao importar JSON', e);
    }
    return false;
  };

  return (
    <FinancialContext.Provider value={{
      currentUser,
      login,
      logout,
      masterPassword,
      changePassword,
      partners: INITIAL_PARTNERS,
      currentYear,
      currentMonthNum,
      currentMonthKey,
      selectMonth,
      changeYear,
      months,
      MONTH_NAMES,
      revenues: revenues[currentMonthKey] || [],
      allRevenues: revenues,
      expenses: expenses[currentMonthKey] || [],
      allExpenses: expenses,
      addRevenue,
      updateRevenue,
      deleteRevenue,
      addExpense,
      updateExpense,
      deleteExpense,
      propagateFixedExpenses,
      propagateRevenueChannels,
      liveExchangeRate,
      exchangeRateLoading,
      exchangeRateLastUpdated,
      fetchExchangeRate,
      resetToDefaults,
      exportData,
      importData,
      isFirebaseConnected,
      lastCloudSync,
      firebaseConfig,
      updateFirebaseCredentials,
      disconnectFirebase
    }}>
      {children}
    </FinancialContext.Provider>
  );
};

export const useFinancial = () => {
  const context = useContext(FinancialContext);
  if (!context) {
    throw new Error('useFinancial deve ser usado dentro de FinancialProvider');
  }
  return context;
};
