import React, { useState } from 'react';
import { Brain, Sparkles, HelpCircle, RefreshCw, Eye, BookOpen, Layers, Award } from 'lucide-react';

interface Props {
  systemPrompt: string;
  setSystemPrompt: (prompt: string) => void;
  isDarkMode: boolean;
  isAccessibilityMode: boolean;
  playSound: (type: 'success' | 'click' | 'reset' | 'tutor') => void;
}

interface Preset {
  id: string;
  name: string;
  description: string;
  icon: string;
  prompt: string;
}

export const AI_PRESETS: Preset[] = [
  {
    id: 'general',
    name: 'Constructivista (Predeterminado)',
    description: 'Preguntas para aprendizaje significativo, razonamiento crítico y retroalimentación socrática.',
    icon: '💡',
    prompt: 'Actúa como un pedagogo constructivista. Enfócate en generar preguntas que promuevan el aprendizaje significativo y el razonamiento crítico. Evita la simple memorización de datos crudos. Las retroalimentaciones deben guiar socráticamente al alumno para comprender el error y construir el conocimiento.'
  },
  {
    id: 'stem',
    name: 'Rigor Científico / STEM',
    description: 'Tono formal, explicaciones estructuradas paso a paso y lenguaje de alta precisión analítica.',
    icon: '🔬',
    prompt: 'Actúa como un pedagogo especializado en disciplinas STEM (Ciencias, Tecnología, Ingeniería y Matemáticas). Utiliza un tono analítico, preciso y estructurado. Desglosa los conceptos paso a paso con rigor científico. En la retroalimentación, explica detalladamente los mecanismos, fórmulas o lógicas subyacentes.'
  },
  {
    id: 'gamified',
    name: 'Gamificación / Lúdico',
    description: 'Metáforas de juego, desafíos intrigantes, narrativa interactiva y feedback estimulante.',
    icon: '🎮',
    prompt: 'Actúa como un diseñador de aprendizaje basado en juegos (Gamificación). Redacta las preguntas utilizando metáforas lúdicas, contextos narrativos intrigantes y desafíos intelectuales estimulantes. Haz que la retroalimentación sea motivadora, empática y de estilo aventura o reto superado.'
  },
  {
    id: 'socratic',
    name: 'Método Socrático',
    description: 'Enfoque reflexivo e inquisitivo que guía al alumno con pistas lógicas sin darle la solución masticada.',
    icon: '🏛️',
    prompt: 'Actúa como un pedagogo socrático. Utiliza preguntas reflexivas que desafíen las suposiciones y fomenten la indagación autónoma. La retroalimentación no debe dar la respuesta masticada inmediatamente, sino plantear una contra-pregunta o una pista reflexiva para que el estudiante deduzca la verdad.'
  }
];

