/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  Wand2, 
  Loader2, 
  Settings2, 
  BarChart, 
  Hash, 
  CheckSquare,
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  CheckCircle2,
  AlertCircle,
  Info,
  Eye,
  ArrowRight,
  Sparkles,
  ChevronDown,
  ChevronUp,
  X,
  Volume2
} from 'lucide-react';
import { LessonItem, ComplexityLevel, Question } from '../types';
import { FileUpload } from './FileUpload';
import { motion, AnimatePresence } from 'motion/react';

interface Props {
  items?: LessonItem[];
  onAddQuestions: (items: LessonItem[]) => void;
  systemPrompt?: string;
}

interface QuestionQualityIssue {
  type: 'too_short' | 'insufficient_options' | 'empty_option' | 'missing_feedback' | 'short_feedback' | 'invalid_correct_answer';
  severity: 'error' | 'warning';
  message: string;
}

interface QuestionQualityResult {
  itemId: string;
  questionText: string;
  type: 'multiple-choice' | 'true-false';
  issues: QuestionQualityIssue[];
  score: number;
}

export const AIAssistant: React.FC<Props> = ({ items = [], onAddQuestions, systemPrompt }) => {
  const [mode, setMode] = useState<'generate' | 'adapt'>('generate');
  const [extractedText, setExtractedText] = useState('');
  const [difficulty, setDifficulty] = useState<ComplexityLevel>('intermedio');
  const [mcCount, setMcCount] = useState<number>(10);
  const [trueFalseCount, setTrueFalseCount] = useState<number>(0);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(true);
  
  // Quality check states
  const [showValidationResult, setShowValidationResult] = useState(false);
  const [expandedQuestionId, setExpandedQuestionId] = useState<string | null>(null);

  const totalCount = mcCount + trueFalseCount;
  const isWithinLimit = totalCount > 0 && totalCount <= 50;
  
  // Decide validity based on mode
  const isValid = mode === 'generate'
    ? (isWithinLimit && extractedText.trim())
    : (extractedText.trim().length > 10);

  const runQualityValidation = (): QuestionQualityResult[] => {
    return items
      .filter((item): item is { type: 'question'; data: Question } => item.type === 'question')
      .map((item) => {
        const q = item.data;
        const issues: QuestionQualityIssue[] = [];
        let score = 100;
        
        // 1. Longitud de la pregunta
        const questionText = q.question || '';
        const trimmedLength = questionText.trim().length;
        if (trimmedLength === 0) {
          issues.push({
            type: 'too_short',
            severity: 'error',
            message: 'El enunciado de la pregunta está completamente vacío.'
          });
          score -= 40;
        } else if (trimmedLength < 25) {
          issues.push({
            type: 'too_short',
            severity: 'warning',
            message: `El enunciado es muy corto (${trimmedLength} caracteres; se recomiendan al menos 25 caracteres para dar contexto educativo).`
          });
          score -= 20;
        }
        
        // 2. Opciones suficientes e inválidas
        const options = q.options || [];
        if (q.type === 'multiple-choice') {
          if (options.length < 3) {
            issues.push({
              type: 'insufficient_options',
              severity: 'error',
              message: `Opciones insuficientes: tiene ${options.length} opciones (las de opción múltiple deben tener al menos 3 opciones).`
            });
            score -= 30;
          }
          
          // Buscar opciones vacías
          options.forEach((opt, idx) => {
            if (!opt || opt.trim().length === 0) {
              issues.push({
                type: 'empty_option',
                severity: 'error',
                message: `La opción de respuesta ${idx + 1} está vacía.`
              });
              score -= 15;
            }
          });
        } else if (q.type === 'true-false') {
          if (options.length < 2) {
            issues.push({
              type: 'insufficient_options',
              severity: 'error',
              message: `Opciones insuficientes para Verdadero/Falso (debe tener al menos 2 opciones).`
            });
            score -= 30;
          }
        }
        
        // 3. Respuesta correcta
        if (typeof q.correctAnswer !== 'number' || q.correctAnswer < 0 || q.correctAnswer >= options.length) {
          issues.push({
            type: 'invalid_correct_answer',
            severity: 'error',
            message: 'La respuesta correcta no es un índice válido o no está definida.'
          });
          score -= 25;
        }
        
        // 4. Feedback
        const feedbackText = q.feedback || '';
        const feedbackLength = feedbackText.trim().length;
        if (feedbackLength === 0) {
          issues.push({
            type: 'missing_feedback',
            severity: 'warning',
            message: 'Falta la retroalimentación explicativa (feedback) para el estudiante.'
          });
          score -= 15;
        } else if (feedbackLength < 10) {
          issues.push({
            type: 'short_feedback',
            severity: 'warning',
            message: `La retroalimentación explicativa es muy corta (${feedbackLength} caracteres; se sugieren más de 10 caracteres).`
          });
          score -= 5;
        }
        
        return {
          itemId: q.id,
          questionText: questionText || `[Pregunta sin texto]`,
          type: q.type,
          issues,
          score: Math.max(0, score)
        };
      });
  };

  const handleScrollToAndHighlight = (id: string) => {
    const element = document.getElementById(`lesson-item-${id}`);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      // Clear any previous highlights first
      document.querySelectorAll('[id^="lesson-item-"]').forEach(el => {
        el.classList.remove('ring-4', 'ring-amber-500', 'ring-offset-2', 'dark:ring-offset-slate-900', 'shadow-2xl', 'scale-[1.01]', 'duration-500');
      });
      // Add glowing active ring
      element.classList.add('ring-4', 'ring-amber-500', 'ring-offset-2', 'dark:ring-offset-slate-900', 'shadow-2xl', 'scale-[1.01]', 'duration-500');
      setTimeout(() => {
        element.classList.remove('ring-4', 'ring-amber-500', 'ring-offset-2', 'dark:ring-offset-slate-900', 'shadow-2xl', 'scale-[1.01]');
      }, 4000);
    } else {
      alert("No se pudo encontrar la pregunta en el editor de contenido. Asegúrate de estar en modo de edición interactiva.");
    }
  };

  const generate = async () => {
    if (!isValid) return;
    setLoading(true);
    try {
      const activeBreakdown = {
        'básico': difficulty === 'básico' ? mcCount : 0,
        'intermedio': difficulty === 'intermedio' ? mcCount : 0,
        'avanzado': difficulty === 'avanzado' ? mcCount : 0
      };

      const endpoint = mode === 'generate' ? '/api/generate-questions' : '/api/adapt-quiz';
      const body = mode === 'generate'
        ? { text: extractedText, breakdown: activeBreakdown, trueFalseCount, systemPrompt }
        : { text: extractedText, systemPrompt };

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ error: 'Respuesta no válida del servidor' }));
        throw new Error(errorData.error || `Error del servidor: ${res.status}`);
      }

      const data = await res.json();
      
      if (!Array.isArray(data)) {
        console.error('Invalid response format:', data);
        alert('La IA no devolvió un formato válido. Por favor, intenta de nuevo.');
        return;
      }
      
      const newItems: LessonItem[] = data.map((q: any) => ({
        type: 'question',
        data: {
          id: crypto.randomUUID(),
          ...q,
          complexity: difficulty // Apply chosen difficulty metadata
        }
      }));
      
      onAddQuestions(newItems);
      setIsOpen(false);
    } catch (err: any) {
      console.error('Error generating:', err);
      alert(err.message || 'Error contactando con el asistente de IA.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence mode="wait">
      {!isOpen ? (
        <motion.div 
          key="closed"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          className="flex justify-center mb-8"
        >
          <button 
            onClick={() => setIsOpen(true)}
            className="flex items-center gap-2 px-6 py-3 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 rounded-full font-bold hover:bg-indigo-200 dark:hover:bg-indigo-800 transition-all shadow-md group"
          >
            <motion.div
              animate={{ rotate: [0, 15, -15, 0] }}
              transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
            >
              <Wand2 size={20} />
            </motion.div>
            <span>Generar o adaptar preguntas con IA</span>
          </button>
        </motion.div>
      ) : (
        <motion.div 
          key="open"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="bg-white dark:bg-slate-900 border-2 border-indigo-100 dark:border-slate-800 rounded-3xl p-8 shadow-xl mb-12 transition-colors duration-300"
        >
          {/* Header & Tabs */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-8 border-b border-slate-100 dark:border-slate-800 pb-6">
            <div className="flex items-center gap-3">
              <div className="bg-indigo-600 p-2 rounded-xl shrink-0">
                <Wand2 size={24} className="text-white" />
              </div>
              <div>
                <h3 className="font-bold text-xl text-slate-800 dark:text-white">Generador Inteligente</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">Enriquece y crea tus evaluaciones interactivas con inteligencia artificial</p>
              </div>
            </div>

            {/* Mode selection buttons and validation */}
            <div className="flex flex-wrap gap-3 items-center">
              <div className="flex p-1 bg-slate-100 dark:bg-slate-800 rounded-xl max-w-fit self-start md:self-auto">
                <button
                  type="button"
                  onClick={() => {
                    setMode('generate');
                    setShowValidationResult(false);
                  }}
                  className={`px-4 py-2 rounded-lg font-bold text-xs transition-all ${
                    mode === 'generate' && !showValidationResult
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                  }`}
                >
                  ✨ Crear con Temario por IA
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMode('adapt');
                    setShowValidationResult(false);
                  }}
                  className={`px-4 py-2 rounded-lg font-bold text-xs transition-all ${
                    mode === 'adapt' && !showValidationResult
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                  }`}
                >
                  📂 Adaptar Cuestionario
                </button>
              </div>

              <button
                type="button"
                onClick={() => {
                  setShowValidationResult(!showValidationResult);
                }}
                className={`px-4 py-2 rounded-xl font-bold text-xs transition-all border flex items-center gap-2 ${
                  showValidationResult
                    ? 'bg-amber-500 hover:bg-amber-600 text-white border-amber-600 shadow-md shadow-amber-500/20'
                    : 'bg-white hover:bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 dark:hover:bg-slate-700'
                }`}
              >
                <ShieldCheck size={16} className={showValidationResult ? 'text-white' : 'text-amber-500'} />
                <span>Validar Calidad</span>
              </button>

              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-lg transition-colors"
                aria-label="Cerrar panel de asistente de IA"
              >
                <X size={20} />
              </button>
            </div>
          </div>

          <AnimatePresence mode="wait">
            {showValidationResult ? (
              <motion.div
                key="quality-validation"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-6"
              >
                {(() => {
                  const validationResults = runQualityValidation();
                  const totalQuestions = validationResults.length;
                  
                  if (totalQuestions === 0) {
                    return (
                      <div className="text-center py-12 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">
                        <ShieldAlert size={48} className="mx-auto text-slate-300 dark:text-slate-700 mb-4 animate-bounce" />
                        <h4 className="font-bold text-slate-700 dark:text-slate-300 text-base mb-1">No hay preguntas para validar</h4>
                        <p className="text-xs text-slate-400 dark:text-slate-500 max-w-md mx-auto leading-relaxed">
                          Genera primero algunas preguntas con la inteligencia artificial o impórtalas para realizar el análisis automático de calidad pedagógica y estructura.
                        </p>
                      </div>
                    );
                  }

                  const issuesCount = validationResults.reduce((sum, q) => sum + q.issues.length, 0);
                  const errors = validationResults.filter(q => q.issues.some(i => i.severity === 'error'));
                  const warnings = validationResults.filter(q => q.issues.some(i => i.severity === 'warning') && !q.issues.some(i => i.severity === 'error'));
                  const perfectQuestions = validationResults.filter(q => q.issues.length === 0);
                  const averageScore = Math.round(validationResults.reduce((sum, q) => sum + q.score, 0) / totalQuestions);

                  // Set quality level badge based on score
                  let badgeColor = 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-900/30';
                  let badgeLabel = 'Calidad Excelente (A)';
                  let progressColor = 'bg-emerald-500';
                  
                  if (averageScore < 50) {
                    badgeColor = 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/20 dark:text-rose-400 dark:border-rose-900/30';
                    badgeLabel = 'Revisión Crítica Requerida (F)';
                    progressColor = 'bg-rose-500';
                  } else if (averageScore < 75) {
                    badgeColor = 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/20 dark:text-amber-400 dark:border-amber-900/30';
                    badgeLabel = 'Calidad Regular (C)';
                    progressColor = 'bg-amber-500';
                  } else if (averageScore < 90) {
                    badgeColor = 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/20 dark:text-blue-400 dark:border-blue-900/30';
                    badgeLabel = 'Calidad Buena (B)';
                    progressColor = 'bg-blue-500';
                  }

                  return (
                    <div className="space-y-6">
                      {/* Overall quality analysis banner */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {/* Gauge Card */}
                        <div className="bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800/50 p-6 rounded-2xl flex flex-col justify-between space-y-4">
                          <div>
                            <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 dark:text-slate-500">
                              Índice de Calidad Promedio
                            </span>
                            <div className="flex items-baseline gap-1 mt-1.5">
                              <span className="text-4xl font-black text-slate-800 dark:text-white">{averageScore}</span>
                              <span className="text-lg font-bold text-slate-400">/100</span>
                            </div>
                          </div>
                          
                          <div className="space-y-2">
                            <div className="w-full bg-slate-200 dark:bg-slate-700 h-2.5 rounded-full overflow-hidden">
                              <div className={`h-full ${progressColor} transition-all duration-1000`} style={{ width: `${averageScore}%` }} />
                            </div>
                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[11px] font-bold ${badgeColor}`}>
                              <Sparkles size={12} />
                              {badgeLabel}
                            </span>
                          </div>
                        </div>

                        {/* Stat counters */}
                        <div className="col-span-2 grid grid-cols-3 gap-4 bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800/50 p-6 rounded-2xl">
                          <div className="flex flex-col justify-between border-r border-slate-200/60 dark:border-slate-700/60 pr-4">
                            <div>
                              <p className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">Preguntas Totales</p>
                              <h4 className="text-3xl font-black text-slate-700 dark:text-slate-300 mt-2">{totalQuestions}</h4>
                            </div>
                            <p className="text-[11px] text-slate-400">Items detectados</p>
                          </div>

                          <div className="flex flex-col justify-between border-r border-slate-200/60 dark:border-slate-700/60 px-4">
                            <div>
                              <p className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">Perfectas</p>
                              <h4 className="text-3xl font-black text-emerald-600 dark:text-emerald-400 mt-2">{perfectQuestions.length}</h4>
                            </div>
                            <p className="text-[11px] text-emerald-500 font-medium">Cumplen con todo</p>
                          </div>

                          <div className="flex flex-col justify-between pl-4">
                            <div>
                              <p className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">Por Mejorar</p>
                              <h4 className="text-3xl font-black text-amber-500 mt-2">{errors.length + warnings.length}</h4>
                            </div>
                            <p className="text-[11px] text-amber-500 font-medium">Tienen alertas</p>
                          </div>
                        </div>
                      </div>

                      {/* Diagnostic instruction banner */}
                      <div className="p-4 bg-amber-50/60 dark:bg-amber-950/10 border border-amber-100/50 dark:border-amber-900/20 rounded-2xl flex gap-3 text-xs leading-relaxed text-amber-800 dark:text-amber-400">
                        <Info size={16} className="text-amber-500 shrink-0 mt-0.5" />
                        <div>
                          <span className="font-bold">Analizador de Preguntas Generadas</span>
                          <p className="mt-0.5 text-slate-600 dark:text-slate-400">
                            La herramienta analiza la longitud de los enunciados y la estructura de opciones. Usa el botón <span className="font-bold text-indigo-600 dark:text-indigo-400">Ver en Editor</span> para resaltar la pregunta directamente en el área de edición interactiva del cuestionario.
                          </p>
                        </div>
                      </div>

                      {/* Detailed issues list */}
                      <div className="space-y-3">
                        <h4 className="font-bold text-sm text-slate-700 dark:text-slate-300 px-1">Auditoría por Pregunta</h4>
                        
                        <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
                          {validationResults.map((result, idx) => {
                            const isExpanded = expandedQuestionId === result.itemId;
                            const hasIssues = result.issues.length > 0;
                            const score = result.score;
                            
                            let scoreBadgeColor = 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/20 dark:text-emerald-400 border-emerald-100 dark:border-emerald-900/30';
                            if (score < 50) scoreBadgeColor = 'text-rose-600 bg-rose-50 dark:bg-rose-950/20 dark:text-rose-400 border-rose-100 dark:border-rose-900/30';
                            else if (score < 80) scoreBadgeColor = 'text-amber-600 bg-amber-50 dark:bg-amber-950/20 dark:text-amber-400 border-amber-100 dark:border-amber-900/30';

                            return (
                              <div 
                                key={result.itemId}
                                className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/60 rounded-xl overflow-hidden shadow-sm transition-all hover:border-indigo-150"
                              >
                                {/* Header of item */}
                                <div className="p-4 flex items-center justify-between gap-4 flex-wrap md:flex-nowrap">
                                  <div className="flex items-start gap-3 min-w-0">
                                    <span className="text-xs font-black text-slate-400 bg-slate-100 dark:bg-slate-800 dark:text-slate-500 w-6 h-6 rounded-full flex items-center justify-center shrink-0">
                                      {idx + 1}
                                    </span>
                                    <div className="min-w-0">
                                      <p className="font-bold text-slate-800 dark:text-slate-200 text-sm line-clamp-1">
                                        {result.questionText}
                                      </p>
                                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                                        <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wide">
                                          {result.type === 'multiple-choice' ? 'Opción Múltiple' : 'Verdadero o Falso'}
                                        </span>
                                        <span className={`text-[10px] font-extrabold px-1.5 py-0.5 rounded border ${scoreBadgeColor}`}>
                                          Calificación: {score}/100
                                        </span>
                                      </div>
                                    </div>
                                  </div>

                                  <div className="flex items-center gap-2 shrink-0 ml-auto md:ml-0">
                                    <button
                                      type="button"
                                      onClick={() => handleScrollToAndHighlight(result.itemId)}
                                      className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 dark:bg-indigo-950/30 dark:text-indigo-400 dark:hover:bg-indigo-900/40 rounded-lg text-xs font-bold transition-all border border-indigo-100/50 dark:border-indigo-900/30"
                                    >
                                      <Eye size={13} />
                                      <span>Ver en Editor</span>
                                    </button>

                                    <button
                                      type="button"
                                      onClick={() => setExpandedQuestionId(isExpanded ? null : result.itemId)}
                                      className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-850 rounded-lg transition-all"
                                      aria-label={isExpanded ? "Contraer detalles" : "Expandir detalles"}
                                    >
                                      {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                                    </button>
                                  </div>
                                </div>

                                {/* Collapsible Issues block */}
                                <AnimatePresence initial={false}>
                                  {(isExpanded || hasIssues) && (
                                    <motion.div
                                      initial={{ height: 0, opacity: 0 }}
                                      animate={{ height: "auto", opacity: 1 }}
                                      exit={{ height: 0, opacity: 0 }}
                                      transition={{ duration: 0.2 }}
                                      className="border-t border-slate-50 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-950/20 p-4"
                                    >
                                      {!hasIssues ? (
                                        <div className="flex items-start gap-2.5 text-emerald-700 dark:text-emerald-400 text-xs">
                                          <CheckCircle2 size={16} className="shrink-0 text-emerald-500 mt-0.5" />
                                          <div>
                                            <p className="font-bold">¡Pregunta excelente!</p>
                                            <p className="text-[11px] text-slate-500 dark:text-slate-400">Cumple con las directrices de extensión, alternativas mínimas y contiene feedback detallado.</p>
                                          </div>
                                        </div>
                                      ) : (
                                        <ul className="space-y-2.5">
                                          {result.issues.map((issue, iIdx) => (
                                            <li key={iIdx} className="flex items-start gap-2.5 text-xs leading-normal">
                                              {issue.severity === 'error' ? (
                                                <AlertCircle size={15} className="text-rose-500 shrink-0 mt-0.5" />
                                              ) : (
                                                <AlertTriangle size={15} className="text-amber-500 shrink-0 mt-0.5" />
                                              )}
                                              <div>
                                                <span className={`font-semibold ${issue.severity === 'error' ? 'text-rose-700 dark:text-rose-400' : 'text-amber-700 dark:text-amber-400'}`}>
                                                  {issue.severity === 'error' ? 'Error Estructural' : 'Sugerencia de Calidad'}
                                                </span>
                                                <p className="text-slate-600 dark:text-slate-400 text-[11px] mt-0.5">{issue.message}</p>
                                              </div>
                                            </li>
                                          ))}
                                        </ul>
                                      )}
                                    </motion.div>
                                  )}
                                </AnimatePresence>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </motion.div>
            ) : mode === 'generate' ? (
              <motion.div
                key="mode-generate"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="grid grid-cols-1 md:grid-cols-2 gap-8"
              >
                <div>
                  <label className="block text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3">1. Proporciona el Material de Estudio</label>
                  <FileUpload onTextExtracted={setExtractedText} />
                </div>

                <div className="space-y-6">
                  <label className="block text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">2. Configura tu Cuestionario</label>
                  
                  <div className="space-y-4">
                    <div className="bg-slate-50 dark:bg-slate-800/50 p-5 rounded-2xl border border-slate-100 dark:border-slate-800 space-y-5">
                      {/* Nivel de Dificultad */}
                      <div className="space-y-2">
                        <label className="block text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                          Nivel de Dificultad
                        </label>
                        <div className="grid grid-cols-3 gap-2">
                          {(['básico', 'intermedio', 'avanzado'] as ComplexityLevel[]).map((level) => {
                            const isSelected = difficulty === level;
                            return (
                              <button
                                key={level}
                                type="button"
                                onClick={() => setDifficulty(level)}
                                className={`py-2.5 px-3 rounded-xl text-xs font-bold transition-all border capitalize ${
                                  isSelected
                                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                                    : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-750'
                                }`}
                              >
                                {level}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      <div className="border-t border-slate-100 dark:border-slate-800/50 pt-4 space-y-4">
                        <p className="text-[10px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1">Cantidad de preguntas</p>
                        
                        {/* Opción Múltiple */}
                        <div className="flex items-center justify-between gap-4">
                          <label className="text-sm font-medium text-slate-600 dark:text-slate-300 flex items-center gap-2">
                            <BarChart size={14} className="opacity-50" />
                            Opción Múltiple
                          </label>
                          <div className="flex items-center gap-3">
                            <button 
                              type="button"
                              onClick={() => setMcCount(prev => Math.max(0, prev - 1))}
                              className="w-8 h-8 rounded-lg bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-slate-50 transition-colors"
                            >-</button>
                            <input 
                              type="number"
                              min="0"
                              max="50"
                              value={mcCount}
                              onChange={(e) => setMcCount(Math.max(0, parseInt(e.target.value) || 0))}
                              className="w-12 text-center bg-transparent border-b-2 border-slate-200 dark:border-slate-700 focus:border-indigo-500 outline-none font-bold text-indigo-600 dark:text-indigo-400"
                            />
                            <button 
                              type="button"
                              onClick={() => setMcCount(prev => Math.min(50, prev + 1))}
                              className="w-8 h-8 rounded-lg bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-slate-50 transition-colors"
                            >+</button>
                          </div>
                        </div>

                        {/* Verdadero o Falso */}
                        <div className="flex items-center justify-between gap-4">
                          <label className="text-sm font-medium text-slate-600 dark:text-slate-300 flex items-center gap-2">
                            <CheckSquare size={14} className="opacity-50" />
                            Verdadero o Falso
                          </label>
                          <div className="flex items-center gap-3">
                            <button 
                              type="button"
                              onClick={() => setTrueFalseCount(prev => Math.max(0, prev - 1))}
                              className="w-8 h-8 rounded-lg bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-slate-50 transition-colors"
                            >-</button>
                            <input 
                              type="number"
                              min="0"
                              max="50"
                              value={trueFalseCount}
                              onChange={(e) => setTrueFalseCount(Math.max(0, parseInt(e.target.value) || 0))}
                              className="w-12 text-center bg-transparent border-b-2 border-slate-200 dark:border-slate-700 focus:border-indigo-500 outline-none font-bold text-indigo-600 dark:text-indigo-400"
                            />
                            <button 
                              type="button"
                              onClick={() => setTrueFalseCount(prev => Math.min(50, prev + 1))}
                              className="w-8 h-8 rounded-lg bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-slate-50 transition-colors"
                            >+</button>
                          </div>
                        </div>
                      </div>

                      <div className="mt-6 pt-4 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between">
                        <p className="text-sm font-bold text-slate-800 dark:text-white uppercase tracking-wider">Total:</p>
                        <div className="text-right">
                          <p className={`text-xl font-black ${isValid ? 'text-indigo-600 dark:text-indigo-400' : 'text-rose-500'}`}>
                            {totalCount}
                          </p>
                          {totalCount > 50 && (
                            <p className="text-[10px] text-rose-500 font-bold">Máximo 50 preguntas</p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="pt-2">
                    <button 
                      onClick={generate}
                      disabled={loading || !isValid}
                      className="w-full flex items-center justify-center gap-3 py-4 bg-indigo-600 text-white rounded-2xl font-bold text-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-indigo-700 transition-all shadow-lg active:scale-[0.98]"
                    >
                      {loading ? <Loader2 size={24} className="animate-spin" /> : <Settings2 size={24} />}
                      <span>{loading ? 'Generando con Gemini...' : 'Crear Preguntas'}</span>
                    </button>
                    <p className="text-center text-[10px] text-slate-400 dark:text-slate-600 mt-4 px-4 leading-relaxed">
                      La IA leerá tu material de estudio y producirá automáticamente preguntas novedosas balanceadas por dificultad pedagógica.
                    </p>
                  </div>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="mode-adapt"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="grid grid-cols-1 md:grid-cols-2 gap-8"
              >
                <div>
                  <label className="block text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">1. Proporciona tu Cuestionario</label>
                  <p className="text-xs text-slate-400 dark:text-slate-500 mb-3">Sube un archivo redactado (.pdf, .docx, .txt) o pégalo directamente en la caja de abajo.</p>
                  
                  <FileUpload onTextExtracted={(text) => setExtractedText(prev => prev ? (prev + "\n" + text) : text)} />
                  
                  <div className="mt-4">
                    <label className="block text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2">Texto del Cuestionario Copiado / Extraído:</label>
                    <textarea
                      value={extractedText}
                      onChange={(e) => setExtractedText(e.target.value)}
                      placeholder={`Ejemplo de formato libre:
1. ¿Cuál es el principal gas de efecto invernadero?
a) Oxígeno
b) Dióxido de carbono
c) Helio
d) Nitrógeno
Rta correcta: b

2. La fotosíntesis ocurre solo de noche.
a) Verdadero
b) Falso
Respuesta: b`}
                      className="w-full h-56 p-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl font-sans text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none text-slate-700 dark:text-slate-300 resize-none font-mono text-[13px] leading-relaxed"
                    />
                  </div>
                </div>

                <div className="flex flex-col justify-between space-y-6">
                  <div className="space-y-6">
                    <label className="block text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">2. Flujo de Adaptación Inteligente</label>
                    
                    {/* Nivel de Dificultad para adaptadas */}
                    <div className="space-y-2">
                      <label className="block text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                        Nivel de Dificultad de las preguntas
                      </label>
                      <div className="grid grid-cols-3 gap-2">
                        {(['básico', 'intermedio', 'avanzado'] as ComplexityLevel[]).map((level) => {
                          const isSelected = difficulty === level;
                          return (
                            <button
                              key={level}
                              type="button"
                              onClick={() => setDifficulty(level)}
                              className={`py-2.5 px-3 rounded-xl text-xs font-bold transition-all border capitalize ${
                                isSelected
                                  ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                                  : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-750'
                              }`}
                            >
                              {level}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div className="bg-slate-50 dark:bg-slate-800/50 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 space-y-4">
                      <h4 className="font-bold text-sm text-indigo-700 dark:text-indigo-400">¿Qué hará el asistente inteligente con tu cuestionario?</h4>
                      
                      <ul className="space-y-3 text-xs text-slate-600 dark:text-slate-300 list-inside list-disc leading-relaxed">
                        <li><strong>Detección de Respuestas</strong>: Lee las preguntas con sus distractores y sitúa el índice correcto de respuesta (aunque el texto no lo aclare, lo deducirá científicamente).</li>
                        <li><strong>Retroalimentación Pedagógica</strong>: Creará explicaciones ("feedback") didácticas completas y coherentes para cada opción.</li>
                        <li><strong>Doble Formateo</strong>: Segmentará automáticamente las preguntas entre cuestionarios estándar de opción múltiple o respuestas dicotómicas (verdadero/falso).</li>
                        <li><strong>Evaluación de Complejidad</strong>: Clasificará cada ítem por su dificultad conceptual ('básico', 'intermedio', 'avanzado').</li>
                      </ul>
                      
                      <p className="text-[11px] text-slate-400 dark:text-slate-500 italic mt-2">
                        Esto te permite aprovechar todo el flujo de SCORM, edición interactiva y exportación inmersiva, partiendo directamente de un contenido que ya tienes aprobado.
                      </p>
                    </div>
                  </div>

                  <div className="pt-2">
                    <button 
                      onClick={generate}
                      disabled={loading || !isValid}
                      className="w-full flex items-center justify-center gap-3 py-4 bg-indigo-600 text-white rounded-2xl font-bold text-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-indigo-700 transition-all shadow-lg active:scale-[0.98]"
                    >
                      {loading ? <Loader2 size={24} className="animate-spin" /> : <Settings2 size={24} />}
                      <span>{loading ? 'Adaptando con Gemini...' : 'Adaptar e Importar Preguntas'}</span>
                    </button>
                    {!isValid && (
                      <p className="text-center text-[10px] text-rose-500 font-bold mt-2">
                        Por favor escribe o sube al menos algunas preguntas para comenzar la adaptación.
                      </p>
                    )}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
