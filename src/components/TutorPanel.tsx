/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Award, Loader2, Sparkles, Check, AlertTriangle, ArrowRight, ThumbsUp, HelpCircle, CornerDownRight } from 'lucide-react';
import { LessonItem, Question } from '../types';
import { motion, AnimatePresence } from 'motion/react';

interface Props {
  items: LessonItem[];
  setItems: React.Dispatch<React.SetStateAction<LessonItem[]>>;
  isAccessibilityMode?: boolean;
  isDarkMode?: boolean;
  playSound?: (type: 'success' | 'click' | 'reset' | 'tutor') => void;
  triggerNotification?: (title: string, body: string) => void;
  systemPrompt?: string;
}

interface ReviewItem {
  id: string;
  hasSuggestions: boolean;
  critique: string;
  suggestedQuestion: string;
  suggestedOptions: string[];
  suggestedFeedback: string;
  suggestedOptionsFeedback: string[];
}

interface ReviewResult {
  overallEvaluation: string;
  reviews: ReviewItem[];
}

export const TutorPanel: React.FC<Props> = ({ items, setItems, isAccessibilityMode, isDarkMode, playSound, triggerNotification, systemPrompt }) => {
  const [loading, setLoading] = useState(false);
  const [reviewResult, setReviewResult] = useState<ReviewResult | null>(null);
  const [appliedIds, setAppliedIds] = useState<Record<string, boolean>>({});

  // Get active questions (ignoring content slides or draft questions)
  const activeQuestions = items.filter(
    (item) => item.type === 'question' && !item.data.isDraft
  ) as { type: 'question'; data: Question }[];

  const runTutorReview = async () => {
    if (activeQuestions.length === 0) return;
    setLoading(true);
    try {
      // Map questions to a cleaner payload for the API
      const questionsPayload = activeQuestions.map((q) => ({
        id: q.data.id,
        type: q.data.type,
        question: q.data.question,
        options: q.data.options,
        correctAnswer: q.data.correctAnswer,
        feedback: q.data.feedback,
        optionsFeedback: q.data.optionsFeedback,
        complexity: q.data.complexity
      }));

      const res = await fetch('/api/tutor-review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ questions: questionsPayload, systemPrompt })
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ error: 'Error al contactar con el tutor' }));
        throw new Error(errorData.error || 'Error del servidor');
      }

      const data = await res.json();
      setReviewResult(data);
      // Reset applied status for new review
      setAppliedIds({});
      playSound?.('tutor');
      if (triggerNotification) {
        triggerNotification(
          '¡Auditoría IA Completada! 🎓✨',
          'El Tutor de Calidad ha analizado tus preguntas y tiene sugerencias de redacción y feedback preparadas.'
        );
      }
    } catch (err: any) {
      console.error('Error running tutor review:', err);
      alert(err.message || 'Error al conectar con el Tutor IA.');
    } finally {
      setLoading(false);
    }
  };

  const applySuggestions = (qId: string, review: ReviewItem) => {
    setItems((prevItems) =>
      prevItems.map((item) => {
        if (item.type === 'question' && item.data.id === qId) {
          return {
            ...item,
            data: {
              ...item.data,
              question: review.suggestedQuestion,
              options: review.suggestedOptions,
              feedback: review.suggestedFeedback,
              optionsFeedback: review.suggestedOptionsFeedback
            }
          };
        }
        return item;
      })
    );

    setAppliedIds((prev) => ({ ...prev, [qId]: true }));
    playSound?.('success');
  };

  return (
    <div className="space-y-8">
      {/* Introduction Card */}
      <div className={`rounded-3xl border-2 p-8 shadow-md relative overflow-hidden transition-all ${
        isAccessibilityMode
          ? 'bg-white border-slate-950 dark:bg-black dark:border-white text-slate-950 dark:text-white'
          : 'bg-gradient-to-br from-amber-50 to-orange-50/40 border-amber-200 dark:from-slate-900 dark:to-slate-900/30 dark:border-slate-800'
      }`}>
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="p-2 bg-amber-500 text-white rounded-xl">
                <Sparkles size={20} className="animate-pulse" />
              </span>
              <h3 className="text-xl font-bold tracking-tight text-amber-800 dark:text-amber-400">Modo Tutor IA 🎓</h3>
            </div>
            <p className="text-sm text-amber-900/80 dark:text-slate-300 leading-relaxed max-w-xl">
              La inteligencia artificial analizará la redacción, claridad científica y calidad pedagógica de tus preguntas. 
              Recibe sugerencias para pulir las opciones de respuesta y explicaciones constructivas para tu paquete SCORM.
            </p>
          </div>

          <button
            onClick={runTutorReview}
            disabled={loading || activeQuestions.length === 0}
            className={`w-full md:w-auto shrink-0 px-6 py-4 rounded-2xl font-bold flex items-center justify-center gap-2.5 transition-all shadow-md active:scale-95 disabled:opacity-50 ${
              isAccessibilityMode
                ? 'border-2 border-slate-950 dark:border-white bg-white dark:bg-black text-slate-950 dark:text-white'
                : 'bg-amber-500 hover:bg-amber-600 text-white shadow-amber-500/10'
            }`}
          >
            {loading ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                <span>Analizando pedagogía...</span>
              </>
            ) : (
              <>
                <Sparkles size={18} />
                <span>Iniciar Revisión del Cuestionario</span>
              </>
            )}
          </button>
        </div>

        {activeQuestions.length === 0 && (
          <p className="mt-4 text-xs font-bold text-rose-600 dark:text-rose-400">
            ⚠️ Necesitas tener al menos una pregunta activa (que no sea borrador) para iniciar la revisión.
          </p>
        )}
      </div>

      {/* Main Review Result Container */}
      <AnimatePresence mode="wait">
        {loading && (
          <motion.div
            key="loading-review"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex flex-col items-center justify-center py-16 text-center"
          >
            <Loader2 size={48} className="animate-spin text-amber-500 mb-4" />
            <h4 className="font-bold text-lg">El Tutor Pedagógico está evaluando tus preguntas...</h4>
            <p className="text-sm text-slate-400 mt-1 max-w-sm">Revisando rigurosidad semántica, dobles negativos y distractores eficaces.</p>
          </motion.div>
        )}

        {!loading && reviewResult && (
          <motion.div
            key="review-results"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-8"
          >
            {/* General Evaluation */}
            <div className={`rounded-2xl border p-6 shadow-sm ${
              isAccessibilityMode
                ? 'bg-white border-slate-950 dark:bg-black dark:border-white'
                : 'bg-white border-slate-200 dark:bg-slate-900 dark:border-slate-800'
            }`}>
              <h4 className="text-sm font-black uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-3 flex items-center gap-1.5">
                <Award size={16} className="text-amber-500" />
                Evaluación Pedagógica Global
              </h4>
              <p className="text-sm leading-relaxed text-slate-700 dark:text-slate-300">
                {reviewResult.overallEvaluation}
              </p>
            </div>

            {/* Individual Reviews */}
            <div className="space-y-6">
              <h3 className="font-bold text-lg text-slate-800 dark:text-slate-200 flex items-center gap-2">
                <span>Sugerencias por Pregunta</span>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                  {reviewResult.reviews.length} preguntas analizadas
                </span>
              </h3>

              {reviewResult.reviews.map((review) => {
                const originalItem = items.find(
                  (it) => it.type === 'question' && it.data.id === review.id
                ) as { type: 'question'; data: Question } | undefined;

                if (!originalItem) return null;

                const isApplied = appliedIds[review.id];

                return (
                  <div
                    key={review.id}
                    className={`rounded-2xl border p-6 transition-all relative overflow-hidden ${
                      isApplied
                        ? 'border-emerald-500 bg-emerald-50/10 dark:border-emerald-900/30'
                        : isAccessibilityMode
                          ? 'bg-white border-slate-950 dark:bg-black dark:border-white'
                          : 'bg-white border-slate-200 dark:bg-slate-900 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                    }`}
                  >
                    {/* Critique / Feedback */}
                    <div className="mb-6">
                      <div className="flex items-start justify-between gap-4 mb-3">
                        <div className="flex items-center gap-2">
                          <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                            isApplied ? 'bg-emerald-500 text-white' : 'bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-400'
                          }`}>
                            ID
                          </span>
                          <span className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                            Diagnóstico Pedagógico
                          </span>
                        </div>
                        {isApplied ? (
                          <span className="flex items-center gap-1 text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/20 px-2.5 py-1 rounded-full border border-emerald-200 dark:border-emerald-900/30">
                            <Check size={12} />
                            Aplicado
                          </span>
                        ) : (
                          <button
                            onClick={() => applySuggestions(review.id, review)}
                            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all active:scale-95 ${
                              isAccessibilityMode
                                ? 'border-2 border-slate-950 dark:border-white bg-white dark:bg-black text-slate-950 dark:text-white'
                                : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm'
                            }`}
                          >
                            <Sparkles size={12} />
                            Aplicar Sugerencia
                          </button>
                        )}
                      </div>
                      
                      <div className={`p-4 rounded-xl border flex gap-3 ${
                        isApplied
                          ? 'bg-emerald-50/30 border-emerald-100 text-emerald-900 dark:bg-emerald-950/10 dark:border-emerald-900/20 dark:text-emerald-300'
                          : 'bg-amber-50/50 border-amber-100 text-slate-700 dark:bg-slate-950/10 dark:border-slate-800/60 dark:text-slate-300'
                      }`}>
                        <AlertTriangle size={16} className={`shrink-0 mt-0.5 ${isApplied ? 'text-emerald-500' : 'text-amber-500'}`} />
                        <p className="text-xs leading-relaxed">{review.critique}</p>
                      </div>
                    </div>

                    {/* Comparison Layout */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-slate-100 dark:border-slate-800/80">
                      {/* Original Question Card */}
                      <div className="space-y-4">
                        <div className="flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-slate-400">
                          <HelpCircle size={12} />
                          Versión Original
                        </div>
                        <div className="space-y-3 opacity-65">
                          <div>
                            <p className="text-xs font-bold text-slate-400">Pregunta:</p>
                            <p className="text-sm font-semibold">{originalItem.data.question}</p>
                          </div>
                          <div>
                            <p className="text-xs font-bold text-slate-400">Opciones:</p>
                            <ul className="list-disc pl-4 text-xs space-y-1">
                              {originalItem.data.options.map((opt, i) => (
                                <li key={i} className={i === originalItem.data.correctAnswer ? "font-bold text-indigo-600 dark:text-indigo-400" : ""}>
                                  {opt} {i === originalItem.data.correctAnswer && "✓"}
                                </li>
                              ))}
                            </ul>
                          </div>
                          <div>
                            <p className="text-xs font-bold text-slate-400">Retroalimentación:</p>
                            <p className="text-xs italic leading-relaxed">{originalItem.data.feedback}</p>
                          </div>
                        </div>
                      </div>

                      {/* Suggested Question Card */}
                      <div className="space-y-4">
                        <div className="flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-amber-500">
                          <Sparkles size={12} />
                          Sugerencia Pedagógica
                        </div>
                        <div className={`space-y-3 p-4 rounded-xl border ${
                          isApplied 
                            ? 'bg-slate-50/50 border-slate-200 dark:bg-slate-900/50 dark:border-slate-800'
                            : 'bg-amber-50/20 border-amber-100/60 dark:bg-slate-800/20 dark:border-slate-800/60'
                        }`}>
                          <div>
                            <p className="text-xs font-bold text-amber-600 dark:text-amber-400">Pregunta Sugerida:</p>
                            <p className="text-sm font-bold text-slate-800 dark:text-slate-100">{review.suggestedQuestion}</p>
                          </div>
                          <div>
                            <p className="text-xs font-bold text-amber-600 dark:text-amber-400">Opciones Sugeridas:</p>
                            <ul className="list-disc pl-4 text-xs space-y-1 text-slate-700 dark:text-slate-300">
                              {review.suggestedOptions.map((opt, i) => (
                                <li key={i} className={i === originalItem.data.correctAnswer ? "font-bold text-indigo-600 dark:text-indigo-400" : ""}>
                                  {opt} {i === originalItem.data.correctAnswer && "✓"}
                                </li>
                              ))}
                            </ul>
                          </div>
                          <div>
                            <p className="text-xs font-bold text-amber-600 dark:text-amber-400">Retroalimentación Sugerida:</p>
                            <p className="text-xs italic leading-relaxed text-slate-600 dark:text-slate-300">{review.suggestedFeedback}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