export const AISettingsPanel: React.FC<Props> = ({
  systemPrompt,
  setSystemPrompt,
  isDarkMode,
  isAccessibilityMode,
  playSound
}) => {
  const [showPreview, setShowPreview] = useState(false);

  // Determine current active preset
  const activePreset = AI_PRESETS.find(p => p.prompt === systemPrompt) || (systemPrompt.trim() === '' ? AI_PRESETS[0] : null);

  const handleSelectPreset = (preset: Preset) => {
    playSound('click');
    setSystemPrompt(preset.prompt);
  };

  const handleReset = () => {
    playSound('reset');
    setSystemPrompt('');
  };

  // Static preview generated based on current system prompt (helps users understand how the output would change)
  const getSimulatedOutput = () => {
    if (!systemPrompt.trim() || systemPrompt === AI_PRESETS[0].prompt) {
      return {
        pregunta: '¿Cuál es la función principal de los cloroplastos en la célula vegetal?',
        feedback: 'Los cloroplastos albergan la clorofila que captura la energía de la luz solar. En lugar de memorizar que fabrican glucosa, piensa en cómo transforman la energía inorgánica en química para alimentar a toda la planta.'
      };
    }
    if (systemPrompt === AI_PRESETS[1].prompt) {
      return {
        pregunta: '¿Cuál es el mecanismo bioquímico por el cual los tilacoides del cloroplasto participan en la fotosíntesis?',
        feedback: 'En los tilacoides se realiza la fase luminosa mediante la transferencia de electrones en la cadena transportadora de la membrana del tilacoide, generando un gradiente de protones (fuerza protón-motriz) que impulsa la síntesis de ATP por la enzima ATP sintasa.'
      };
    }
    if (systemPrompt === AI_PRESETS[2].prompt) {
      return {
        pregunta: '¡Estás al mando de una nave espacial botánica! El reactor de cloroplastos está apagado. ¿Qué elemento indispensable debes activar para reiniciar la producción de energía?',
        feedback: '¡Excelente maniobra! Has activado los paneles solares orgánicos (clorofila). Al capturar los fotones de luz, abres el flujo de energía orgánica que recargará los propulsores celulares de tu tripulación botánica.'
      };
    }
    if (systemPrompt === AI_PRESETS[3].prompt) {
      return {
        pregunta: 'Si se bloqueara la captación de luz solar en el cloroplasto, ¿qué consecuencia directa crees que tendría sobre la síntesis de compuestos orgánicos?',
        feedback: 'Reflexiona sobre esto: si la luz solar es el iniciador que divide las moléculas de agua, ¿cómo podrían formarse los transportadores de energía intermedios sin esta chispa inicial? ¿Qué bloquea realmente a los reactores de azúcar?'
      };
    }
    return {
      pregunta: '¿Cómo influye la fotosíntesis en el flujo de carbono global?',
      feedback: `Generada según tus directivas personalizadas: "${systemPrompt.substring(0, 80)}..."`
    };
  };

  const preview = getSimulatedOutput();

  return (
    <div 
      id="ai-settings-card"
      className={`rounded-2xl border p-8 shadow-sm transition-all duration-300 ${
        isDarkMode 
          ? 'bg-slate-900 border-slate-800' 
          : 'bg-white border-slate-200'
      }`}
    >
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 pb-4 border-b border-slate-100 dark:border-slate-800">
        <div>
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-2">
            <Brain size={18} className="text-purple-500 animate-pulse" />
            Configuración de IA y Enfoque Pedagógico
          </h3>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
            Define el tono de enseñanza y enfoque instruccional que utilizará la IA en todas las futuras generaciones de cuestionarios.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {systemPrompt && (
            <button
              onClick={handleReset}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${
                isAccessibilityMode
                  ? 'border-2 border-slate-950 dark:border-white text-slate-950 dark:text-white font-black hover:bg-slate-100 dark:hover:bg-slate-800'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
              title="Restaurar a enfoque pedagógico predeterminado"
            >
              <RefreshCw size={13} />
              Reestablecer
            </button>
          )}
          <button
            onClick={() => {
              playSound('click');
              setShowPreview(!showPreview);
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${
              showPreview
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            <Eye size={13} />
            {showPreview ? 'Ocultar Ejemplo' : 'Ver Ejemplo Estático'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
        {/* Presets Grid */}
        <div className="xl:col-span-7 space-y-3">
          <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
            Selecciona un Especialista Pedagógico:
          </label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {AI_PRESETS.map((preset) => {
              const isSelected = activePreset?.id === preset.id;
              return (
                <button
                  key={preset.id}
                  onClick={() => handleSelectPreset(preset)}
                  className={`p-4 rounded-xl text-left transition-all border duration-200 flex items-start gap-3 relative ${
                    isSelected
                      ? (isAccessibilityMode
                          ? 'border-2 border-indigo-600 bg-indigo-50/10 dark:bg-indigo-950/20 text-indigo-950 dark:text-white ring-2 ring-indigo-500 font-black'
                          : 'border-indigo-500 bg-indigo-500/5 text-indigo-950 dark:text-indigo-100 shadow-sm')
                      : 'border-slate-150 bg-slate-50/30 hover:bg-slate-100/50 dark:border-slate-800/80 dark:bg-slate-900/40 dark:hover:bg-slate-850/60 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  <span className="text-2xl mt-0.5 shrink-0" role="img" aria-label={preset.name}>
                    {preset.icon}
                  </span>
                  <div className="space-y-1">
                    <p className={`text-xs font-bold ${isSelected ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-700 dark:text-slate-200'}`}>
                      {preset.name}
                    </p>
                    <p className="text-[10px] leading-relaxed opacity-80">
                      {preset.description}
                    </p>
                  </div>
                  {isSelected && (
                    <span className="absolute top-2 right-2 flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          <div className="p-3 bg-indigo-50/20 dark:bg-indigo-950/10 border border-indigo-500/10 rounded-xl text-[10px] text-slate-500 dark:text-slate-400 leading-relaxed flex items-start gap-2">
            <Sparkles size={14} className="text-indigo-500 shrink-0 mt-0.5" />
            <span>
              <strong>¿Cómo influye esto?</strong> La IA adaptará automáticamente el estilo cognitivo, la formulación de los enunciados, los distractores incorrectos y el enfoque explicativo del feedback socrático/constructivo según las directivas configuradas.
            </span>
          </div>
        </div>

        {/* Custom Prompt Textarea & Preview */}
        <div className="xl:col-span-5 flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1">
                Directiva Personalizada (System Prompt):
              </label>
              <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold uppercase ${
                activePreset 
                  ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' 
                  : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 animate-pulse'
              }`}>
                {activePreset ? `Preset: ${activePreset.name.split(' ')[0]}` : 'Prompt Personalizado'}
              </span>
            </div>
            <textarea
              value={systemPrompt}
              onChange={(e) => setSystemPrompt(e.target.value)}
              placeholder="Ingresa tus directivas de personalidad o pedagogía especializadas para la IA..."
              rows={5}
              className={`w-full text-xs p-3 rounded-xl outline-none border transition-all resize-none font-sans leading-relaxed ${
                isDarkMode 
                  ? 'bg-slate-950 border-slate-800 text-slate-200 focus:border-indigo-500 placeholder:text-slate-700' 
                  : 'bg-slate-50 border-slate-200 text-slate-800 focus:border-indigo-500 placeholder:text-slate-400'
              }`}
            />
          </div>

          {/* Example Output Box (Static Preview) */}
          {showPreview && (
            <div className={`p-4 rounded-xl border animate-fadeIn transition-colors ${
              isDarkMode ? 'bg-slate-950 border-slate-850' : 'bg-slate-50 border-slate-150'
            }`}>
              <div className="flex items-center gap-1.5 mb-2 text-[10px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
                <BookOpen size={12} />
                Ejemplo del Tono Generado: Cloroplastos
              </div>
              <div className="space-y-2">
                <div>
                  <span className="text-[9px] font-black uppercase text-slate-400 dark:text-slate-500">Pregunta:</span>
                  <p className="text-xs font-medium text-slate-800 dark:text-slate-200 leading-normal">
                    {preview.pregunta}
                  </p>
                </div>
                <div>
                  <span className="text-[9px] font-black uppercase text-slate-400 dark:text-slate-500">Retroalimentación (Feedback):</span>
                  <p className="text-xs italic text-slate-600 dark:text-slate-400 leading-normal bg-indigo-500/5 p-2 rounded border border-indigo-500/5 mt-0.5">
                    "{preview.feedback}"
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
