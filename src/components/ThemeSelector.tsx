/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { ThemeType } from '../types';
import { 
  Zap, 
  Building2, 
  Layout, 
  Accessibility, 
  Sunset, 
  Trees, 
  Sparkles,
  Volume2
} from 'lucide-react';
import { motion } from 'motion/react';

interface Props {
  selected: ThemeType;
  onSelect: (theme: ThemeType) => void;
}

export const ThemeSelector: React.FC<Props> = ({ selected, onSelect }) => {
  const themes: {
    id: ThemeType;
    label: string;
    icon: any;
    color: string;
    description: string;
    soundDesc: string;
    previewStyle: {
      bg: string;
      cardBg: string;
      accentBg: string;
      textColor: string;
      borderColor?: string;
    };
  }[] = [
    { 
      id: 'neon', 
      label: 'Neón Galáctico', 
      icon: Zap, 
      color: 'bg-violet-600',
      description: 'Estilo espacial oscuro retro con destellos dorados.',
      soundDesc: 'Chiptunes sintéticos de 16-bits 👾',
      previewStyle: {
        bg: 'bg-[#0c071e]',
        cardBg: 'bg-[#1d183a]',
        accentBg: 'bg-[#ffd700]',
        textColor: 'text-white'
      }
    },
    { 
      id: 'corporate', 
      label: 'Corporativo', 
      icon: Building2, 
      color: 'bg-blue-600',
      description: 'Profesional y formal, con azules de alto rango.',
      soundDesc: 'Campanas elegantes y sutiles 🔔',
      previewStyle: {
        bg: 'bg-slate-100',
        cardBg: 'bg-white',
        accentBg: 'bg-blue-600',
        textColor: 'text-slate-800',
        borderColor: 'border-slate-200'
      }
    },
    { 
      id: 'minimal', 
      label: 'Minimalista', 
      icon: Layout, 
      color: 'bg-slate-300',
      description: 'Diseño limpio y claro para un enfoque sin distracciones.',
      soundDesc: 'Pops táctiles ultra-cortos 🧼',
      previewStyle: {
        bg: 'bg-white',
        cardBg: 'bg-slate-50',
        accentBg: 'bg-slate-900',
        textColor: 'text-slate-750',
        borderColor: 'border-slate-150'
      }
    },
    { 
      id: 'high-contrast', 
      label: 'Alto Contraste', 
      icon: Accessibility, 
      color: 'bg-yellow-400',
      description: 'Máxima accesibilidad visual con negro y amarillo.',
      soundDesc: 'Bleeps retro estilo arcade clásico 🕹️',
      previewStyle: {
        bg: 'bg-black',
        cardBg: 'bg-black',
        accentBg: 'bg-yellow-400',
        textColor: 'text-white',
        borderColor: 'border-white'
      }
    },
    { 
      id: 'sunset', 
      label: 'Atardecer Cálido', 
      icon: Sunset, 
      color: 'bg-orange-500',
      description: 'Tonos melocotón, coral y ámbar suaves y reconfortantes.',
      soundDesc: 'Arpegios dorados y acústicos 🌅',
      previewStyle: {
        bg: 'bg-gradient-to-br from-pink-100 to-orange-100',
        cardBg: 'bg-white',
        accentBg: 'bg-orange-600',
        textColor: 'text-orange-950',
        borderColor: 'border-orange-100'
      }
    },
    { 
      id: 'forest', 
      label: 'Bosque Profundo', 
      icon: Trees, 
      color: 'bg-emerald-600',
      description: 'Paleta verde y tierra que transmite calma natural.',
      soundDesc: 'Percusión de madera tipo marimba 🍃',
      previewStyle: {
        bg: 'bg-gradient-to-br from-green-100 to-emerald-100',
        cardBg: 'bg-white',
        accentBg: 'bg-emerald-700',
        textColor: 'text-emerald-950',
        borderColor: 'border-green-100'
      }
    },
    { 
      id: 'cosmic', 
      label: 'Nebulosa Cósmica', 
      icon: Sparkles, 
      color: 'bg-purple-600',
      description: 'Fondo estelar místico y violetas cósmicos vibrantes.',
      soundDesc: 'Swell espacial resplandeciente 🌌',
      previewStyle: {
        bg: 'bg-[#020617]',
        cardBg: 'bg-[#1e1b4b]',
        accentBg: 'bg-[#c084fc]',
        textColor: 'text-slate-100',
        borderColor: 'border-indigo-950'
      }
    }
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-8">
      {themes.map((t) => {
        const isSel = selected === t.id;
        const s = t.previewStyle;
        
        return (
          <motion.button
            key={t.id}
            type="button"
            whileHover={{ scale: 1.015, y: -2 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => onSelect(t.id)}
            className={`flex flex-col text-left p-5 rounded-2xl border-2 transition-all cursor-pointer ${
              isSel
                ? 'border-indigo-500 bg-indigo-50/40 dark:bg-indigo-950/20 shadow-md'
                : 'border-slate-150 dark:border-slate-800/80 hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-slate-900/50'
            }`}
          >
            {/* Cabecera de la Tarjeta */}
            <div className="flex items-start gap-3 w-full mb-3">
              <div className={`p-2.5 rounded-xl shrink-0 ${t.color} ${t.id === 'minimal' ? 'text-slate-800' : 'text-white'}`}>
                <t.icon size={20} />
              </div>
              <div className="min-w-0">
                <span className={`block font-bold text-sm truncate ${isSel ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-800 dark:text-slate-200'}`}>
                  {t.label}
                </span>
                <span className="block text-[10px] text-slate-400 dark:text-slate-500 line-clamp-1 mt-0.5">
                  {t.description}
                </span>
              </div>
            </div>

            {/* PREVISUALIZACIÓN ESTÁTICA PREVIA */}
            <div className="w-full h-24 rounded-xl mb-3 relative overflow-hidden flex items-center justify-center p-2 bg-slate-100 dark:bg-slate-950 border border-slate-200/55 dark:border-slate-800">
              {/* Fondo del dispositivo de simulación */}
              <div className={`absolute inset-0 ${s.bg} w-full h-full transition-colors duration-300`} />
              
              {/* Tarjeta de trivia simulada */}
              <div className={`relative z-10 w-full h-full max-w-[150px] ${s.cardBg} ${s.borderColor || ''} border rounded-lg p-1.5 flex flex-col justify-between shadow-xs transition-colors duration-300`}>
                {/* Cabecera / Barra de progreso */}
                <div className="space-y-1">
                  <div className="flex justify-between items-center text-[5px] opacity-40 font-bold scale-90">
                    <span className={s.textColor}>Trivia</span>
                    <span className={s.textColor}>4/10</span>
                  </div>
                  <div className="w-full h-1 bg-black/5 dark:bg-white/10 rounded-full overflow-hidden">
                    <div className={`h-full ${s.accentBg} w-[40%] rounded-full`} />
                  </div>
                </div>

                {/* Pregunta ficticia */}
                <div className="space-y-0.5">
                  <div className={`h-1 w-[85%] ${s.textColor} bg-current opacity-80 rounded-xs`} />
                  <div className={`h-1 w-[60%] ${s.textColor} bg-current opacity-80 rounded-xs`} />
                </div>

                {/* Respuestas */}
                <div className="space-y-1">
                  <div className="h-2 w-full rounded bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/5 flex items-center px-1">
                    <div className="w-1 h-1 rounded-full bg-slate-400/40" />
                    <div className={`h-0.5 w-[40%] ${s.textColor} bg-current opacity-30 ml-1 rounded-xs`} />
                  </div>
                  <div className={`h-2 w-full rounded ${s.accentBg} bg-opacity-15 border border-current flex items-center px-1`}>
                    <div className={`w-1 h-1 rounded-full ${s.accentBg}`} />
                    <div className={`h-0.5 w-[55%] ${s.textColor} bg-current opacity-60 ml-1 rounded-xs`} />
                  </div>
                </div>
              </div>
            </div>

            {/* Badge de Sonido */}
            <div className={`w-full mt-auto flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[9px] font-bold ${
              isSel 
                ? 'bg-indigo-100/40 text-indigo-700 dark:bg-indigo-950/30 dark:text-indigo-300' 
                : 'bg-slate-50 text-slate-500 dark:bg-slate-800/40 dark:text-slate-400'
            }`}>
              <Volume2 size={11} className="shrink-0" />
              <span className="truncate">{t.soundDesc}</span>
            </div>
          </motion.button>
        );
      })}
    </div>
  );
};
