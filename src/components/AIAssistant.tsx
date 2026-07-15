/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Wand2, Loader2, Settings2, BarChart, Hash, CheckSquare } from 'lucide-react';
import { LessonItem, ComplexityLevel } from '../types';
import { FileUpload } from './FileUpload';
import { motion, AnimatePresence } from 'motion/react';

interface Props {
  onAddQuestions: (items: LessonItem[]) => void;
  systemPrompt?: string;
}

export const AIAssistant: React.FC<Props> = ({ onAddQuestions, systemPrompt }) => {
  const [mode, setMode] = useState<'generate' | 'adapt'>('generate');
  const [extractedText, setExtractedText] = useState('');
  const [difficulty, setDifficulty] = useState<ComplexityLevel>('intermedio');
  const [mcCount, setMcCount] = useState<number>(10);
  const [trueFalseCount, setTrueFalseCount] = useState<number>(0);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(true);

  const totalCount = mcCount + trueFalseCount;
  const isWithinLimit = totalCount > 0 && totalCount <= 50;
  
  // Decide validity based on mode
  const isValid = mode === 'generate'
    ? (isWithinLimit && extractedText.trim())
    : (extractedText.trim().length > 10);

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
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8 border-b border-slate-100 dark:border-slate-800 pb-6">
            <div className="flex items-center gap-3">
              <div className="bg-indigo-600 p-2 rounded-xl shrink-0">
                <Wand2 size={24} className="text-white" />
              </div>
              <div>
                <h3 className="font-bold text-xl text-slate-800 dark:text-white">Generador Inteligente</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">Enriquece y crea tus evaluaciones interactivas con inteligencia artificial</p>
              </div>
            </div>

            {/* Mode selection buttons */}
            <div className="flex p-1 bg-slate-100 dark:bg-slate-800 rounded-xl max-w-fit self-start md:self-auto">
              <button
                type="button"
                onClick={() => {
                  setMode('generate');
                  setExtractedText('');
                }}
                className={`px-4 py-2 rounded-lg font-bold text-xs transition-all ${
                  mode === 'generate'
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
                  setExtractedText('');
                }}
                className={`px-4 py-2 rounded-lg font-bold text-xs transition-all ${
                  mode === 'adapt'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                📂 Adaptar Cuestionario Existente
              </button>
            </div>
          </div>

          <AnimatePresence mode="wait">
            {mode === 'generate' ? (
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
