/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import { LessonItem, Question, ContentSlide } from '../types';
import { Trash2, GripVertical, Plus, Check, FileText, HelpCircle, Search, X, Image as ImageIcon, Loader2, Sparkles, Eye, EyeOff, ArrowUp, ArrowDown, ShieldAlert, ShieldCheck, AlertTriangle, CheckCircle2, AlertCircle, Info, Upload } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { validateAllLessonItems, ValidationIssue } from '../utils/validation';
import { parseTxtQuestions } from '../utils/txtImporter';

interface Props {
  items: LessonItem[];
  setItems: React.Dispatch<React.SetStateAction<LessonItem[]>>;
  readOnly?: boolean;
  isAccessibilityMode?: boolean;
}

interface DraggableItemProps {
  item: LessonItem;
  searchTerm: string;
  onUpdate: (id: string, data: any) => void;
  onRemove: (id: string) => void;
  onGenerateImage: (id: string, title: string) => Promise<void>;
  generatingId: string | null;
  onImprove: (item: LessonItem) => Promise<void>;
  improvingId: string | null;
  readOnly?: boolean;
  isAccessibilityMode?: boolean;
  isSelected: boolean;
  onToggleSelect: (id: string) => void;
  onRewriteQuestionText: (id: string, currentText: string) => Promise<void>;
  rewritingQuestionId: string | null;
  onGenerateDistractors: (id: string, question: Question) => Promise<void>;
  generatingDistractorsId: string | null;
  onMoveUp: (id: string) => void;
  onMoveDown: (id: string) => void;
  isFirst: boolean;
  isLast: boolean;
  isHighlighted?: boolean;
}

