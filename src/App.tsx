/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { ThemeSelector } from './components/ThemeSelector';
import { LessonEditor } from './components/LessonEditor';
import { AIAssistant } from './components/AIAssistant';
import { TutorPanel } from './components/TutorPanel';
import { StatsPanel } from './components/StatsPanel';
import { PreviewModal } from './components/PreviewModal';
import { AccessibilityPanel } from './components/AccessibilityPanel';
import { AISettingsPanel } from './components/AISettingsPanel';
import { NeonCustomizer } from './components/NeonCustomizer';
import { Gatekeeper } from './components/Gatekeeper';
import { CloudSync } from './components/CloudSync';
import { QuizBundle, ThemeType, LessonItem, Question } from './types';
import { Download, Package, BookOpen, Settings, Loader2, Eye, Sun, Moon, FileDown, Printer, AlertTriangle, CheckCircle2, XCircle, ShieldCheck, Accessibility, Keyboard, Save, RotateCcw, Upload, FileJson, FileText, Award, TrendingUp, Volume2, VolumeX, Bell, BellOff, RefreshCw, HelpCircle, Sparkles, Brain, LogOut, Wifi, WifiOff, Database } from 'lucide-react';
import JSZip from 'jszip';
import { motion, AnimatePresence } from 'motion/react';
import { generateManifest, generateQuizHtml } from './scormUtils';
import { generateQuizPdf } from './pdfUtils';
import { generateQuizDocx } from './docxUtils';

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    try {
      return localStorage.getItem('scorm_builder_auth') === 'true';
    } catch {
      return false;
    }
  });
  const [authUserEmail, setAuthUserEmail] = useState<string>(() => {
    try {
      return localStorage.getItem('scorm_builder_auth_email') || '';
    } catch {
      return '';
    }
  });

  const handleUnlock = (email: string) => {
    setIsAuthenticated(true);
    setAuthUserEmail(email);
    try {
      localStorage.setItem('scorm_builder_auth', 'true');
      localStorage.setItem('scorm_builder_auth_email', email);
    } catch (e) {
      console.error(e);
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setAuthUserEmail('');
    try {
      localStorage.removeItem('scorm_builder_auth');
      localStorage.removeItem('scorm_builder_auth_email');
    } catch (e) {
      console.error(e);
    }
    playSound('reset');
  };

  const [isOnline, setIsOnline] = useState<boolean>(() => {
    try {
      return typeof navigator !== 'undefined' ? navigator.onLine : true;
    } catch {
      return true;
    }
  });

  const [showGuide, setShowGuide] = useState(false);

  const [title, setTitle] = useState(() => {
    try {
      const saved = localStorage.getItem('scorm_builder_save');
      return saved ? JSON.parse(saved).title : 'Hacer cuestionarios';
    } catch { return 'Hacer cuestionarios'; }
  });
  const [theme, setTheme] = useState<ThemeType>(() => {
    try {
      const saved = localStorage.getItem('scorm_builder_save');
      return saved ? JSON.parse(saved).theme : 'neon';
    } catch { return 'neon'; }
  });
  const [items, setItems] = useState<LessonItem[]>(() => {
    try {
      const saved = localStorage.getItem('scorm_builder_save');
      return saved ? JSON.parse(saved).items : [];
    } catch { return []; }
  });
  const [isExporting, setIsExporting] = useState(false);
  const [isThemeConfirmed, setIsThemeConfirmed] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [timeLimit, setTimeLimit] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('scorm_builder_save');
      return saved ? JSON.parse(saved).timeLimit : 0;
    } catch { return 0; }
  }); // 0 means no limit
  const [shuffleQuestions, setShuffleQuestions] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('scorm_builder_save');
      return saved ? JSON.parse(saved).shuffleQuestions ?? false : false;
    } catch { return false; }
  });
  const [kioskMode, setKioskMode] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('scorm_builder_save');
      return saved ? JSON.parse(saved).kioskMode ?? false : false;
    } catch { return false; }
  });
  const [includeAnswersInPdf, setIncludeAnswersInPdf] = useState(false);
  const [includeConfigSummaryInPdf, setIncludeConfigSummaryInPdf] = useState(false);
  const [includeAnswersInDocx, setIncludeAnswersInDocx] = useState(false);
  const [includeConfigSummaryInDocx, setIncludeConfigSummaryInDocx] = useState(false);
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [isExportingDocx, setIsExportingDocx] = useState(false);
  const [isExportingGift, setIsExportingGift] = useState(false);
  const [isFlowPreviewMode, setIsFlowPreviewMode] = useState(false);
  const [isTutorModeOpen, setIsTutorModeOpen] = useState(false);
  const [feedbackTiming, setFeedbackTiming] = useState<'immediate' | 'end'>(() => {
    try {
      const saved = localStorage.getItem('scorm_builder_save');
      return saved ? JSON.parse(saved).feedbackTiming ?? 'immediate' : 'immediate';
    } catch { return 'immediate'; }
  });
  const [isAccessibilityMode, setIsAccessibilityMode] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('scorm_builder_save');
      return saved ? JSON.parse(saved).isAccessibilityMode ?? false : false;
    } catch { return false; }
  });
  const [pointsPerQuestion, setPointsPerQuestion] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('scorm_builder_save');
      return saved ? JSON.parse(saved).pointsPerQuestion ?? 10 : 10;
    } catch { return 10; }
  });
  const [passingScore, setPassingScore] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('scorm_builder_save');
      return saved ? JSON.parse(saved).passingScore ?? 60 : 60;
    } catch { return 60; }
  });

  const [neonPrimaryColor, setNeonPrimaryColor] = useState<string>(() => {
    try {
      const saved = localStorage.getItem('scorm_builder_save');
      return saved ? JSON.parse(saved).neonPrimaryColor ?? '#0c071e' : '#0c071e';
    } catch { return '#0c071e'; }
  });

  const [neonAccentColor, setNeonAccentColor] = useState<string>(() => {
    try {
      const saved = localStorage.getItem('scorm_builder_save');
      return saved ? JSON.parse(saved).neonAccentColor ?? '#ffd700' : '#ffd700';
    } catch { return '#ffd700'; }
  });

  const [enableSoundEffects, setEnableSoundEffects] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('scorm_builder_save');
      return saved ? JSON.parse(saved).enableSoundEffects ?? true : true;
    } catch { return true; }
  });

  const [enableSuccessNotifications, setEnableSuccessNotifications] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('scorm_builder_save');
      return saved ? JSON.parse(saved).enableSuccessNotifications ?? true : true;
    } catch { return true; }
  });

  const [enableBrowserNotifications, setEnableBrowserNotifications] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('scorm_builder_save');
      return saved ? JSON.parse(saved).enableBrowserNotifications ?? false : false;
    } catch { return false; }
  });

  const [aiSystemPrompt, setAiSystemPrompt] = useState<string>(() => {
    try {
      const saved = localStorage.getItem('scorm_builder_save');
      return saved ? JSON.parse(saved).aiSystemPrompt ?? '' : '';
    } catch { return ''; }
  });

  const playSound = (type: 'success' | 'click' | 'reset' | 'tutor') => {
    if (!enableSoundEffects) return;
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) return;
      const ctx = new AudioContextClass();
      const now = ctx.currentTime;
      
      if (type === 'success') {
        const osc1 = ctx.createOscillator();
        const gain1 = ctx.createGain();
        osc1.type = 'sine';
        osc1.frequency.setValueAtTime(523.25, now);
        osc1.frequency.exponentialRampToValueAtTime(1046.50, now + 0.15);
        gain1.gain.setValueAtTime(0.12, now);
        gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
        osc1.connect(gain1);
        gain1.connect(ctx.destination);
        osc1.start(now);
        osc1.stop(now + 0.3);
        
        const osc2 = ctx.createOscillator();
        const gain2 = ctx.createGain();
        osc2.type = 'sine';
        osc2.frequency.setValueAtTime(659.25, now + 0.08);
        osc2.frequency.exponentialRampToValueAtTime(1318.51, now + 0.23);
        gain2.gain.setValueAtTime(0.1, now + 0.08);
        gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
        osc2.connect(gain2);
        gain2.connect(ctx.destination);
        osc2.start(now + 0.08);
        osc2.stop(now + 0.35);
      } else if (type === 'click') {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(600, now);
        osc.frequency.exponentialRampToValueAtTime(150, now + 0.08);
        gain.gain.setValueAtTime(0.06, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.08);
      } else if (type === 'reset') {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(440, now);
        osc.frequency.exponentialRampToValueAtTime(110, now + 0.25);
        gain.gain.setValueAtTime(0.1, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.25);
      } else if (type === 'tutor') {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(300, now);
        osc.frequency.exponentialRampToValueAtTime(900, now + 0.4);
        gain.gain.setValueAtTime(0.08, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.4);
      }
    } catch (e) {
      console.warn('Audio play failed:', e);
    }
  };

  const triggerNotification = (titleText: string, bodyText: string) => {
    if (enableBrowserNotifications && 'Notification' in window) {
      if (Notification.permission === 'granted') {
        try {
          new Notification(titleText, {
            body: bodyText,
            icon: '/favicon.ico'
          });
        } catch (e) {
          console.warn('Notification failed to trigger:', e);
        }
      }
    }
  };

  const [itemCount, setItemCount] = useState(0);
  const [lastSaved, setLastSaved] = useState<string | null>(null);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [isForceSaving, setIsForceSaving] = useState(false);
  const [isForceSaveSuccess, setIsForceSaveSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleForceAutosave = () => {
    setIsForceSaving(true);
    playSound('click');
    
    // Tiny delay to simulate syncing state to LocalStorage for clear UX
    setTimeout(() => {
      handleSave();
      setIsForceSaving(false);
      setIsForceSaveSuccess(true);
      
      // Flash visually for 1.5s
      setTimeout(() => {
        setIsForceSaveSuccess(false);
      }, 1500);
    }, 400);
  };

  const handleClearAll = () => {
    setTitle('Hacer cuestionarios');
    setTheme('neon');
    setItems([]);
    setTimeLimit(0);
    setShuffleQuestions(false);
    setKioskMode(false);
    setFeedbackTiming('immediate');
    setIsThemeConfirmed(false);
    setPointsPerQuestion(10);
    setPassingScore(60);
    setNeonPrimaryColor('#0c071e');
    setNeonAccentColor('#ffd700');
    
    localStorage.removeItem('scorm_builder_save');
    playSound('reset');
    
    if (enableSuccessNotifications) {
      setToast({
        show: true,
        message: '¡Cuestionario reiniciado! 🔄',
        sub: 'Se han borrado todos los elementos y preferencias.'
      });
      
      setTimeout(() => {
        setToast(prev => {
          if (prev && prev.message.includes('reiniciado')) {
            return { ...prev, show: false };
          }
          return prev;
        });
      }, 3000);
    }
  };

  // Autosave effect
  useEffect(() => {
    const stateToSave = { 
      title, 
      items, 
      theme, 
      timeLimit, 
      shuffleQuestions, 
      kioskMode, 
      feedbackTiming, 
      isAccessibilityMode, 
      pointsPerQuestion, 
      passingScore,
      enableSoundEffects,
      enableSuccessNotifications,
      enableBrowserNotifications,
      aiSystemPrompt,
      neonPrimaryColor,
      neonAccentColor
    };
    localStorage.setItem('scorm_builder_save', JSON.stringify(stateToSave));
    setLastSaved(new Date().toLocaleTimeString());
  }, [title, items, theme, timeLimit, shuffleQuestions, kioskMode, feedbackTiming, isAccessibilityMode, pointsPerQuestion, passingScore, enableSoundEffects, enableSuccessNotifications, enableBrowserNotifications, aiSystemPrompt, neonPrimaryColor, neonAccentColor]);

  // Escuchar estado de conexión de red
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      playSound('success');
      setToast({
        show: true,
        message: '¡Conexión Restablecida! 🌐',
        sub: 'Estás conectado a internet nuevamente. Todas las funciones en la nube están disponibles.'
      });
      setTimeout(() => {
        setToast(prev => {
          if (prev && prev.message.includes('Conexión Restablecida')) {
            return { ...prev, show: false };
          }
          return prev;
        });
      }, 4000);
    };

    const handleOffline = () => {
      setIsOnline(false);
      try {
        playSound('reset');
      } catch (e) {}
      setToast({
        show: true,
        message: 'Modo Offline Activo 📶',
        sub: 'No hay conexión a internet. El autoguardado, la edición y la descarga (ZIP, PDF, DOCX, GIFT) siguen funcionando de manera 100% local.'
      });
      setTimeout(() => {
        setToast(prev => {
          if (prev && prev.message.includes('Modo Offline Activo')) {
            return { ...prev, show: false };
          }
          return prev;
        });
      }, 5000);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [enableSoundEffects]);

  const [toast, setToast] = useState<{ show: boolean; message: string; sub?: string; type?: 'success' | 'error' | 'warning' | 'info' } | null>(null);

  // Refs to avoid stale closures in keydown listener
  const refs = useRef({
    title,
    items,
    theme,
    timeLimit,
    shuffleQuestions,
    kioskMode,
    feedbackTiming,
    isAccessibilityMode,
    pointsPerQuestion,
    passingScore,
    isDarkMode,
    enableSoundEffects,
    enableSuccessNotifications,
    handleExport,
    setIsPreviewOpen,
    setIsDarkMode,
    neonPrimaryColor,
    neonAccentColor,
  });

  useEffect(() => {
    refs.current = {
      title,
      items,
      theme,
      timeLimit,
      shuffleQuestions,
      kioskMode,
      feedbackTiming,
      isAccessibilityMode,
      pointsPerQuestion,
      passingScore,
      isDarkMode,
      enableSoundEffects,
      enableSuccessNotifications,
      handleExport,
      setIsPreviewOpen,
      setIsDarkMode,
      neonPrimaryColor,
      neonAccentColor,
    };
  }, [title, items, theme, timeLimit, shuffleQuestions, kioskMode, feedbackTiming, isAccessibilityMode, pointsPerQuestion, passingScore, isDarkMode, enableSoundEffects, enableSuccessNotifications, handleExport, neonPrimaryColor, neonAccentColor]);

  const handleSave = () => {
    const current = refs.current;
    const stateToSave = { 
      title: current.title, 
      items: current.items, 
      theme: current.theme, 
      timeLimit: current.timeLimit, 
      shuffleQuestions: current.shuffleQuestions, 
      kioskMode: current.kioskMode, 
      feedbackTiming: current.feedbackTiming,
      isAccessibilityMode: current.isAccessibilityMode,
      pointsPerQuestion: current.pointsPerQuestion,
      passingScore: current.passingScore,
      enableSoundEffects: current.enableSoundEffects,
      enableSuccessNotifications: current.enableSuccessNotifications,
      neonPrimaryColor: current.neonPrimaryColor,
      neonAccentColor: current.neonAccentColor
    };
    localStorage.setItem('scorm_builder_save', JSON.stringify(stateToSave));
    setLastSaved(new Date().toLocaleTimeString());
    
    playSound('success');

    if (current.enableSuccessNotifications) {
      setToast({
        show: true,
        message: '¡Cuestionario guardado con éxito! 💾',
        sub: 'Todos tus cambios han sido respaldados en el almacenamiento local de tu navegador.'
      });
      
      // Auto-dismiss after 3 seconds
      setTimeout(() => {
        setToast(prev => {
          if (prev && prev.message.includes('guardado con éxito')) {
            return { ...prev, show: false };
          }
          return prev;
        });
      }, 3000);
    }
  };

  const triggerExport = () => {
    refs.current.handleExport();
  };

  const triggerPreview = () => {
    refs.current.setIsPreviewOpen(true);
    playSound('click');

    if (enableSuccessNotifications) {
      setToast({
        show: true,
        message: 'Abriendo Vista Previa 👁️',
        sub: 'Se ha abierto la ventana flotante con el simulador interactivo de tu cuestionario.'
      });
      setTimeout(() => {
        setToast(prev => {
          if (prev && prev.message.includes('Vista Previa')) {
            return { ...prev, show: false };
          }
          return prev;
        });
      }, 3000);
    }
  };

  const toggleThemeMode = () => {
    const newMode = !refs.current.isDarkMode;
    setIsDarkMode(newMode);
    playSound('click');

    if (enableSuccessNotifications) {
      setToast({
        show: true,
        message: newMode ? 'Modo Oscuro activado 🌙' : 'Modo Claro activado ☀️',
        sub: 'La interfaz se ha adaptado a la preferencia de brillo seleccionada.'
      });
      setTimeout(() => {
        setToast(prev => {
          if (prev && (prev.message.includes('Claro') || prev.message.includes('Oscuro'))) {
            return { ...prev, show: false };
          }
          return prev;
        });
      }, 3000);
    }
  };

  const triggerClearAll = () => {
    const confirmClear = window.confirm('¿Estás seguro de que deseas borrar todos los elementos y reiniciar el cuestionario?');
    if (confirmClear) {
      handleClearAll();
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isCtrlOrMeta = e.ctrlKey || e.metaKey;
      const key = e.key.toLowerCase();

      if (isCtrlOrMeta) {
        if (key === 's') {
          e.preventDefault();
          handleSave();
        } else if (key === 'e') {
          e.preventDefault();
          triggerExport();
        } else if (key === 'p') {
          e.preventDefault();
          triggerPreview();
        } else if (key === 'b') {
          e.preventDefault();
          toggleThemeMode();
        } else if (key === 'r') {
          e.preventDefault();
          triggerClearAll();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  function getCompatibilityReport() {
    const alerts: { type: 'error' | 'warning' | 'success'; message: string; details?: string }[] = [];
    
    // 1. Check title length
    if (!title || title.trim() === '') {
      alerts.push({
        type: 'error',
        message: 'El título está vacío.',
        details: 'Asigna un título significativo a tu cuestionario en el Paso 0 para una correcta exportación.'
      });
    } else if (title.trim().length > 50) {
      alerts.push({
        type: 'warning',
        message: 'Título demasiado largo.',
        details: `El título "${title}" tiene ${title.trim().length} caracteres. Recomendamos que sea menor a 50 caracteres para asegurar la correcta compatibilidad con todos los LMS.`
      });
    } else {
      alerts.push({
        type: 'success',
        message: 'Título compatible.',
        details: `El título cuenta con una extensión excelente (${title.trim().length} caracteres).`
      });
    }

    // 2. Check items & questions
    const activeItems = items.filter(it => !it.data.isDraft);
    const questions = activeItems.filter(it => it.type === 'question');
    if (questions.length === 0) {
      alerts.push({
        type: 'error',
        message: 'Sin preguntas configuradas.',
        details: 'Debes añadir al menos una pregunta para poder generar un cuestionario compatible.'
      });
    } else {
      let undefinedAnswersCount = 0;
      let emptyOptionsCount = 0;
      
      questions.forEach((qItem) => {
        const q = qItem.data as Question;
        
        // Check if correct answer option is invalid or index out of bound or empty
        const isOutOfBounds = q.correctAnswer < 0 || q.correctAnswer >= q.options.length;
        const selectedOption = isOutOfBounds ? undefined : q.options[q.correctAnswer];
        const isAnswerEmpty = !selectedOption || selectedOption.trim() === '';
        
        if (isOutOfBounds || isAnswerEmpty) {
          undefinedAnswersCount++;
        }
        
        // Check if any of the options is blank/empty
        const hasEmptyOptions = q.options.some(opt => !opt || opt.trim() === '');
        if (hasEmptyOptions) {
          emptyOptionsCount++;
        }
      });

      if (undefinedAnswersCount > 0) {
        alerts.push({
          type: 'error',
          message: `${undefinedAnswersCount} pregunta(s) sin respuesta correcta válida.`,
          details: 'Por favor, asegúrate de que todas las preguntas tienen la casilla de respuesta correcta adecuadamente seleccionada y que el texto de dicha opción no esté vacío.'
        });
      } else {
        alerts.push({
          type: 'success',
          message: 'Respuestas correctas configuradas.',
          details: 'Todas las preguntas tienen una respuesta correcta definida de forma consistente.'
        });
      }
      
      if (emptyOptionsCount > 0) {
        alerts.push({
          type: 'warning',
          message: `Hay ${emptyOptionsCount} pregunta(s) con opciones vacías.`,
          details: 'Algunas opciones de distractores están totalmente en blanco. Te sugerimos rellenarlas o eliminarlas antes de exportar.'
        });
      }
    }

    return alerts;
  };

  async function handleExport() {
    const activeItems = items.filter(it => !it.data.isDraft);
    if (activeItems.length === 0) {
      alert('No tienes ningún elemento activo para exportar. Desactiva el modo borrador de al menos un elemento o añade uno nuevo.');
      return;
    }

    const report = getCompatibilityReport();
    const hasError = report.some(r => r.type === 'error');
    if (hasError) {
      const confirmExport = window.confirm('¡Atención! Tu cuestionario presenta problemas de compatibilidad (ej: título vacío o preguntas sin respuestas válidas definidas). ¿Deseas exportarlo de todas formas?');
      if (!confirmExport) return;
    }

    setIsExporting(true);
    try {
      const zip = new JSZip();
      const bundle: QuizBundle = { title, theme, items: activeItems, timeLimit, shuffleQuestions, kioskMode, feedbackTiming, pointsPerQuestion, passingScore, neonPrimaryColor, neonAccentColor };
      
      const manifest = generateManifest(title, passingScore);
      const html = generateQuizHtml(bundle);

      zip.file("imsmanifest.xml", manifest);
      zip.file("index.html", html);

      const content = await zip.generateAsync({ type: "blob" });
      const url = window.URL.createObjectURL(content);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${title.replace(/\s+/g, '_')}_SCORM_1.2.zip`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Export failed:', err);
      alert('Error al generar el paquete SCORM.');
    } finally {
      setIsExporting(false);
    }
  };

  async function handlePdfExport() {
    const activeItems = items.filter(it => !it.data.isDraft);
    if (activeItems.length === 0) {
      alert('No tienes ningún elemento activo para exportar. Desactiva el modo borrador de al menos un elemento o añade uno nuevo.');
      return;
    }

    const report = getCompatibilityReport();
    const hasError = report.some(r => r.type === 'error');
    if (hasError) {
      const confirmExport = window.confirm('¡Atención! Tu cuestionario presenta problemas de compatibilidad. ¿Deseas generar el PDF de todas formas?');
      if (!confirmExport) return;
    }

    setIsExportingPdf(true);
    try {
      const bundle: QuizBundle = { title, theme, items: activeItems, timeLimit, shuffleQuestions, kioskMode, feedbackTiming, pointsPerQuestion, passingScore };
      const doc = generateQuizPdf(bundle, includeAnswersInPdf, includeConfigSummaryInPdf);
      doc.save(`${title.replace(/\s+/g, '_')}.pdf`);
    } catch (err) {
      console.error('PDF Export failed:', err);
      alert('Error al generar el documento PDF.');
    } finally {
      setIsExportingPdf(false);
    }
  };

  async function handleDocxExport() {
    const activeItems = items.filter(it => !it.data.isDraft);
    if (activeItems.length === 0) {
      alert('No tienes ningún elemento activo para exportar. Desactiva el modo borrador de al menos un elemento o añade uno nuevo.');
      return;
    }

    const report = getCompatibilityReport();
    const hasError = report.some(r => r.type === 'error');
    if (hasError) {
      const confirmExport = window.confirm('¡Atención! Tu cuestionario presenta problemas de compatibilidad. ¿Deseas generar el documento Word de todas formas?');
      if (!confirmExport) return;
    }

    setIsExportingDocx(true);
    try {
      const bundle: QuizBundle = { title, theme, items: activeItems, timeLimit, shuffleQuestions, kioskMode, feedbackTiming, pointsPerQuestion, passingScore };
      const docBlob = await generateQuizDocx(bundle, includeAnswersInDocx, includeConfigSummaryInDocx);
      
      const url = URL.createObjectURL(docBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${title.replace(/\s+/g, '_')}.docx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('DOCX Export failed:', err);
      alert('Error al generar el documento Word (.docx).');
    } finally {
      setIsExportingDocx(false);
    }
  };

  async function handleGiftExport() {
    const activeItems = items.filter(it => !it.data.isDraft);
    const questions = activeItems.filter(it => it.type === 'question');
    if (questions.length === 0) {
      alert('No tienes ninguna pregunta activa para exportar en formato GIFT. Añade preguntas primero.');
      return;
    }

    const report = getCompatibilityReport();
    const hasError = report.some(r => r.type === 'error');
    if (hasError) {
      const confirmExport = window.confirm('¡Atención! Tu cuestionario presenta problemas de compatibilidad (ej: preguntas sin respuestas válidas definidas). ¿Deseas exportar en formato GIFT de todas formas?');
      if (!confirmExport) return;
    }

    setIsExportingGift(true);
    try {
      const giftText = generateGiftFormat(activeItems);
      const blob = new Blob([giftText], { type: 'text/plain;charset=utf-8' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${title.replace(/\s+/g, '_')}_preguntas.gift.txt`;
      a.click();
      window.URL.revokeObjectURL(url);
      setToast({
        show: true,
        message: 'Formato GIFT exportado con éxito 🎉',
        sub: 'Ya puedes importar tus preguntas directamente en Moodle u otros LMS.'
      });
      setTimeout(() => {
        setToast(prev => {
          if (prev && prev.message.includes('GIFT')) {
            return { ...prev, show: false };
          }
          return prev;
        });
      }, 4000);
    } catch (err) {
      console.error('GIFT Export failed:', err);
      alert('Error al generar el archivo GIFT.');
    } finally {
      setIsExportingGift(false);
    }
  };

  const handleJsonExport = () => {
    try {
      const configData = {
        title,
        theme,
        items,
        timeLimit,
        shuffleQuestions,
        kioskMode,
        feedbackTiming,
        isAccessibilityMode,
        pointsPerQuestion,
        passingScore,
        enableSoundEffects,
        enableSuccessNotifications,
        neonPrimaryColor,
        neonAccentColor
      };
      
      const jsonString = JSON.stringify(configData, null, 2);
      const blob = new Blob([jsonString], { type: 'application/json;charset=utf-8' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${title.replace(/\s+/g, '_')}_config.json`;
      a.click();
      window.URL.revokeObjectURL(url);
      
      playSound('success');

      if (enableSuccessNotifications) {
        setToast({
          show: true,
          message: 'Ajustes exportados con éxito 💾',
          sub: 'Se ha descargado el archivo JSON con toda la configuración.'
        });
        setTimeout(() => {
          setToast(prev => {
            if (prev && prev.message && prev.message.includes('exportados')) {
              return { ...prev, show: false };
            }
            return prev;
          });
        }, 3000);
      }
    } catch (err) {
      console.error('JSON Export failed:', err);
      alert('Error al exportar la configuración.');
    }
  };

  const handleJsonImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        const data = JSON.parse(content);
        
        if (typeof data !== 'object' || data === null) {
          throw new Error('El archivo no tiene un formato JSON de configuración válido.');
        }
        
        if (data.title !== undefined) setTitle(data.title);
        if (data.theme !== undefined) setTheme(data.theme);
        if (Array.isArray(data.items)) {
          setItems(data.items);
          if (data.items.length > 0) {
            setIsThemeConfirmed(true);
          }
        }
        if (data.timeLimit !== undefined) setTimeLimit(Number(data.timeLimit));
        if (data.shuffleQuestions !== undefined) setShuffleQuestions(!!data.shuffleQuestions);
        if (data.kioskMode !== undefined) setKioskMode(!!data.kioskMode);
        if (data.feedbackTiming !== undefined) setFeedbackTiming(data.feedbackTiming);
        if (data.isAccessibilityMode !== undefined) setIsAccessibilityMode(!!data.isAccessibilityMode);
        if (data.pointsPerQuestion !== undefined) setPointsPerQuestion(Number(data.pointsPerQuestion));
        if (data.passingScore !== undefined) setPassingScore(Number(data.passingScore));
        if (data.enableSoundEffects !== undefined) setEnableSoundEffects(!!data.enableSoundEffects);
        if (data.enableSuccessNotifications !== undefined) setEnableSuccessNotifications(!!data.enableSuccessNotifications);
        if (data.neonPrimaryColor !== undefined) setNeonPrimaryColor(data.neonPrimaryColor);
        if (data.neonAccentColor !== undefined) setNeonAccentColor(data.neonAccentColor);
        
        playSound('success');

        if (enableSuccessNotifications) {
          setToast({
            show: true,
            message: 'Configuración cargada con éxito 📂',
            sub: 'Se ha restaurado el cuestionario y todos sus ajustes.'
          });
          setTimeout(() => {
            setToast(prev => {
              if (prev && prev.message && prev.message.includes('cargada')) {
                return { ...prev, show: false };
              }
              return prev;
            });
          }, 3000);
        }
        
        e.target.value = '';
      } catch (err: any) {
        console.error('JSON Import failed:', err);
        alert(`Error al cargar el archivo de configuración: ${err.message || 'Formato no soportado'}`);
      }
    };
    reader.readAsText(file);
  };

  const onLoadCloudData = (data: any) => {
    if (typeof data !== 'object' || data === null) return;
    if (data.title !== undefined) setTitle(data.title);
    if (data.theme !== undefined) setTheme(data.theme);
    if (Array.isArray(data.items)) {
      setItems(data.items);
      if (data.items.length > 0) {
        setIsThemeConfirmed(true);
      }
    }
    if (data.timeLimit !== undefined) setTimeLimit(data.timeLimit === null || data.timeLimit === undefined ? undefined : Number(data.timeLimit));
    if (data.shuffleQuestions !== undefined) setShuffleQuestions(!!data.shuffleQuestions);
    if (data.kioskMode !== undefined) setKioskMode(!!data.kioskMode);
    if (data.feedbackTiming !== undefined) setFeedbackTiming(data.feedbackTiming);
    if (data.isAccessibilityMode !== undefined) setIsAccessibilityMode(!!data.isAccessibilityMode);
    if (data.pointsPerQuestion !== undefined) setPointsPerQuestion(Number(data.pointsPerQuestion));
    if (data.passingScore !== undefined) setPassingScore(Number(data.passingScore));
    if (data.enableSoundEffects !== undefined) setEnableSoundEffects(!!data.enableSoundEffects);
    if (data.enableSuccessNotifications !== undefined) setEnableSuccessNotifications(!!data.enableSuccessNotifications);
    if (data.neonPrimaryColor !== undefined) setNeonPrimaryColor(data.neonPrimaryColor);
    if (data.neonAccentColor !== undefined) setNeonAccentColor(data.neonAccentColor);
    if (data.aiSystemPrompt !== undefined) setAiSystemPrompt(data.aiSystemPrompt);
  };

  if (!isAuthenticated) {
    return <Gatekeeper onUnlock={handleUnlock} isDarkMode={isDarkMode} />;
  }

  return (
    <div className={`min-h-screen font-sans transition-colors duration-300 ${
      isAccessibilityMode 
        ? (isDarkMode ? 'dark bg-black text-white' : 'bg-white text-black')
        : (isDarkMode ? 'dark bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900')
    } pb-24`}>
      <header className={`border-b sticky top-0 z-40 transition-colors duration-300 ${
        isAccessibilityMode
          ? (isDarkMode ? 'bg-black border-white' : 'bg-white border-black')
          : (isDarkMode ? 'bg-slate-900/80 backdrop-blur-md border-slate-800' : 'bg-white border-slate-200')
      }`}>
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-indigo-600 p-2 rounded-lg">
              <Package className="text-white" size={24} />
            </div>
            <h1 className={`font-bold text-xl tracking-tight ${isAccessibilityMode ? 'font-black text-2xl text-slate-950 dark:text-white' : ''}`}>SCORM Builder</h1>
          </div>
          
          <div className="hidden md:flex gap-6 text-sm font-medium">
            <span className={items.length === 0 ? 'text-indigo-600' : (isDarkMode ? 'text-slate-400' : 'text-slate-400')}>1. Preparación</span>
            <span className={items.length > 0 && !isThemeConfirmed ? 'text-indigo-600' : (isDarkMode ? 'text-slate-400' : 'text-slate-400')}>2. Contenido</span>
            <span className={isThemeConfirmed ? 'text-indigo-600' : (isDarkMode ? 'text-slate-400' : 'text-slate-400')}>3. Estilo y Exportar</span>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              {/* Indicador de Conexión de Red */}
              <div className="flex items-center gap-1.5 shrink-0">
                {isOnline ? (
                  <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 text-[10px] font-bold uppercase tracking-wider">
                    <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></span>
                    <Wifi size={12} className="shrink-0" />
                    <span className="hidden md:inline">En Línea</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 text-[10px] font-bold uppercase tracking-wider animate-pulse">
                    <span className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-ping"></span>
                    <WifiOff size={12} className="shrink-0" />
                    <span>Modo Offline</span>
                  </div>
                )}
              </div>

              {lastSaved && (
                <div className="hidden sm:flex items-center gap-1 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                  <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
                  Autoguardado {lastSaved}
                </div>
              )}
              
              <button
                onClick={handleForceAutosave}
                disabled={isForceSaving}
                className={`p-2 sm:px-3 sm:py-1.5 rounded-xl transition-all flex items-center gap-1.5 font-bold text-xs border ${
                  isAccessibilityMode
                    ? `border-2 bg-white dark:bg-black focus-visible:ring-4 ${
                        isForceSaveSuccess 
                          ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400 animate-pulse' 
                          : 'border-slate-950 dark:border-white text-slate-950 dark:text-white'
                      }`
                    : isForceSaveSuccess
                      ? 'bg-emerald-500 border-emerald-600 text-white animate-pulse shadow-lg shadow-emerald-500/30 ring-4 ring-emerald-500/20 scale-105'
                      : 'bg-emerald-50 hover:bg-emerald-100 border-emerald-200 dark:bg-emerald-950/20 dark:hover:bg-emerald-900/40 dark:border-emerald-900/30 text-emerald-600 dark:text-emerald-400 hover:shadow-sm active:scale-95'
                }`}
                title="Forzar guardado y sincronizar estado en LocalStorage"
              >
                <RefreshCw size={14} className={isForceSaving ? 'animate-spin' : ''} />
                <span className="hidden lg:inline">{isForceSaving ? 'Sincronizando...' : isForceSaveSuccess ? '¡Guardado!' : 'Forzar Autoguardado'}</span>
                <span className="lg:hidden">{isForceSaving ? 'Sinc...' : isForceSaveSuccess ? '¡Sinc!' : 'Autoguardado'}</span>
              </button>

              <button
                onClick={handleSave}
                className={`p-2 sm:px-3 sm:py-1.5 rounded-xl transition-all flex items-center gap-1.5 font-bold text-xs border ${
                  isAccessibilityMode
                    ? 'border-2 border-slate-950 dark:border-white bg-white dark:bg-black text-slate-950 dark:text-white hover:bg-slate-950 hover:text-white dark:hover:bg-white dark:hover:text-black focus-visible:ring-4'
                    : 'bg-indigo-50 hover:bg-indigo-100 border-indigo-200 dark:bg-indigo-950/20 dark:hover:bg-indigo-900/40 dark:border-indigo-900/30 text-indigo-600 dark:text-indigo-400 hover:shadow-sm active:scale-95'
                }`}
                title="Guardar cuestionario ahora"
              >
                <Save size={14} />
                <span className="hidden sm:inline">Guardar ahora</span>
                <span className="sm:hidden">Guardar</span>
              </button>

              {showClearConfirm ? (
                <div className="flex items-center gap-1.5 bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/30 p-1 rounded-xl">
                  <span className="text-[10px] font-bold text-rose-600 dark:text-rose-400 px-1">¿Reiniciar todo?</span>
                  <button
                    onClick={() => {
                      handleClearAll();
                      setShowClearConfirm(false);
                    }}
                    className="px-2 py-1 bg-rose-600 hover:bg-rose-700 text-white font-bold text-[10px] uppercase tracking-wider rounded-lg transition-colors"
                  >
                    Sí
                  </button>
                  <button
                    onClick={() => setShowClearConfirm(false)}
                    className="px-2 py-1 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-[10px] uppercase tracking-wider rounded-lg transition-colors"
                  >
                    No
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setShowClearConfirm(true)}
                  className={`p-2 sm:px-3 sm:py-1.5 rounded-xl transition-all flex items-center gap-1.5 font-bold text-xs border ${
                    isAccessibilityMode
                      ? 'border-2 border-slate-950 dark:border-white bg-white dark:bg-black text-slate-950 dark:text-white hover:bg-slate-950 hover:text-white dark:hover:bg-white dark:hover:text-black focus-visible:ring-4'
                      : 'bg-rose-50 hover:bg-rose-100 border-rose-200 dark:bg-rose-950/20 dark:hover:bg-rose-900/40 dark:border-rose-900/30 text-rose-600 dark:text-rose-400 hover:shadow-sm active:scale-95'
                  }`}
                  title="Limpiar y empezar de nuevo"
                >
                  <RotateCcw size={14} />
                  <span className="hidden sm:inline">Limpiar</span>
                  <span className="sm:hidden">Limpiar</span>
                </button>
              )}
            </div>
            
            <button
              onClick={() => setIsAccessibilityMode(!isAccessibilityMode)}
              className={`p-2 rounded-xl transition-all flex items-center gap-1.5 font-bold text-xs border ${
                isAccessibilityMode
                  ? 'bg-indigo-600 text-white border-indigo-700 focus:ring-4 focus:ring-indigo-600'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-transparent hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
              aria-label="Alternar Modo de Accesibilidad"
              aria-pressed={isAccessibilityMode}
            >
              <Accessibility size={20} />
              <span className="hidden sm:inline">Accesibilidad</span>
              <span className={`w-2.5 h-2.5 rounded-full ${isAccessibilityMode ? 'bg-emerald-400' : 'bg-slate-400'}`}></span>
            </button>

            <button
              onClick={() => { playSound('click'); setShowGuide(true); }}
              className={`p-2 rounded-xl transition-all flex items-center gap-1.5 font-bold text-xs border ${
                isAccessibilityMode
                  ? 'bg-purple-600 text-white border-purple-700'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-transparent hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
              aria-label="Ver manual de uso"
            >
              <HelpCircle size={20} />
              <span className="hidden sm:inline">Guía</span>
            </button>

            <button
              onClick={() => setIsDarkMode(!isDarkMode)}
              className={`p-2 rounded-xl transition-all ${
                isAccessibilityMode
                  ? 'border-2 border-slate-950 dark:border-white bg-white dark:bg-black text-slate-950 dark:text-white focus:ring-4 focus:ring-indigo-600'
                  : 'bg-slate-800 text-yellow-400 hover:bg-slate-700'
              }`}
              aria-label="Toggle dark mode"
            >
              {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
            </button>

            {isAuthenticated && (
              <button
                onClick={handleLogout}
                className={`p-2 rounded-xl transition-all flex items-center gap-1.5 font-bold text-xs border ${
                  isAccessibilityMode
                    ? 'bg-rose-600 text-white border-rose-700 hover:bg-rose-700'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-transparent hover:bg-rose-500 hover:text-white dark:hover:bg-rose-600'
                }`}
                aria-label="Cerrar sesión"
                title="Cerrar sesión"
              >
                <LogOut size={20} />
                <span className="hidden sm:inline">Cerrar Sesión</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Modal: Guía de Inicio Rápido */}
      <AnimatePresence>
        {showGuide && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowGuide(false)}
              className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className={`relative w-full max-w-3xl max-h-[85vh] overflow-hidden rounded-3xl shadow-2xl border flex flex-col ${
                isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
              }`}
            >
              <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-gradient-to-r from-indigo-600 to-purple-600 text-white">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white/20 rounded-xl">
                    <BookOpen size={24} />
                  </div>
                  <div>
                    <h2 className="text-xl font-black tracking-tight text-white">Manual de Usuario</h2>
                    <p className="text-xs text-white/80 font-medium">Guía de SCORM AI Builder Pro</p>
                  </div>
                </div>
                <button 
                  onClick={() => setShowGuide(false)}
                  className="p-2 hover:bg-white/20 rounded-full transition-colors text-white"
                >
                  <XCircle size={24} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-8 space-y-8 custom-scrollbar">
                <section>
                  <h3 className="text-sm font-black uppercase tracking-widest text-indigo-500 mb-4 flex items-center gap-2">
                    <TrendingUp size={16} />
                    Flujo de Trabajo (Workflow)
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {[
                      { step: '0', title: 'Configurar', desc: 'Define título, tema visual y personalidad pedagógica de la IA.' },
                      { step: '1', title: 'Construir', desc: 'Sube documentos o usa la IA para generar preguntas masivas.' },
                      { step: '2', title: 'Exportar', desc: 'Audita la accesibilidad, previsualiza y descarga el paquete SCORM.' }
                    ].map((item, idx) => (
                      <div key={idx} className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800">
                        <span className="text-2xl font-black text-indigo-500/20 block mb-1">#{item.step}</span>
                        <h4 className="font-bold text-sm text-slate-800 dark:text-slate-100 mb-1">{item.title}</h4>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">{item.desc}</p>
                      </div>
                    ))}
                  </div>
                </section>

                <section className="space-y-4">
                  <h3 className="text-sm font-black uppercase tracking-widest text-purple-500 flex items-center gap-2">
                    <Sparkles size={16} />
                    Características Maestras
                  </h3>
                  <div className="space-y-4">
                    <div className="flex gap-4 items-start">
                      <div className="p-2.5 rounded-xl bg-purple-500/10 text-purple-500 shrink-0">
                        <Brain size={20} />
                      </div>
                      <div>
                        <h4 className="font-bold text-sm dark:text-slate-100">IA con Enfoque Pedagógico</h4>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                          En el <strong>Paso 0</strong>, puedes elegir la personalidad de la IA (Socrática, STEM, Gamificada, etc.). Esto afecta drásticamente cómo la IA redacta las preguntas y las retroalimentaciones.
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-4 items-start">
                      <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-500 shrink-0">
                        <Accessibility size={20} />
                      </div>
                      <div>
                        <h4 className="font-bold text-sm dark:text-slate-100">Panel de Accesibilidad (WCAG)</h4>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                          Escanea tu curso buscando barreras de aprendizaje. Te avisará si faltan descripciones de imagen o si el tiempo es muy corto, permitiéndote corregirlo al instante.
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-4 items-start">
                      <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-500 shrink-0">
                        <ShieldCheck size={20} />
                      </div>
                      <div>
                        <h4 className="font-bold text-sm dark:text-slate-100">Tutor de Calidad IA</h4>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                          En el <strong>Paso 1</strong>, activa el Tutor para que la IA revise tu material y proponga mejoras en la claridad didáctica y el rigor de los contenidos.
                        </p>
                      </div>
                    </div>
                  </div>
                </section>

                <div className="p-5 rounded-2xl bg-indigo-500/5 border border-indigo-500/10 flex items-start gap-3">
                  <div className="p-2 bg-indigo-500 text-white rounded-lg shrink-0">
                    <Save size={16} />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-indigo-900 dark:text-indigo-200">Guardado Inteligente</p>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 italic mt-0.5 leading-relaxed">
                      La aplicación utiliza LocalStorage para guardar tu trabajo localmente. No necesitas una cuenta para empezar, tu progreso persiste incluso si cierras el navegador.
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-6 bg-slate-50 dark:bg-slate-950/50 flex justify-end">
                <button
                  onClick={() => setShowGuide(false)}
                  className="px-8 py-3 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold text-sm hover:scale-105 active:scale-95 transition-all shadow-lg"
                >
                  Entendido, ¡Comencemos!
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {!isOnline && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-5xl mx-auto px-4 pt-6"
        >
          <div className={`p-4 rounded-2xl border transition-all duration-300 ${
            isDarkMode 
              ? 'bg-amber-500/10 border-amber-500/20 text-amber-300' 
              : 'bg-amber-50 border-amber-200 text-amber-800'
          } shadow-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4`}>
            <div className="flex gap-3 items-start sm:items-center">
              <div className={`p-2 rounded-xl shrink-0 ${isDarkMode ? 'bg-amber-500/20' : 'bg-amber-100'}`}>
                <WifiOff size={20} className="animate-pulse" />
              </div>
              <div>
                <h4 className="font-bold text-xs uppercase tracking-wider">Modo Offline Activo</h4>
                <p className="text-[11px] opacity-90 leading-relaxed mt-0.5">
                  Estás navegando sin conexión a internet. Todas las acciones de edición, autoguardado en el almacenamiento local del navegador, la persistencia de sesión y las herramientas de exportación (ZIP SCORM, PDF, DOCX, GIFT) continúan funcionando de forma 100% local y segura.
                </p>
              </div>
            </div>
            <div className="text-[10px] uppercase font-bold tracking-widest bg-amber-500/20 dark:bg-amber-500/30 px-3 py-1.5 rounded-lg shrink-0 select-none border border-amber-500/25">
              Estado: 100% Operativo Local
            </div>
          </div>
        </motion.div>
      )}

      <main className="max-w-5xl mx-auto px-4 py-8">
        {/* Guía Rápida de Uso */}
        <motion.section 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-12"
        >
          <div className="bg-gradient-to-br from-indigo-600 to-purple-700 rounded-3xl p-8 text-white shadow-xl relative overflow-hidden">
            <div className="relative z-10 text-center md:text-left">
              <h2 className="text-2xl font-bold mb-4 flex items-center justify-center md:justify-start gap-2">
                <BookOpen size={28} />
                Instrucciones de Uso
              </h2>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <div>
                    <div className="bg-white/20 w-8 h-8 rounded-full flex items-center justify-center font-bold mb-2 text-xs">1</div>
                    <p className="font-bold text-sm">Configuración</p>
                    <p className="text-[10px] text-indigo-100 leading-relaxed">Define el título, tema visual y el <strong>enfoque pedagógico</strong> de la IA (Constructivista, STEM, etc).</p>
                  </div>
                  <div>
                    <div className="bg-white/20 w-8 h-8 rounded-full flex items-center justify-center font-bold mb-2 text-xs">2</div>
                    <p className="font-bold text-sm">Carga e IA</p>
                    <p className="text-[10px] text-indigo-100 leading-relaxed">Sube documentos o pega textos. La IA generará preguntas alineadas a tu material y enfoque.</p>
                  </div>
                  <div>
                    <div className="bg-white/20 w-8 h-8 rounded-full flex items-center justify-center font-bold mb-2 text-xs">3</div>
                    <p className="font-bold text-sm">Optimización</p>
                    <p className="text-[10px] text-indigo-100 leading-relaxed">Audita la <strong>Accesibilidad WCAG</strong> y usa el Tutor IA para refinar la calidad didáctica.</p>
                  </div>
                  <div>
                    <div className="bg-white/20 w-8 h-8 rounded-full flex items-center justify-center font-bold mb-2 text-xs">4</div>
                    <p className="font-bold text-sm">Exportación</p>
                    <p className="text-[10px] text-indigo-100 leading-relaxed">Previsualiza el resultado final y descarga tu paquete <strong>SCORM 1.2</strong> listo para tu LMS.</p>
                  </div>
                </div>

              <div className="mt-6 pt-6 border-t border-white/20 flex flex-wrap items-center justify-center md:justify-start gap-x-6 gap-y-2 text-xs text-indigo-100">
                <span className="font-bold uppercase tracking-wider text-[10px] bg-white/20 px-2 py-0.5 rounded-md flex items-center gap-1">
                  <Keyboard size={12} />
                  Atajos rápidos:
                </span>
                <span className="flex items-center gap-1.5">
                  <kbd className="px-1.5 py-0.5 bg-white/10 dark:bg-black/30 border border-white/10 rounded font-mono text-[10px] text-white font-bold">Ctrl + S</kbd> 
                  <span>Guardar</span>
                </span>
                <span className="flex items-center gap-1.5">
                  <kbd className="px-1.5 py-0.5 bg-white/10 dark:bg-black/30 border border-white/10 rounded font-mono text-[10px] text-white font-bold">Ctrl + E</kbd> 
                  <span>Exportar SCORM</span>
                </span>
                <span className="flex items-center gap-1.5">
                  <kbd className="px-1.5 py-0.5 bg-white/10 dark:bg-black/30 border border-white/10 rounded font-mono text-[10px] text-white font-bold">Ctrl + P</kbd> 
                  <span>Previsualizar</span>
                </span>
                <span className="flex items-center gap-1.5">
                  <kbd className="px-1.5 py-0.5 bg-white/10 dark:bg-black/30 border border-white/10 rounded font-mono text-[10px] text-white font-bold">Ctrl + B</kbd> 
                  <span>Modo Oscuro</span>
                </span>
                <span className="flex items-center gap-1.5">
                  <kbd className="px-1.5 py-0.5 bg-white/10 dark:bg-black/30 border border-white/10 rounded font-mono text-[10px] text-white font-bold">Ctrl + R</kbd> 
                  <span>Limpiar Todo</span>
                </span>
              </div>
            </div>
          </div>
        </motion.section>

        {/* PASO 0: Título y Configuración */}
        <motion.section 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-12"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Card 1: Identificación y Límite de Tiempo */}
            <div className={`rounded-2xl border p-8 shadow-sm transition-colors duration-300 flex flex-col justify-between ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
              <div>
                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-6 flex items-center gap-1.5">
                  <BookOpen size={16} className="text-indigo-500" />
                  Identificación y Tiempo
                </h3>
                
                <div className="mb-6">
                  <label className={`block text-xs font-bold uppercase tracking-wider mb-2 ${isDarkMode ? 'text-slate-500' : 'text-slate-500'}`}>Título del Cuestionario</label>
                  <input 
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className={`w-full text-2xl font-bold bg-transparent border-b-2 outline-none transition-colors py-2 ${isDarkMode ? 'text-indigo-400 border-slate-800 focus:border-indigo-500 placeholder:text-slate-700' : 'text-indigo-600 border-slate-100 focus:border-indigo-500'}`}
                    placeholder="Ej: Hacer cuestionarios"
                  />
                </div>

                <div className="mb-4">
                  <label className={`block text-xs font-bold uppercase tracking-wider mb-2 ${isDarkMode ? 'text-slate-500' : 'text-slate-500'}`}>Límite de tiempo (minutos)</label>
                  <div className="flex items-center gap-4">
                    <input 
                      type="number"
                      min="0"
                      value={timeLimit || ''}
                      onKeyDown={(e) => {
                        // Prevent typing negative signs, plus signs, or scientific notation 'e'
                        if (e.key === '-' || e.key === '+' || e.key === 'e' || e.key === 'E') {
                          e.preventDefault();
                        }
                      }}
                      onChange={(e) => {
                        const parsed = parseInt(e.target.value);
                        if (e.target.value === '') {
                          setTimeLimit(0);
                        } else if (!isNaN(parsed)) {
                          setTimeLimit(Math.max(0, parsed));
                        }
                      }}
                      className={`flex-1 text-2xl font-bold bg-transparent border-b-2 outline-none transition-colors py-2 ${
                        timeLimit > 0 && timeLimit < 2
                          ? (isAccessibilityMode
                              ? 'text-amber-600 dark:text-amber-400 border-amber-600 dark:border-amber-400'
                              : 'text-amber-500 border-amber-400 focus:border-amber-500 dark:text-amber-400 dark:border-amber-500')
                          : (isDarkMode ? 'text-indigo-400 border-slate-800 focus:border-indigo-500' : 'text-indigo-600 border-slate-100 focus:border-indigo-500')
                      }`}
                      placeholder="Sin límite"
                    />
                    <span className="text-xs text-slate-400 font-bold uppercase tracking-widest pt-4">Minutos</span>
                  </div>

                  {/* Botones de preajustes rápidos */}
                  <div className="flex flex-wrap items-center gap-1.5 mt-3">
                    <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500 mr-1">Preajustes:</span>
                    {[
                      { label: 'Sin límite', value: 0 },
                      { label: '15 min', value: 15 },
                      { label: '30 min', value: 30 },
                      { label: '45 min', value: 45 },
                      { label: '60 min', value: 60 },
                    ].map((preset) => {
                      const isSelected = timeLimit === preset.value;
                      return (
                        <button
                          key={preset.value}
                          type="button"
                          onClick={() => setTimeLimit(preset.value)}
                          className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all border ${
                            isSelected
                              ? (isAccessibilityMode
                                  ? 'bg-indigo-600 text-white border-2 border-slate-950 dark:border-white font-black'
                                  : 'bg-indigo-600 text-white border-indigo-600 shadow-sm')
                              : (isAccessibilityMode
                                  ? 'bg-white text-slate-950 border-2 border-slate-950 dark:bg-black dark:text-white dark:border-white hover:bg-slate-100 dark:hover:bg-slate-900'
                                  : 'bg-slate-100 text-slate-600 border-transparent hover:bg-slate-200/80 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700/80')
                          }`}
                        >
                          {preset.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
              
              <AnimatePresence>
                {timeLimit > 0 && timeLimit < 2 && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="overflow-hidden mt-4"
                  >
                    <div className={`p-3 rounded-xl border flex gap-2.5 items-start ${
                      isAccessibilityMode
                        ? 'bg-amber-100 border-amber-600 text-amber-950 dark:bg-black dark:border-amber-400 dark:text-amber-400'
                        : 'bg-amber-50/70 border-amber-100 text-amber-800 dark:bg-amber-950/20 dark:border-amber-900/30 dark:text-amber-300'
                    }`}>
                      <AlertTriangle size={16} className={`shrink-0 mt-0.5 ${isAccessibilityMode ? 'text-amber-700 dark:text-amber-400' : 'text-amber-500'}`} />
                      <div className="text-xs leading-snug">
                        <p className="font-bold">Límite de tiempo inusualmente corto</p>
                        <p className="opacity-90 mt-0.5">Configurar menos de 2 minutos puede no dar suficiente margen para responder con calma.</p>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Card 2: Puntuación y Pesos */}
            <div className={`rounded-2xl border p-8 shadow-sm transition-colors duration-300 flex flex-col justify-between ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
              <div>
                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-6 flex items-center gap-1.5">
                  <Award size={16} className="text-indigo-500" />
                  Puntuación y Pesos
                </h3>
                
                {/* Puntos por Pregunta */}
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Puntos por pregunta</label>
                    <span className="text-lg font-black text-indigo-600 dark:text-indigo-400">{pointsPerQuestion} pts</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <input 
                      type="range"
                      min="1"
                      max="100"
                      value={pointsPerQuestion}
                      onChange={(e) => setPointsPerQuestion(Number(e.target.value))}
                      className="flex-1 accent-indigo-600 dark:accent-indigo-400"
                    />
                    <input 
                      type="number"
                      min="1"
                      max="1000"
                      value={pointsPerQuestion}
                      onChange={(e) => setPointsPerQuestion(Math.max(1, Number(e.target.value)))}
                      className={`w-16 text-center font-bold text-sm bg-transparent border-b outline-none focus:border-indigo-500 ${isDarkMode ? 'text-slate-200 border-slate-800' : 'text-slate-800 border-slate-200'}`}
                    />
                  </div>
                  
                  {/* Presets de Puntos */}
                  <div className="flex flex-wrap items-center gap-1.5 mt-2">
                    <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mr-1">Rápido:</span>
                    {[1, 2, 5, 10, 20].map((pts) => (
                      <button
                        key={pts}
                        type="button"
                        onClick={() => setPointsPerQuestion(pts)}
                        className={`px-1.5 py-0.5 rounded text-[10px] font-bold transition-all border ${
                          pointsPerQuestion === pts
                            ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                            : 'bg-slate-100 text-slate-600 border-transparent hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700'
                        }`}
                      >
                        {pts} pt
                      </button>
                    ))}
                  </div>
                </div>

                {/* Puntaje Mínimo para Aprobar */}
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Porcentaje mínimo para aprobar</label>
                    <span className="text-lg font-black text-indigo-600 dark:text-indigo-400">{passingScore}%</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <input 
                      type="range"
                      min="0"
                      max="100"
                      value={passingScore}
                      onChange={(e) => setPassingScore(Number(e.target.value))}
                      className="flex-1 accent-indigo-600 dark:accent-indigo-400"
                    />
                    <input 
                      type="number"
                      min="0"
                      max="100"
                      value={passingScore}
                      onChange={(e) => setPassingScore(Math.min(100, Math.max(0, Number(e.target.value))))}
                      className={`w-16 text-center font-bold text-sm bg-transparent border-b outline-none focus:border-indigo-500 ${isDarkMode ? 'text-slate-200 border-slate-800' : 'text-slate-800 border-slate-200'}`}
                    />
                  </div>
                  
                  {/* Presets de Porcentaje */}
                  <div className="flex flex-wrap items-center gap-1.5 mt-2">
                    <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mr-1">Rápido:</span>
                    {[50, 60, 70, 80].map((pct) => (
                      <button
                        key={pct}
                        type="button"
                        onClick={() => setPassingScore(pct)}
                        className={`px-1.5 py-0.5 rounded text-[10px] font-bold transition-all border ${
                          passingScore === pct
                            ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                            : 'bg-slate-100 text-slate-600 border-transparent hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700'
                        }`}
                      >
                        {pct}%
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Resumen dinámico */}
              <div className={`p-4 rounded-xl border text-xs leading-relaxed ${
                isDarkMode ? 'bg-slate-800/40 border-slate-800/70 text-slate-300' : 'bg-slate-50 border-slate-150 text-slate-600'
              }`}>
                {(() => {
                  const activeQuestions = items.filter(it => it.type === 'question' && !it.data.isDraft).length;
                  const totalPossible = activeQuestions * pointsPerQuestion;
                  const passingRequired = Math.round((totalPossible * passingScore) / 100);
                  const questionsNeeded = Math.ceil((activeQuestions * passingScore) / 100);
                  return (
                    <div>
                      <p className="font-bold mb-1.5 flex items-center gap-1 text-slate-800 dark:text-slate-200">
                        <TrendingUp size={14} className="text-emerald-500" />
                        Resumen de Evaluación:
                      </p>
                      {activeQuestions > 0 ? (
                        <p>
                          Cuestionario de <strong className="text-indigo-600 dark:text-indigo-400">{activeQuestions}</strong> pregunta(s). Valor total: <strong className="text-indigo-600 dark:text-indigo-400">{totalPossible} pts</strong>. 
                          Se requiere un mínimo de <strong className="text-emerald-600 dark:text-emerald-400">{questionsNeeded} respuestas correctas</strong> para aprobar (equivalente a <strong className="text-emerald-600 dark:text-emerald-400">{passingRequired} pts</strong> o más).
                        </p>
                      ) : (
                        <p className="text-slate-400 dark:text-slate-500 italic">No hay preguntas activas aún para realizar el cálculo de pesos.</p>
                      )}
                    </div>
                  );
                })()}
              </div>
            </div>

            {/* Card 3: Configuración de Interfaz y Sonido */}
            <div className={`rounded-2xl border p-8 shadow-sm transition-colors duration-300 flex flex-col justify-between ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
              <div>
                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-6 flex items-center gap-1.5">
                  <Settings size={16} className="text-indigo-500" />
                  Preferencias Globales
                </h3>

                <p className={`text-xs mb-6 leading-relaxed ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                  Personaliza tu experiencia de autoría activando o desactivando las notificaciones y sonidos del sistema.
                </p>

                {/* Toggle: Notificaciones de Éxito */}
                <div className={`p-4 rounded-xl border mb-4 transition-all duration-300 ${
                  enableSuccessNotifications 
                    ? 'bg-emerald-500/5 border-emerald-500/20 text-emerald-950 dark:text-emerald-100'
                    : 'bg-slate-50/50 border-slate-100 dark:bg-slate-900/30 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                }`}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-bold text-xs uppercase tracking-wider flex items-center gap-1.5">
                      {enableSuccessNotifications ? <Bell size={14} className="text-emerald-500" /> : <BellOff size={14} className="text-slate-400" />}
                      Notificaciones
                    </span>
                    <button
                      type="button"
                      role="switch"
                      aria-checked={enableSuccessNotifications}
                      aria-label="Activar notificaciones de éxito"
                      onClick={() => {
                        setEnableSuccessNotifications(!enableSuccessNotifications);
                        playSound('click');
                      }}
                      className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
                        enableSuccessNotifications ? 'bg-emerald-500' : 'bg-slate-200 dark:bg-slate-700'
                      }`}
                    >
                      <span
                        aria-hidden="true"
                        className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                          enableSuccessNotifications ? 'translate-x-4' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>
                  <p className="text-[10px] leading-relaxed opacity-85">
                    Muestra avisos flotantes cuando guardas cambios, restauras la configuración o exportas contenidos.
                  </p>
                </div>

                {/* Toggle: Efectos de Sonido */}
                <div className={`p-4 rounded-xl border transition-all duration-300 ${
                  enableSoundEffects 
                    ? 'bg-indigo-500/5 border-indigo-500/20 text-indigo-950 dark:text-indigo-100'
                    : 'bg-slate-50/50 border-slate-100 dark:bg-slate-900/30 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                }`}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-bold text-xs uppercase tracking-wider flex items-center gap-1.5">
                      {enableSoundEffects ? <Volume2 size={14} className="text-indigo-500" /> : <VolumeX size={14} className="text-slate-400" />}
                      Efectos de Sonido
                    </span>
                    <button
                      type="button"
                      role="switch"
                      aria-checked={enableSoundEffects}
                      aria-label="Activar efectos de sonido"
                      onClick={() => {
                        setEnableSoundEffects(!enableSoundEffects);
                        if (!enableSoundEffects) {
                          try {
                            const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
                            if (AudioContextClass) {
                              const ctx = new AudioContextClass();
                              const now = ctx.currentTime;
                              const osc = ctx.createOscillator();
                              const gain = ctx.createGain();
                              osc.type = 'sine';
                              osc.frequency.setValueAtTime(600, now);
                              gain.gain.setValueAtTime(0.06, now);
                              gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
                              osc.connect(gain);
                              gain.connect(ctx.destination);
                              osc.start(now);
                              osc.stop(now + 0.1);
                            }
                          } catch {}
                        }
                      }}
                      className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                        enableSoundEffects ? 'bg-indigo-600' : 'bg-slate-200 dark:bg-slate-700'
                      }`}
                    >
                      <span
                        aria-hidden="true"
                        className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                          enableSoundEffects ? 'translate-x-4' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>
                  <p className="text-[10px] leading-relaxed opacity-85">
                    Reproduce sonidos interactivos cortos al interactuar con botones o confirmar acciones.
                  </p>
                </div>

                {/* Toggle: Notificaciones de Escritorio (Push) */}
                <div className={`p-4 rounded-xl border mt-4 transition-all duration-300 ${
                  enableBrowserNotifications 
                    ? 'bg-amber-500/5 border-amber-500/20 text-amber-950 dark:text-amber-100'
                    : 'bg-slate-50/50 border-slate-100 dark:bg-slate-900/30 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                }`}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-bold text-xs uppercase tracking-wider flex items-center gap-1.5">
                      {enableBrowserNotifications ? <Bell className="text-amber-500 animate-bounce" size={14} /> : <BellOff className="text-slate-400" size={14} />}
                      Avisos de Escritorio (IA)
                    </span>
                    <button
                      type="button"
                      role="switch"
                      aria-checked={enableBrowserNotifications}
                      aria-label="Activar notificaciones de escritorio"
                      onClick={async () => {
                        playSound('click');
                        if (enableBrowserNotifications) {
                          setEnableBrowserNotifications(false);
                        } else {
                          if (!('Notification' in window)) {
                            if (enableSuccessNotifications) {
                              setToast({
                                show: true,
                                message: 'No soportado ⚠️',
                                sub: 'Tu navegador o entorno iframe no admite notificaciones de escritorio.'
                              });
                            }
                            return;
                          }
                          const permission = await Notification.requestPermission();
                          if (permission === 'granted') {
                            setEnableBrowserNotifications(true);
                            new Notification('¡Notificaciones Activas! 🔔', {
                              body: 'Te avisaremos cuando se completen las generaciones masivas por IA o las revisiones.',
                              icon: '/favicon.ico'
                            });
                          } else {
                            setEnableBrowserNotifications(false);
                            if (enableSuccessNotifications) {
                              setToast({
                                show: true,
                                message: 'Permiso Denegado 🔒',
                                sub: 'Por favor, permite las notificaciones en la barra de direcciones de tu navegador.'
                              });
                            }
                          }
                        }
                      }}
                      className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-amber-500 ${
                        enableBrowserNotifications ? 'bg-amber-500' : 'bg-slate-200 dark:bg-slate-700'
                      }`}
                    >
                      <span
                        aria-hidden="true"
                        className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                          enableBrowserNotifications ? 'translate-x-4' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>
                  <p className="text-[10px] leading-relaxed opacity-85">
                    Envía avisos push del sistema cuando finalice la generación masiva con IA o las revisiones en segundo plano.
                  </p>
                  
                  {typeof window !== 'undefined' && 'Notification' in window && (
                    <div className="mt-1.5 pt-1.5 border-t border-black/5 dark:border-white/5 flex justify-between items-center text-[9px] font-bold opacity-75">
                      <span>Estado del permiso:</span>
                      <span className={
                        Notification.permission === 'granted' ? 'text-emerald-500' :
                        Notification.permission === 'denied' ? 'text-rose-500' : 'text-slate-400'
                      }>
                        {Notification.permission === 'granted' ? 'Permitido ✅' :
                         Notification.permission === 'denied' ? 'Bloqueado ❌' : 'Por solicitar ❔'}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Status Indicator */}
              <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500">
                <span>Preferencia Local</span>
                <span className="flex items-center gap-1">
                  <span className={`w-1.5 h-1.5 rounded-full ${enableSoundEffects || enableSuccessNotifications || enableBrowserNotifications ? 'bg-emerald-500' : 'bg-amber-500'}`}></span>
                  {enableSoundEffects || enableSuccessNotifications || enableBrowserNotifications ? 'Activo' : 'Silenciado'}
                </span>
              </div>
            </div>

            {/* Card 4: Sincronización en la Nube (Firestore) */}
            <div className={`rounded-2xl border p-8 shadow-sm transition-colors duration-300 flex flex-col justify-between ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
              <div>
                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-6 flex items-center gap-1.5">
                  <Database size={16} className="text-indigo-500" />
                  Sincronización Cloud
                </h3>

                <p className={`text-xs mb-4 leading-relaxed ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                  Sincroniza y respalda tus datos de manera automática con Firestore para recuperarlos en cualquier dispositivo.
                </p>

                <CloudSync
                  isDarkMode={isDarkMode}
                  isAccessibilityMode={isAccessibilityMode}
                  playSound={playSound}
                  currentData={{
                    title,
                    items,
                    theme,
                    timeLimit,
                    shuffleQuestions,
                    kioskMode,
                    feedbackTiming,
                    neonPrimaryColor,
                    neonAccentColor,
                    pointsPerQuestion,
                    passingScore,
                    enableSoundEffects,
                    enableSuccessNotifications,
                    enableBrowserNotifications,
                    aiSystemPrompt
                  }}
                  onLoadData={onLoadCloudData}
                  onToast={(msg, sub, type) => {
                    setToast({
                      show: true,
                      message: msg,
                      sub: sub,
                      type: type
                    });
                  }}
                  isOnline={isOnline}
                />
              </div>
            </div>
          </div>

          {/* Panel de Configuración de IA */}
          <div className="mt-8">
            <AISettingsPanel 
              systemPrompt={aiSystemPrompt}
              setSystemPrompt={setAiSystemPrompt}
              isDarkMode={isDarkMode}
              isAccessibilityMode={isAccessibilityMode}
              playSound={playSound}
            />
          </div>

          {/* Panel de Verificación de Accesibilidad */}
          <div className="mt-8">
            <AccessibilityPanel 
              items={items}
              setItems={setItems}
              isAccessibilityMode={isAccessibilityMode}
              isDarkMode={isDarkMode}
              timeLimit={timeLimit}
              passingScore={passingScore}
              playSound={playSound}
            />
          </div>
        </motion.section>

        {/* PASO 1: Construir Contenido */}
        <motion.section 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-12"
        >
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
            <div className="flex items-center gap-3">
              <span className="w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-sm">1</span>
              <h2 className="text-2xl font-bold">Generar Cuestionario</h2>
            </div>
            
            <div className="flex flex-wrap items-center gap-3">
              {/* Barajar Preguntas */}
              <div className={`flex items-center justify-between gap-3 px-4 py-2 rounded-2xl border text-sm font-semibold transition-all ${
                shuffleQuestions 
                  ? 'bg-indigo-50/50 border-indigo-200 text-indigo-700 dark:bg-indigo-950/20 dark:border-indigo-900/30' 
                  : 'bg-white border-slate-200 text-slate-600 dark:bg-slate-900/40 dark:border-slate-800/40 dark:text-slate-400'
              }`}>
                <div className="flex flex-col">
                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500">Evaluación Aleatoria</span>
                  <span className="text-xs font-bold">Barajar preguntas</span>
                </div>
                <button
                  type="button"
                  id="toggle-shuffle"
                  role="switch"
                  aria-checked={shuffleQuestions}
                  aria-label="Barajar preguntas aleatoriamente"
                  onClick={() => setShuffleQuestions(!shuffleQuestions)}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    shuffleQuestions ? 'bg-indigo-600' : 'bg-slate-200 dark:bg-slate-800'
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                      shuffleQuestions ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              {/* Modo Kiosco */}
              <div className={`flex items-center justify-between gap-3 px-4 py-2 rounded-2xl border text-sm font-semibold transition-all ${
                kioskMode 
                  ? 'bg-amber-50/50 border-amber-200 text-amber-800 dark:bg-amber-950/20 dark:border-amber-900/30' 
                  : 'bg-white border-slate-200 text-slate-600 dark:bg-slate-900/40 dark:border-slate-800/40 dark:text-slate-400'
              }`}>
                <div className="flex flex-col">
                  <span className="text-[10px] font-black uppercase tracking-wider text-amber-500 dark:text-amber-500">Navegación Secuencial</span>
                  <span className="text-xs font-bold flex items-center gap-1">Modo Kiosco 🔒</span>
                </div>
                <button
                  type="button"
                  id="toggle-kiosk"
                  role="switch"
                  aria-checked={kioskMode}
                  aria-label="Habilitar Modo Kiosco para navegación secuencial obligatoria"
                  onClick={() => setKioskMode(!kioskMode)}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    kioskMode ? 'bg-amber-500' : 'bg-slate-200 dark:bg-slate-800'
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                      kioskMode ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              {/* Temporizador Visual */}
              <div className={`flex items-center justify-between gap-3 px-4 py-2 rounded-2xl border text-sm font-semibold transition-all ${
                timeLimit && timeLimit > 0
                  ? 'bg-rose-50/50 border-rose-200 text-rose-700 dark:bg-rose-950/20 dark:border-rose-900/30' 
                  : 'bg-white border-slate-200 text-slate-600 dark:bg-slate-900/40 dark:border-slate-800/40 dark:text-slate-400'
              }`}>
                <div className="flex flex-col">
                  <span className="text-[10px] font-black uppercase tracking-wider text-rose-500 dark:text-rose-500">Examen con Tiempo</span>
                  <span className="text-xs font-bold flex items-center gap-1">Temporizador Visual ⏱️</span>
                </div>
                <button
                  type="button"
                  id="toggle-timer"
                  role="switch"
                  aria-checked={!!timeLimit && timeLimit > 0}
                  aria-label="Habilitar cuenta regresiva visual"
                  onClick={() => {
                    if (timeLimit && timeLimit > 0) {
                      setTimeLimit(undefined);
                    } else {
                      setTimeLimit(10); // Default to 10 mins if enabled via toggle
                    }
                  }}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    timeLimit && timeLimit > 0 ? 'bg-rose-500' : 'bg-slate-200 dark:bg-slate-800'
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                      timeLimit && timeLimit > 0 ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
            </div>
          </div>

          <AIAssistant 
            systemPrompt={aiSystemPrompt}
            onAddQuestions={(newItems) => {
              setItems([...items, ...newItems]);
              triggerNotification(
                '¡Generación IA Completada! 🤖✨', 
                `Se han generado con éxito ${newItems.length} nuevas preguntas basadas en tu material. ¡Listas para Moodle!`
              );
            }} 
          />

          <AnimatePresence>
            {items.length > 0 && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="mt-12"
              >
                <StatsPanel items={items} />
                <div className="flex items-center justify-between mb-6">
                  <div className="flex flex-wrap items-center gap-4">
                    <h3 className={`text-xl font-bold ${isAccessibilityMode ? 'text-slate-950 dark:text-white font-black text-2xl' : 'text-slate-800'}`}>Contenido Generado</h3>
                    <button
                      onClick={() => {
                        setIsFlowPreviewMode(!isFlowPreviewMode);
                        setIsTutorModeOpen(false);
                      }}
                      className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                        isFlowPreviewMode 
                          ? 'bg-indigo-600 text-white shadow-lg' 
                          : (isAccessibilityMode
                              ? 'bg-white dark:bg-black border-2 border-slate-950 dark:border-white text-slate-950 dark:text-white font-black hover:bg-slate-950 hover:text-white dark:hover:bg-white dark:hover:text-black'
                              : 'bg-slate-100 text-slate-500 hover:bg-slate-200')
                      }`}
                    >
                      <Eye size={14} />
                      {isFlowPreviewMode ? 'Volver a Edición' : 'Vista Previa de Flujo'}
                    </button>

                    <button
                      onClick={() => {
                        setIsTutorModeOpen(!isTutorModeOpen);
                        setIsFlowPreviewMode(false);
                      }}
                      className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                        isTutorModeOpen 
                          ? 'bg-amber-500 text-white shadow-lg font-black' 
                          : (isAccessibilityMode
                              ? 'bg-white dark:bg-black border-2 border-slate-950 dark:border-white text-slate-950 dark:text-white font-black hover:bg-slate-950 hover:text-white dark:hover:bg-white dark:hover:text-black'
                              : 'bg-slate-100 text-slate-500 hover:bg-slate-200')
                      }`}
                    >
                      <Award size={14} />
                      {isTutorModeOpen ? 'Volver a Edición' : 'Modo Tutor 🎓'}
                    </button>
                  </div>
                  {!isFlowPreviewMode && !isTutorModeOpen && (
                    <button 
                      onClick={() => { 
                        setItems([]); 
                        setTitle('Hacer cuestionarios');
                        setIsThemeConfirmed(false); 
                      }}
                      className={`text-xs font-bold uppercase tracking-wider ${isAccessibilityMode ? 'text-rose-700 dark:text-rose-400 font-black decoration-2 underline' : 'text-slate-400 hover:text-red-500'}`}
                    >
                      Limpiar Todo
                    </button>
                  )}
                </div>
                {isFlowPreviewMode ? (
                  <LessonEditor items={items} setItems={setItems} readOnly={true} isAccessibilityMode={isAccessibilityMode} />
                ) : isTutorModeOpen ? (
                  <TutorPanel items={items} setItems={setItems} isAccessibilityMode={isAccessibilityMode} isDarkMode={isDarkMode} playSound={playSound} triggerNotification={triggerNotification} systemPrompt={aiSystemPrompt} />
                ) : (
                  <LessonEditor items={items} setItems={setItems} readOnly={false} isAccessibilityMode={isAccessibilityMode} />
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.section>

        {/* PASO 2: Estilo y Exportar */}
        <AnimatePresence>
          {items.length > 0 && (
            <motion.section 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="mb-12"
            >
              <div className="flex items-center gap-3 mb-6">
              <span className="w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-sm">2</span>
              <h2 className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>Personalizar y Exportar</h2>
            </div>

            <div className={`rounded-2xl border p-8 shadow-sm transition-colors duration-300 ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
              <p className={`text-sm mb-6 italic ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                Elige el estilo visual para tu trivia interactiva.
              </p>
              
              {!isThemeConfirmed ? (
                <div>
                  <ThemeSelector selected={theme} onSelect={setTheme} />
                  
                  {theme === 'neon' && (
                    <div className="mt-6">
                      <NeonCustomizer
                        primaryColor={neonPrimaryColor}
                        onChangePrimary={setNeonPrimaryColor}
                        accentColor={neonAccentColor}
                        onChangeAccent={setNeonAccentColor}
                        isDarkMode={isDarkMode}
                      />
                    </div>
                  )}

                  <button 
                    onClick={() => setIsThemeConfirmed(true)}
                    className="mt-6 w-full py-4 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-colors shadow-lg"
                  >
                    Confirmar Estilo Visual
                  </button>
                </div>
              ) : (
                <div className="space-y-8">
                  <div className="flex flex-col items-center py-6 border-2 border-dashed border-indigo-200 rounded-2xl bg-indigo-50/50">
                    <p className="font-bold text-indigo-900 mb-2">Estilo "{theme.toUpperCase()}" seleccionado</p>
                    <button 
                      onClick={() => setIsThemeConfirmed(false)}
                      className="text-indigo-600 text-sm font-bold flex items-center gap-1 hover:underline"
                    >
                      <Settings size={14} />
                      Botón de arrepentimiento: Cambiar estilo
                    </button>
                  </div>

                  {theme === 'neon' && (
                    <NeonCustomizer
                      primaryColor={neonPrimaryColor}
                      onChangePrimary={setNeonPrimaryColor}
                      accentColor={neonAccentColor}
                      onChangeAccent={setNeonAccentColor}
                      isDarkMode={isDarkMode}
                    />
                  )}

                  {/* Configuración de Retroalimentación */}
                  <div className={`p-6 rounded-2xl border transition-all duration-300 ${
                    isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
                  }`}>
                    <h3 className="font-bold text-sm uppercase tracking-wide mb-3 flex items-center gap-2">
                      <Settings className="text-indigo-600 dark:text-indigo-400" size={18} />
                      Retroalimentación del Cuestionario
                    </h3>
                    <p className="text-xs text-slate-500 mb-4">
                      Define cuándo verán los alumnos las respuestas correctas y los comentarios aclaratorios de cada pregunta.
                    </p>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => setFeedbackTiming('immediate')}
                        className={`p-4 rounded-xl border-2 text-left flex flex-col justify-between transition-all ${
                          feedbackTiming === 'immediate'
                            ? 'border-indigo-600 bg-indigo-50/20 dark:bg-indigo-950/20 text-indigo-900 dark:text-indigo-200 shadow-md'
                            : 'border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-900'
                        }`}
                      >
                        <div className="flex items-center justify-between w-full mb-2">
                          <span className="font-bold text-sm">Feedback Inmediato</span>
                          <span className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                            feedbackTiming === 'immediate' ? 'border-indigo-600' : 'border-slate-300'
                          }`}>
                            {feedbackTiming === 'immediate' && (
                              <span className="w-2 h-2 rounded-full bg-indigo-600"></span>
                            )}
                          </span>
                        </div>
                        <p className="text-[11px] opacity-80 leading-relaxed">
                          Los alumnos reciben retroalimentación interactiva y ven si acertaron inmediatamente después de responder cada pregunta.
                        </p>
                      </button>

                      <button
                        type="button"
                        onClick={() => setFeedbackTiming('end')}
                        className={`p-4 rounded-xl border-2 text-left flex flex-col justify-between transition-all ${
                          feedbackTiming === 'end'
                            ? 'border-indigo-600 bg-indigo-50/20 dark:bg-indigo-950/20 text-indigo-900 dark:text-indigo-200 shadow-md'
                            : 'border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-900'
                        }`}
                      >
                        <div className="flex items-center justify-between w-full mb-2">
                          <span className="font-bold text-sm">Al Finalizar el Cuestionario</span>
                          <span className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                            feedbackTiming === 'end' ? 'border-indigo-600' : 'border-slate-300'
                          }`}>
                            {feedbackTiming === 'end' && (
                              <span className="w-2 h-2 rounded-full bg-indigo-600"></span>
                            )}
                          </span>
                        </div>
                        <p className="text-[11px] opacity-80 leading-relaxed">
                          La trivia fluye sin interrupciones ni revelaciones previas. Al terminar el intento, se muestra una revisión completa de respuestas.
                        </p>
                      </button>
                    </div>
                  </div>

                  {/* Panel de Verificación de Compatibilidad */}
                  <div className={`p-6 rounded-2xl border transition-all duration-300 ${
                    isDarkMode ? 'bg-slate-950/40 border-slate-800' : 'bg-slate-50 border-slate-200'
                  }`}>
                    <div className="flex items-center gap-2.5 mb-4 border-b pb-3 border-slate-100 dark:border-slate-800">
                      <ShieldCheck className="text-indigo-600 dark:text-indigo-400" size={20} />
                      <div className="flex-1">
                        <h4 className={`font-bold text-sm uppercase tracking-wide ${isDarkMode ? 'text-slate-200' : 'text-slate-800'}`}>
                          Verificación de Compatibilidad SCORM & PDF
                        </h4>
                        <p className="text-[10px] text-slate-400 dark:text-slate-500 uppercase font-black tracking-widest leading-none mt-1">Auditado en tiempo real</p>
                      </div>
                    </div>
                    
                    <div className="space-y-3">
                      {getCompatibilityReport().map((report, idx) => (
                        <div key={idx} className={`p-4 rounded-xl border flex gap-3 transition-colors ${
                          report.type === 'error'
                            ? (isDarkMode ? 'bg-rose-950/10 border-rose-900/30 text-rose-200' : 'bg-rose-50 border-rose-100 text-rose-800')
                            : report.type === 'warning'
                              ? (isDarkMode ? 'bg-amber-950/10 border-amber-900/30 text-amber-200' : 'bg-amber-50 border-amber-100 text-amber-800')
                              : (isDarkMode ? 'bg-emerald-950/10 border-emerald-900/30 text-emerald-200' : 'bg-emerald-50 border-emerald-100 text-emerald-800')
                        }`}>
                          <div className="mt-0.5 shrink-0">
                            {report.type === 'error' && <XCircle size={18} className="text-rose-500" />}
                            {report.type === 'warning' && <AlertTriangle size={18} className="text-amber-500" />}
                            {report.type === 'success' && <CheckCircle2 size={18} className="text-emerald-500" />}
                          </div>
                          <div>
                            <p className="font-bold text-xs leading-none mb-1.5">{report.message}</p>
                            <p className={`text-[11px] leading-relaxed ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>{report.details}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="bg-slate-900 rounded-2xl p-8 text-white shadow-2xl relative overflow-hidden">
                    <div className="relative z-10 text-center md:text-left">
                      <div className="flex flex-col md:flex-row items-center gap-6 mb-8">
                        <div className="p-4 bg-indigo-500 rounded-2xl shadow-lg shadow-indigo-500/20">
                          <Package size={40} className="text-white" />
                        </div>
                        <div>
                          <h3 className="text-2xl font-bold">Todo listo para exportar</h3>
                          <p className="text-slate-400 text-sm">Elige el formato que mejor se adapte a tus necesidades.</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-8 mb-8 pb-8 border-b border-white/10">
                        {/* SCORM Option */}
                        <div className="space-y-4">
                          <h4 className="font-bold flex items-center gap-2">
                             <div className="w-2 h-2 rounded-full bg-indigo-500"></div>
                             Paquete SCORM 1.2
                          </h4>
                          <p className="text-slate-500 text-xs leading-relaxed">
                            Formato estándar para LMS como Moodle o Blackboard. Interactivo y trazable.
                          </p>
                          <div className="grid grid-cols-1 gap-2">
                            <button 
                              onClick={() => setIsPreviewOpen(true)}
                              className="flex items-center justify-center gap-3 py-3 bg-white/10 text-white rounded-xl font-bold hover:bg-white/20 transition-all border border-white/10 text-sm"
                            >
                              <Eye size={18} />
                              <span>Previsualizar</span>
                            </button>

                            <button 
                              onClick={handleExport}
                              disabled={isExporting}
                              className="flex items-center justify-center gap-3 py-3 bg-indigo-500 text-white rounded-xl font-bold hover:bg-indigo-400 transition-all shadow-lg active:scale-[0.98] disabled:opacity-50 text-sm"
                            >
                              {isExporting ? <Loader2 size={18} className="animate-spin" /> : <Download size={18} />}
                              <span>{isExporting ? 'Procesando...' : 'Descargar ZIP'}</span>
                            </button>
                          </div>
                        </div>

                        {/* PDF Option */}
                        <div className="space-y-4">
                          <h4 className="font-bold flex items-center gap-2">
                             <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                             Documento PDF
                          </h4>
                          <p className="text-slate-500 text-xs leading-relaxed">
                            Formato para imprimir o compartir como lectura estática.
                          </p>
                          
                          <div className="space-y-1 py-1">
                            <label className="flex items-center gap-2 cursor-pointer group">
                              <input 
                                type="checkbox" 
                                checked={includeAnswersInPdf}
                                onChange={(e) => setIncludeAnswersInPdf(e.target.checked)}
                                className="w-4 h-4 rounded border-slate-700 bg-slate-800 text-emerald-500 focus:ring-emerald-500"
                              />
                              <span className="text-xs text-slate-400 group-hover:text-slate-200 transition-colors">Incluir respuestas correctas</span>
                            </label>

                            <label className="flex items-center gap-2 cursor-pointer group">
                              <input 
                                type="checkbox" 
                                checked={includeConfigSummaryInPdf}
                                onChange={(e) => setIncludeConfigSummaryInPdf(e.target.checked)}
                                className="w-4 h-4 rounded border-slate-700 bg-slate-800 text-emerald-500 focus:ring-emerald-500"
                              />
                              <span className="text-xs text-slate-400 group-hover:text-slate-200 transition-colors">Incluir página de ajustes técnicos</span>
                            </label>
                          </div>

                          <button 
                            onClick={handlePdfExport}
                            disabled={isExportingPdf}
                            className="w-full flex items-center justify-center gap-3 py-3 bg-white text-slate-900 rounded-xl font-bold hover:bg-slate-200 transition-all shadow-lg active:scale-[0.98] disabled:opacity-50 text-sm"
                          >
                            {isExportingPdf ? <Loader2 size={18} className="animate-spin" /> : <Printer size={18} />}
                            <span>{isExportingPdf ? 'Generando...' : 'Descargar PDF'}</span>
                          </button>
                        </div>

                        {/* Word Document Option */}
                        <div className="space-y-4">
                          <h4 className="font-bold flex items-center gap-2">
                             <div className="w-2 h-2 rounded-full bg-blue-400"></div>
                             Documento Word (.docx)
                          </h4>
                          <p className="text-slate-500 text-xs leading-relaxed">
                            Formato editable de Microsoft Word para documentar o modificar de forma libre.
                          </p>
                          
                          <div className="space-y-1 py-1">
                            <label className="flex items-center gap-2 cursor-pointer group">
                              <input 
                                type="checkbox" 
                                checked={includeAnswersInDocx}
                                onChange={(e) => setIncludeAnswersInDocx(e.target.checked)}
                                className="w-4 h-4 rounded border-slate-700 bg-slate-800 text-blue-500 focus:ring-blue-500"
                              />
                              <span className="text-xs text-slate-400 group-hover:text-slate-200 transition-colors">Incluir respuestas correctas</span>
                            </label>

                            <label className="flex items-center gap-2 cursor-pointer group">
                              <input 
                                type="checkbox" 
                                checked={includeConfigSummaryInDocx}
                                onChange={(e) => setIncludeConfigSummaryInDocx(e.target.checked)}
                                className="w-4 h-4 rounded border-slate-700 bg-slate-800 text-blue-500 focus:ring-blue-500"
                              />
                              <span className="text-xs text-slate-400 group-hover:text-slate-200 transition-colors">Incluir página de ajustes técnicos</span>
                            </label>
                          </div>

                          <button 
                            onClick={handleDocxExport}
                            disabled={isExportingDocx}
                            className="w-full flex items-center justify-center gap-3 py-3 bg-white text-slate-900 rounded-xl font-bold hover:bg-slate-200 transition-all shadow-lg active:scale-[0.98] disabled:opacity-50 text-sm"
                          >
                            {isExportingDocx ? <Loader2 size={18} className="animate-spin" /> : <FileText size={18} />}
                            <span>{isExportingDocx ? 'Generando...' : 'Descargar DOCX'}</span>
                          </button>
                        </div>

                        {/* GIFT Option */}
                        <div className="space-y-4">
                          <h4 className="font-bold flex items-center gap-2">
                             <div className="w-2 h-2 rounded-full bg-amber-500"></div>
                             Formato GIFT (Moodle)
                          </h4>
                          <p className="text-slate-500 text-xs leading-relaxed">
                            Formato de texto estándar ideal para importar preguntas directamente a Moodle y otros LMS.
                          </p>
                          
                          <div className="flex items-center gap-2 py-1">
                            <span className="text-xs text-slate-400 block h-6">Exporta solo las preguntas del cuestionario</span>
                          </div>

                          <button 
                            onClick={handleGiftExport}
                            disabled={isExportingGift}
                            className="w-full flex items-center justify-center gap-3 py-3 bg-amber-500 text-slate-950 rounded-xl font-bold hover:bg-amber-400 transition-all shadow-lg active:scale-[0.98] disabled:opacity-50 text-sm"
                          >
                            {isExportingGift ? <Loader2 size={18} className="animate-spin" /> : <FileDown size={18} />}
                            <span>{isExportingGift ? 'Generando...' : 'Descargar GIFT'}</span>
                          </button>
                        </div>

                        {/* JSON Configuration Option */}
                        <div className="space-y-4">
                          <h4 className="font-bold flex items-center gap-2">
                             <div className="w-2 h-2 rounded-full bg-violet-400"></div>
                             Respaldo JSON
                          </h4>
                          <p className="text-slate-500 text-xs leading-relaxed">
                            Guarda la estructura completa de tu cuestionario (título, preguntas, ajustes) para volver a cargarla más tarde.
                          </p>
                          
                          <input 
                            type="file" 
                            ref={fileInputRef} 
                            onChange={handleJsonImport} 
                            accept=".json" 
                            className="hidden" 
                          />

                          <div className="grid grid-cols-1 gap-2">
                            <button 
                              onClick={handleJsonExport}
                              className="flex items-center justify-center gap-3 py-3 bg-white/10 text-white rounded-xl font-bold hover:bg-white/20 transition-all border border-white/10 text-sm active:scale-[0.98]"
                            >
                              <FileJson size={18} />
                              <span>Exportar JSON</span>
                            </button>

                            <button 
                              onClick={() => fileInputRef.current?.click()}
                              className="flex items-center justify-center gap-3 py-3 bg-violet-600 text-white rounded-xl font-bold hover:bg-violet-500 transition-all shadow-lg active:scale-[0.98] text-sm"
                            >
                              <Upload size={18} />
                              <span>Cargar JSON</span>
                            </button>
                          </div>
                        </div>
                      </div>

                      <p className="text-center text-[10px] text-slate-500 font-medium">
                        Sugerencia: Usa el SCORM para la evaluación final interactiva, el PDF para material físico, y el formato GIFT para importar directamente a tu aula virtual Moodle.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </motion.section>
        )}
        </AnimatePresence>
      </main>

      <PreviewModal 
        isOpen={isPreviewOpen} 
        onClose={() => setIsPreviewOpen(false)} 
        bundle={{ title, theme, items: items.filter(it => !it.data.isDraft), timeLimit, shuffleQuestions, kioskMode, feedbackTiming, neonPrimaryColor, neonAccentColor }}
      />

      <AnimatePresence>
        {toast && toast.show && (
          (() => {
            const toastType = (() => {
              if (toast.type) return toast.type;
              const msg = toast.message.toLowerCase();
              if (msg.includes('éxito') || msg.includes('guardado') || msg.includes('cargada') || msg.includes('exitoso') || msg.includes('restablecida') || msg.includes('concedido')) {
                return 'success';
              }
              if (msg.includes('error') || msg.includes('denegado') || msg.includes('falló') || msg.includes('incorrecta') || msg.includes('no soportado') || msg.includes('permiso') || msg.includes('denegado')) {
                return 'error';
              }
              if (msg.includes('offline') || msg.includes('advertencia') || msg.includes('⚠️') || msg.includes('reiniciado')) {
                return 'warning';
              }
              return 'info';
            })();

            const styles = {
              success: {
                bg: isAccessibilityMode
                  ? (isDarkMode ? 'bg-black border-emerald-500 text-white' : 'bg-white border-emerald-600 text-black')
                  : (isDarkMode ? 'bg-slate-900/95 border-emerald-500/20 text-white shadow-emerald-500/5' : 'bg-white border-emerald-100 text-slate-800 shadow-emerald-100/30'),
                iconBg: isAccessibilityMode ? 'bg-emerald-600 text-white' : 'bg-emerald-500/10 text-emerald-500 dark:text-emerald-400 border border-emerald-500/20',
                accentBar: 'bg-emerald-500',
                icon: <CheckCircle2 size={20} className="stroke-[2.5]" />
              },
              error: {
                bg: isAccessibilityMode
                  ? (isDarkMode ? 'bg-black border-rose-500 text-white' : 'bg-white border-rose-600 text-black')
                  : (isDarkMode ? 'bg-slate-900/95 border-rose-500/20 text-white shadow-rose-500/5' : 'bg-white border-rose-100 text-slate-800 shadow-rose-100/30'),
                iconBg: isAccessibilityMode ? 'bg-rose-600 text-white' : 'bg-rose-500/10 text-rose-500 dark:text-rose-400 border border-rose-500/20',
                accentBar: 'bg-rose-500',
                icon: <XCircle size={20} className="stroke-[2.5]" />
              },
              warning: {
                bg: isAccessibilityMode
                  ? (isDarkMode ? 'bg-black border-amber-500 text-white' : 'bg-white border-amber-600 text-black')
                  : (isDarkMode ? 'bg-slate-900/95 border-amber-500/20 text-white shadow-amber-500/5' : 'bg-white border-amber-100 text-slate-800 shadow-amber-100/30'),
                iconBg: isAccessibilityMode ? 'bg-amber-600 text-white' : 'bg-amber-500/10 text-amber-500 dark:text-amber-400 border border-amber-500/20',
                accentBar: 'bg-amber-500',
                icon: <AlertTriangle size={20} className="stroke-[2.5]" />
              },
              info: {
                bg: isAccessibilityMode
                  ? (isDarkMode ? 'bg-black border-indigo-500 text-white' : 'bg-white border-indigo-600 text-black')
                  : (isDarkMode ? 'bg-slate-900/95 border-indigo-500/20 text-white shadow-indigo-500/5' : 'bg-white border-indigo-100 text-slate-800 shadow-indigo-100/30'),
                iconBg: isAccessibilityMode ? 'bg-indigo-600 text-white' : 'bg-indigo-500/10 text-indigo-500 dark:text-indigo-400 border border-indigo-500/20',
                accentBar: 'bg-indigo-500',
                icon: <Sparkles size={20} className="stroke-[2.5]" />
              }
            }[toastType];

            return (
              <motion.div
                initial={{ opacity: 0, x: 80, scale: 0.9 }}
                animate={{ 
                  opacity: 1, 
                  x: 0, 
                  scale: 1,
                  transition: {
                    type: "spring",
                    stiffness: 350,
                    damping: 26
                  }
                }}
                exit={{ 
                  opacity: 0, 
                  x: 80, 
                  scale: 0.9, 
                  transition: { duration: 0.2, ease: "easeIn" } 
                }}
                className={`fixed top-6 right-6 z-[9999] max-w-sm w-full border shadow-2xl rounded-2xl p-4 flex gap-3 pointer-events-auto overflow-hidden ${styles.bg}`}
              >
                {/* Visual accent bar at the left */}
                <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${styles.accentBar}`} />
                
                <div className={`p-2 rounded-xl shrink-0 h-10 w-10 flex items-center justify-center ${styles.iconBg}`}>
                  {styles.icon}
                </div>
                <div className="flex-1 min-w-0 pl-1">
                  <p className="font-extrabold text-sm leading-tight mb-1">{toast.message}</p>
                  {toast.sub && <p className={`text-xs leading-snug ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>{toast.sub}</p>}
                </div>
                <button 
                  onClick={() => setToast(null)}
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 self-start p-1 transition-colors hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
                  aria-label="Cerrar notificación"
                >
                  <XCircle size={16} />
                </button>
              </motion.div>
            );
          })()
        )}
      </AnimatePresence>

      <footer className={`max-w-5xl mx-auto px-4 py-8 border-t text-center text-sm transition-colors duration-300 flex flex-col sm:flex-row items-center justify-center gap-2 ${isDarkMode ? 'border-slate-800 text-slate-600' : 'border-slate-200 text-slate-400'}`}>
        <span>SCORM Builder &copy; {new Date().getFullYear()} - Herramienta de autoría rápida</span>
        <span className="hidden sm:inline">&middot;</span>
        <a 
          href="https://simple.bio/ARIfischer" 
          target="_blank" 
          rel="noopener noreferrer" 
          className="text-indigo-600 dark:text-indigo-400 hover:underline font-medium"
        >
          Contacto: https://simple.bio/ARIfischer
        </a>
      </footer>
    </div>
  );
}

function escapeGiftText(text: string): string {
  if (!text) return '';
  // Escape GIFT special characters: ~, =, #, {, }, :
  return text.replace(/([~=#{}:])/g, '\\$1');
}

function generateGiftFormat(items: LessonItem[]): string {
  const questions = items.filter(it => it.type === 'question').map(it => it.data as Question);
  
  let giftText = '';
  
  questions.forEach((q, idx) => {
    const title = q.complexity 
      ? `::Pregunta ${idx + 1} [${q.complexity.toUpperCase()}]::` 
      : `::Pregunta ${idx + 1}::`;
      
    const questionText = escapeGiftText(q.question);
    let answerBlock = '';
    
    if (q.type === 'true-false') {
      const isTrue = q.correctAnswer === 0; // index 0 is Verdadero
      const answerChar = isTrue ? 'TRUE' : 'FALSE';
      
      let tfFeedback = '';
      if (q.feedback) {
        tfFeedback = `#${escapeGiftText(q.feedback)}`;
      }
      answerBlock = `{${answerChar}${tfFeedback}}`;
    } else {
      // Multiple choice
      const optionsText = q.options.map((opt, oIdx) => {
        const isCorrect = oIdx === q.correctAnswer;
        const prefix = isCorrect ? '=' : '~';
        const cleanOpt = escapeGiftText(opt);
        
        let optFeedback = '';
        if (q.optionsFeedback && q.optionsFeedback[oIdx]) {
          optFeedback = `#${escapeGiftText(q.optionsFeedback[oIdx])}`;
        }
        
        return `  ${prefix}${cleanOpt}${optFeedback}`;
      }).join('\n');
      
      answerBlock = `{\n${optionsText}\n}`;
    }
    
    let generalFeedbackBlock = '';
    if (q.feedback && q.type !== 'true-false') {
      generalFeedbackBlock = ` #### ${escapeGiftText(q.feedback)}`;
    }
    
    giftText += `${title} ${questionText} ${answerBlock}${generalFeedbackBlock}\n\n`;
  });
  
  return giftText.trim();
}
