/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, ShieldCheck, Mail, Calendar, User, Search, 
  CheckCircle2, XCircle, Clock, Filter, Loader2, AlertTriangle, RefreshCw,
  Copy, ExternalLink, Check
} from 'lucide-react';
import { db } from '../lib/firebase';
import { collection, query, orderBy, getDocs, doc, updateDoc } from 'firebase/firestore';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  isDarkMode: boolean;
  playSound: (type: 'success' | 'click' | 'reset' | 'tutor') => void;
}

interface AccessRequest {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  userId: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt?: any;
}

export const AdminDashboard: React.FC<Props> = ({ isOpen, onClose, isDarkMode, playSound }) => {
  const [requests, setRequests] = useState<AccessRequest[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    playSound('success');
    setTimeout(() => setCopiedId(null), 2000);
  };

  const triggerLocalEmail = (req: AccessRequest) => {
    playSound('click');
    const subject = encodeURIComponent('¡Tu acceso a SCORM AI Builder Pro ha sido aprobado! 🎉');
    const body = encodeURIComponent(
      `Hola ${req.firstName} ${req.lastName},\n\n` +
      `Nos complace informarte que tu solicitud de acceso para la herramienta de autoría de cuestionarios SCORM AI Builder Pro ha sido aprobada.\n\n` +
      `Ya puedes ingresar a la plataforma directamente iniciando sesión con Google usando tu correo electrónico registrado (${req.email}).\n\n` +
      `¡Que tengas un excelente día!\n\n` +
      `Atentamente,\n` +
      `El equipo de SCORM AI Builder Pro`
    );
    window.location.href = `mailto:${req.email}?subject=${subject}&body=${body}`;
  };

  const fetchRequests = async () => {
    setLoading(true);
    setError(null);
    try {
      const q = query(collection(db, 'solicitudes_acceso'), orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);
      const fetched: AccessRequest[] = [];
      querySnapshot.forEach((docSnap) => {
        fetched.push({
          id: docSnap.id,
          ...docSnap.data()
        } as AccessRequest);
      });
      setRequests(fetched);
    } catch (err: any) {
      console.error('Error fetching access requests:', err);
      setError('No se pudieron cargar las solicitudes de acceso. Verifica las reglas de Firestore.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchRequests();
    }
  }, [isOpen]);

  const handleApprove = async (req: AccessRequest) => {
    setProcessingId(req.id);
    setError(null);
    setSuccessMessage(null);
    playSound('click');

    try {
      // 1. Update status to 'approved' in Firestore
      const docRef = doc(db, 'solicitudes_acceso', req.id);
      await updateDoc(docRef, { status: 'approved' });

      // 2. Trigger the automated approval email endpoint
      console.log(`Calling approval email API for ${req.email}...`);
      const response = await fetch('/api/send-approval-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: req.email,
          firstName: req.firstName,
          lastName: req.lastName,
          userId: req.userId,
        }),
      });

      const apiResult = await response.json();

      if (!response.ok) {
        throw new Error(apiResult.error || 'Error al enviar el correo electrónico de aprobación.');
      }

      playSound('success');
      setSuccessMessage(`¡Solicitud aprobada con éxito! Se ha registrado el estado y ${
        apiResult.sent 
          ? 'se envió el correo de notificación SMTP.' 
          : 'se simuló el correo electrónico en la consola del servidor.'
      }`);
      
      // Update local state
      setRequests(prev => prev.map(r => r.id === req.id ? { ...r, status: 'approved' } : r));
    } catch (err: any) {
      console.error('Error approving request:', err);
      setError(err.message || 'Error al procesar la aprobación.');
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (req: AccessRequest) => {
    setProcessingId(req.id);
    setError(null);
    setSuccessMessage(null);
    playSound('click');

    try {
      const docRef = doc(db, 'solicitudes_acceso', req.id);
      await updateDoc(docRef, { status: 'rejected' });

      playSound('reset');
      setSuccessMessage(`La solicitud de ${req.firstName} ${req.lastName} ha sido rechazada.`);
      
      // Update local state
      setRequests(prev => prev.map(r => r.id === req.id ? { ...r, status: 'rejected' } : r));
    } catch (err: any) {
      console.error('Error rejecting request:', err);
      setError(err.message || 'Error al procesar el rechazo.');
    } finally {
      setProcessingId(null);
    }
  };

  const filteredRequests = requests.filter(req => {
    const fullName = `${req.firstName} ${req.lastName}`.toLowerCase();
    const email = req.email.toLowerCase();
    const id = req.userId.toLowerCase();
    const queryMatch = fullName.includes(searchTerm.toLowerCase()) || 
                       email.includes(searchTerm.toLowerCase()) || 
                       id.includes(searchTerm.toLowerCase());
    
    if (statusFilter === 'all') return queryMatch;
    return req.status === statusFilter && queryMatch;
  });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm"
      />

      {/* Container */}
      <motion.div
        initial={{ scale: 0.95, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 20 }}
        className={`relative w-full max-w-4xl max-h-[85vh] overflow-hidden rounded-3xl shadow-2xl border flex flex-col ${
          isDarkMode ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-800'
        }`}
      >
        {/* Header */}
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-gradient-to-r from-indigo-700 to-indigo-900 text-white">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-xl">
              <ShieldCheck size={24} />
            </div>
            <div>
              <h2 className="text-xl font-black tracking-tight text-white">Panel de Administración</h2>
              <p className="text-xs text-indigo-100 font-medium">Control de solicitudes de acceso a la plataforma</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-white/20 rounded-full transition-colors text-white"
          >
            <X size={20} />
          </button>
        </div>

        {/* Search & Filters */}
        <div className={`p-4 border-b flex flex-col md:flex-row gap-4 items-center justify-between ${
          isDarkMode ? 'bg-slate-950/50 border-slate-800' : 'bg-slate-50 border-slate-150'
        }`}>
          {/* Search Bar */}
          <div className="relative w-full md:w-80">
            <span className={`absolute left-3.5 top-2.5 ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>
              <Search size={16} />
            </span>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por nombre, email o ID..."
              className={`w-full pl-10 pr-4 py-2 rounded-xl border text-xs transition-all focus:outline-hidden focus:ring-2 focus:ring-indigo-500/40 ${
                isDarkMode
                  ? 'bg-slate-900 border-slate-800 text-white placeholder-slate-600 focus:border-indigo-500/80'
                  : 'bg-white border-slate-200 text-slate-800 placeholder-slate-400 focus:border-indigo-500'
              }`}
            />
          </div>

          {/* Status Filters */}
          <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto">
            <span className={`text-[10px] font-bold uppercase tracking-wider mr-2 ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>
              Filtrar:
            </span>
            {(['all', 'pending', 'approved', 'rejected'] as const).map((filter) => (
              <button
                key={filter}
                onClick={() => { playSound('click'); setStatusFilter(filter); }}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all uppercase tracking-wider text-[10px] ${
                  statusFilter === filter
                    ? 'bg-indigo-600 text-white'
                    : isDarkMode
                      ? 'bg-slate-900 hover:bg-slate-800 text-slate-400'
                      : 'bg-white border border-slate-200 hover:bg-slate-100 text-slate-600'
                }`}
              >
                {filter === 'all' ? 'Todas' : 
                 filter === 'pending' ? 'Pendientes' : 
                 filter === 'approved' ? 'Aprobadas' : 'Rechazadas'}
              </button>
            ))}

            <button
              onClick={() => { playSound('click'); fetchRequests(); }}
              disabled={loading}
              className={`p-1.5 rounded-xl ml-2 transition-all shrink-0 ${
                isDarkMode ? 'bg-slate-900 text-slate-400 hover:bg-slate-800' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
              }`}
              title="Actualizar datos"
            >
              <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            </button>
          </div>
        </div>

        {/* Content body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
          {/* Notification Alerts */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-500 flex gap-2.5 items-start"
              >
                <AlertTriangle className="shrink-0 mt-0.5" size={18} />
                <div className="text-xs">
                  <p className="font-bold">Error del Sistema</p>
                  <p className="opacity-90 mt-0.5 leading-relaxed">{error}</p>
                </div>
              </motion.div>
            )}

            {successMessage && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 flex gap-2.5 items-start"
              >
                <CheckCircle2 className="shrink-0 mt-0.5" size={18} />
                <div className="text-xs">
                  <p className="font-bold">Operación Exitosa</p>
                  <p className="opacity-90 mt-0.5 leading-relaxed">{successMessage}</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {loading ? (
            <div className="h-48 flex flex-col items-center justify-center gap-3 text-slate-400">
              <Loader2 className="animate-spin text-indigo-500" size={32} />
              <p className="text-xs font-semibold">Cargando solicitudes...</p>
            </div>
          ) : filteredRequests.length === 0 ? (
            <div className="h-48 flex flex-col items-center justify-center gap-2 text-slate-400 text-center p-8">
              <Clock size={40} className="text-slate-300 dark:text-slate-700" />
              <p className="text-xs font-bold mt-2">No se encontraron solicitudes</p>
              <p className="text-[11px] text-slate-500 max-w-sm mt-1 leading-relaxed">
                {searchTerm ? 'No hay registros que coincidan con la búsqueda.' : 'No existen solicitudes registradas para esta categoría todavía.'}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredRequests.map((req) => (
                <div 
                  key={req.id}
                  className={`p-5 rounded-2xl border transition-all flex flex-col md:flex-row items-start md:items-center justify-between gap-4 ${
                    isDarkMode 
                      ? 'bg-slate-950/40 border-slate-800/80 hover:border-slate-700' 
                      : 'bg-slate-50/50 border-slate-150 hover:border-slate-300'
                  }`}
                >
                  <div className="space-y-2 min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h4 className="font-bold text-sm truncate flex items-center gap-1.5">
                        <User size={14} className="text-slate-400 shrink-0" />
                        {req.firstName} {req.lastName}
                      </h4>

                      {/* Status Badges */}
                      {req.status === 'pending' && (
                        <span className="px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider bg-amber-500/10 text-amber-500 border border-amber-500/20 flex items-center gap-1">
                          <Clock size={10} /> Pendiente
                        </span>
                      )}
                      {req.status === 'approved' && (
                        <span className="px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 flex items-center gap-1">
                          <CheckCircle2 size={10} /> Aprobado
                        </span>
                      )}
                      {req.status === 'rejected' && (
                        <span className="px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider bg-rose-500/10 text-rose-500 border border-rose-500/20 flex items-center gap-1">
                          <XCircle size={10} /> Rechazado
                        </span>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-1.5 text-xs text-slate-500 dark:text-slate-400">
                      <p className="flex items-center gap-1.5 truncate">
                        <Mail size={12} className="text-slate-400 shrink-0" />
                        {req.email}
                      </p>
                      <p className="flex items-center gap-1.5">
                        <ShieldCheck size={12} className="text-indigo-400 shrink-0" />
                        ID asignado: <strong className="font-mono text-indigo-500 dark:text-indigo-400">{req.userId}</strong>
                      </p>
                      {req.createdAt && (
                        <p className="flex items-center gap-1.5 col-span-1 md:col-span-2 text-[10px] text-slate-400">
                          <Calendar size={12} />
                          Solicitado el: {new Date(req.createdAt?.seconds * 1000).toLocaleString('es-ES')}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-wrap items-center gap-2 w-full md:w-auto justify-end border-t md:border-t-0 pt-3 md:pt-0 shrink-0">
                    {req.status === 'pending' ? (
                      <>
                        <button
                          disabled={processingId !== null}
                          onClick={() => handleReject(req)}
                          className={`px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1 cursor-pointer transition-colors ${
                            isDarkMode 
                              ? 'bg-slate-900 text-slate-300 hover:bg-rose-500/20 hover:text-rose-400' 
                              : 'bg-white border border-slate-200 text-slate-600 hover:bg-rose-50 hover:text-rose-600'
                          }`}
                        >
                          {processingId === req.id ? <Loader2 size={12} className="animate-spin" /> : <XCircle size={12} />}
                          <span>Rechazar</span>
                        </button>
                        <button
                          disabled={processingId !== null}
                          onClick={() => handleApprove(req)}
                          className="px-4 py-1.5 rounded-xl font-bold text-xs bg-emerald-600 text-white hover:bg-emerald-500 flex items-center gap-1 shadow-lg shadow-emerald-500/10 cursor-pointer transition-all active:scale-95"
                        >
                          {processingId === req.id ? <Loader2 size={12} className="animate-spin" /> : <CheckCircle2 size={12} />}
                          <span>Aprobar y Registrar</span>
                        </button>
                      </>
                    ) : (
                      <div className="flex items-center gap-2">
                        {req.status === 'approved' && (
                          <>
                            <button
                              onClick={() => triggerLocalEmail(req)}
                              className={`px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 cursor-pointer transition-colors ${
                                isDarkMode 
                                  ? 'bg-indigo-950/40 text-indigo-300 hover:bg-indigo-900/50 border border-indigo-900/50' 
                                  : 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-100'
                              }`}
                              title="Enviar email usando tu correo local (Gmail, Outlook, etc.)"
                            >
                              <ExternalLink size={12} />
                              <span>Enviar Correo</span>
                            </button>
                            <button
                              onClick={() => handleCopy(req.userId, req.id)}
                              className={`px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 cursor-pointer transition-colors ${
                                copiedId === req.id
                                  ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'
                                  : isDarkMode 
                                    ? 'bg-slate-900 text-slate-300 hover:bg-slate-800 border border-slate-800' 
                                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200'
                              }`}
                            >
                              {copiedId === req.id ? <Check size={12} /> : <Copy size={12} />}
                              <span>{copiedId === req.id ? '¡Copiado!' : 'Copiar ID'}</span>
                            </button>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer info */}
        <div className={`p-4 text-center border-t text-[10px] font-medium text-slate-400 dark:text-slate-500 ${
          isDarkMode ? 'bg-slate-950/30 border-slate-800/80' : 'bg-slate-50 border-slate-150'
        }`}>
          SCORM AI Builder Pro &copy; 2026 &bull; Panel de Control Privado de Administrador
        </div>
      </motion.div>
    </div>
  );
};
