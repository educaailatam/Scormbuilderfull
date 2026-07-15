/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { LessonItem, Question } from '../types';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend
} from 'recharts';
import { LayoutDashboard, BrainCircuit } from 'lucide-react';
import { motion } from 'motion/react';

interface Props {
  items: LessonItem[];
}

export const StatsPanel: React.FC<Props> = ({ items }) => {
  const questions = items.filter(item => item.type === 'question' && !item.data.isDraft).map(item => item.data as Question);
  
  if (questions.length === 0) return null;

  // Question Types Data
  const typeData = [
    { name: 'Opción Múltiple', value: questions.filter(q => q.type === 'multiple-choice').length },
    { name: 'V / F', value: questions.filter(q => q.type === 'true-false').length },
  ].filter(d => d.value > 0);

  const TYPE_COLORS = ['#6366f1', '#a855f7'];

  // Complexity Mapping
  const complexityValues = { 'básico': 1, 'intermedio': 2, 'avanzado': 3 };
  const complexityCounts = { 'básico': 0, 'intermedio': 0, 'avanzado': 0 };
  
  let totalScore = 0;
  let scoreCount = 0;

  questions.forEach(q => {
    if (q.complexity) {
      complexityCounts[q.complexity]++;
      totalScore += complexityValues[q.complexity];
      scoreCount++;
    }
  });

  const avgComplexity = scoreCount > 0 ? (totalScore / scoreCount).toFixed(1) : '0.0';
  
  const complexityData = [
    { name: 'Básico', value: complexityCounts['básico'] },
    { name: 'Intermedio', value: complexityCounts['intermedio'] },
    { name: 'Avanzado', value: complexityCounts['avanzado'] },
  ];

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
      className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-8 shadow-sm mb-12 transition-colors"
    >
      <div className="flex items-center gap-3 mb-8">
        <div className="bg-indigo-600 p-2 rounded-xl">
          <LayoutDashboard size={20} className="text-white" />
        </div>
        <h3 className="font-bold text-xl text-slate-800 dark:text-white">Panel de Análisis</h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
        {/* Gráfica de Tipos de Pregunta */}
        <div>
          <p className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-4">Distribución por Tipo</p>
          <div className="h-[200px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={typeData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                  stroke="transparent"
                >
                  {typeData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={TYPE_COLORS[index % TYPE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ 
                    borderRadius: '12px', 
                    border: 'none', 
                    boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
                    backgroundColor: '#1e293b',
                    color: '#f8fafc'
                  }}
                  itemStyle={{ color: '#f8fafc' }}
                />
                <Legend verticalAlign="bottom" height={36}/>
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Gráfica de Complejidad */}
        <div className="flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Nivel de Complejidad</p>
            <div className="flex items-center gap-2 bg-indigo-50 dark:bg-indigo-900/20 px-3 py-1 rounded-full">
              <BrainCircuit size={14} className="text-indigo-600 dark:text-indigo-400" />
              <span className="text-xs font-bold text-indigo-700 dark:text-indigo-300">Promedio: {avgComplexity}</span>
            </div>
          </div>
          
          <div className="h-[180px] w-full mt-auto">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={complexityData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1e293b" />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#64748b', fontSize: 12 }}
                />
                <YAxis hide />
                <Tooltip 
                  cursor={{ fill: '#1e293b', opacity: 0.2 }}
                  contentStyle={{ 
                    borderRadius: '12px', 
                    border: 'none', 
                    boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
                    backgroundColor: '#1e293b',
                    color: '#f8fafc'
                  }}
                  itemStyle={{ color: '#f8fafc' }}
                />
                <Bar dataKey="value" fill="#6366f1" radius={[4, 4, 0, 0]} barSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <p className="text-[10px] text-slate-400 dark:text-slate-600 text-center mt-2 italic">
            El promedio se calcula asignando valores del 1 (Básico) al 3 (Avanzado).
          </p>
        </div>
      </div>
    </motion.div>
  );
};