const DraggableItem: React.FC<DraggableItemProps> = ({ 
  item, 
  searchTerm, 
  onUpdate, 
  onRemove, 
  onGenerateImage, 
  generatingId,
  onImprove,
  improvingId,
  readOnly,
  isAccessibilityMode,
  isSelected,
  onToggleSelect,
  onRewriteQuestionText,
  rewritingQuestionId,
  onGenerateDistractors,
  generatingDistractorsId,
  onMoveUp,
  onMoveDown,
  isFirst,
  isLast,
  isHighlighted
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.data.id });

  const isQuestion = item.type === 'question';
  const data = item.data;
  const [showAiMenu, setShowAiMenu] = useState(false);

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : undefined,
  };

  const dragProps = !searchTerm && !readOnly ? { ...listeners, ...attributes } : {};

  return (
    <motion.div 
      ref={setNodeRef}
      style={style}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: isDragging ? 0.6 : 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      layout
      className={`list-none outline-none ${isDragging ? 'shadow-2xl scale-[1.02] z-50' : ''}`}
    >
      <div 
        id={`lesson-item-${data.id}`}
        className={`rounded-2xl p-5 flex gap-4 group transition-all duration-500 ${
          isHighlighted
            ? (isAccessibilityMode
                ? 'bg-white dark:bg-black border-4 border-indigo-600 dark:border-indigo-400 shadow-xl scale-[1.01]'
                : 'bg-indigo-50/10 dark:bg-indigo-950/10 border-indigo-500 dark:border-indigo-400 ring-4 ring-indigo-500/20 shadow-md scale-[1.01]')
            : (isAccessibilityMode
                ? 'bg-white dark:bg-black border-2 border-slate-950 dark:border-white shadow-none'
                : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm hover:border-indigo-100 dark:hover:border-indigo-900/40')
        } ${data.isDraft ? 'border-dashed border-amber-300 dark:border-amber-900/50 bg-amber-50/5 dark:bg-amber-950/5 opacity-80' : ''}`}
      >
        {!readOnly && (
          <div className="flex flex-col items-center gap-3 mt-1.5 shrink-0">
            <div 
              {...dragProps}
              tabIndex={searchTerm ? -1 : 0}
              role="button"
              aria-label={`Arrastrar para reordenar esta lección: ${isQuestion ? 'Pregunta' : 'Contenido'}`}
              className={`p-1.5 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                isAccessibilityMode 
                  ? 'text-slate-950 dark:text-white border-2 border-slate-950 dark:border-white bg-slate-100 dark:bg-slate-950 focus-visible:ring-4 focus-visible:ring-indigo-600 focus-visible:ring-offset-2' 
                  : 'text-slate-300 dark:text-slate-700'
              } ${!searchTerm ? 'cursor-grab active:cursor-grabbing hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-500' : 'cursor-not-allowed opacity-50'}`}
              title={searchTerm ? 'Búsqueda activa: reordenado deshabilitado' : 'Arrastrar para reordenar'}
            >
              <GripVertical size={20} />
            </div>

            <button
              type="button"
              disabled={isFirst}
              onClick={() => onMoveUp(data.id)}
              title="Subir elemento"
              aria-label="Subir este elemento de orden"
              className={`p-1.5 rounded-lg transition-colors border ${
                isAccessibilityMode
                  ? 'border-2 border-slate-950 text-slate-950 bg-white dark:border-white dark:text-white dark:bg-black focus-visible:ring-4 focus-visible:ring-indigo-600'
                  : 'border-transparent text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-600 dark:hover:text-slate-300'
              } ${isFirst ? 'opacity-30 cursor-not-allowed' : ''}`}
            >
              <ArrowUp size={16} />
            </button>

            <button
              type="button"
              disabled={isLast}
              onClick={() => onMoveDown(data.id)}
              title="Bajar elemento"
              aria-label="Bajar este elemento de orden"
              className={`p-1.5 rounded-lg transition-colors border ${
                isAccessibilityMode
                  ? 'border-2 border-slate-950 text-slate-950 bg-white dark:border-white dark:text-white dark:bg-black focus-visible:ring-4 focus-visible:ring-indigo-600'
                  : 'border-transparent text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-600 dark:hover:text-slate-300'
              } ${isLast ? 'opacity-30 cursor-not-allowed' : ''}`}
            >
              <ArrowDown size={16} />
            </button>

            <input 
              type="checkbox"
              checked={isSelected}
              onChange={() => onToggleSelect(data.id)}
              aria-label={`Seleccionar esta lección para acción masiva`}
              className={`w-5 h-5 rounded cursor-pointer transition-all ${
                isAccessibilityMode 
                  ? 'text-indigo-600 border-4 border-slate-950 dark:border-white focus:ring-4 focus:ring-indigo-600'
                  : 'text-indigo-600 border border-slate-300 dark:border-slate-700 rounded bg-slate-50 dark:bg-slate-800 focus:ring-indigo-500 focus:ring-offset-2'
              }`}
            />
          </div>
        )}
        
        <div className="flex-1 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-50 dark:border-slate-800/50 pb-3">
            <div className="flex flex-wrap items-center gap-3">
              <div className={`p-2 rounded-xl ${
                isAccessibilityMode
                  ? (isQuestion ? 'bg-indigo-600 text-white border-2 border-slate-950 dark:border-white' : 'bg-emerald-600 text-white border-2 border-slate-950 dark:border-white')
                  : (isQuestion ? 'bg-indigo-50 text-indigo-500 dark:bg-indigo-900/20' : 'bg-emerald-50 text-emerald-500 dark:bg-emerald-900/20')
              }`}>
                {isQuestion ? <HelpCircle size={18} /> : <FileText size={18} />}
              </div>
              <div>
                <span className={`text-sm font-bold block leading-tight ${
                  isAccessibilityMode
                    ? 'text-slate-950 dark:text-white font-black text-base'
                    : 'text-slate-800 dark:text-slate-200'
                }`}>
                  {isQuestion ? 'Pregunta' : 'Contenido'}
                </span>
                {isQuestion && (data as Question).complexity && (
                  <span className={`text-[10px] font-black uppercase tracking-widest ${
                    isAccessibilityMode
                      ? ((data as Question).complexity === 'básico' 
                          ? 'text-emerald-800 dark:text-emerald-400 font-black'
                          : (data as Question).complexity === 'avanzado'
                            ? 'text-rose-800 dark:text-rose-400 font-black'
                            : 'text-indigo-800 dark:text-indigo-400 font-black')
                      : ((data as Question).complexity === 'básico' 
                          ? 'text-emerald-500'
                          : (data as Question).complexity === 'avanzado'
                            ? 'text-rose-500'
                            : 'text-indigo-500')
                  }`}>
                    {(data as Question).complexity}
                  </span>
                )}
              </div>

              {!readOnly && (
                <button
                  onClick={() => {
                    const title = isQuestion ? (data as Question).question : (data as ContentSlide).title;
                    onGenerateImage(data.id, title);
                  }}
                  disabled={generatingId === data.id}
                  aria-label={`Generar ilustración mediante inteligencia artificial para esta lección: ${isQuestion ? 'Pregunta' : 'Diapositiva'}`}
                  className={`flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 rounded-full transition-all ml-2 ${
                    isAccessibilityMode
                      ? 'border-2 border-slate-950 dark:border-white bg-white dark:bg-black text-slate-950 dark:text-white hover:bg-slate-950 hover:text-white dark:hover:bg-white dark:hover:text-black focus-visible:ring-4 focus-visible:ring-indigo-600 focus-visible:ring-offset-2 focus-visible:outline-none'
                      : (generatingId === data.id
                          ? 'bg-slate-100 dark:bg-slate-800 text-slate-400 cursor-wait'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-indigo-600 hover:text-white dark:hover:bg-indigo-600')
                  }`}
                >
                  {generatingId === data.id ? <Loader2 size={12} className="animate-spin" /> : <ImageIcon size={12} />}
                  {data.imageUrl ? 'Regenerar' : 'Imagen IA'}
                </button>
              )}

              {!readOnly && (
                <button
                  onClick={() => onImprove(item)}
                  disabled={improvingId === data.id}
                  aria-label={`Optimizar redacción, distractores y feedback didáctico con Inteligencia Artificial para esta lección`}
                  className={`flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 rounded-full transition-all ml-1 ${
                    isAccessibilityMode
                      ? 'border-2 border-slate-950 dark:border-white bg-white dark:bg-black text-slate-950 dark:text-white hover:bg-slate-950 hover:text-white dark:hover:bg-white dark:hover:text-black focus-visible:ring-4 focus-visible:ring-indigo-600 focus-visible:ring-offset-2 focus-visible:outline-none'
                      : (improvingId === data.id
                          ? 'bg-slate-100 dark:bg-slate-800 text-slate-400 cursor-wait'
                          : 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-600 hover:text-white dark:hover:bg-indigo-600 dark:hover:text-white border border-indigo-100 dark:border-indigo-900/40')
                  }`}
                  title="Mejorar redacción y distractores con IA"
                >
                  {improvingId === data.id ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} />}
                  Mejorar IA
                </button>
              )}

              {!readOnly && (
                <button
                  onClick={() => onUpdate(data.id, { isDraft: !data.isDraft })}
                  aria-label={data.isDraft ? "Activar elemento (quitar borrador)" : "Marcar como borrador (en proceso)"}
                  className={`flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 rounded-full transition-all ml-1 border ${
                    isAccessibilityMode
                      ? 'border-2 border-slate-950 dark:border-white bg-white dark:bg-black text-slate-950 dark:text-white hover:bg-slate-950 hover:text-white dark:hover:bg-white dark:hover:text-black focus-visible:ring-4'
                      : (data.isDraft
                          ? 'bg-amber-100 border-amber-300 text-amber-800 dark:bg-amber-950/40 dark:border-amber-900/40 dark:text-amber-400 font-extrabold'
                          : 'bg-slate-50 border-slate-200 dark:bg-slate-800/40 dark:border-slate-700 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300')
                  }`}
                  title={data.isDraft ? "En proceso (borrador) - Excluido de exportación" : "Marcar como borrador (en proceso)"}
                >
                  <span className={`w-2 h-2 rounded-full ${data.isDraft ? 'bg-amber-500 animate-pulse' : 'bg-slate-300 dark:bg-slate-600'}`} />
                  <span>{data.isDraft ? 'En proceso ✏️' : 'Borrador'}</span>
                </button>
              )}
            </div>
            
            {!readOnly && (
              <button 
                onClick={() => onRemove(data.id)}
                aria-label={`Eliminar esta lección, ID: ${data.id}`}
                className={`p-2 rounded-xl transition-all ${
                  isAccessibilityMode
                    ? 'text-rose-700 dark:text-rose-400 border-2 border-rose-700 dark:border-rose-400 bg-white dark:bg-black hover:bg-rose-700 hover:text-white dark:hover:bg-rose-400 dark:hover:text-black focus-visible:ring-4'
                    : 'text-slate-300 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20'
                }`}
              >
                <Trash2 size={18} />
              </button>
            )}
          </div>

          {data.imageUrl && (
            <div className="space-y-2 w-full">
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`relative w-full aspect-[21/9] rounded-2xl overflow-hidden border group/img ${readOnly ? 'shadow-lg' : ''} ${
                  isAccessibilityMode
                    ? 'border-2 border-slate-950 dark:border-white'
                    : 'border-slate-200 dark:border-slate-800'
                }`}
              >
                <img 
                  src={data.imageUrl} 
                  alt={data.imageAlt || "Ilustración generada por IA"}
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
                {!readOnly && (
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover/img:opacity-100 transition-opacity flex items-end justify-end p-4">
                    <button 
                      onClick={() => onUpdate(data.id, { imageUrl: undefined })}
                      aria-label="Eliminar imagen ilustrativa"
                      className="bg-white text-rose-600 p-2 rounded-xl shadow-xl hover:scale-110 transition-transform"
                      title="Eliminar imagen"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                )}
              </motion.div>
              
              {!readOnly && (
                <div className="flex gap-2 items-center">
                  <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 shrink-0 uppercase tracking-wide">Texto Alt (Accesibilidad):</span>
                  <input
                    type="text"
                    value={data.imageAlt || ''}
                    onChange={(e) => onUpdate(data.id, { imageAlt: e.target.value })}
                    placeholder="Describe esta imagen para estudiantes con discapacidad visual..."
                    className={`text-xs px-3 py-1 flex-1 rounded-lg outline-none border transition-all ${
                      isAccessibilityMode 
                        ? 'border-2 border-slate-950 dark:border-white bg-white dark:bg-black text-slate-950 dark:text-white font-semibold'
                        : 'bg-slate-50 border-slate-150 dark:bg-slate-800/40 dark:border-slate-700 dark:text-slate-200 focus:border-indigo-400'
                    }`}
                  />
                </div>
              )}
            </div>
          )}

          {item.type === 'content' ? (
            <div className="space-y-3">
              {readOnly ? (
                <div className="space-y-4">
                  <h4 className={`text-xl font-bold ${isAccessibilityMode ? 'text-slate-950 dark:text-white font-black' : 'dark:text-white'}`}>{(data as ContentSlide).title}</h4>
                  <p className={`whitespace-pre-wrap leading-relaxed ${isAccessibilityMode ? 'text-slate-900 dark:text-white font-medium' : 'text-slate-600 dark:text-slate-300'}`}>{(data as ContentSlide).content}</p>
                </div>
              ) : (
                <>
                  <input 
                    className={`w-full px-4 py-2 rounded-xl outline-none transition-all font-medium ${
                      isAccessibilityMode
                        ? 'bg-white dark:bg-black border-2 border-slate-950 dark:border-white text-slate-950 dark:text-white focus:ring-4 focus:ring-indigo-600'
                        : 'bg-slate-50 dark:bg-slate-800/50 border border-transparent focus:border-indigo-400 dark:focus:border-indigo-500 dark:text-white'
                    }`}
                    placeholder="Título de la diapositiva..."
                    aria-label="Título de la diapositiva de contenido"
                    value={(data as ContentSlide).title}
                    onChange={(e) => onUpdate(data.id, { title: e.target.value })}
                  />
                  <textarea 
                    className={`w-full px-4 py-3 rounded-xl outline-none min-h-[120px] transition-all text-sm ${
                      isAccessibilityMode
                        ? 'bg-white dark:bg-black border-2 border-slate-950 dark:border-white text-slate-950 dark:text-white focus:ring-4 focus:ring-indigo-600 font-semibold'
                        : 'bg-slate-50 dark:bg-slate-800/50 border border-transparent focus:border-indigo-400 dark:focus:border-indigo-500 dark:text-white'
                    }`}
                    placeholder="Escribe el contenido educativo aquí..."
                    aria-label="Contenido de la diapositiva de estudio"
                    value={(data as ContentSlide).content}
                    onChange={(e) => onUpdate(data.id, { content: e.target.value })}
                  />
                </>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {!readOnly && (
                <div className={`flex p-1 rounded-xl w-fit ${isAccessibilityMode ? 'bg-slate-200 dark:bg-slate-800 border border-slate-950 dark:border-white' : 'bg-slate-100 dark:bg-slate-800'}`}>
                  <button
                    onClick={() => onUpdate(data.id, { type: 'multiple-choice' })}
                    aria-label="Configurar tipo de pregunta como Opción Múltiple"
                    className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all ${
                      (data as Question).type === 'multiple-choice'
                        ? (isAccessibilityMode ? 'bg-slate-950 dark:bg-white text-white dark:text-black shadow-sm font-black' : 'bg-white dark:bg-slate-700 text-indigo-600 shadow-sm')
                        : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                    }`}
                  >
                    Opción Múltiple
                  </button>
                  <button
                    onClick={() => {
                      const q = data as Question;
                      onUpdate(data.id, { 
                        type: 'true-false', 
                        options: ['Verdadero', 'Falso'],
                        correctAnswer: q.correctAnswer > 1 ? 0 : q.correctAnswer
                      });
                    }}
                    aria-label="Configurar tipo de pregunta como Verdadero o Falso"
                    className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all ${
                      (data as Question).type === 'true-false'
                        ? (isAccessibilityMode ? 'bg-slate-950 dark:bg-white text-white dark:text-black shadow-sm font-black' : 'bg-white dark:bg-slate-700 text-indigo-600 shadow-sm')
                        : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                    }`}
                  >
                    V/F
                  </button>
                </div>
              )}

              {readOnly ? (
                <p className={`text-lg font-bold leading-tight ${isAccessibilityMode ? 'text-slate-950 dark:text-white font-black' : 'dark:text-white'}`}>{(data as Question).question}</p>
              ) : (
                <div className="space-y-2">
                  <textarea 
                    className={`w-full px-4 py-3 rounded-xl outline-none transition-all font-medium text-sm ${
                      isAccessibilityMode
                        ? 'bg-white dark:bg-black border-2 border-slate-950 dark:border-white text-slate-950 dark:text-white focus:ring-4 focus:ring-indigo-600 font-extrabold'
                        : 'bg-slate-50 dark:bg-slate-800/50 border border-transparent focus:border-indigo-400 dark:focus:border-indigo-500 dark:text-white'
                    }`}
                    placeholder="Escribe el enunciado de la pregunta..."
                    aria-label="Enunciado de la pregunta de evaluación"
                    value={(data as Question).question}
                    onChange={(e) => onUpdate(data.id, { question: e.target.value })}
                  />
                  <div className="relative flex justify-end">
                    <button
                      type="button"
                      onClick={() => setShowAiMenu(!showAiMenu)}
                      aria-expanded={showAiMenu}
                      aria-haspopup="true"
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${
                        isAccessibilityMode
                          ? 'border-2 border-slate-950 bg-white text-slate-950 dark:bg-black dark:text-white hover:bg-slate-950 hover:text-white'
                          : 'bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border-indigo-100/80 dark:bg-indigo-950/40 dark:hover:bg-indigo-900/40 dark:text-indigo-400 dark:border-indigo-900/30'
                      }`}
                    >
                      {rewritingQuestionId === data.id || generatingDistractorsId === data.id ? (
                        <Loader2 size={13} className="animate-spin text-indigo-500" />
                      ) : (
                        <Sparkles size={13} className="text-indigo-500" />
                      )}
                      <span>Mejorar con IA</span>
                    </button>

                    {showAiMenu && (
                      <>
                        <div 
                          className="fixed inset-0 z-10" 
                          onClick={() => setShowAiMenu(false)} 
                        />
                        <div className={`absolute right-0 top-full mt-1.5 w-56 rounded-xl shadow-lg border p-1 z-20 focus:outline-none ${
                          isAccessibilityMode
                            ? 'bg-white dark:bg-black border-4 border-slate-950 dark:border-white text-slate-950 dark:text-white'
                            : 'bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700'
                        }`}>
                          <button
                            type="button"
                            onClick={() => {
                              setShowAiMenu(false);
                              onRewriteQuestionText(data.id, (data as Question).question);
                            }}
                            disabled={rewritingQuestionId === data.id}
                            className={`w-full flex items-center gap-2 px-3 py-2 text-left text-xs font-semibold rounded-lg transition-colors ${
                              isAccessibilityMode
                                ? 'hover:bg-slate-950 hover:text-white dark:hover:bg-white dark:hover:text-black font-black'
                                : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700/50'
                            }`}
                          >
                            <span className="text-base">✍️</span>
                            <span>Reescribir pregunta</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setShowAiMenu(false);
                              onGenerateDistractors(data.id, data as Question);
                            }}
                            disabled={generatingDistractorsId === data.id}
                            className={`w-full flex items-center gap-2 px-3 py-2 text-left text-xs font-semibold rounded-lg transition-colors ${
                              isAccessibilityMode
                                ? 'hover:bg-slate-950 hover:text-white dark:hover:bg-white dark:hover:text-black font-black'
                                : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700/50'
                            }`}
                          >
                            <span className="text-base">🎯</span>
                            <span>Generar distractores</span>
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              )}
              <div className="space-y-2">
                <div className="flex items-center justify-between px-1">
                  <p className={`text-[10px] font-black uppercase tracking-widest ${isAccessibilityMode ? 'text-slate-950 dark:text-white font-extrabold' : 'text-slate-400'}`}>Opciones de Respuesta</p>
                  <p className={`text-[10px] font-black uppercase tracking-widest ${isAccessibilityMode ? 'text-indigo-800 dark:text-indigo-400 font-extrabold' : 'text-indigo-400'}`}>Correcta</p>
                </div>
                {(data as Question).options.map((opt, idx) => {
                  const optsFeedback = (data as Question).optionsFeedback || [];
                  const feedbackVal = optsFeedback[idx] || '';
                  return (
                    <div key={idx} className="space-y-1.5 group/opt">
                      <div className="flex gap-3 items-center">
                        <div className="flex-1 relative">
                          {readOnly ? (
                            <div className={`w-full px-4 py-2.5 rounded-xl text-sm font-medium border ${
                              (data as Question).correctAnswer === idx 
                                ? (isAccessibilityMode
                                    ? 'bg-emerald-100 border-2 border-emerald-900 text-emerald-950 dark:bg-emerald-950 dark:border-emerald-400 dark:text-emerald-200 font-bold'
                                    : 'bg-emerald-50 border-emerald-200 text-emerald-800 dark:bg-emerald-950/20 dark:border-emerald-900/30 dark:text-emerald-400')
                                : (isAccessibilityMode
                                    ? 'bg-white border-2 border-slate-950 text-slate-950 dark:bg-black dark:border-white dark:text-white font-medium'
                                    : 'bg-slate-50 border-slate-100 text-slate-600 dark:bg-slate-800/40 dark:border-slate-800 dark:text-slate-400')
                            }`}>
                              {opt}
                            </div>
                          ) : (
                            <input 
                              className={`w-full pl-4 pr-3 py-2 rounded-xl text-sm transition-all ${
                                (data as Question).type === 'true-false' ? 'opacity-70 cursor-not-allowed' : ''
                              } ${
                                isAccessibilityMode
                                  ? 'bg-white dark:bg-black border-2 border-slate-950 dark:border-white font-bold text-slate-950 dark:text-white focus:ring-4 focus:ring-indigo-600'
                                  : 'bg-slate-50 dark:bg-slate-800/50 border border-transparent focus:border-indigo-400 dark:text-slate-300'
                              }`}
                              placeholder={`Opción ${idx + 1}`}
                              value={opt}
                              aria-label={`Texto de la opción de respuesta ${idx + 1}`}
                              readOnly={(data as Question).type === 'true-false'}
                              onChange={(e) => {
                                if ((data as Question).type === 'true-false') return;
                                const newOpts = [...(data as Question).options];
                                newOpts[idx] = e.target.value;
                                onUpdate(data.id, { options: newOpts });
                              }}
                            />
                          )}
                        </div>
                        
                        {!readOnly ? (
                          <input 
                            type="radio" 
                            name={`correct-${data.id}`}
                            checked={(data as Question).correctAnswer === idx}
                            onChange={() => onUpdate(data.id, { correctAnswer: idx })}
                            aria-label={`Marcar opción ${idx + 1} como respuesta correcta`}
                            className={`w-5 h-5 cursor-pointer focus:ring-offset-2 ${
                              isAccessibilityMode 
                                ? 'text-indigo-600 border-4 border-slate-950 dark:border-white focus:ring-4 focus:ring-indigo-600'
                                : 'text-indigo-600 border-2 border-slate-300 dark:border-slate-700 focus:ring-indigo-500'
                            }`}
                          />
                        ) : (
                          (data as Question).correctAnswer === idx && (
                            <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${isAccessibilityMode ? 'bg-emerald-700 border-2 border-emerald-950 text-white' : 'bg-emerald-500'}`}>
                              <Check size={14} className="text-white font-black" />
                            </div>
                          )
                        )}

                        {!readOnly && (data as Question).type === 'multiple-choice' && (data as Question).options.length > 2 && (
                          <button 
                            onClick={() => {
                              const newOpts = (data as Question).options.filter((_, i) => i !== idx);
                              const newCorrect = (data as Question).correctAnswer === idx 
                                ? 0 
                                : ((data as Question).correctAnswer > idx ? (data as Question).correctAnswer - 1 : (data as Question).correctAnswer);
                              
                              let newOptsFeedback = undefined;
                              if ((data as Question).optionsFeedback) {
                                newOptsFeedback = (data as Question).optionsFeedback!.filter((_, i) => i !== idx);
                              }
                              onUpdate(data.id, { 
                                options: newOpts, 
                                correctAnswer: newCorrect,
                                ...(newOptsFeedback ? { optionsFeedback: newOptsFeedback } : {})
                              });
                            }}
                            aria-label={`Eliminar opción de respuesta ${idx + 1}`}
                            className={`transition-colors ${
                              isAccessibilityMode
                                ? 'opacity-100 text-rose-700 dark:text-rose-400 p-1 border-2 border-rose-700 dark:border-rose-400 rounded-lg hover:bg-rose-50'
                                : 'text-slate-300 hover:text-rose-500 opacity-0 group-hover/opt:opacity-100'
                            }`}
                          >
                            <X size={14} />
                          </button>
                        )}
                      </div>
                      
                      {feedbackVal && (
                        <div className="pl-4 pr-8">
                          {readOnly ? (
                            <p className={`text-[11px] font-bold ${isAccessibilityMode ? 'text-slate-900 dark:text-slate-200' : 'text-slate-500 italic'}`}> Feedback: {feedbackVal}</p>
                          ) : (
                            <input
                              className={`w-full px-3 py-1.5 rounded-lg text-[11px] transition-all outline-none ${
                                isAccessibilityMode
                                  ? 'bg-white dark:bg-black border-2 border-slate-950 dark:border-white text-slate-950 dark:text-white font-bold focus:ring-4 focus:ring-indigo-600'
                                  : 'bg-slate-100/30 dark:bg-slate-800/20 border border-slate-200/40 dark:border-slate-700/30 text-slate-500 dark:text-slate-400 italic focus:border-indigo-300 focus:bg-white dark:focus:bg-slate-800'
                              }`}
                              placeholder={`Comentario/Explicación si el alumno elige esta opción...`}
                              aria-label={`Comentario explicativo si se selecciona la opción ${idx + 1}`}
                              value={feedbackVal}
                              onChange={(e) => {
                                const newFeedbacks = [...optsFeedback];
                                for (let i = 0; i <= idx; i++) {
                                  if (newFeedbacks[i] === undefined) {
                                    newFeedbacks[i] = '';
                                  }
                                }
                                newFeedbacks[idx] = e.target.value;
                                onUpdate(data.id, { optionsFeedback: newFeedbacks });
                              }}
                            />
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
                {!readOnly && (data as Question).type !== 'true-false' && (
                  <button 
                    onClick={() => {
                      const newOpts = [...(data as Question).options, ''];
                      onUpdate(data.id, { options: newOpts });
                    }}
                    aria-label="Añadir una nueva opción de respuesta distractora"
                    className={`flex items-center gap-1.5 px-3 py-2 text-xs font-bold rounded-xl transition-all w-fit ${
                      isAccessibilityMode
                        ? 'text-indigo-800 dark:text-indigo-400 border-2 border-slate-950 dark:border-white bg-white dark:bg-black hover:bg-slate-950 hover:text-white dark:hover:bg-white dark:hover:text-black focus-visible:ring-4'
                        : 'text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20'
                    }`}
                  >
                    <Plus size={14} />
                    Añadir Opción
                  </button>
                )}
              </div>
              <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                  <FileText size={14} />
                </div>
                {readOnly ? (
                  <div className={`w-full pl-10 pr-4 py-3 border rounded-xl text-xs ${
                    isAccessibilityMode
                      ? 'bg-indigo-50 border-2 border-indigo-900 text-indigo-950 dark:bg-indigo-950 dark:border-indigo-400 dark:text-indigo-200 font-bold'
                      : 'bg-indigo-50/30 dark:bg-indigo-900/10 border-indigo-100/50 dark:border-indigo-900/20 text-slate-600 dark:text-slate-400 italic'
                  }`}>
                    {(data as Question).feedback}
                  </div>
                ) : (
                  <input 
                    className={`w-full pl-10 pr-4 py-2.5 rounded-xl text-xs transition-all ${
                      isAccessibilityMode
                        ? 'bg-white dark:bg-black border-2 border-slate-950 dark:border-white font-bold text-slate-950 dark:text-white focus:ring-4 focus:ring-indigo-600'
                        : 'bg-indigo-50/30 dark:bg-indigo-900/10 border border-transparent text-slate-600 dark:text-slate-400 italic focus:border-indigo-300'
                    }`}
                    placeholder="Feedback pedagógico para esta pregunta..."
                    aria-label="Retroalimentación general explicativa de la pregunta"
                    value={(data as Question).feedback}
                    onChange={(e) => onUpdate(data.id, { feedback: e.target.value })}
                  />
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export const LessonEditor: React.FC<Props> = ({ items, setItems, readOnly, isAccessibilityMode }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [generatingId, setGeneratingId] = useState<string | null>(null);
  const [improvingId, setImprovingId] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [rewritingQuestionId, setRewritingQuestionId] = useState<string | null>(null);
  const [generatingDistractorsId, setGeneratingDistractorsId] = useState<string | null>(null);

  const [highlightedItemId, setHighlightedItemId] = useState<string | null>(null);
  const [isValidationOpen, setIsValidationOpen] = useState(false);
  const [validationFilter, setValidationFilter] = useState<'all' | 'error' | 'warning'>('all');

  const bottomRef = useRef<HTMLDivElement>(null);
  const prevItemsLength = useRef(items.length);

  useEffect(() => {
    if (items.length > prevItemsLength.current) {
      setTimeout(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
      }, 100);
    }
    prevItemsLength.current = items.length;
  }, [items.length]);

  const [isImportOpen, setIsImportOpen] = useState(false);
  const [importText, setImportText] = useState('');
  const [importFileError, setImportFileError] = useState<string | null>(null);
  const [importSuccessMsg, setImportSuccessMsg] = useState<string | null>(null);
  const [parsedPreview, setParsedPreview] = useState<{
    items: LessonItem[];
    successCount: number;
    ignoredLines: { lineNum: number; content: string; reason: string }[];
  } | null>(null);

  const currentValidationIssues = isValidationOpen ? validateAllLessonItems(items) : [];

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setItems((prev) => {
        const oldIndex = prev.findIndex((item) => item.data.id === active.id);
        const newIndex = prev.findIndex((item) => item.data.id === over.id);
        if (oldIndex !== -1 && newIndex !== -1) {
          return arrayMove(prev, oldIndex, newIndex);
        }
        return prev;
      });
    }
  };

  const handleTxtFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.txt') && file.type !== 'text/plain') {
      setImportFileError('Por favor selecciona únicamente archivos de texto plano (.txt).');
      setParsedPreview(null);
      return;
    }

    try {
      const text = await file.text();
      setImportText(text);
      setImportFileError(null);
      const results = parseTxtQuestions(text);
      setParsedPreview(results);
    } catch (err: any) {
      console.error('Error al leer el archivo:', err);
      setImportFileError('No se pudo leer el archivo seleccionado. Asegúrate de que es un archivo .txt válido.');
      setParsedPreview(null);
    }
  };

  const handleTextareaChange = (text: string) => {
    setImportText(text);
    if (!text.trim()) {
      setParsedPreview(null);
      setImportFileError(null);
      return;
    }
    const results = parseTxtQuestions(text);
    setParsedPreview(results);
    setImportFileError(null);
  };

  const executeImport = () => {
    if (!parsedPreview || parsedPreview.items.length === 0) {
      alert('No hay preguntas válidas para importar.');
      return;
    }

    setItems(prev => [...prev, ...parsedPreview.items]);
    setImportSuccessMsg(`Se han importado exitosamente ${parsedPreview.successCount} preguntas al cuestionario.`);
    
    // Clear state
    setImportText('');
    setParsedPreview(null);
    
    // Close after a brief delay or keep open to show success
    setTimeout(() => {
      setImportSuccessMsg(null);
      setIsImportOpen(false);
    }, 4000);
  };

  const loadSampleFormat = () => {
    const sample = `# Líneas con '#' o '//' se ignoran
¿Cuál es la capital de Francia?|París|Londres|Madrid|París
¿El agua hierve a 100 grados Celsius?|Verdadero|Falso|Verdadero
¿Qué elemento tiene el símbolo químico O?|Oro|Oxígeno|Osmio|1
¿Cuántos bits tiene un byte?|4|8|16|32|8`;
    setImportText(sample);
    const results = parseTxtQuestions(sample);
    setParsedPreview(results);
    setImportFileError(null);
  };

  const scrollToAndHighlight = (id: string) => {
    setHighlightedItemId(id);
    const element = document.getElementById(`lesson-item-${id}`);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
    setTimeout(() => {
      setHighlightedItemId(null);
    }, 3000);
  };

  const handleToggleSelect = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) 
        ? prev.filter(item => item !== id) 
        : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    const allFilteredIds = filteredItems.map(item => item.data.id);
    const areAllSelected = allFilteredIds.every(id => selectedIds.includes(id));
    
    if (areAllSelected) {
      setSelectedIds(prev => prev.filter(id => !allFilteredIds.includes(id)));
    } else {
      setSelectedIds(prev => {
        const newSelection = [...prev];
        allFilteredIds.forEach(id => {
          if (!newSelection.includes(id)) {
            newSelection.push(id);
          }
        });
        return newSelection;
      });
    }
  };

  const handleBulkDelete = () => {
    const count = selectedIds.length;
    if (count === 0) return;
    const confirmMsg = count === 1 
      ? '¿Estás seguro de que deseas eliminar el elemento seleccionado?' 
      : `¿Estás seguro de que deseas eliminar los ${count} elementos seleccionados?`;
    if (window.confirm(confirmMsg)) {
      setItems(prev => prev.filter(item => !selectedIds.includes(item.data.id)));
      setSelectedIds([]);
    }
  };

  const handleBulkSetDraft = (isDraft: boolean) => {
    setItems(prev => prev.map(item => 
      selectedIds.includes(item.data.id) 
        ? { ...item, data: { ...item.data, isDraft } } 
        : item
    ));
    setSelectedIds([]);
  };

  const handleBulkMoveToTop = () => {
    setItems(prev => {
      const selected = prev.filter(item => selectedIds.includes(item.data.id));
      const unselected = prev.filter(item => !selectedIds.includes(item.data.id));
      return [...selected, ...unselected];
    });
    setSelectedIds([]);
  };

  const handleBulkMoveToBottom = () => {
    setItems(prev => {
      const selected = prev.filter(item => selectedIds.includes(item.data.id));
      const unselected = prev.filter(item => !selectedIds.includes(item.data.id));
      return [...unselected, ...selected];
    });
    setSelectedIds([]);
  };

  const addItem = (type: 'question' | 'content') => {
    const id = crypto.randomUUID();
    const newItem: LessonItem = 
      type === 'question' 
        ? { type: 'question', data: { id, type: 'multiple-choice', question: '', options: ['', ''], correctAnswer: 0, feedback: '' } }
        : { type: 'content', data: { id, title: '', content: '' } };
    setItems([...items, newItem]);
  };

  const removeItem = (id: string) => {
    setItems(items.filter(item => item.data.id !== id));
  };

  const updateItem = (id: string, data: any) => {
    setItems(items.map(item => item.data.id === id ? { ...item, data: { ...item.data, ...data } } : item));
  };

  const handleMoveUp = (id: string) => {
    setItems(prev => {
      const index = prev.findIndex(item => item.data.id === id);
      if (index <= 0) return prev;
      const newItems = [...prev];
      const temp = newItems[index];
      newItems[index] = newItems[index - 1];
      newItems[index - 1] = temp;
      return newItems;
    });
  };

  const handleMoveDown = (id: string) => {
    setItems(prev => {
      const index = prev.findIndex(item => item.data.id === id);
      if (index === -1 || index >= prev.length - 1) return prev;
      const newItems = [...prev];
      const temp = newItems[index];
      newItems[index] = newItems[index + 1];
      newItems[index + 1] = temp;
      return newItems;
    });
  };

  const generateIllustration = async (id: string, title: string) => {
    if (!title || title.trim().length < 3) {
      alert("Por favor escribe un título o pregunta más descriptiva antes de generar la imagen.");
      return;
    }

    setGeneratingId(id);
    try {
      const response = await fetch('/api/generate-illustration', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title })
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || "Error de red");
      }

      const data = await response.json();
      updateItem(id, { imageUrl: data.imageUrl });
    } catch (error: any) {
      console.error("Error generating image:", error);
      alert("No se pudo generar la ilustración: " + error.message);
    } finally {
      setGeneratingId(null);
    }
  };

  const improveItem = async (item: LessonItem) => {
    setImprovingId(item.data.id);
    try {
      const response = await fetch('/api/improve-item', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ item })
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || "Error de red");
      }

      const improvedData = await response.json();
      updateItem(item.data.id, improvedData);
    } catch (error: any) {
      console.error("Error improving item:", error);
      alert("No se pudo mejorar el contenido: " + error.message);
    } finally {
      setImprovingId(null);
    }
  };

  const handleRewriteQuestionText = async (id: string, currentText: string) => {
    if (!currentText || !currentText.trim()) {
      alert("Por favor escribe una pregunta antes de reescribirla con IA.");
      return;
    }
    setRewritingQuestionId(id);
    try {
      const response = await fetch('/api/rewrite-question', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ questionText: currentText })
      });
      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || "Error al reescribir");
      }
      const data = await response.json();
      if (data.rewrittenText) {
        updateItem(id, { question: data.rewrittenText });
      }
    } catch (error: any) {
      console.error("Error rewriting question text:", error);
      alert("No se pudo reescribir el enunciado: " + error.message);
    } finally {
      setRewritingQuestionId(null);
    }
  };

  const handleGenerateDistractors = async (id: string, question: Question) => {
    if (!question.question || !question.question.trim()) {
      alert("Por favor escribe el enunciado de la pregunta antes de generar distractores.");
      return;
    }
    setGeneratingDistractorsId(id);
    try {
      const response = await fetch('/api/generate-distractors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question })
      });
      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || "Error al generar distractores");
      }
      const data = await response.json();
      updateItem(id, {
        options: data.options,
        correctAnswer: data.correctAnswer,
        feedback: data.feedback || question.feedback,
        optionsFeedback: data.optionsFeedback || []
      });
    } catch (error: any) {
      console.error("Error generating distractors:", error);
      alert("No se pudieron generar los distractores: " + error.message);
    } finally {
      setGeneratingDistractorsId(null);
    }
  };

  const filteredItems = items.filter(item => {
    if (!searchTerm) return true;
    const searchLower = searchTerm.toLowerCase();
    if (item.type === 'question') {
      const q = item.data as Question;
      return q.question.toLowerCase().includes(searchLower) || 
             q.options.some(opt => opt.toLowerCase().includes(searchLower)) ||
             q.feedback.toLowerCase().includes(searchLower);
    } else {
      const c = item.data as ContentSlide;
      return c.title.toLowerCase().includes(searchLower) || 
             c.content.toLowerCase().includes(searchLower);
    }
  });

  return (
    <div className="space-y-6">
      {items.length > 0 && (
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <h3 className={`text-lg font-bold flex items-center gap-2 ${isAccessibilityMode ? 'text-slate-950 dark:text-white font-black text-xl' : 'text-slate-800 dark:text-white'}`}>
              {readOnly ? 'Ver Contenido' : 'Gestionar Contenido'}
              {searchTerm && (
                <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${isAccessibilityMode ? 'bg-slate-950 text-white dark:bg-white dark:text-black border border-slate-950' : 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400'}`}>
                  {filteredItems.length} {filteredItems.length === 1 ? 'resultado' : 'resultados'}
                </span>
              )}
            </h3>
            {!readOnly && filteredItems.length > 0 && selectedIds.length === 0 && (
              <button
                onClick={handleSelectAll}
                className={`text-xs font-semibold hover:underline transition-colors ${
                  isAccessibilityMode ? 'text-indigo-800 dark:text-indigo-400 font-bold' : 'text-indigo-600 dark:text-indigo-400'
                }`}
              >
                Seleccionar todos ({filteredItems.length})
              </button>
            )}
          </div>
          
          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto md:justify-end">
            {!readOnly && (
              <button
                type="button"
                onClick={() => {
                  setIsImportOpen(!isImportOpen);
                  setIsValidationOpen(false);
                }}
                aria-label="Abrir importador de preguntas desde archivo TXT"
                className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold transition-all border ${
                  isImportOpen
                    ? (isAccessibilityMode
                        ? 'bg-indigo-600 text-white border-2 border-slate-950 dark:border-white'
                        : 'bg-indigo-600 text-white border-indigo-600 hover:bg-indigo-700 shadow-sm')
                    : (isAccessibilityMode
                        ? 'bg-white text-slate-950 border-2 border-slate-950 dark:bg-black dark:text-white dark:border-white hover:bg-slate-100'
                        : 'bg-white text-slate-700 border-slate-200 dark:bg-slate-900 dark:border-slate-800 dark:text-slate-200 hover:bg-slate-50 hover:border-slate-300 dark:hover:border-slate-700 shadow-sm')
                }`}
              >
                <Upload size={14} className={isImportOpen ? "text-white" : "text-indigo-500"} />
                <span>Importar TXT</span>
              </button>
            )}

            {!readOnly && items.length > 0 && (
              <button
                type="button"
                onClick={() => {
                  setIsValidationOpen(!isValidationOpen);
                  setIsImportOpen(false);
                }}
                aria-label="Abrir validación global del cuestionario"
                className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold transition-all border ${
                  isValidationOpen
                    ? (isAccessibilityMode
                        ? 'bg-indigo-600 text-white border-2 border-slate-950 dark:border-white'
                        : 'bg-indigo-600 text-white border-indigo-600 hover:bg-indigo-700 shadow-sm')
                    : (isAccessibilityMode
                        ? 'bg-white text-slate-950 border-2 border-slate-950 dark:bg-black dark:text-white dark:border-white hover:bg-slate-100'
                        : 'bg-white text-slate-700 border-slate-200 dark:bg-slate-900 dark:border-slate-800 dark:text-slate-200 hover:bg-slate-50 hover:border-slate-300 dark:hover:border-slate-700 shadow-sm')
                }`}
              >
                <ShieldAlert size={14} className={isValidationOpen ? "text-white" : "text-indigo-500"} />
                <span>Validación Global</span>
              </button>
            )}

            <AnimatePresence>
              {items.length > 0 && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="relative group flex-1 min-w-[200px] md:w-64 max-w-md"
                >
                  <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                    <Search size={18} className="text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                  </div>
                  <input
                    type="text"
                    placeholder="Buscar por pregunta, respuesta o tema..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    aria-label="Buscar lecciones o preguntas en el editor"
                    className={`w-full pl-11 pr-11 py-2.5 rounded-xl shadow-sm outline-none transition-all text-sm ${
                      isAccessibilityMode
                        ? 'bg-white dark:bg-black border-2 border-slate-950 dark:border-white text-slate-950 dark:text-white font-bold focus:ring-4 focus:ring-indigo-600'
                        : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 focus:ring-2 focus:ring-indigo-500 dark:text-white'
                    }`}
                  />
                  {searchTerm && (
                    <button 
                      onClick={() => setSearchTerm('')}
                      aria-label="Limpiar búsqueda"
                      className="absolute inset-y-0 right-4 flex items-center text-slate-400 hover:text-slate-600"
                    >
                      <X size={16} />
                    </button>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      )}

      {/* Panel de Validación Global */}
      <AnimatePresence>
        {isValidationOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className={`rounded-2xl border p-5 space-y-4 shadow-md transition-all duration-300 ${
              isAccessibilityMode
                ? 'bg-white dark:bg-black border-4 border-slate-950 dark:border-white text-slate-950 dark:text-white'
                : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800'
            }`}
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className={`p-2 rounded-xl ${
                  isAccessibilityMode
                    ? 'border-2 border-slate-950 bg-indigo-50 text-indigo-950'
                    : 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400'
                }`}>
                  <ShieldAlert size={20} />
                </div>
                <div>
                  <h4 className={`font-bold text-sm ${isAccessibilityMode ? 'font-black text-base' : 'text-slate-800 dark:text-white'}`}>
                    Resultados de Validación Global
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Análisis automático de calidad y completitud del cuestionario.
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-2 self-end sm:self-auto">
                <button
                  type="button"
                  onClick={() => setIsValidationOpen(false)}
                  aria-label="Cerrar panel de validación"
                  className={`p-1.5 rounded-lg border transition-all ${
                    isAccessibilityMode
                      ? 'border-2 border-slate-950 hover:bg-slate-100'
                      : 'border-slate-100 hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
                  }`}
                >
                  <X size={16} />
                </button>
              </div>
            </div>

            {/* Overall summary stats */}
            {(() => {
              const errors = currentValidationIssues.filter(x => x.severity === 'error');
              const warnings = currentValidationIssues.filter(x => x.severity === 'warning');
              
              if (items.length === 0) {
                return (
                  <div className="text-center py-4 text-sm text-slate-500 italic">
                    No hay elementos en el cuestionario para validar. Añade una pregunta o diapositiva primero.
                  </div>
                );
              }

              if (currentValidationIssues.length === 0) {
                return (
                  <motion.div 
                    initial={{ scale: 0.98 }}
                    animate={{ scale: 1 }}
                    className={`flex items-start gap-3 p-4 rounded-xl border ${
                      isAccessibilityMode
                        ? 'border-4 border-slate-950 bg-emerald-50 text-emerald-950 font-bold'
                        : 'bg-emerald-50/50 dark:bg-emerald-950/10 border-emerald-100 dark:border-emerald-900/30 text-emerald-800 dark:text-emerald-400'
                    }`}
                  >
                    <CheckCircle2 size={18} className="shrink-0 text-emerald-600 mt-0.5" />
                    <div>
                      <p className="font-bold text-sm">¡Excelente trabajo!</p>
                      <p className="text-xs">No se encontraron errores ni advertencias. El contenido cumple con todos los estándares de calidad y está listo para publicarse.</p>
                    </div>
                  </motion.div>
                );
              }

              return (
                <div className="space-y-4">
                  {/* Stats Badges */}
                  <div className="flex flex-wrap items-center gap-3">
                    <button
                      type="button"
                      onClick={() => setValidationFilter('all')}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${
                        validationFilter === 'all'
                          ? (isAccessibilityMode
                              ? 'bg-slate-950 text-white border-2 border-slate-950 font-black'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-white border-slate-200 dark:border-slate-700')
                          : 'bg-transparent text-slate-500 border-transparent hover:bg-slate-50 dark:hover:bg-slate-800/50'
                      }`}
                    >
                      <Info size={13} />
                      <span>Todos ({currentValidationIssues.length})</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setValidationFilter('error')}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${
                        validationFilter === 'error'
                          ? (isAccessibilityMode
                              ? 'bg-rose-700 text-white border-2 border-rose-950 font-black'
                              : 'bg-rose-50 dark:bg-rose-950/20 text-rose-700 dark:text-rose-400 border-rose-200/50 dark:border-rose-900/40')
                          : 'bg-transparent text-slate-500 border-transparent hover:bg-rose-50/50 dark:hover:bg-rose-900/10'
                      } ${errors.length === 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
                      disabled={errors.length === 0}
                    >
                      <AlertCircle size={13} className="text-rose-500" />
                      <span>Errores ({errors.length})</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setValidationFilter('warning')}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${
                        validationFilter === 'warning'
                          ? (isAccessibilityMode
                              ? 'bg-amber-600 text-slate-950 border-2 border-slate-950 font-black'
                              : 'bg-amber-50 dark:bg-amber-950/20 text-amber-700 dark:text-amber-400 border-amber-200/50 dark:border-amber-900/40')
                          : 'bg-transparent text-slate-500 border-transparent hover:bg-amber-50/50 dark:hover:bg-amber-900/10'
                      } ${warnings.length === 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
                      disabled={warnings.length === 0}
                    >
                      <AlertTriangle size={13} className="text-amber-500" />
                      <span>Advertencias ({warnings.length})</span>
                    </button>
                  </div>

                  {/* Group issues by Item */}
                  <div className="max-h-64 overflow-y-auto pr-1 space-y-3 scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-slate-800">
                    {(() => {
                      // Filtered issues list
                      const filteredIssues = currentValidationIssues.filter(issue => {
                        if (validationFilter === 'error') return issue.severity === 'error';
                        if (validationFilter === 'warning') return issue.severity === 'warning';
                        return true;
                      });

                      if (filteredIssues.length === 0) {
                        return (
                          <div className="text-center py-6 text-xs text-slate-400 italic">
                            No hay problemas que coincidan con el filtro seleccionado.
                          </div>
                        );
                      }

                      // Group issues by itemId
                      const grouped: { [key: string]: { itemTitle: string; itemType: string; issues: ValidationIssue[] } } = {};
                      
                      filteredIssues.forEach(issue => {
                        if (!grouped[issue.itemId]) {
                          grouped[issue.itemId] = {
                            itemTitle: issue.itemTitle,
                            itemType: issue.itemType,
                            issues: []
                          };
                        }
                        grouped[issue.itemId].issues.push(issue);
                      });

                      return Object.entries(grouped).map(([itemId, group]) => {
                        const originalIndex = items.findIndex(x => x.data.id === itemId);
                        const label = group.itemType === 'question' ? 'Pregunta' : 'Diapositiva';
                        
                        return (
                          <div 
                            key={itemId}
                            className={`p-3 rounded-xl border text-xs flex flex-col md:flex-row md:items-start justify-between gap-3 transition-colors ${
                              isAccessibilityMode
                                ? 'border-2 border-slate-950 bg-white dark:bg-black text-slate-950 dark:text-white'
                                : 'bg-slate-50/50 dark:bg-slate-800/30 border-slate-100 dark:border-slate-800'
                            }`}
                          >
                            <div className="space-y-1.5 flex-1">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                                  group.itemType === 'question'
                                    ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400'
                                    : 'bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:text-purple-400'
                                }`}>
                                  {label} {originalIndex !== -1 ? `#${originalIndex + 1}` : ''}
                                </span>
                                <span className="font-bold text-slate-700 dark:text-slate-300 line-clamp-1">
                                  {group.itemTitle}
                                </span>
                              </div>
                              
                              <ul className="space-y-1 pl-1">
                                {group.issues.map((iss, iIndex) => (
                                  <li key={iIndex} className="flex items-start gap-2 text-slate-600 dark:text-slate-400">
                                    {iss.severity === 'error' ? (
                                      <AlertCircle size={14} className="text-rose-500 shrink-0 mt-0.5" />
                                    ) : (
                                      <AlertTriangle size={14} className="text-amber-500 shrink-0 mt-0.5" />
                                    )}
                                    <span className="leading-normal">{iss.message}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>

                            {originalIndex !== -1 && (
                              <button
                                type="button"
                                onClick={() => scrollToAndHighlight(itemId)}
                                className={`self-end md:self-start flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all border shrink-0 ${
                                  isAccessibilityMode
                                    ? 'bg-white text-slate-950 border-2 border-slate-950 hover:bg-slate-950 hover:text-white font-black'
                                    : 'bg-white hover:bg-indigo-50 text-indigo-600 border-indigo-100 hover:border-indigo-200 dark:bg-slate-800 dark:border-slate-700 dark:text-indigo-400 dark:hover:bg-indigo-950/30'
                                }`}
                              >
                                <span>Ver elemento</span>
                              </button>
                            )}
                          </div>
                        );
                      });
                    })()}
                  </div>
                </div>
              );
            })()}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Panel de Importación Masiva TXT */}
      <AnimatePresence>
        {isImportOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className={`rounded-2xl border p-5 space-y-4 shadow-md transition-all duration-300 ${
              isAccessibilityMode
                ? 'bg-white dark:bg-black border-4 border-slate-950 dark:border-white text-slate-950 dark:text-white'
                : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800'
            }`}
          >
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className={`p-2 rounded-xl ${
                  isAccessibilityMode
                    ? 'border-2 border-slate-950 bg-indigo-50 text-indigo-950'
                    : 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400'
                }`}>
                  <Upload size={20} />
                </div>
                <div>
                  <h4 className={`font-bold text-sm ${isAccessibilityMode ? 'font-black text-base' : 'text-slate-800 dark:text-white'}`}>
                    Importación Masiva desde .TXT
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Carga o escribe preguntas en formato plano para agregarlas al cuestionario instantáneamente.
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-2 self-end sm:self-auto">
                <button
                  type="button"
                  onClick={loadSampleFormat}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${
                    isAccessibilityMode
                      ? 'border-2 border-slate-950 bg-slate-100 text-slate-950 font-black'
                      : 'border-indigo-100 dark:border-indigo-900/40 bg-indigo-50/50 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/50'
                  }`}
                >
                  Cargar Ejemplo
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsImportOpen(false);
                    setParsedPreview(null);
                    setImportText('');
                    setImportFileError(null);
                  }}
                  aria-label="Cerrar panel de importación"
                  className={`p-1.5 rounded-lg border transition-all ${
                    isAccessibilityMode
                      ? 'border-2 border-slate-950 hover:bg-slate-100'
                      : 'border-slate-100 hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
                  }`}
                >
                  <X size={16} />
                </button>
              </div>
            </div>

            {/* Instruction Banner */}
            <div className={`p-4 rounded-xl text-xs space-y-2 border ${
              isAccessibilityMode
                ? 'border-2 border-slate-950 bg-slate-50 dark:bg-slate-950'
                : 'bg-slate-50 dark:bg-slate-800/30 border-slate-100 dark:border-slate-800'
            }`}>
              <p className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Info size={14} className="text-indigo-500" />
                Instrucciones de Formato:
              </p>
              <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                Cada línea representa una pregunta y debe estar separada por el caracter de barra vertical <code className="px-1.5 py-0.5 bg-slate-200 dark:bg-slate-800 font-mono text-[11px] rounded font-bold">|</code>. El formato requerido es:
              </p>
              <div className="font-mono bg-white dark:bg-slate-950 p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 text-[11px] text-indigo-600 dark:text-indigo-400 overflow-x-auto">
                Pregunta|Opción A|Opción B|[Otras Opciones...]|Respuesta Correcta
              </div>
              <p className="text-slate-500 dark:text-slate-400 text-[11px]">
                * La <strong className="text-slate-700 dark:text-slate-300">Respuesta Correcta</strong> puede ser el texto exacto de la opción correcta, un índice basado en 0 (ej: 0 para Opción A) o un índice basado en 1 (ej: 1 para Opción A).
              </p>
            </div>

            {/* Form Fields: Drag Drop File & Textarea */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* File Upload zone */}
              <div className="space-y-2 flex flex-col justify-between">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    Cargar archivo (.txt)
                  </label>
                  <div className={`border-2 border-dashed rounded-xl p-6 text-center transition-all cursor-pointer relative group ${
                    isAccessibilityMode
                      ? 'border-slate-950 dark:border-white bg-white dark:bg-black hover:bg-slate-50'
                      : 'border-slate-200 dark:border-slate-800 bg-slate-50/20 dark:bg-slate-950/20 hover:border-indigo-400 hover:bg-indigo-50/10'
                  }`}>
                    <input 
                      type="file"
                      accept=".txt"
                      onChange={handleTxtFileChange}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      title="Seleccionar un archivo .txt"
                    />
                    <Upload className="mx-auto text-slate-400 group-hover:text-indigo-500 mb-2 transition-colors" size={24} />
                    <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      Arrastra o selecciona un archivo .txt
                    </p>
                    <p className="text-[10px] text-slate-400 mt-1">
                      Solo archivos UTF-8 de texto plano (.txt)
                    </p>
                  </div>
                </div>

                {importFileError && (
                  <div className="bg-rose-50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/40 p-2.5 rounded-lg flex items-start gap-2 text-rose-700 dark:text-rose-400 text-xs">
                    <AlertCircle size={14} className="shrink-0 mt-0.5" />
                    <span>{importFileError}</span>
                  </div>
                )}

                {importSuccessMsg && (
                  <div className="bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/40 p-2.5 rounded-lg flex items-start gap-2 text-emerald-700 dark:text-emerald-400 text-xs">
                    <CheckCircle2 size={14} className="shrink-0 mt-0.5" />
                    <span>{importSuccessMsg}</span>
                  </div>
                )}
              </div>

              {/* Textarea Editor */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                  Escribe o pega tus preguntas directamente:
                </label>
                <textarea
                  value={importText}
                  onChange={(e) => handleTextareaChange(e.target.value)}
                  placeholder={`Ejemplo:\n¿De qué color es el cielo?|Azul|Rojo|Verde|Azul\n¿La Tierra es plana?|Verdadero|Falso|Falso`}
                  className={`w-full h-36 p-3 rounded-xl text-xs font-mono outline-none transition-all resize-none ${
                    isAccessibilityMode
                      ? 'bg-white dark:bg-black border-2 border-slate-950 dark:border-white text-slate-950 dark:text-white focus:ring-4 focus:ring-indigo-600'
                      : 'bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-indigo-500'
                  }`}
                />
              </div>
            </div>

            {/* Parsing Previews and validation feedback */}
            {parsedPreview && (
              <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-3">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-bold flex items-center gap-1 ${
                      parsedPreview.successCount > 0 
                        ? 'bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400' 
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                    }`}>
                      <CheckCircle2 size={13} />
                      {parsedPreview.successCount} preguntas válidas listas
                    </span>

                    {parsedPreview.ignoredLines.length > 0 && (
                      <span className="px-2 py-0.5 rounded-full text-xs font-bold flex items-center gap-1 bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400">
                        <AlertTriangle size={13} />
                        {parsedPreview.ignoredLines.length} líneas omitidas
                      </span>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={executeImport}
                    disabled={parsedPreview.successCount === 0}
                    className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                      parsedPreview.successCount === 0
                        ? 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-600 cursor-not-allowed border border-slate-200 dark:border-slate-700'
                        : (isAccessibilityMode
                            ? 'bg-indigo-600 text-white hover:bg-indigo-700 border-2 border-slate-950 dark:border-white font-black'
                            : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-md hover:shadow-indigo-500/10')
                    }`}
                  >
                    <Plus size={14} />
                    <span>Importar Ahora</span>
                  </button>
                </div>

                {/* Ignored Lines details */}
                {parsedPreview.ignoredLines.length > 0 && (
                  <div className="space-y-1 bg-amber-50/50 dark:bg-amber-950/10 border border-amber-100 dark:border-amber-900/30 p-3 rounded-lg">
                    <p className="text-[11px] font-bold text-amber-800 dark:text-amber-400">
                      Líneas omitidas por errores de formato:
                    </p>
                    <div className="max-h-24 overflow-y-auto space-y-1 text-[10px] font-mono pr-1">
                      {parsedPreview.ignoredLines.map((ignored, idx) => (
                        <div key={idx} className="flex gap-2 text-slate-600 dark:text-slate-400">
                          <span className="text-amber-600 shrink-0 font-bold">Línea {ignored.lineNum}:</span>
                          <span className="line-clamp-1 italic shrink-0 max-w-[200px]">"{ignored.content}"</span>
                          <span className="text-rose-500">- {ignored.reason}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Question list preview scroll */}
                {parsedPreview.successCount > 0 && (
                  <div className="space-y-1.5">
                    <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      Vista previa de preguntas detectadas:
                    </p>
                    <div className="max-h-40 overflow-y-auto border border-slate-100 dark:border-slate-800 rounded-xl divide-y divide-slate-100 dark:divide-slate-800 pr-1">
                      {parsedPreview.items.map((item, idx) => {
                        const q = item.data as Question;
                        return (
                          <div key={idx} className="p-2.5 text-xs bg-slate-50/30 dark:bg-slate-900/30 space-y-1">
                            <div className="flex items-start gap-1.5">
                              <span className="text-slate-400 shrink-0 font-bold">#{idx + 1}</span>
                              <p className="font-bold text-slate-700 dark:text-slate-300">{q.question}</p>
                            </div>
                            <div className="pl-5 flex flex-wrap gap-2 text-[11px]">
                              {q.options.map((opt, oIdx) => (
                                <span 
                                  key={oIdx} 
                                  className={`px-1.5 py-0.5 rounded border ${
                                    oIdx === q.correctAnswer
                                      ? 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400 border-emerald-200/50 dark:border-emerald-900/30 font-bold'
                                      : 'bg-white dark:bg-slate-800 text-slate-500 border-slate-200 dark:border-slate-700'
                                  }`}
                                >
                                  {opt} {oIdx === q.correctAnswer && '✓'}
                                </span>
                              ))}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {!readOnly && selectedIds.length > 0 && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className={`rounded-2xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 border ${
            isAccessibilityMode
              ? 'bg-white dark:bg-black border-4 border-slate-950 dark:border-white shadow-none text-slate-950 dark:text-white'
              : 'bg-indigo-50/50 dark:bg-indigo-950/20 border-indigo-100 dark:border-indigo-900/30'
          }`}
        >
          <div className="flex items-center gap-3">
            <input 
              type="checkbox"
              checked={filteredItems.length > 0 && filteredItems.every(item => selectedIds.includes(item.data.id))}
              onChange={handleSelectAll}
              aria-label="Seleccionar todos los elementos"
              className={`w-5 h-5 rounded cursor-pointer transition-all ${
                isAccessibilityMode 
                  ? 'text-indigo-600 border-4 border-slate-950 dark:border-white focus:ring-4 focus:ring-indigo-600'
                  : 'text-indigo-600 border border-slate-300 dark:border-slate-700 rounded bg-slate-50 dark:bg-slate-800 focus:ring-indigo-500 focus:ring-offset-2'
              }`}
            />
            <span className={`text-sm font-bold ${isAccessibilityMode ? 'text-slate-950 dark:text-white font-black' : 'text-slate-700 dark:text-slate-200'}`}>
              {selectedIds.length} {selectedIds.length === 1 ? 'seleccionado' : 'seleccionados'}
            </span>
            <button 
              onClick={() => setSelectedIds([])}
              className={`text-xs font-bold hover:underline ${
                isAccessibilityMode ? 'text-slate-950 dark:text-white underline font-black' : 'text-indigo-600 dark:text-indigo-400'
              }`}
            >
              Limpiar selección
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleBulkMoveToTop}
              title="Mover seleccionados al inicio de la lista"
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${
                isAccessibilityMode
                  ? 'bg-white dark:bg-black text-slate-950 dark:text-white border-2 border-slate-950 dark:border-white hover:bg-slate-950 hover:text-white dark:hover:bg-white dark:hover:text-black'
                  : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700'
              }`}
            >
              <ArrowUp size={14} />
              <span>Al inicio</span>
            </button>

            <button
              onClick={handleBulkMoveToBottom}
              title="Mover seleccionados al final de la lista"
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${
                isAccessibilityMode
                  ? 'bg-white dark:bg-black text-slate-950 dark:text-white border-2 border-slate-950 dark:border-white hover:bg-slate-950 hover:text-white dark:hover:bg-white dark:hover:text-black'
                  : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700'
              }`}
            >
              <ArrowDown size={14} />
              <span>Al final</span>
            </button>

            <span className="h-6 w-px bg-slate-200 dark:bg-slate-800 mx-1 hidden sm:block" />

            <button
              onClick={() => handleBulkSetDraft(true)}
              title="Marcar elementos seleccionados como borrador"
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${
                isAccessibilityMode
                  ? 'bg-white dark:bg-black text-amber-800 dark:text-amber-400 border-2 border-slate-950 dark:border-white hover:bg-amber-100'
                  : 'bg-amber-50 dark:bg-amber-950/20 text-amber-700 dark:text-amber-400 border-amber-200/40 dark:border-amber-900/30 hover:bg-amber-100/50 dark:hover:bg-amber-900/30'
              }`}
            >
              <EyeOff size={14} />
              <span>Borrador</span>
            </button>

            <button
              onClick={() => handleBulkSetDraft(false)}
              title="Activar elementos seleccionados (quitar de borrador)"
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${
                isAccessibilityMode
                  ? 'bg-white dark:bg-black text-emerald-800 dark:text-emerald-400 border-2 border-slate-950 dark:border-white hover:bg-emerald-100'
                  : 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400 border-emerald-200/40 dark:border-emerald-900/30 hover:bg-emerald-100/50 dark:hover:bg-emerald-900/30'
              }`}
            >
              <Eye size={14} />
              <span>Activar</span>
            </button>

            <span className="h-6 w-px bg-slate-200 dark:bg-slate-800 mx-1 hidden sm:block" />

            <button
              onClick={handleBulkDelete}
              title="Eliminar todos los elementos seleccionados"
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${
                isAccessibilityMode
                  ? 'bg-rose-700 text-white border-2 border-rose-950 hover:bg-rose-800'
                  : 'bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 border-rose-100 dark:border-rose-900/20 hover:bg-rose-100 dark:hover:bg-rose-900/40'
              }`}
            >
              <Trash2 size={14} />
              <span>Eliminar</span>
            </button>
          </div>
        </motion.div>
      )}

      <AnimatePresence>
        {filteredItems.length === 0 && items.length > 0 && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className={`text-center py-12 rounded-3xl border-2 border-dashed ${
              isAccessibilityMode
                ? 'bg-white dark:bg-black border-slate-950 dark:border-white border-2 text-slate-950 dark:text-white'
                : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800'
            }`}
          >
            <Search size={40} className="mx-auto text-slate-300 mb-4" />
            <p className={`font-bold ${isAccessibilityMode ? 'text-slate-950 dark:text-white' : 'text-slate-500'}`}>No se encontraron resultados para "{searchTerm}"</p>
            <button 
              onClick={() => setSearchTerm('')}
              className="mt-4 text-indigo-600 font-bold hover:underline"
            >
              Ver todos los elementos
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={filteredItems.map(item => item.data.id)}
          strategy={verticalListSortingStrategy}
        >
          <div className="space-y-4">
            <AnimatePresence mode="popLayout" initial={false}>
              {filteredItems.map((item) => {
                const idx = items.findIndex(x => x.data.id === item.data.id);
                const isFirst = idx === 0;
                const isLast = idx === items.length - 1;
                return (
                  <DraggableItem 
                    key={item.data.id} 
                    item={item} 
                    searchTerm={searchTerm} 
                    onUpdate={updateItem}
                    onRemove={removeItem}
                    onGenerateImage={generateIllustration}
                    generatingId={generatingId}
                    onImprove={improveItem}
                    improvingId={improvingId}
                    readOnly={readOnly}
                    isAccessibilityMode={isAccessibilityMode}
                    isSelected={selectedIds.includes(item.data.id)}
                    onToggleSelect={handleToggleSelect}
                    onRewriteQuestionText={handleRewriteQuestionText}
                    rewritingQuestionId={rewritingQuestionId}
                    onGenerateDistractors={handleGenerateDistractors}
                    generatingDistractorsId={generatingDistractorsId}
                    onMoveUp={handleMoveUp}
                    onMoveDown={handleMoveDown}
                    isFirst={isFirst}
                    isLast={isLast}
                    isHighlighted={highlightedItemId === item.data.id}
                  />
                );
              })}
            </AnimatePresence>
          </div>
        </SortableContext>
      </DndContext>

      <div ref={bottomRef} className="h-2" />

      {!readOnly && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-8">
          <button 
            onClick={() => addItem('content')}
            aria-label="Añadir una nueva diapositiva de contenido"
            className={`flex items-center justify-center gap-2 py-3 border-2 border-dashed rounded-xl transition-all font-medium ${
              isAccessibilityMode
                ? 'border-emerald-600 dark:border-emerald-400 bg-white dark:bg-black text-emerald-800 dark:text-emerald-400 hover:bg-emerald-600 hover:text-white dark:hover:bg-emerald-400 dark:hover:text-black border-2 focus-visible:ring-4 font-black'
                : 'border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-emerald-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/10'
            }`}
          >
            <Plus size={20} />
            <span>Contenido</span>
          </button>
          <button 
            onClick={() => addItem('question')}
            aria-label="Añadir una nueva pregunta de evaluación"
            className={`flex items-center justify-center gap-2 py-3 border-2 border-dashed rounded-xl transition-all font-medium ${
              isAccessibilityMode
                ? 'border-indigo-600 dark:border-indigo-400 bg-white dark:bg-black text-indigo-800 dark:text-indigo-400 hover:bg-indigo-600 hover:text-white dark:hover:bg-indigo-400 dark:hover:text-black border-2 focus-visible:ring-4 font-black'
                : 'border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-indigo-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/10'
            }`}
          >
            <Plus size={20} />
            <span>Pregunta</span>
          </button>
          <button 
            onClick={() => {
              setIsImportOpen(!isImportOpen);
              setIsValidationOpen(false);
            }}
            aria-label="Importar preguntas desde formato plano (.txt)"
            className={`flex items-center justify-center gap-2 py-3 border-2 border-dashed rounded-xl transition-all font-medium ${
              isAccessibilityMode
                ? 'border-indigo-600 dark:border-indigo-400 bg-white dark:bg-black text-indigo-800 dark:text-indigo-400 hover:bg-indigo-600 hover:text-white dark:hover:bg-indigo-400 dark:hover:text-black border-2 focus-visible:ring-4 font-black'
                : 'border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-indigo-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/10'
            }`}
          >
            <Upload size={20} />
            <span>Importar TXT</span>
          </button>
        </div>
      )}
    </div>
  );
};
