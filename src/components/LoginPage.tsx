import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Lock, 
  Unlock, 
  Mail, 
  ShieldCheck, 
  AlertTriangle, 
  ArrowRight, 
  Sparkles, 
  Cpu, 
  ArrowLeft, 
  CheckCircle2, 
  User,
  Chrome
} from 'lucide-react';
import { db, auth } from '../lib/firebase';
import { collection, addDoc, serverTimestamp, query, where, getDocs } from 'firebase/firestore';
import { GoogleAuthProvider, signInWithPopup, signOut } from 'firebase/auth';

interface Props {
  onUnlock: (email: string, isAdmin: boolean) => void;
  isDarkMode: boolean;
}

export const LoginPage: React.FC<Props> = ({ onUnlock, isDarkMode }) => {
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  
  // Request Access state
  const [showRequestForm, setShowRequestForm] = useState(false);
  const [reqFirstName, setReqFirstName] = useState('');
  const [reqLastName, setReqLastName] = useState('');
  const [reqEmail, setReqEmail] = useState('');
  const [isSubmittingReq, setIsSubmittingReq] = useState(false);
  const [reqSuccess, setReqSuccess] = useState(false);
  const [reqError, setReqError] = useState<string | null>(null);
  const [generatedUserId, setGeneratedUserId] = useState('');

  const handleGoogleSignIn = async () => {
    setError(null);
    setIsLoading(true);

    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({
        prompt: 'select_account'
      });
      
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      if (!user || !user.email) {
        throw new Error('No se pudo obtener la información del usuario de Google.');
      }

      const userEmail = user.email.toLowerCase();

      // Check if this is the administrator/owner bypass
      if (userEmail === 'marianofischer@gmail.com') {
        setIsSuccess(true);
        setTimeout(() => {
          onUnlock(userEmail, true);
        }, 800);
        return;
      }

      // Query the solicitudes_acceso collection to find an approved request
      const q = query(
        collection(db, 'solicitudes_acceso'),
        where('email', '==', userEmail)
      );
      
      const querySnapshot = await getDocs(q);
      let isApproved = false;
      let hasRequest = false;

      querySnapshot.forEach((docSnap) => {
        hasRequest = true;
        const data = docSnap.data();
        if (data.status === 'approved') {
          isApproved = true;
        }
      });

      if (isApproved) {
        setIsSuccess(true);
        setTimeout(() => {
          onUnlock(userEmail, false);
        }, 800);
      } else {
        // Sign out since they don't have access approval
        await signOut(auth);
        
        if (hasRequest) {
          setError('Tu solicitud de acceso aún está pendiente de aprobación por parte de un administrador.');
        } else {
          setError('Esta dirección de correo electrónico no se encuentra registrada ni aprobada en nuestro sistema. Solicita acceso a continuación.');
        }
      }
    } catch (err: any) {
      console.error('Error during Google Sign-In / Access check:', err);
      if (err.code === 'auth/popup-closed-by-user') {
        setError('El inicio de sesión fue cancelado al cerrar la ventana.');
      } else {
        setError(err.message || 'Error al iniciar sesión con Google.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleRequestSubmit = async () => {
    setReqError(null);

    if (!reqFirstName.trim()) {
      setReqError('Por favor, ingresa tu nombre.');
      return;
    }
    if (!reqLastName.trim()) {
      setReqError('Por favor, ingresa tu apellido.');
      return;
    }
    if (!reqEmail.trim()) {
      setReqError('Por favor, ingresa tu correo electrónico.');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(reqEmail.trim())) {
      setReqError('Formato de correo electrónico no válido.');
      return;
    }

    setIsSubmittingReq(true);
    const path = 'solicitudes_acceso';
    // Generate unique user ID for this applicant
    const uniqueUserId = `SCORM-${Math.random().toString(36).substring(2, 6).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
    
    try {
      await addDoc(collection(db, path), {
        firstName: reqFirstName.trim(),
        lastName: reqLastName.trim(),
        email: reqEmail.trim().toLowerCase(),
        userId: uniqueUserId,
        status: 'pending',
        createdAt: serverTimestamp()
      });
      setGeneratedUserId(uniqueUserId);
      setReqSuccess(true);
      setReqFirstName('');
      setReqLastName('');
      setReqEmail('');
    } catch (err: any) {
      console.error("Error submitting access request:", err);
      setReqError('Ocurrió un error al enviar tu solicitud de acceso. Por favor, intenta de nuevo.');
    } finally {
      setIsSubmittingReq(false);
    }
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
          
          <h2 className="text-xl font-black tracking-tight mb-2">
            SCORM AI Builder Pro
          </h2>
          <p className={`text-xs ${isDarkMode ? 'text-slate-400' : 'text-slate-500'} font-medium max-w-[280px]`}>
            Inicia sesión con tu cuenta de Google para acceder al constructor.
          </p>
        </div>

        {/* Security Alert Header Banner */}
        <div className={`p-4 rounded-2xl border text-xs mb-6 flex gap-3 ${
          isDarkMode 
            ? 'bg-indigo-500/5 border-indigo-500/20 text-indigo-300' 
            : 'bg-indigo-50 border-indigo-100 text-indigo-800'
        }`}>
          <Lock className="shrink-0 mt-0.5" size={15} />
          <div>
            <p className="font-bold uppercase tracking-wider mb-1">Acceso con Google Activo</p>
            <p className="opacity-90 leading-relaxed">
              Esta es una herramienta exclusiva para usuarios autorizados. Inicia sesión con Google; si tu correo cuenta con una solicitud aprobada, ingresarás inmediatamente.
            </p>
          </div>
        </div>

        <AnimatePresence mode="wait">
          {!showRequestForm ? (
            <motion.div
              key="login"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              className="space-y-4"
            >
              <div className="space-y-4">
                <p className={`text-xs text-center leading-relaxed ${isDarkMode ? 'text-slate-400' : 'text-slate-500'} mb-2`}>
                  Haz clic a continuación para ingresar de forma segura usando tu cuenta de Google registrada.
                </p>

                {/* Error Alert */}
                <AnimatePresence>
                  {error && (
                    <motion.div
                      initial={{ opacity: 0, y: -8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-500 flex gap-2.5 items-start"
                    >
                      <AlertTriangle className="shrink-0 mt-0.5" size={15} />
                      <span className="text-[11px] font-semibold leading-relaxed">{error}</span>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Google Sign-In Button */}
                <div className="pt-2 flex flex-col gap-3">
                  <button
                    onClick={handleGoogleSignIn}
                    disabled={isLoading || isSuccess}
                    className={`w-full py-3.5 px-6 rounded-xl font-bold text-sm tracking-wide shadow-lg cursor-pointer transition-all flex items-center justify-center gap-3 ${
                      isSuccess
                        ? 'bg-emerald-500 hover:bg-emerald-500 text-white shadow-emerald-500/10'
                        : isDarkMode
                          ? 'bg-white text-slate-900 hover:bg-slate-100 shadow-white/5 active:scale-[0.98] border border-transparent'
                          : 'bg-slate-950 text-white hover:bg-slate-900 active:scale-[0.98]'
                    } disabled:opacity-50`}
                  >
                    {isSuccess ? (
                      <>
                        <ShieldCheck size={18} />
                        <span>¡Acceso Concedido!</span>
                      </>
                    ) : isLoading ? (
                      <>
                        <div className={`w-4 h-4 border-2 rounded-full animate-spin ${
                          isDarkMode ? 'border-slate-900/30 border-t-slate-900' : 'border-white/30 border-t-white'
                        }`} />
                        <span>Verificando acceso...</span>
                      </>
                    ) : (
                      <>
                        <Chrome size={18} className="shrink-0" />
                        <span>Iniciar Sesión con Google</span>
                        <ArrowRight size={16} />
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => { setShowRequestForm(true); setError(null); }}
                    className={`w-full py-3 rounded-xl border font-bold text-xs tracking-wider uppercase transition-all flex items-center justify-center gap-1.5 ${
                      isDarkMode
                        ? 'bg-slate-950/40 border-slate-800 text-slate-400 hover:text-white hover:border-slate-700 hover:bg-slate-900/40'
                        : 'bg-slate-50 border-slate-200 text-slate-500 hover:text-slate-800 hover:border-slate-300 hover:bg-slate-100'
                    }`}
                  >
                    <User size={14} />
                    <span>Solicitar Acceso a la Herramienta</span>
                  </button>
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="request"
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              className="space-y-4"
            >
              <div className="flex items-center justify-between mb-2">
                <button
                  type="button"
                  onClick={() => setShowRequestForm(false)}
                  className={`flex items-center gap-1 text-xs font-bold transition-colors ${
                    isDarkMode ? 'text-slate-400 hover:text-indigo-400' : 'text-slate-500 hover:text-indigo-600'
                  }`}
                >
                  <ArrowLeft size={14} />
                  <span>Volver al Login</span>
                </button>
                <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-sm ${
                  isDarkMode ? 'bg-indigo-500/10 text-indigo-400' : 'bg-indigo-50 text-indigo-600'
                }`}>
                  Formulario
                </span>
              </div>

              {!reqSuccess ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className={`text-[10px] font-black uppercase tracking-wider ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                        Nombre
                      </label>
                      <input
                        type="text"
                        disabled={isSubmittingReq}
                        value={reqFirstName}
                        onChange={(e) => setReqFirstName(e.target.value)}
                        placeholder="Ej: Mariano"
                        className={`w-full px-4 py-3 rounded-xl border text-sm transition-all focus:outline-hidden focus:ring-2 focus:ring-indigo-500/40 ${
                          isDarkMode
                            ? 'bg-slate-950/80 border-slate-800 text-white placeholder-slate-600 focus:border-indigo-500/80'
                            : 'bg-slate-50 border-slate-200 text-slate-800 placeholder-slate-400 focus:border-indigo-500 focus:bg-white'
                        }`}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className={`text-[10px] font-black uppercase tracking-wider ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                        Apellido
                      </label>
                      <input
                        type="text"
                        disabled={isSubmittingReq}
                        value={reqLastName}
                        onChange={(e) => setReqLastName(e.target.value)}
                        placeholder="Ej: Fischer"
                        className={`w-full px-4 py-3 rounded-xl border text-sm transition-all focus:outline-hidden focus:ring-2 focus:ring-indigo-500/40 ${
                          isDarkMode
                            ? 'bg-slate-950/80 border-slate-800 text-white placeholder-slate-600 focus:border-indigo-500/80'
                            : 'bg-slate-50 border-slate-200 text-slate-800 placeholder-slate-400 focus:border-indigo-500 focus:bg-white'
                        }`}
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className={`text-[10px] font-black uppercase tracking-wider ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                      Correo Electrónico (Google)
                    </label>
                    <div className="relative">
                      <span className={`absolute left-3.5 top-3.5 ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>
                        <Mail size={16} />
                      </span>
                      <input
                        type="email"
                        disabled={isSubmittingReq}
                        value={reqEmail}
                        onChange={(e) => setReqEmail(e.target.value)}
                        placeholder="ejemplo@gmail.com"
                        className={`w-full pl-10 pr-4 py-3 rounded-xl border text-sm transition-all focus:outline-hidden focus:ring-2 focus:ring-indigo-500/40 ${
                          isDarkMode
                            ? 'bg-slate-950/80 border-slate-800 text-white placeholder-slate-600 focus:border-indigo-500/80'
                            : 'bg-slate-50 border-slate-200 text-slate-800 placeholder-slate-400 focus:border-indigo-500 focus:bg-white'
                        }`}
                      />
                    </div>
                    <p className={`text-[10px] leading-relaxed ${isDarkMode ? 'text-slate-500' : 'text-slate-400'} italic`}>
                      * El correo ingresado debe coincidir exactamente con el que utilices para iniciar sesión con Google.
                    </p>
                  </div>

                  {reqError && (
                    <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-500 flex gap-2 items-start">
                      <AlertTriangle className="shrink-0 mt-0.5" size={15} />
                      <span className="text-[11px] font-semibold leading-relaxed">{reqError}</span>
                    </div>
                  )}

                  <button
                    onClick={handleRequestSubmit}
                    disabled={isSubmittingReq}
                    className={`w-full py-3.5 rounded-xl bg-indigo-600 text-white font-bold text-sm tracking-wide shadow-lg cursor-pointer transition-all hover:bg-indigo-500 active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-50`}
                  >
                    {isSubmittingReq ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        <span>Enviando solicitud...</span>
                      </>
                    ) : (
                      <>
                        <span>Enviar Solicitud de Acceso</span>
                        <ArrowRight size={16} />
                      </>
                    )}
                  </button>
                </div>
              ) : (
                <div className="space-y-4 text-center py-4">
                  <div className="mx-auto w-12 h-12 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center mb-2">
                    <CheckCircle2 size={28} />
                  </div>
                  <h3 className="font-bold text-base">Solicitud Enviada con Éxito</h3>
                  <p className={`text-xs leading-relaxed ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                    Tu solicitud ha sido guardada en nuestro sistema de forma segura.
                  </p>
                  
                  <div className={`p-3.5 rounded-xl border text-center ${
                    isDarkMode ? 'bg-slate-950/60 border-slate-800' : 'bg-slate-50 border-slate-150'
                  }`}>
                    <p className={`text-[10px] uppercase font-black tracking-widest ${isDarkMode ? 'text-slate-500' : 'text-slate-400'} mb-1`}>
                      Tu Identificador de Ticket:
                    </p>
                    <p className="font-mono text-sm font-bold text-indigo-500 tracking-wider">
                      {generatedUserId}
                    </p>
                  </div>

                  <p className={`text-xs leading-relaxed font-bold ${isDarkMode ? 'text-indigo-400' : 'text-indigo-600'}`}>
                    Un administrador revisará tu solicitud. Una vez aprobada, recibirás una notificación y podrás ingresar inmediatamente usando Google Sign-In con tu correo registrado.
                  </p>
                  <button
                    onClick={() => { setReqSuccess(false); setShowRequestForm(false); }}
                    className={`w-full py-3 rounded-xl border font-bold text-xs tracking-wider uppercase transition-all ${
                      isDarkMode
                        ? 'bg-slate-950/40 border-slate-800 text-slate-300 hover:text-white hover:bg-slate-900/40'
                        : 'bg-white border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                    }`}
                  >
                    Volver al Inicio de Sesión
                  </button>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
};
