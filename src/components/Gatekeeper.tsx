/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Lock, Unlock, Mail, Key, Eye, EyeOff, ShieldCheck, AlertTriangle, ArrowRight, Sparkles, Cpu } from 'lucide-react';

interface Props {
  onUnlock: (email: string) => void;
  isDarkMode: boolean;
}

export const Gatekeeper: React.FC<Props> = ({ onUnlock, isDarkMode }) => {
  const [email, setEmail] = useState('');
  const [key, setKey] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  // Accepted credentials
  const CORRECT_KEY = 'SCORM-PRO-2026';
  const ALT_KEY = '123456'; // Backup easy key for smooth testing

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSubmit();
    }
  };

  const handleSubmit = () => {
    setError(null);

    // Validation
    if (!email) {
      setError('Por favor, ingresa tu dirección de correo electrónico.');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('Formato de correo electrónico no válido.');
      return;
    }

    if (!key) {
      setError('Por favor, ingresa la clave de acceso de seguridad.');
      return;
    }

    const trimmedKey = key.trim();
    if (trimmedKey !== CORRECT_KEY && trimmedKey !== ALT_KEY) {
      setError('Clave de acceso incorrecta o desactualizada. Verifica e intenta de nuevo.');
      return;
    }

    // Success simulation
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      setIsSuccess(true);
      setTimeout(() => {
        onUnlock(email);
      }, 800);
    }, 1500);
  };

  const fillDemo = () => {
    setEmail('marianofischer@gmail.com');
    setKey(CORRECT_KEY);
    setError(null);
  };

  return (
    <div className={`fixed inset-0 z-[9999] flex items-center justify-center p-4 overflow-y-auto transition-colors duration-500 ${
      isDarkMode 
        ? 'bg-[#06030c] bg-radial-gradient' 
        : 'bg-slate-100 bg-linear-to-br from-slate-100 to-indigo-50'
    }`}>
      {/* Background visual flourishes */}
      {isDarkMode && (
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-[400px] h-[400px] rounded-full bg-indigo-500/10 blur-[100px] animate-pulse" />
          <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] rounded-full bg-purple-500/10 blur-[100px] animate-pulse" />
          {/* Cyber grid overlay */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:24px_24px]" />
        </div>
      )}

      <motion.div
        initial={{ scale: 0.95, opacity: 0, y: 15 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        className={`relative w-full max-w-md rounded-3xl shadow-2xl border p-8 transition-colors duration-300 ${
          isDarkMode 
            ? 'bg-slate-900/90 border-slate-800 backdrop-blur-xl text-white' 
            : 'bg-white border-slate-200 text-slate-800'
        }`}
      >
        {/* Top brand header */}
        <div className="flex flex-col items-center text-center mb-8">
          <div className="relative mb-4">
            <motion.div 
              animate={isSuccess ? { scale: [1, 1.2, 1], rotate: [0, 360, 360] } : {}}
              transition={{ duration: 0.8 }}
              className={`p-4 rounded-2xl border flex items-center justify-center shadow-lg ${
                isSuccess 
                  ? 'bg-emerald-500 border-emerald-600 text-white'
                  : isDarkMode
                    ? 'bg-indigo-950/40 border-indigo-500/30 text-indigo-400'
                    : 'bg-indigo-50 border-indigo-100 text-indigo-600'
              }`}
            >
              {isSuccess ? <ShieldCheck size={28} /> : <Cpu size={28} />}
            </motion.div>
            <div className="absolute -top-1 -right-1 flex h-3.5 w-3.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-indigo-500"></span>
            </div>
          </div>

          <h2 className="text-2xl font-black tracking-tight mb-2">
            SCORM AI Builder Pro
          </h2>
          <p className={`text-xs ${isDarkMode ? 'text-slate-400' : 'text-slate-500'} font-medium max-w-[280px]`}>
            Sistema de seguridad Gatekeeper. Introduce tus credenciales para acceder al constructor.
          </p>
        </div>

        {/* Info card of access */}
        <div className={`p-4 rounded-2xl mb-6 border transition-colors ${
          isDarkMode
            ? 'bg-indigo-500/5 border-indigo-500/10 text-indigo-300'
            : 'bg-indigo-50/50 border-indigo-100/60 text-indigo-900'
        }`}>
          <div className="flex gap-2.5 items-start">
            <Sparkles className="shrink-0 text-indigo-500 mt-0.5" size={16} />
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider mb-1.5">Llave de Acceso Temporal</p>
              <p className="text-[10px] leading-relaxed opacity-90">
                Puedes iniciar sesión rápidamente pulsando en el botón de autorellenado o introduciendo:
              </p>
              <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 font-mono text-[10px] font-bold">
                <span className="flex items-center gap-1">
                  <Mail size={11} className="opacity-70" /> marianofischer@gmail.com
                </span>
                <span className="flex items-center gap-1">
                  <Key size={11} className="opacity-70" /> SCORM-PRO-2026
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Input Form */}
        <div className="space-y-4">
          <div className="space-y-1.5">
            <label className={`text-[10px] font-black uppercase tracking-wider ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
              Correo Electrónico
            </label>
            <div className="relative">
              <span className={`absolute left-3.5 top-3.5 ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>
                <Mail size={16} />
              </span>
              <input
                type="email"
                disabled={isLoading || isSuccess}
                value={email}
                onChange={(e) => { setEmail(e.target.value); setError(null); }}
                onKeyDown={handleKeyPress}
                placeholder="ejemplo@correo.com"
                className={`w-full pl-10 pr-4 py-3 rounded-xl border text-sm transition-all focus:outline-hidden focus:ring-2 focus:ring-indigo-500/40 ${
                  isDarkMode
                    ? 'bg-slate-950/80 border-slate-800 text-white placeholder-slate-600 focus:border-indigo-500/80'
                    : 'bg-slate-50 border-slate-200 text-slate-800 placeholder-slate-400 focus:border-indigo-500 focus:bg-white'
                }`}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className={`text-[10px] font-black uppercase tracking-wider ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                Clave de Seguridad
              </label>
            </div>
            <div className="relative">
              <span className={`absolute left-3.5 top-3.5 ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>
                <Key size={16} />
              </span>
              <input
                type={showKey ? 'text' : 'password'}
                disabled={isLoading || isSuccess}
                value={key}
                onChange={(e) => { setKey(e.target.value); setError(null); }}
                onKeyDown={handleKeyPress}
                placeholder="••••••••••••"
                className={`w-full pl-10 pr-11 py-3 rounded-xl border text-sm transition-all focus:outline-hidden focus:ring-2 focus:ring-indigo-500/40 ${
                  isDarkMode
                    ? 'bg-slate-950/80 border-slate-800 text-white placeholder-slate-600 focus:border-indigo-500/80'
                    : 'bg-slate-50 border-slate-200 text-slate-800 placeholder-slate-400 focus:border-indigo-500 focus:bg-white'
                }`}
              />
              <button
                type="button"
                onClick={() => setShowKey(!showKey)}
                className={`absolute right-3.5 top-3.5 hover:text-indigo-500 transition-colors ${
                  isDarkMode ? 'text-slate-500' : 'text-slate-400'
                }`}
              >
                {showKey ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {/* Error Alert */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-500 flex gap-2 items-start"
              >
                <AlertTriangle className="shrink-0 mt-0.5" size={15} />
                <span className="text-[11px] font-semibold leading-relaxed">{error}</span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Buttons */}
          <div className="pt-2 flex flex-col gap-3">
            <button
              onClick={handleSubmit}
              disabled={isLoading || isSuccess}
              className={`w-full py-3.5 px-6 rounded-xl font-bold text-sm tracking-wide shadow-lg cursor-pointer transition-all flex items-center justify-center gap-2 ${
                isSuccess
                  ? 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-emerald-500/20'
                  : isLoading
                    ? 'bg-indigo-600/70 text-white shadow-none'
                    : 'bg-indigo-600 hover:bg-indigo-500 hover:scale-[1.01] active:scale-[0.99] text-white shadow-indigo-500/20'
              }`}
            >
              {isSuccess ? (
                <>
                  <Unlock size={16} className="animate-bounce" />
                  <span>Acceso Concedido</span>
                </>
              ) : isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Verificando credenciales...</span>
                </>
              ) : (
                <>
                  <span>Desbloquear Aplicación</span>
                  <ArrowRight size={16} />
                </>
              )}
            </button>

            <button
              onClick={fillDemo}
              disabled={isLoading || isSuccess}
              className={`w-full py-2.5 rounded-xl text-xs font-bold transition-all border ${
                isDarkMode
                  ? 'bg-slate-900 border-slate-800 text-slate-400 hover:bg-slate-800/80 hover:text-white'
                  : 'bg-slate-100 border-slate-200 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Autocompletar Demo ✨
            </button>
          </div>
        </div>

        {/* Bottom footer credit */}
        <div className="mt-8 text-center border-t border-slate-150 dark:border-slate-800/80 pt-5">
          <p className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">
            Entorno Protegido • SCORM AI Builder Pro v2026
          </p>
        </div>
      </motion.div>
    </div>
  );
};
