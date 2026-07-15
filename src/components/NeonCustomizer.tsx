/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { RotateCcw, Palette } from 'lucide-react';

interface Props {
  primaryColor: string;
  onChangePrimary: (color: string) => void;
  accentColor: string;
  onChangeAccent: (color: string) => void;
  isDarkMode: boolean;
}

export const NeonCustomizer: React.FC<Props> = ({
  primaryColor,
  onChangePrimary,
  accentColor,
  onChangeAccent,
  isDarkMode,
}) => {
  const bgPresets = [
    { name: 'Espacio Clásico', hex: '#0c071e' },
    { name: 'Azul Ciber', hex: '#070b19' },
    { name: 'Púrpura Tóxico', hex: '#12071f' },
    { name: 'Obsidiana Pura', hex: '#050505' },
  ];

  const accentPresets = [
    { name: 'Oro Láser', hex: '#ffd700' },
    { name: 'Cian Eléctrico', hex: '#00f0ff' },
    { name: 'Rosa Plasma', hex: '#ff007f' },
    { name: 'Verde Ácido', hex: '#39ff14' },
  ];

  const resetDefaults = () => {
    onChangePrimary('#0c071e');
    onChangeAccent('#ffd700');
  };

  return (
    <div className={`p-6 rounded-2xl border transition-all duration-300 ${
      isDarkMode ? 'bg-slate-900/40 border-slate-800' : 'bg-slate-50 border-slate-200'
    } shadow-xs`}>
      <div className="flex flex-wrap items-center justify-between gap-4 mb-4 pb-3 border-b border-slate-150 dark:border-slate-800/80">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-violet-500/15 text-violet-500 dark:text-violet-400 rounded-xl">
            <Palette size={18} />
          </div>
          <div>
            <h4 className="font-bold text-xs uppercase tracking-wider text-slate-800 dark:text-slate-200">
              Personalización del Estilo Neón
            </h4>
            <p className="text-[10px] text-slate-400 dark:text-slate-500">
              Modifica la paleta cibernética del tema Neón Galáctico.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={resetDefaults}
          className="flex items-center gap-1 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-rose-500 hover:text-rose-600 bg-rose-500/5 hover:bg-rose-500/10 rounded-lg transition-colors border border-rose-500/10"
          title="Restaurar colores originales"
        >
          <RotateCcw size={12} />
          <span>Restaurar</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Color Primario (Fondo) */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full border border-slate-300" style={{ backgroundColor: primaryColor }} />
              Color de Fondo (Primario)
            </span>
            <input
              type="color"
              value={primaryColor}
              onChange={(e) => onChangePrimary(e.target.value)}
              className="w-8 h-8 rounded-lg cursor-pointer border border-slate-200 dark:border-slate-700 bg-transparent p-0"
            />
          </div>

          <div className="grid grid-cols-2 gap-1.5">
            {bgPresets.map((preset) => (
              <button
                key={preset.hex}
                type="button"
                onClick={() => onChangePrimary(preset.hex)}
                className={`text-[10px] px-2.5 py-1.5 rounded-lg border text-left transition-all flex items-center gap-1.5 ${
                  primaryColor.toLowerCase() === preset.hex.toLowerCase()
                    ? 'border-indigo-500 bg-indigo-50/40 dark:bg-indigo-950/20 font-bold text-indigo-600 dark:text-indigo-400'
                    : 'border-slate-100 dark:border-slate-800/80 hover:border-slate-200 hover:bg-slate-100/50 dark:hover:bg-slate-900 text-slate-500 dark:text-slate-400'
                }`}
              >
                <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: preset.hex }} />
                <span className="truncate">{preset.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Color de Acento */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full border border-slate-300 animate-pulse" style={{ backgroundColor: accentColor }} />
              Color de Acento (Destellos)
            </span>
            <input
              type="color"
              value={accentColor}
              onChange={(e) => onChangeAccent(e.target.value)}
              className="w-8 h-8 rounded-lg cursor-pointer border border-slate-200 dark:border-slate-700 bg-transparent p-0"
            />
          </div>

          <div className="grid grid-cols-2 gap-1.5">
            {accentPresets.map((preset) => (
              <button
                key={preset.hex}
                type="button"
                onClick={() => onChangeAccent(preset.hex)}
                className={`text-[10px] px-2.5 py-1.5 rounded-lg border text-left transition-all flex items-center gap-1.5 ${
                  accentColor.toLowerCase() === preset.hex.toLowerCase()
                    ? 'border-indigo-500 bg-indigo-50/40 dark:bg-indigo-950/20 font-bold text-indigo-600 dark:text-indigo-400'
                    : 'border-slate-100 dark:border-slate-800/80 hover:border-slate-200 hover:bg-slate-100/50 dark:hover:bg-slate-900 text-slate-500 dark:text-slate-400'
                }`}
              >
                <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: preset.hex }} />
                <span className="truncate">{preset.name}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
