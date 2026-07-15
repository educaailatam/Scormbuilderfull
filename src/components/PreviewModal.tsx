/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { X, Eye, ExternalLink, Smartphone, Tablet as TabletIcon, Monitor, Maximize2, Minimize2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { generateQuizHtml } from '../scormUtils';
import { QuizBundle } from '../types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  bundle: QuizBundle;
}

export const PreviewModal: React.FC<Props> = ({ isOpen, onClose, bundle }) => {
  const [device, setDevice] = useState<'mobile' | 'tablet' | 'desktop'>('desktop');
  const [isFullScreen, setIsFullScreen] = useState(false);
  const modalRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullScreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  const toggleFullScreen = async () => {
    if (!modalRef.current) return;
    try {
      if (!document.fullscreenElement) {
        if (modalRef.current.requestFullscreen) {
          await modalRef.current.requestFullscreen();
        }
        setIsFullScreen(true);
      } else {
        if (document.exitFullscreen) {
          await document.exitFullscreen();
        }
        setIsFullScreen(false);
      }
    } catch (err) {
      console.warn("Native fullscreen not supported or blocked, falling back to viewport-maximize:", err);
      setIsFullScreen(!isFullScreen);
    }
  };

  const handleClose = async () => {
    if (document.fullscreenElement && document.exitFullscreen) {
      try {
        await document.exitFullscreen();
      } catch (e) {}
    }
    onClose();
  };

  const html = generateQuizHtml(bundle);
  // Inyectamos un mock de la API SCORM para que el preview no falle al buscar la API del LMS
  const mockedHtml = html.replace('function buscarAPI(win) {', `
    function buscarAPI(win) {
      console.log('SCORM Preview Mode: API Mocked');
      return {
        LMSInitialize: () => { console.log('SCORM Init'); return "true"; },
        LMSSetValue: (k, v) => { console.log('SCORM Set:', k, v); return "true"; },
        LMSCommit: (v) => { console.log('SCORM Commit'); return "true"; },
        LMSFinish: (v) => { console.log('SCORM Finish'); return "true"; }
      };
  `);

  const deviceSizes = {
    mobile: 'w-[min(100%,360px)] aspect-square',
    tablet: 'w-[min(100%,580px)] aspect-square',
    desktop: 'w-[min(100%,75vh)] aspect-square',
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/90 backdrop-blur-md"
        >
          <motion.div 
            ref={modalRef}
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ 
              opacity: 1, 
              scale: 1, 
              y: 0,
              width: isFullScreen ? '100vw' : '100%',
              height: isFullScreen ? '100vh' : '90vh',
              maxWidth: isFullScreen ? '100vw' : '1024px',
              borderRadius: isFullScreen ? '0px' : '2rem',
            }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="bg-white dark:bg-slate-900 shadow-2xl flex flex-col overflow-hidden border border-white/20 relative z-50"
          >
            <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-slate-900">
              <div className="flex items-center gap-4">
                <div className="bg-indigo-100 dark:bg-indigo-900/30 p-2.5 rounded-xl text-indigo-600 dark:text-indigo-400">
                  <Eye size={20} />
                </div>
                <div>
                  <h3 className="font-bold text-slate-800 dark:text-white text-lg">Previsualización Interactiva</h3>
                  <div className="flex items-center gap-2">
                    <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
                    <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-widest font-mono">Simulación de Entorno LMS Activa</p>
                  </div>
                </div>
              </div>

              {/* Selector de tamaño de pantalla/dispositivo */}
              <div className="flex items-center gap-1.5 p-1.5 bg-slate-100 dark:bg-slate-800/80 rounded-2xl border border-slate-200/55 dark:border-slate-700/55 self-center">
                <button
                  type="button"
                  onClick={() => setDevice('mobile')}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all duration-200 ${
                    device === 'mobile'
                      ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-md scale-105'
                      : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
                  }`}
                  aria-label="Previsualizar en tamaño dispositivo Móvil"
                  title="Móvil"
                >
                  <Smartphone size={14} />
                  <span className="hidden sm:inline">Móvil</span>
                </button>
                <button
                  type="button"
                  onClick={() => setDevice('tablet')}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all duration-200 ${
                    device === 'tablet'
                      ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-md scale-105'
                      : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
                  }`}
                  aria-label="Previsualizar en tamaño dispositivo Tablet"
                  title="Tablet"
                >
                  <TabletIcon size={14} />
                  <span className="hidden sm:inline">Tablet</span>
                </button>
                <button
                  type="button"
                  onClick={() => setDevice('desktop')}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all duration-200 ${
                    device === 'desktop'
                      ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-md scale-105'
                      : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
                  }`}
                  aria-label="Previsualizar en tamaño dispositivo Escritorio"
                  title="Escritorio"
                >
                  <Monitor size={14} />
                  <span className="hidden sm:inline">Escritorio</span>
                </button>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={toggleFullScreen}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all border shadow-sm ${
                    isFullScreen 
                      ? 'bg-indigo-600 text-white border-indigo-600 hover:bg-indigo-700' 
                      : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-750'
                  }`}
                  aria-label={isFullScreen ? 'Salir de pantalla completa' : 'Ver en pantalla completa'}
                  title={isFullScreen ? 'Minimizar' : 'Pantalla Completa'}
                >
                  {isFullScreen ? <Minimize2 size={15} /> : <Maximize2 size={15} />}
                  <span>Pantalla Completa</span>
                </button>

                <button 
                  onClick={handleClose}
                  className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full text-slate-400 hover:text-slate-600 transition-all hover:rotate-90"
                  aria-label="Cerrar"
                >
                  <X size={28} />
                </button>
              </div>
            </div>
            
            <div className="flex-1 bg-slate-50 dark:bg-slate-950 p-4 md:p-6 overflow-hidden flex items-center justify-center">
                <div className={`${deviceSizes[device]} ${isFullScreen && device === 'desktop' ? '!w-full !h-full !max-w-none !max-h-none !aspect-auto !rounded-none shadow-none border-none' : ''} max-w-full max-h-full bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-800 transition-all duration-300 ease-in-out`}>
                    <iframe 
                        srcDoc={mockedHtml}
                        className="w-full h-full border-none bg-white"
                        title="Quiz Preview Simulation"
                    />
                </div>
            </div>

            <div className="px-8 py-4 bg-slate-50 dark:bg-slate-950 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <p className="text-xs text-slate-400 dark:text-slate-500 font-medium flex items-center gap-2">
                <ExternalLink size={14} />
                Esta vista previa utiliza el código exacto que se exportará en el archivo index.html.
              </p>
              <button 
                onClick={handleClose}
                className="px-6 py-2 bg-slate-800 dark:bg-indigo-600 text-white text-sm font-bold rounded-xl hover:bg-slate-700 dark:hover:bg-indigo-700 transition-colors"
                aria-label="Cerrar ventana de previsualización"
              >
                Cerrar Preview
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
