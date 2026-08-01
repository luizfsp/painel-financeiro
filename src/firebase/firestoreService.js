import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, doc, onSnapshot, setDoc, getDoc } from 'firebase/firestore';

let app = null;
let db = null;

export const DEFAULT_FIREBASE_CONFIG_KEY = 'viralfx_firebase_credentials';

export const getEnvFirebaseConfig = () => {
  const apiKey = import.meta.env.VITE_FIREBASE_API_KEY;
  const projectId = import.meta.env.VITE_FIREBASE_PROJECT_ID;

  if (apiKey && projectId) {
    return {
      apiKey,
      authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || `${projectId}.firebaseapp.com`,
      projectId,
      storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || `${projectId}.appspot.com`,
      messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
      appId: import.meta.env.VITE_FIREBASE_APP_ID || ''
    };
  }
  return null;
};

export const getStoredFirebaseConfig = () => {
  // First priority: Environment Variables (Vercel / .env)
  const envConfig = getEnvFirebaseConfig();
  if (envConfig) return envConfig;

  // Second priority: LocalStorage
  try {
    const stored = localStorage.getItem(DEFAULT_FIREBASE_CONFIG_KEY);
    if (stored) return JSON.parse(stored);
  } catch (e) {
    console.error('Erro ao ler credenciais do Firebase', e);
  }
  return null;
};

export const saveFirebaseConfig = (configObj) => {
  localStorage.setItem(DEFAULT_FIREBASE_CONFIG_KEY, JSON.stringify(configObj));
};

export const clearFirebaseConfig = () => {
  localStorage.removeItem(DEFAULT_FIREBASE_CONFIG_KEY);
};

export const initializeFirebaseService = (configObj) => {
  const config = configObj || getEnvFirebaseConfig();
  if (!config || !config.apiKey || !config.projectId) {
    return null;
  }

  try {
    if (!getApps().length) {
      app = initializeApp(config);
    } else {
      app = getApp();
    }
    db = getFirestore(app);
    return { app, db };
  } catch (err) {
    console.error('Erro ao inicializar Firebase:', err);
    return null;
  }
};

// Fetch current snapshot directly from Firestore
export const fetchCurrentFirestoreData = async (database) => {
  if (!database) return null;
  try {
    const docRef = doc(database, 'viralfx_financials', 'current_state');
    const snapshot = await getDoc(docRef);
    if (snapshot.exists()) {
      return snapshot.data();
    }
  } catch (err) {
    console.warn('Erro ao buscar snapshot direto do Firestore:', err);
  }
  return null;
};

// Realtime Listener for ViralFX Financial Data
export const subscribeToViralFXData = (database, onDataReceived) => {
  if (!database) return () => {};

  const docRef = doc(database, 'viralfx_financials', 'current_state');

  const unsubscribe = onSnapshot(docRef, (snapshot) => {
    if (snapshot.exists()) {
      const data = snapshot.data();
      onDataReceived(data);
    }
  }, (error) => {
    console.warn('Firestore snapshot error:', error);
  });

  return unsubscribe;
};

// Sync Data to Firestore
export const pushDataToFirestore = async (database, payload, updatedBy = 'Sócio') => {
  if (!database) return false;

  try {
    const docRef = doc(database, 'viralfx_financials', 'current_state');
    const dataToSave = {
      updatedBy,
      updatedAt: new Date().toISOString()
    };

    if (payload.months !== undefined) dataToSave.months = payload.months;
    if (payload.revenues !== undefined) dataToSave.revenues = payload.revenues;
    if (payload.expenses !== undefined) dataToSave.expenses = payload.expenses;
    if (payload.partnerPasswords !== undefined) dataToSave.partnerPasswords = payload.partnerPasswords;
    if (payload.masterPassword !== undefined) dataToSave.masterPassword = payload.masterPassword;

    await setDoc(docRef, dataToSave, { merge: true });
    return true;
  } catch (err) {
    console.error('Erro ao enviar dados para o Firestore:', err);
    return false;
  }
};
