/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Cloud, 
  CloudRain,
  CloudLightning,
  CloudOff,
  User, 
  Lock, 
  Mail, 
  Key, 
  LogIn, 
  UserPlus, 
  LogOut, 
  RefreshCw, 
  Save, 
  Download, 
  Sparkles, 
  ShieldCheck, 
  AlertTriangle, 
  Eye, 
  EyeOff, 
  ArrowRight,
  Clock,
  Wifi,
  Database
} from 'lucide-react';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged, 
  User as FirebaseUser 
} from 'firebase/auth';
import { 
  doc, 
  setDoc, 
  getDoc 
} from 'firebase/firestore';
import { auth, db } from '../lib/firebase';

interface Props {
  isDarkMode: boolean;
  isAccessibilityMode: boolean;
  playSound: (type: 'success' | 'click' | 'reset' | 'tutor') => void;
  currentData: any; // Entire SCORM state bundle
  onLoadData: (data: any) => void;
  onToast: (msg: string, sub?: string, type?: 'success' | 'error' | 'warning' | 'info') => void;
  isOnline: boolean;
}

export const CloudSync: React.FC<Props> = ({
  isDarkMode,
  isAccessibilityMode,
  playSound,
  currentData,
  onLoadData,
  onToast,
  isOnline
}) => {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');
  
  // Credentials Inputs
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  // Cloud Sync Options
  const [autoSync, setAutoSync] = useState<boolean>(() => {
    try {
      return localStorage.getItem('scorm_cloud_autosync') === 'true';
    } catch {
      return false;
    }
  });
  const [lastSyncedTime, setLastSyncedTime] = useState<string | null>(() => {
    try {
      return localStorage.getItem('scorm_cloud_last_synced') || null;
    } catch {
      return null;
    }
  });

  // Track state ref to avoid stale closure in auto-sync effect
  const dataRef = useRef(currentData);
  useEffect(() => {
    dataRef.current = currentData;
  }, [currentData]);

  // Firebase Auth State listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  // Auto-sync debounce effect
  useEffect(() => {
    if (!user || !autoSync || !isOnline) return;

    // Debounce Firestore save by 3 seconds of inactivity
    const timer = setTimeout(() => {
      handleSaveToCloud(true);
    }, 3000);

    return () => clearTimeout(timer);
  }, [currentData, user, autoSync, isOnline]);

  const handleSaveToCloud = async (isAuto = false) => {
    if (!user) return;
    if (!isOnline) {
      if (!isAuto) {
        onToast('Sin conexión a internet 📶', 'No puedes guardar en la nube en modo offline. Los cambios siguen guardados localmente.', 'warning');
      }
      return;
    }

    if (!isAuto) setActionLoading(true);
    try {
      const userDocRef = doc(db, 'user_saves', user.uid);
      const dataToSave = {
        ...dataRef.current,
        syncedAt: new Date().toISOString(),
        userId: user.uid,
        userEmail: user.email
      };

      await setDoc(userDocRef, dataToSave);
      
      const nowStr = new Date().toLocaleTimeString();
      setLastSyncedTime(nowStr);
      try {
        localStorage.setItem('scorm_cloud_last_synced', nowStr);
      } catch (e) {}

      if (!isAuto) {
        playSound('success');
        onToast(
          '¡Sincronizado con éxito! ☁️', 
          'Tus cuestionarios y preferencias han sido respaldados en Firestore.', 
          'success'
        );
      }
    } catch (error: any) {
      console.error("Firestore Save Error:", error);
      if (!isAuto) {
        onToast(
          'Fallo al sincronizar ❌', 
          error.message || 'Verifica los permisos de red o intenta de nuevo.', 
          'error'
        );
      }
    } finally {
      if (!isAuto) setActionLoading(false);
    }
  };

  const handleLoadFromCloud = async () => {
    if (!user) return;
    if (!isOnline) {
      onToast('Sin conexión a internet 📶', 'No puedes descargar tu respaldo en la nube en modo offline.', 'warning');
      return;
    }

    setActionLoading(true);
    try {
      const userDocRef = doc(db, 'user_saves', user.uid);
      const snapshot = await getDoc(userDocRef);
      
      if (snapshot.exists()) {
        const cloudData = snapshot.data();
        
        // Load data into parent application
        onLoadData(cloudData);
        
        playSound('success');
        onToast(
          'Cargado desde la nube 📂', 
          'Se ha restaurado el cuestionario respaldado en tu cuenta.', 
          'success'
        );
      } else {
        onToast(
          'No hay respaldos 🔍', 
          'Aún no tienes ningún cuestionario guardado en la nube para esta cuenta.', 
          'warning'
        );
      }
    } catch (error: any) {
      console.error("Firestore Load Error:", error);
      onToast(
        'Fallo al cargar datos ❌', 
        error.message || 'No se pudo leer la base de datos de la nube.', 
        'error'
      );
    } finally {
      setActionLoading(false);
    }
  };

  const handleAuthAction = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);

    if (!isOnline) {
      setAuthError('No hay conexión a internet para autenticar tu cuenta.');
      return;
    }

    if (!email || !password) {
      setAuthError('Por favor, completa todos los campos.');
      return;
    }

    if (password.length < 6) {
      setAuthError('La contraseña debe tener al menos 6 caracteres.');
      return;
    }

    setActionLoading(true);
    try {
      if (authMode === 'login') {
        await signInWithEmailAndPassword(auth, email.trim(), password);
        playSound('success');
        onToast('Sesión Iniciada ☁️', 'Has conectado tu cuenta para sincronización en tiempo real.', 'success');
      } else {
        await createUserWithEmailAndPassword(auth, email.trim(), password);
        playSound('success');
        onToast('Cuenta Creada 🎉', '¡Bienvenido! Tu cuenta ha sido registrada y está lista para guardar.', 'success');
      }
      // Reset fields
      setPassword('');
    } catch (error: any) {
      console.error("Auth Error:", error);
      let errorMsg = 'Ocurrió un error al autenticar. Revisa tus credenciales.';
      if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
        errorMsg = 'Correo o contraseña incorrectos.';
      } else if (error.code === 'auth/email-already-in-use') {
        errorMsg = 'Este correo electrónico ya está registrado.';
      } else if (error.code === 'auth/weak-password') {
        errorMsg = 'La contraseña es demasiado débil.';
      } else if (error.code === 'auth/invalid-email') {
        errorMsg = 'El formato del correo electrónico es inválido.';
      }
      setAuthError(errorMsg);
    } finally {
      setActionLoading(false);
    }
  };

  const handleLogout = async () => {
    setActionLoading(true);
    try {
      await signOut(auth);
      onToast('Sesión Cerrada 👋', 'Se ha desconectado la sincronización en la nube.', 'info');
      playSound('reset');
    } catch (error: any) {
      onToast('Error al salir', error.message || 'Error desconocido.', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleToggleAutoSync = () => {
    const newValue = !autoSync;
    setAutoSync(newValue);
    playSound('click');
    try {
      localStorage.setItem('scorm_cloud_autosync', newValue ? 'true' : 'false');
    } catch (e) {}

    if (newValue) {
      onToast('Autosincronización Activa 🔄', 'Tus cambios se guardarán automáticamente en Firestore en segundo plano.', 'info');
    } else {
      onToast('Autosincronización Desactivada ⏱️', 'Debes presionar "Guardar en la Nube" para subir tus cambios manualmente.', 'info');
    }
  };

  const fillQuickDemo = () => {
    setEmail('marianofischer@gmail.com');
    setPassword('SCORM-PRO-2026');
    setAuthError(null);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-8">
        <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
        <span className="text-xs text-slate-400 mt-2">Conectando con Firestore...</span>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <AnimatePresence mode="wait">
        {user ? (
          /* LOGGED IN USER VIEW */
          <motion.div
            key="logged-in"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-4"
          >
            {/* Connection Banner */}
            <div className={`p-4 rounded-xl border flex gap-3 items-start transition-all ${
              isDarkMode 
                ? 'bg-emerald-500/5 border-emerald-500/20 text-emerald-300' 
                : 'bg-emerald-50 border-emerald-100 text-emerald-800'
            }`}>
              <div className={`p-2 rounded-lg shrink-0 ${isDarkMode ? 'bg-emerald-500/10' : 'bg-emerald-100 text-emerald-600'}`}>
                <ShieldCheck size={18} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-[10px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded-sm bg-emerald-500/20 text-emerald-500">Nube Activa</span>
                  <span className="text-[10px] text-slate-400 dark:text-slate-400 font-bold truncate max-w-[160px]" title={user.email || ''}>
                    {user.email}
                  </span>
                </div>
                <h4 className="font-bold text-xs mt-1">Conectado a Firebase Firestore</h4>
                <p className="text-[10px] opacity-85 leading-normal mt-0.5">
                  Tus datos están enlazados con tu cuenta. Puedes iniciar sesión en cualquier dispositivo para restaurar tus preguntas y configuraciones pedagógicas.
                </p>
              </div>
            </div>

            {/* Sync Controls */}
            <div className="space-y-3">
              {/* Toggle Auto Sync */}
              <div className={`p-3 rounded-xl border transition-all flex items-center justify-between ${
                autoSync 
                  ? 'bg-indigo-500/5 border-indigo-500/20 text-indigo-950 dark:text-indigo-100'
                  : 'bg-slate-50/50 border-slate-100 dark:bg-slate-900/30 dark:border-slate-800 text-slate-600 dark:text-slate-400'
              }`}>
                <div className="flex flex-col">
                  <span className="text-xs font-bold flex items-center gap-1.5">
                    <RefreshCw size={13} className={autoSync ? "animate-spin" : ""} />
                    Sincronización Automática
                  </span>
                  <span className="text-[9px] opacity-80 mt-0.5">Auto-guarda en la nube tras editar</span>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={autoSync}
                  onClick={handleToggleAutoSync}
                  className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                    autoSync ? 'bg-indigo-600' : 'bg-slate-200 dark:bg-slate-700'
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                      autoSync ? 'translate-x-4' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              {/* Save/Load Actions Buttons */}
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  disabled={actionLoading || !isOnline}
                  onClick={() => handleSaveToCloud(false)}
                  className={`py-2 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-sm ${
                    isAccessibilityMode
                      ? 'border-2 border-slate-950 dark:border-white text-slate-950 dark:text-white font-black hover:bg-slate-100 dark:hover:bg-slate-800'
                      : 'bg-indigo-600 hover:bg-indigo-500 text-white disabled:opacity-50 disabled:cursor-not-allowed'
                  }`}
                >
                  <Save size={13} />
                  Guardar en Nube
                </button>

                <button
                  type="button"
                  disabled={actionLoading || !isOnline}
                  onClick={handleLoadFromCloud}
                  className={`py-2 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all border shadow-sm ${
                    isDarkMode
                      ? 'bg-slate-900 border-slate-800 hover:bg-slate-800 text-slate-200'
                      : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-700'
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  <Download size={13} />
                  Cargar de Nube
                </button>
              </div>

              {/* Status and Log Out */}
              <div className="flex items-center justify-between text-[10px] border-t border-slate-150 dark:border-slate-800/80 pt-2.5">
                <div className="flex items-center gap-1 text-slate-400 dark:text-slate-500 font-medium">
                  <Clock size={11} />
                  <span>Sincronizado: {lastSyncedTime ? `${lastSyncedTime}` : 'Nunca'}</span>
                </div>
                <button
                  onClick={handleLogout}
                  disabled={actionLoading}
                  className="text-rose-500 hover:text-rose-600 font-bold flex items-center gap-1 transition-colors"
                >
                  <LogOut size={11} />
                  Desconectar
                </button>
              </div>
            </div>
          </motion.div>
        ) : (
          /* LOGIN / REGISTRATION FORM VIEW */
          <motion.div
            key="auth-form"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-4"
          >
            {/* Header / Tabs */}
            <div className="flex border-b border-slate-150 dark:border-slate-800">
              <button
                type="button"
                onClick={() => { playSound('click'); setAuthMode('login'); setAuthError(null); }}
                className={`flex-1 pb-2 text-xs font-bold transition-all border-b-2 uppercase tracking-wider ${
                  authMode === 'login'
                    ? 'border-indigo-600 text-indigo-600 dark:border-indigo-500 dark:text-indigo-400'
                    : 'border-transparent text-slate-400 dark:text-slate-500 hover:text-slate-600'
                }`}
              >
                Iniciar Sesión
              </button>
              <button
                type="button"
                onClick={() => { playSound('click'); setAuthMode('signup'); setAuthError(null); }}
                className={`flex-1 pb-2 text-xs font-bold transition-all border-b-2 uppercase tracking-wider ${
                  authMode === 'signup'
                    ? 'border-indigo-600 text-indigo-600 dark:border-indigo-500 dark:text-indigo-400'
                    : 'border-transparent text-slate-400 dark:text-slate-500 hover:text-slate-600'
                }`}
              >
                Crear Cuenta
              </button>
            </div>

            <form onSubmit={handleAuthAction} className="space-y-3">
              <div className="space-y-1">
                <label className="text-[9px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500">
                  Email de la Cuenta
                </label>
                <div className="relative">
                  <span className={`absolute left-3 top-2.5 ${isDarkMode ? 'text-slate-600' : 'text-slate-400'}`}>
                    <Mail size={14} />
                  </span>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => { setEmail(e.target.value); setAuthError(null); }}
                    placeholder="correo@ejemplo.com"
                    className={`w-full pl-9 pr-3 py-2 rounded-lg border text-xs transition-all focus:outline-hidden focus:ring-1 focus:ring-indigo-500 ${
                      isDarkMode
                        ? 'bg-slate-950 border-slate-800 text-white placeholder-slate-700'
                        : 'bg-slate-50 border-slate-200 text-slate-800 placeholder-slate-400'
                    }`}
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[9px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500">
                  Contraseña de Seguridad
                </label>
                <div className="relative">
                  <span className={`absolute left-3 top-2.5 ${isDarkMode ? 'text-slate-600' : 'text-slate-400'}`}>
                    <Key size={14} />
                  </span>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => { setPassword(e.target.value); setAuthError(null); }}
                    placeholder="Mínimo 6 caracteres"
                    className={`w-full pl-9 pr-9 py-2 rounded-lg border text-xs transition-all focus:outline-hidden focus:ring-1 focus:ring-indigo-500 ${
                      isDarkMode
                        ? 'bg-slate-950 border-slate-800 text-white placeholder-slate-700'
                        : 'bg-slate-50 border-slate-200 text-slate-800 placeholder-slate-400'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
                  >
                    {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
              </div>

              {/* Form Error Alert */}
              <AnimatePresence>
                {authError && (
                  <motion.div
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-2.5 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-500 text-[10px] font-semibold flex gap-1.5 items-start"
                  >
                    <AlertTriangle className="shrink-0 mt-0.5" size={13} />
                    <span>{authError}</span>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Submit Buttons */}
              <div className="pt-1.5 flex flex-col gap-2">
                <button
                  type="submit"
                  disabled={actionLoading}
                  className={`w-full py-2.5 px-4 rounded-lg font-bold text-xs tracking-wide shadow-sm cursor-pointer transition-all flex items-center justify-center gap-1.5 ${
                    isAccessibilityMode
                      ? 'border-2 border-indigo-600 text-indigo-600 hover:bg-indigo-50 font-black'
                      : 'bg-indigo-600 hover:bg-indigo-500 text-white'
                  }`}
                >
                  {actionLoading ? (
                    <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : authMode === 'login' ? (
                    <>
                      <LogIn size={13} />
                      <span>Conectar Sincronización</span>
                    </>
                  ) : (
                    <>
                      <UserPlus size={13} />
                      <span>Registrarse y Sincronizar</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={fillQuickDemo}
                  className={`w-full py-1.5 rounded-lg text-[10px] font-bold transition-all border ${
                    isDarkMode
                      ? 'bg-slate-900 border-slate-800 text-slate-400 hover:bg-slate-800/80 hover:text-white'
                      : 'bg-slate-100 border-slate-200 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  Autocompletar credenciales de demostración ✨
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// Loader component
const Loader2 = ({ className }: { className?: string }) => (
  <svg className={`animate-spin ${className}`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
  </svg>
);
