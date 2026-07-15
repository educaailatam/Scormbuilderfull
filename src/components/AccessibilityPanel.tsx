/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { LessonItem, Question, ContentSlide } from '../types';
import { 
  CheckCircle2, 
  AlertTriangle, 
  AlertCircle, 
  Info, 
  Sparkles, 
  Image as ImageIcon, 
  HelpCircle, 
  Lightbulb,
  Check,
  TrendingUp,
  Activity,
  HeartHandshake
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface Props {
  items: LessonItem[];
  setItems: React.Dispatch<React.SetStateAction<LessonItem[]>>;
  isAccessibilityMode?: boolean;
  isDarkMode?: boolean;
  timeLimit: number;
  passingScore: number;
  playSound?: (type: 'success' | 'click' | 'reset' | 'tutor') => void;
}

interface AuditIssue {
  id: string; // Unique ID for keying
  itemId?: string; // Associated LessonItem ID if applicable
  type: 'error' | 'warning' | 'info';
  category: 'alt-text' | 'feedback' | 'short-text' | 'options' | 'time-limit' | 'passing-score';
  title: string;
  description: string;
  suggestion: string;
  itemTitle?: string; // e.g. "Pregunta 3" or Slide Title
  itemType?: 'question' | 'content';
  targetField?: string;
}

export const AccessibilityPanel: React.FC<Props> = ({ 
  items, 
  setItems, 
  isAccessibilityMode, 
  isDarkMode, 
  timeLimit, 
  passingScore,
  playSound 
}) => {
  const [activeTab, setActiveTab] = useState<'all' | 'errors' | 'passed'>('all');
  const [successToast, setSuccessToast] = useState<string | null>(null);

  // Function to update a single item directly from the audit dashboard
  const handleUpdateItemField = (id: string, field: string, value: any) => {
    setItems(prevItems => 
      prevItems.map(item => {
        const itemId = item.type === 'question' ? item.data.id : item.data.id;
        if (itemId === id) {
          if (item.type === 'question') {
            return {
              ...item,
              data: {
                ...item.data,
                [field]: value
              }
            };
          } else {
            return {
              ...item,
              data: {
                ...item.data,
                [field]: value
              }
            };
          }
        }
        return item;
      })
    );
    playSound?.('click');
    setSuccessToast(`¡Cambio guardado con éxito!`);
    setTimeout(() => setSuccessToast(null), 3000);
  };

  // Run audit checks
  const auditResults = useMemo(() => {
    const issues: AuditIssue[] = [];
    const passedChecks: { title: string; description: string }[] = [];
    
    let totalChecks = 0;
    let passedChecksCount = 0;

    const activeItems = items.filter(it => {
      const data = it.data;
      return !data.isDraft;
    });

    // 1. Audit Time Limit
    totalChecks++;
    if (timeLimit > 0 && timeLimit < 5) {
      issues.push({
        id: 'time-limit-strict',
        type: 'warning',
        category: 'time-limit',
        title: 'Límite de tiempo muy ajustado',
        description: `El límite está configurado en ${timeLimit} minuto(s).`,
        suggestion: 'Los estudiantes con dificultades de procesamiento, lectura o limitaciones motrices necesitan más tiempo. Se recomienda configurar un mínimo de 10 minutos o desactivar el límite si no es indispensable.'
      });
    } else {
      passedChecksCount++;
      passedChecks.push({
        title: 'Margen de tiempo inclusivo',
        description: timeLimit === 0 
          ? 'Cuestionario sin presión de tiempo (máxima accesibilidad).' 
          : `Límite de tiempo adecuado (${timeLimit} minutos).`
      });
    }

    // 2. Audit Passing Score
    totalChecks++;
    if (passingScore > 80) {
      issues.push({
        id: 'passing-score-demanding',
        type: 'info',
        category: 'passing-score',
        title: 'Criterio de aprobación exigente',
        description: `La puntuación mínima para aprobar es de ${passingScore}%.`,
        suggestion: 'Un umbral mayor al 80% puede resultar frustrante para alumnos con neurodivergencias. Considera un estándar inclusivo del 60% o 70%, permitiendo reintentos múltiples.'
      });
    } else {
      passedChecksCount++;
      passedChecks.push({
        title: 'Criterio de aprobación equilibrado',
        description: `Puntuación de aprobación configurada en un accesible ${passingScore}%.`
      });
    }

    // 3. Scan Quiz Items
    activeItems.forEach((item, index) => {
      const idxDisplay = index + 1;
      const isQ = item.type === 'question';
      const data = item.data;
      const itemLabel = isQ ? `Pregunta ${idxDisplay}` : `Diapositiva ${idxDisplay}`;

      // Check image alt text
      if (data.imageUrl) {
        totalChecks++;
        if (!data.imageAlt || data.imageAlt.trim() === '') {
          issues.push({
            id: `alt-text-${data.id}`,
            itemId: data.id,
            type: 'error',
            category: 'alt-text',
            title: 'Falta texto alternativo en imagen',
            description: `La ilustración de "${isQ ? (data as Question).question.substring(0, 30) + '...' : (data as ContentSlide).title}" no tiene descripción.`,
            suggestion: 'Los lectores de pantalla no podrán describir esta imagen a estudiantes con discapacidad visual. Por favor, escribe un texto alternativo breve pero descriptivo.',
            itemTitle: itemLabel,
            itemType: item.type,
            targetField: 'imageAlt'
          });
        } else {
          passedChecksCount++;
          passedChecks.push({
            title: `Imagen con Texto Alt (${itemLabel})`,
            description: `"${data.imageAlt.substring(0, 40)}${data.imageAlt.length > 40 ? '...' : ''}"`
          });
        }
      }

      // Check feedback (Crucial WCAG self-assessment)
      if (isQ) {
        const q = data as Question;
        totalChecks++;
        if (!q.feedback || q.feedback.trim().length < 5) {
          issues.push({
            id: `feedback-${q.id}`,
            itemId: q.id,
            type: 'warning',
            category: 'feedback',
            title: 'Falta retroalimentación formativa',
            description: `La pregunta "${q.question.substring(0, 30)}..." no tiene explicación para las respuestas.`,
            suggestion: 'La accesibilidad cognitiva requiere feedback constructivo para guiar al estudiante por qué una opción es correcta o incorrecta.',
            itemTitle: itemLabel,
            itemType: 'question',
            targetField: 'feedback'
          });
        } else {
          passedChecksCount++;
          passedChecks.push({
            title: `Retroalimentación Formativa (${itemLabel})`,
            description: 'Feedback estructurado disponible para el autoaprendizaje.'
          });
        }

        // Check options clarity
        totalChecks++;
        const emptyOptions = q.options.filter(o => !o || o.trim() === '');
        if (emptyOptions.length > 0) {
          issues.push({
            id: `empty-options-${q.id}`,
            itemId: q.id,
            type: 'error',
            category: 'options',
            title: 'Opciones de respuesta vacías',
            description: `Esta pregunta contiene opciones de respuesta en blanco.`,
            suggestion: 'Rellena todas las opciones de respuesta para asegurar que los estudiantes reciban alternativas comprensibles.',
            itemTitle: itemLabel,
            itemType: 'question'
          });
        } else if (q.type === 'multiple-choice' && q.options.length < 2) {
          issues.push({
            id: `few-options-${q.id}`,
            itemId: q.id,
            type: 'error',
            category: 'options',
            title: 'Insuficientes opciones de respuesta',
            description: `La pregunta de opción múltiple tiene menos de 2 alternativas válidas.`,
            suggestion: 'Suministra al menos dos opciones claras para que sea evaluable.',
            itemTitle: itemLabel,
            itemType: 'question'
          });
        } else {
          passedChecksCount++;
          passedChecks.push({
            title: `Estructura de Opciones (${itemLabel})`,
            description: `${q.options.length} alternativas claras y completas.`
          });
        }

        // Check short question text
        totalChecks++;
        if (!q.question || q.question.trim().length < 10) {
          issues.push({
            id: `short-q-${q.id}`,
            itemId: q.id,
            type: 'error',
            category: 'short-text',
            title: 'Enunciado de pregunta extremadamente corto',
            description: 'El enunciado no tiene suficiente contexto didáctico.',
            suggestion: 'Asegúrate de formular una pregunta clara para evitar la ambigüedad cognitiva.',
            itemTitle: itemLabel,
            itemType: 'question',
            targetField: 'question'
          });
        } else {
          passedChecksCount++;
          passedChecks.push({
            title: `Redacción de Pregunta (${itemLabel})`,
            description: 'Longitud y claridad del enunciado apropiadas.'
          });
        }
      } else {
        // Content Slide Check
        const s = data as ContentSlide;
        totalChecks++;
        if (!s.content || s.content.trim().length < 20) {
          issues.push({
            id: `short-s-${s.id}`,
            itemId: s.id,
            type: 'warning',
            category: 'short-text',
            title: 'Contenido didáctico muy breve',
            description: 'La diapositiva apenas tiene información para estudiar.',
            suggestion: 'Añade más detalles o ejemplos prácticos para reforzar la retención cognitiva de los conceptos.',
            itemTitle: itemLabel,
            itemType: 'content',
            targetField: 'content'
          });
        } else {
          passedChecksCount++;
          passedChecks.push({
            title: `Contenido Didáctico (${itemLabel})`,
            description: 'Información de estudio con buena profundidad formativa.'
          });
        }
      }
    });

    // Handle score calculation
    let score = 100;
    if (totalChecks > 0) {
      // Errors count double, warnings single, info does not subtract much
      const errorCount = issues.filter(i => i.type === 'error').length;
      const warningCount = issues.filter(i => i.type === 'warning').length;
      const deduction = (errorCount * 15) + (warningCount * 6);
      score = Math.max(10, 100 - deduction);
    }

    return {
      issues,
      passedChecks,
      score,
      totalChecks,
      passedChecksCount
    };
  }, [items, timeLimit, passingScore]);

  const filteredIssues = useMemo(() => {
    if (activeTab === 'all') {
      return auditResults.issues;
    } else if (activeTab === 'errors') {
      return auditResults.issues.filter(i => i.type === 'error' || i.type === 'warning');
    }
    return [];
  }, [auditResults, activeTab]);

  return (
    <div className={`rounded-2xl border p-6 md:p-8 transition-colors duration-300 shadow-sm ${
      isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
    }`}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-5 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-start gap-3">
          <div className="p-3 bg-indigo-500/10 text-indigo-500 rounded-2xl shrink-0">
            <HeartHandshake size={24} className="animate-pulse" />
          </div>
          <div>
            <h3 className="text-lg font-black tracking-tight text-slate-800 dark:text-slate-100">
              Verificación de Accesibilidad (Doble-A)
            </h3>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
              Escanea tu material educativo con estándares e-learning inclusivos y WCAG.
            </p>
          </div>
        </div>

        {/* Dynamic Score Badge */}
        <div className="flex items-center gap-3 bg-slate-50 dark:bg-slate-950 px-4 py-2.5 rounded-2xl border border-slate-100 dark:border-slate-800">
          <div className="text-right">
            <span className="block text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Inclusión Escolar</span>
            <span className="block text-xs font-bold text-slate-500 dark:text-slate-400">
              {auditResults.passedChecksCount} de {auditResults.totalChecks} pruebas
            </span>
          </div>
          <div className={`text-2xl font-black px-3 py-1.5 rounded-xl flex items-center justify-center ${
            auditResults.score >= 90 ? 'bg-emerald-500/10 text-emerald-500' :
            auditResults.score >= 70 ? 'bg-amber-500/10 text-amber-500' : 'bg-rose-500/10 text-rose-500'
          }`}>
            {auditResults.score}%
          </div>
        </div>
      </div>

      {/* Progress Bar Gauge */}
      <div className="mb-6">
        <div className="flex justify-between items-center text-xs text-slate-400 dark:text-slate-500 font-bold mb-2">
          <span>Nivel de accesibilidad actual</span>
          <span className={
            auditResults.score >= 90 ? 'text-emerald-500' :
            auditResults.score >= 70 ? 'text-amber-500' : 'text-rose-500'
          }>
            {auditResults.score >= 90 ? 'Excelente (Listo para Lectores de Pantalla) 🎉' :
             auditResults.score >= 70 ? 'Aceptable (Sugerencias pendientes) ⚠️' : 'Requiere atención urgente 🚨'}
          </span>
        </div>
        <div className="w-full h-3 bg-slate-100 dark:bg-slate-950 rounded-full overflow-hidden p-0.5 border border-slate-200/50 dark:border-slate-800">
          <motion.div 
            initial={{ width: 0 }}
            animate={{ width: `${auditResults.score}%` }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            className={`h-full rounded-full ${
              auditResults.score >= 90 ? 'bg-gradient-to-r from-emerald-400 to-emerald-500' :
              auditResults.score >= 70 ? 'bg-gradient-to-r from-amber-400 to-amber-500' : 'bg-gradient-to-r from-rose-400 to-rose-500'
            }`}
          />
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b border-slate-100 dark:border-slate-800 pb-3">
        <button
          type="button"
          onClick={() => { playSound?.('click'); setActiveTab('all'); }}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'all'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 dark:text-slate-400'
          }`}
        >
          Todos los Hallazgos ({auditResults.issues.length})
        </button>
        <button
          type="button"
          onClick={() => { playSound?.('click'); setActiveTab('errors'); }}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
            activeTab === 'errors'
              ? 'bg-rose-600 text-white shadow-sm'
              : 'text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/20'
          }`}
        >
          Errores y Advertencias ({auditResults.issues.filter(i => i.type === 'error' || i.type === 'warning').length})
        </button>
        <button
          type="button"
          onClick={() => { playSound?.('click'); setActiveTab('passed'); }}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'passed'
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-950/20'
          }`}
        >
          Chequeos Aprobados ({auditResults.passedChecks.length})
        </button>
      </div>

      {/* Success Toast banner */}
      <AnimatePresence>
        {successToast && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="mb-4 p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-xs text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-2"
          >
            <CheckCircle2 size={14} className="shrink-0 text-emerald-500" />
            <span>{successToast}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Content Areas */}
      {items.filter(it => !it.data.isDraft).length === 0 ? (
        <div className="text-center py-12 border border-dashed rounded-2xl border-slate-200 dark:border-slate-800">
          <Info className="mx-auto text-slate-300 dark:text-slate-700 mb-2" size={32} />
          <p className="text-sm font-bold text-slate-400 dark:text-slate-500">Cuestionario vacío</p>
          <p className="text-xs text-slate-400 dark:text-slate-500/80 mt-1 max-w-sm mx-auto">
            Añade preguntas o diapositivas de estudio en el Paso 1 para que el verificador de accesibilidad pueda analizar tu contenido en tiempo real.
          </p>
        </div>
      ) : activeTab === 'passed' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {auditResults.passedChecks.map((check, i) => (
            <div 
              key={i} 
              className={`p-4 rounded-xl border flex gap-3 items-start transition-all ${
                isDarkMode ? 'bg-slate-950/40 border-slate-800/40 text-slate-300' : 'bg-slate-50/60 border-slate-100 text-slate-700'
              }`}
            >
              <CheckCircle2 className="text-emerald-500 shrink-0 mt-0.5" size={16} />
              <div>
                <h4 className="font-bold text-xs text-slate-800 dark:text-slate-200">{check.title}</h4>
                {check.description && <p className="text-[10px] mt-0.5 opacity-80 leading-relaxed">{check.description}</p>}
              </div>
            </div>
          ))}
        </div>
      ) : filteredIssues.length === 0 ? (
        <div className="text-center py-12 border border-dashed rounded-2xl border-emerald-200 dark:border-emerald-950 bg-emerald-500/5">
          <Check className="mx-auto text-emerald-500 mb-2 p-1.5 bg-emerald-500/10 rounded-full" size={40} />
          <p className="text-sm font-black text-emerald-600 dark:text-emerald-400">¡Ningún problema de accesibilidad!</p>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
            ¡Tu cuestionario cumple perfectamente las pautas de accesibilidad para e-learning! Tus estudiantes te lo agradecerán.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredIssues.map((issue) => {
            const isError = issue.type === 'error';
            const isWarning = issue.type === 'warning';
            
            return (
              <div 
                key={issue.id}
                className={`p-5 rounded-2xl border transition-all ${
                  isError 
                    ? 'bg-rose-500/5 border-rose-500/20 text-rose-950 dark:text-rose-100'
                    : isWarning 
                      ? 'bg-amber-500/5 border-amber-500/15 text-amber-950 dark:text-amber-100'
                      : 'bg-indigo-500/5 border-indigo-500/15 text-indigo-950 dark:text-indigo-100'
                }`}
              >
                {/* Header label */}
                <div className="flex items-start justify-between gap-4 mb-2">
                  <div className="flex items-center gap-2">
                    {isError ? (
                      <AlertCircle className="text-rose-500 shrink-0" size={18} />
                    ) : isWarning ? (
                      <AlertTriangle className="text-amber-500 shrink-0" size={18} />
                    ) : (
                      <Info className="text-indigo-500 shrink-0" size={18} />
                    )}
                    <span className="font-extrabold text-xs uppercase tracking-wider">
                      {issue.title}
                    </span>
                  </div>
                  
                  {issue.itemTitle && (
                    <span className="text-[10px] px-2.5 py-0.5 rounded-full font-black uppercase tracking-wider bg-black/5 dark:bg-white/10 opacity-80">
                      {issue.itemTitle}
                    </span>
                  )}
                </div>

                {/* Description */}
                <p className="text-xs font-semibold leading-relaxed mb-3 opacity-95">
                  {issue.description}
                </p>

                {/* Suggestion Card */}
                <div className="bg-white/40 dark:bg-black/30 p-3 rounded-xl border border-black/5 dark:border-white/5 mb-3">
                  <div className="flex items-start gap-1.5 text-[11px] leading-relaxed">
                    <Lightbulb className="text-yellow-500 shrink-0 mt-0.5" size={13} />
                    <div>
                      <strong className="text-slate-800 dark:text-slate-200">Recomendación:</strong>{' '}
                      <span className="opacity-90">{issue.suggestion}</span>
                    </div>
                  </div>
                </div>

                {/* Inline Action Editors */}
                {issue.itemId && issue.targetField && (
                  <div className="mt-4 pt-3 border-t border-black/5 dark:border-white/5">
                    <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1.5">
                      Resolver problema directamente:
                    </label>

                    {issue.targetField === 'imageAlt' && (
                      <div className="flex gap-2">
                        <input
                          type="text"
                          defaultValue=""
                          placeholder="Ej: Ilustración de un aula virtual con computadoras..."
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              const input = e.currentTarget;
                              if (input.value.trim() !== '') {
                                handleUpdateItemField(issue.itemId!, 'imageAlt', input.value);
                              }
                            }
                          }}
                          className={`text-xs px-3 py-2 flex-1 rounded-xl outline-none border transition-all ${
                            isAccessibilityMode 
                              ? 'border-2 border-slate-950 bg-white text-slate-950 font-black'
                              : 'bg-white dark:bg-slate-950 border-slate-200/80 dark:border-slate-850 dark:text-white focus:border-indigo-500'
                          }`}
                        />
                        <button
                          type="button"
                          onClick={(e) => {
                            const input = e.currentTarget.previousElementSibling as HTMLInputElement;
                            if (input && input.value.trim() !== '') {
                              handleUpdateItemField(issue.itemId!, 'imageAlt', input.value);
                            }
                          }}
                          className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-sm transition-all shrink-0"
                        >
                          Guardar
                        </button>
                      </div>
                    )}

                    {issue.targetField === 'feedback' && (
                      <div className="flex gap-2">
                        <textarea
                          rows={2}
                          placeholder="Escribe una explicación detallada del porqué de la respuesta..."
                          className={`text-xs px-3 py-2 flex-1 rounded-xl outline-none border transition-all resize-none ${
                            isAccessibilityMode 
                              ? 'border-2 border-slate-950 bg-white text-slate-950 font-bold'
                              : 'bg-white dark:bg-slate-950 border-slate-200/80 dark:border-slate-850 dark:text-white focus:border-indigo-500'
                          }`}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                              e.preventDefault();
                              const input = e.currentTarget;
                              if (input.value.trim() !== '') {
                                handleUpdateItemField(issue.itemId!, 'feedback', input.value);
                              }
                            }
                          }}
                        />
                        <button
                          type="button"
                          onClick={(e) => {
                            const input = e.currentTarget.previousElementSibling as HTMLTextAreaElement;
                            if (input && input.value.trim() !== '') {
                              handleUpdateItemField(issue.itemId!, 'feedback', input.value);
                            }
                          }}
                          className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-sm transition-all shrink-0 self-end"
                        >
                          Guardar
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
