/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { QuizBundle } from './types';

export const generateManifest = (title: string, passingScore?: number) => `<?xml version="1.0" encoding="UTF-8"?>
<manifest identifier="QUIZ_MANIFEST_${Date.now()}"
          version="1"
          xmlns="http://www.imsproject.org/xsd/imscp_rootv1p1p2"
          xmlns:adlcp="http://www.adlnet.org/xsd/adlcp_rootv1p2"
          xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
          xsi:schemaLocation="http://www.imsproject.org/xsd/imscp_rootv1p1p2
            imscp_rootv1p1p2.xsd
            http://www.adlnet.org/xsd/adlcp_rootv1p2
            adlcp_rootv1p2.xsd">
  <metadata>
    <schema>ADL SCORM</schema>
    <schemaversion>1.2</schemaversion>
  </metadata>
  <organizations default="ORG_001">
    <organization identifier="ORG_001">
      <title>${title}</title>
      <item identifier="ITEM_001" identifierref="RES_001">
        <title>${title}</title>
        ${passingScore !== undefined ? `<adlcp:masteryscore>${passingScore}</adlcp:masteryscore>` : ''}
      </item>
    </organization>
  </organizations>
  <resources>
    <resource identifier="RES_001"
              type="webcontent"
              adlcp:scormType="sco"
              href="index.html">
      <file href="index.html"/>
    </resource>
  </resources>
</manifest>`;

export const generateQuizHtml = (bundle: QuizBundle) => {
  const { title, theme, items, feedbackTiming = 'immediate', neonPrimaryColor = '#0c071e', neonAccentColor = '#ffd700' } = bundle;
  
  const adjustColorBrightness = (hex: string, percent: number) => {
    try {
      if (!hex || !hex.startsWith('#') || hex.length < 7) return hex;
      let R = parseInt(hex.substring(1, 3), 16);
      let G = parseInt(hex.substring(3, 5), 16);
      let B = parseInt(hex.substring(5, 7), 16);

      R = Math.max(0, Math.min(255, R + percent));
      G = Math.max(0, Math.min(255, G + percent));
      B = Math.max(0, Math.min(255, B + percent));

      const rHex = R.toString(16).padStart(2, '0');
      const gHex = G.toString(16).padStart(2, '0');
      const bHex = B.toString(16).padStart(2, '0');

      return `#${rHex}${gHex}${bHex}`;
    } catch {
      return hex;
    }
  };

  const finalNeonPrimary = neonPrimaryColor || '#0c071e';
  const finalNeonAccent = neonAccentColor || '#ffd700';

  // Theme styles
  const themes = {
    neon: {
      bg: `radial-gradient(circle, ${adjustColorBrightness(finalNeonPrimary, 12)} 0%, ${finalNeonPrimary} 100%)`,
      card: adjustColorBrightness(finalNeonPrimary, 20),
      accent: finalNeonAccent,
      text: '#ffffff',
      glow: `0 0 10px ${finalNeonAccent}`,
      border: 'none'
    },
    corporate: {
      bg: '#f8fafc',
      card: '#ffffff',
      accent: '#2563eb',
      text: '#1e293b',
      glow: 'none',
      border: '1px solid #e2e8f0'
    },
    minimal: {
      bg: '#ffffff',
      card: '#f9fafb',
      accent: '#111827',
      text: '#374151',
      glow: 'none',
      border: '1px solid #e5e7eb'
    },
    'high-contrast': {
      bg: '#000000',
      card: '#000000',
      accent: '#ffff00',
      text: '#ffffff',
      glow: 'none',
      border: '2px solid #ffffff'
    },
    sunset: {
      bg: 'linear-gradient(135deg, #fdf2f8 0%, #fef3c7 50%, #ffe4e6 100%)',
      card: 'rgba(255, 255, 255, 0.95)',
      accent: '#ea580c',
      text: '#3c0d02',
      glow: '0 15px 30px rgba(234, 88, 12, 0.12)',
      border: '1px solid #ffe4e6'
    },
    forest: {
      bg: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 50%, #bbf7d0 100%)',
      card: 'rgba(255, 255, 255, 0.95)',
      accent: '#15803d',
      text: '#052e16',
      glow: '0 15px 30px rgba(21, 128, 61, 0.1)',
      border: '1px solid #dcfce7'
    },
    cosmic: {
      bg: 'radial-gradient(circle at center, #0f172a 0%, #020617 100%)',
      card: '#1e1b4b',
      accent: '#c084fc',
      text: '#f8fafc',
      glow: '0 0 15px rgba(192, 132, 252, 0.35)',
      border: '1px solid rgba(192, 132, 252, 0.2)'
    }
  };

  const selectedTheme = themes[theme] || themes.minimal;
  const accentBtnText = theme === 'neon' || theme === 'high-contrast' ? '#000' : '#fff';

  return `<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title}</title>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&family=Bungee&display=swap" rel="stylesheet">
    <script src="https://cdn.tailwindcss.com"></script>
    <script src="https://cdn.jsdelivr.net/npm/apexcharts"></script>
    <style>
        body {
            background: ${selectedTheme.bg};
            color: ${selectedTheme.text};
            font-family: 'Inter', sans-serif;
            min-height: 100vh;
            margin: 0;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        .bungee { font-family: 'Bungee', cursive; }
        .card {
            background: ${selectedTheme.card};
            border-radius: 1rem;
            padding: 2rem;
            max-width: 600px;
            width: 90%;
            box-shadow: ${selectedTheme.glow};
            border: ${selectedTheme.border};
        }
        .btn-option {
            width: 100%;
            text-align: left;
            padding: 1rem;
            margin-bottom: 0.75rem;
            border-radius: 0.5rem;
            background: rgba(255,255,255,0.05);
            border: 1px solid rgba(255,255,255,0.1);
            transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
            color: inherit;
            cursor: pointer;
        }
        .btn-option:hover:not(:disabled) {
            background: rgba(255,255,255,0.12);
            border-color: ${selectedTheme.accent};
            transform: translateY(-2px) scale(1.015);
            box-shadow: 0 4px 15px rgba(0, 0, 0, 0.15);
        }
        .btn-option:active:not(:disabled) {
            transform: translateY(0) scale(0.985);
        }
        .correct { background: #22c55e !important; color: white !important; }
        .incorrect { background: #ef4444 !important; color: white !important; }
        .progress-bar {
            height: 8px;
            background: rgba(255,255,255,0.1);
            border-radius: 4px;
            overflow: hidden;
            margin-bottom: 2rem;
        }
        .progress-fill {
            height: 100%;
            background: ${selectedTheme.accent};
            transition: width 0.3s;
        }
        .custom-scrollbar::-webkit-scrollbar {
            width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
            background: rgba(255, 255, 255, 0.02);
            border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
            background: rgba(255, 255, 255, 0.15);
            border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
            background: rgba(255, 255, 255, 0.3);
        }
    </style>
</head>
<body>
    <div id="quiz-container" class="card relative">
        <div class="flex items-center justify-between gap-4 mb-2 flex-wrap">
            <span class="text-xs opacity-50 uppercase tracking-widest font-semibold">${title}</span>
            ${bundle.kioskMode ? `<span class="px-2 py-0.5 text-[9px] font-black tracking-widest uppercase bg-amber-500/15 border border-amber-500/30 text-amber-500 rounded-md">🔒 Kiosco</span>` : ''}
        </div>
        <div id="timer-container" class="absolute top-4 right-4 hidden items-center gap-2 px-3 py-1 bg-white/5 rounded-full border border-white/10">
            <span class="text-[10px] font-bold uppercase tracking-widest opacity-50">Tiempo</span>
            <span id="timer-display" class="font-mono font-bold text-sm">--:--</span>
        </div>
        <div class="progress-bar"><div id="progress-fill" class="progress-fill" style="width: 0%"></div></div>
        
        <div id="nav-bullets" class="flex flex-wrap gap-1.5 mb-6"></div>
        
        <div id="time-progress-container" class="hidden flex-col gap-1.5 mb-6">
            <div class="flex justify-between items-center text-[10px] font-bold uppercase tracking-wider opacity-60">
                <span>Tiempo Restante</span>
                <span id="time-percentage-display" class="font-medium">100%</span>
            </div>
            <div class="h-1.5 bg-white/10 rounded-full overflow-hidden">
                <div id="time-progress-fill" class="h-full ease-linear transition-all duration-1000" style="width: 100%; background: ${selectedTheme.accent}"></div>
            </div>
        </div>
        
        <div id="warning-container" class="hidden"></div>
        <div id="content"></div>
    </div>

    <script>
        // === Audio Fanfares via Web Audio API ===
        const currentTheme = '${theme}';
        let audioCtxInstance = null;
        function getAudioContext() {
            if (!audioCtxInstance) {
                audioCtxInstance = new (window.AudioContext || window.webkitAudioContext)();
            }
            return audioCtxInstance;
        }

        function playCorrectSound() {
            try {
                const ctx = getAudioContext();
                if (ctx.state === 'suspended') {
                    ctx.resume();
                }
                const now = ctx.currentTime;

                if (currentTheme === 'corporate') {
                    // Soft polite double chime (sine waves)
                    const notes = [523.25, 659.25]; // C5, E5
                    notes.forEach((freq, i) => {
                        const osc = ctx.createOscillator();
                        const gain = ctx.createGain();
                        osc.type = 'sine';
                        osc.frequency.setValueAtTime(freq, now + i * 0.1);
                        gain.gain.setValueAtTime(0.1, now + i * 0.1);
                        gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.1 + 0.3);
                        osc.connect(gain);
                        gain.connect(ctx.destination);
                        osc.start(now + i * 0.1);
                        osc.stop(now + i * 0.1 + 0.3);
                    });
                } else if (currentTheme === 'minimal') {
                    // Tiny minimal soft pop
                    const osc = ctx.createOscillator();
                    const gain = ctx.createGain();
                    osc.type = 'sine';
                    osc.frequency.setValueAtTime(800, now);
                    osc.frequency.exponentialRampToValueAtTime(1200, now + 0.05);
                    gain.gain.setValueAtTime(0.08, now);
                    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
                    osc.connect(gain);
                    gain.connect(ctx.destination);
                    osc.start(now);
                    osc.stop(now + 0.05);
                } else if (currentTheme === 'sunset') {
                    // Warm harmonic golden arpeggio (warm triangle waves)
                    const notes = [440, 554.37, 659.25, 880]; // A4, C#5, E5, A5
                    notes.forEach((freq, i) => {
                        const osc = ctx.createOscillator();
                        const gain = ctx.createGain();
                        osc.type = 'triangle';
                        osc.frequency.setValueAtTime(freq, now + i * 0.06);
                        gain.gain.setValueAtTime(0.12, now + i * 0.06);
                        gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.06 + 0.4);
                        osc.connect(gain);
                        gain.connect(ctx.destination);
                        osc.start(now + i * 0.06);
                        osc.stop(now + i * 0.06 + 0.4);
                    });
                } else if (currentTheme === 'forest') {
                    // Forest plucky wooden marimba chime
                    const notes = [329.63, 392.00, 523.25, 659.25]; // E4, G4, C5, E5
                    notes.forEach((freq, i) => {
                        const osc = ctx.createOscillator();
                        const gain = ctx.createGain();
                        osc.type = 'sine';
                        osc.frequency.setValueAtTime(freq, now + i * 0.08);
                        gain.gain.setValueAtTime(0.18, now + i * 0.08);
                        gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.08 + 0.2);
                        osc.connect(gain);
                        gain.connect(ctx.destination);
                        osc.start(now + i * 0.08);
                        osc.stop(now + i * 0.08 + 0.2);
                    });
                } else if (currentTheme === 'cosmic') {
                    // Cosmic space-sweering shimmering chime
                    const notes = [587.33, 880.00, 1174.66]; // D5, A5, D6
                    notes.forEach((freq, i) => {
                        const osc = ctx.createOscillator();
                        const gain = ctx.createGain();
                        osc.type = 'sine';
                        osc.frequency.setValueAtTime(freq, now + i * 0.05);
                        osc.frequency.exponentialRampToValueAtTime(freq * 1.5, now + i * 0.05 + 0.4);
                        gain.gain.setValueAtTime(0.08, now + i * 0.05);
                        gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.05 + 0.5);
                        osc.connect(gain);
                        gain.connect(ctx.destination);
                        osc.start(now + i * 0.05);
                        osc.stop(now + i * 0.05 + 0.5);
                    });
                } else if (currentTheme === 'high-contrast') {
                    // retro bleep retro chiptune (square wave)
                    const notes = [300, 600, 900];
                    notes.forEach((freq, i) => {
                        const osc = ctx.createOscillator();
                        const gain = ctx.createGain();
                        osc.type = 'square';
                        osc.frequency.setValueAtTime(freq, now + i * 0.06);
                        gain.gain.setValueAtTime(0.05, now + i * 0.06);
                        gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.06 + 0.2);
                        osc.connect(gain);
                        gain.connect(ctx.destination);
                        osc.start(now + i * 0.06);
                        osc.stop(now + i * 0.06 + 0.2);
                    });
                } else {
                    // Default / neon: Joyful major chord arpeggio
                    const notes = [
                        { note: 523.25, time: 0 },     // C5
                        { note: 659.25, time: 0.08 },   // E5
                        { note: 783.99, time: 0.16 },   // G5
                        { note: 1046.50, time: 0.24 }   // C6
                    ];
                    notes.forEach((item) => {
                        const osc = ctx.createOscillator();
                        const gain = ctx.createGain();
                        osc.type = 'triangle';
                        osc.frequency.setValueAtTime(item.note, now + item.time);
                        gain.gain.setValueAtTime(0.15, now + item.time);
                        gain.gain.exponentialRampToValueAtTime(0.001, now + item.time + 0.35);
                        osc.connect(gain);
                        gain.connect(ctx.destination);
                        osc.start(now + item.time);
                        osc.stop(now + item.time + 0.35);
                    });
                }
            } catch (e) {
                console.error("Audio error:", e);
            }
        }

        function playIncorrectSound() {
            try {
                const ctx = getAudioContext();
                if (ctx.state === 'suspended') {
                    ctx.resume();
                }
                const now = ctx.currentTime;

                if (currentTheme === 'corporate') {
                    // Formal simple double buzz
                    const osc = ctx.createOscillator();
                    const gain = ctx.createGain();
                    osc.type = 'sine';
                    osc.frequency.setValueAtTime(250, now);
                    osc.frequency.setValueAtTime(200, now + 0.1);
                    gain.gain.setValueAtTime(0.1, now);
                    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
                    osc.connect(gain);
                    gain.connect(ctx.destination);
                    osc.start(now);
                    osc.stop(now + 0.3);
                } else if (currentTheme === 'minimal') {
                    // Minimalist single short dull tick
                    const osc = ctx.createOscillator();
                    const gain = ctx.createGain();
                    osc.type = 'sine';
                    osc.frequency.setValueAtTime(150, now);
                    gain.gain.setValueAtTime(0.08, now);
                    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
                    osc.connect(gain);
                    gain.connect(ctx.destination);
                    osc.start(now);
                    osc.stop(now + 0.08);
                } else if (currentTheme === 'sunset') {
                    // Soft warm sigh / low gentle wave
                    const osc = ctx.createOscillator();
                    const gain = ctx.createGain();
                    osc.type = 'triangle';
                    osc.frequency.setValueAtTime(220, now);
                    osc.frequency.exponentialRampToValueAtTime(160, now + 0.3);
                    gain.gain.setValueAtTime(0.1, now);
                    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
                    osc.connect(gain);
                    gain.connect(ctx.destination);
                    osc.start(now);
                    osc.stop(now + 0.3);
                } else if (currentTheme === 'forest') {
                    // Woodblock low organic tap
                    const osc = ctx.createOscillator();
                    const gain = ctx.createGain();
                    osc.type = 'sine';
                    osc.frequency.setValueAtTime(180, now);
                    gain.gain.setValueAtTime(0.15, now);
                    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
                    osc.connect(gain);
                    gain.connect(ctx.destination);
                    osc.start(now);
                    osc.stop(now + 0.15);
                } else if (currentTheme === 'cosmic') {
                    // Space gravity swell low frequency drop
                    const osc = ctx.createOscillator();
                    const gain = ctx.createGain();
                    osc.type = 'sine';
                    osc.frequency.setValueAtTime(180, now);
                    osc.frequency.exponentialRampToValueAtTime(60, now + 0.5);
                    gain.gain.setValueAtTime(0.1, now);
                    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
                    osc.connect(gain);
                    gain.connect(ctx.destination);
                    osc.start(now);
                    osc.stop(now + 0.5);
                } else if (currentTheme === 'high-contrast') {
                    // Retro game over sound (square waves)
                    const notes = [200, 150];
                    notes.forEach((freq, i) => {
                        const osc = ctx.createOscillator();
                        const gain = ctx.createGain();
                        osc.type = 'square';
                        osc.frequency.setValueAtTime(freq, now + i * 0.12);
                        gain.gain.setValueAtTime(0.05, now + i * 0.12);
                        gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.12 + 0.2);
                        osc.connect(gain);
                        gain.connect(ctx.destination);
                        osc.start(now + i * 0.12);
                        osc.stop(now + i * 0.12 + 0.2);
                    });
                } else {
                    // Default neon fall cue
                    const notes = [
                        { note: 220.00, time: 0 },
                        { note: 207.65, time: 0.12 },
                        { note: 196.00, time: 0.24 }
                    ];
                    notes.forEach((item, idx) => {
                        const osc = ctx.createOscillator();
                        const gain = ctx.createGain();
                        osc.type = 'sawtooth';
                        osc.frequency.setValueAtTime(item.note, now + item.time);
                        if (idx === 2) {
                            osc.frequency.exponentialRampToValueAtTime(140.00, now + item.time + 0.45);
                        }
                        const filter = ctx.createBiquadFilter();
                        filter.type = 'lowpass';
                        filter.frequency.setValueAtTime(500, now);
                        gain.gain.setValueAtTime(0.12, now + item.time);
                        gain.gain.exponentialRampToValueAtTime(0.001, now + item.time + (idx === 2 ? 0.5 : 0.2));
                        osc.connect(filter);
                        filter.connect(gain);
                        gain.connect(ctx.destination);
                        osc.start(now + item.time);
                        osc.stop(now + item.time + (idx === 2 ? 0.5 : 0.2));
                    });
                }
            } catch (e) {
                console.error("Audio error:", e);
            }
        }

        function playNavigationSound() {
            try {
                const ctx = getAudioContext();
                if (ctx.state === 'suspended') {
                    ctx.resume();
                }
                const now = ctx.currentTime;
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();

                if (currentTheme === 'minimal') {
                    osc.type = 'sine';
                    osc.frequency.setValueAtTime(400, now);
                    gain.gain.setValueAtTime(0.03, now);
                    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);
                } else if (currentTheme === 'corporate') {
                    osc.type = 'sine';
                    osc.frequency.setValueAtTime(600, now);
                    gain.gain.setValueAtTime(0.04, now);
                    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);
                } else if (currentTheme === 'sunset') {
                    osc.type = 'triangle';
                    osc.frequency.setValueAtTime(330, now);
                    osc.frequency.exponentialRampToValueAtTime(440, now + 0.08);
                    gain.gain.setValueAtTime(0.06, now);
                    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
                } else if (currentTheme === 'forest') {
                    osc.type = 'sine';
                    osc.frequency.setValueAtTime(250, now);
                    gain.gain.setValueAtTime(0.08, now);
                    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);
                } else if (currentTheme === 'cosmic') {
                    osc.type = 'sine';
                    osc.frequency.setValueAtTime(440, now);
                    osc.frequency.exponentialRampToValueAtTime(880, now + 0.15);
                    gain.gain.setValueAtTime(0.05, now);
                    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
                } else if (currentTheme === 'high-contrast') {
                    osc.type = 'square';
                    osc.frequency.setValueAtTime(400, now);
                    gain.gain.setValueAtTime(0.03, now);
                    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);
                } else {
                    // Default neon click
                    osc.type = 'sine';
                    osc.frequency.setValueAtTime(500, now);
                    osc.frequency.exponentialRampToValueAtTime(1000, now + 0.08);
                    gain.gain.setValueAtTime(0.06, now);
                    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
                }

                osc.connect(gain);
                gain.connect(ctx.destination);

                osc.start(now);
                osc.stop(now + 0.15);
            } catch (e) {
                console.error("Audio error:", e);
            }
        }

        // === Timer Logic ===
        const totalDuration = ${bundle.timeLimit ? bundle.timeLimit * 60 : 0};
        let timeLeft = totalDuration;
        let timerId = null;

        function startTimer() {
            if (timeLeft <= 0) return;
            document.getElementById('timer-container').classList.remove('hidden');
            document.getElementById('timer-container').classList.add('flex');
            document.getElementById('time-progress-container').classList.remove('hidden');
            document.getElementById('time-progress-container').classList.add('flex');
            
            updateTimerDisplay();
            timerId = setInterval(() => {
                timeLeft--;
                updateTimerDisplay();
                if (timeLeft <= 0) {
                    clearInterval(timerId);
                    alert('¡Se ha acabado el tiempo!');
                    showResults();
                }
            }, 1000);
        }

        function updateTimerDisplay() {
            const min = Math.floor(timeLeft / 60);
            const sec = timeLeft % 60;
            document.getElementById('timer-display').innerText = 
                \`\${String(min).padStart(2, '0')}:\${String(sec).padStart(2, '0')}\`;
            
            if (totalDuration > 0) {
                const percentage = Math.max(0, Math.min(100, (timeLeft / totalDuration) * 100));
                const fillEl = document.getElementById('time-progress-fill');
                const percentEl = document.getElementById('time-percentage-display');
                if (fillEl) {
                    fillEl.style.width = percentage + '%';
                    if (timeLeft < 30) {
                        fillEl.style.backgroundColor = '#ef4444';
                        fillEl.classList.add('animate-pulse');
                    } else if (timeLeft < totalDuration * 0.25) {
                        fillEl.style.backgroundColor = '#f97316';
                    }
                }
                if (percentEl) {
                    percentEl.innerText = Math.round(percentage) + '%';
                }
            }
            
            if (timeLeft < 30) {
                document.getElementById('timer-display').classList.add('text-red-500');
                document.getElementById('timer-display').classList.add('animate-pulse');
            }
        }

        // === SCORM 1.2 API ===
        var scormAPI = null;
        function buscarAPI(win) {
            var attempts = 0;
            while (win.API == null && win.parent != null && win.parent != win) {
                win = win.parent;
                attempts++;
                if (attempts > 10) break;
            }
            return win.API || null;
        }
        function inicializarSCORM() {
            scormAPI = buscarAPI(window);
            if (scormAPI) scormAPI.LMSInitialize("");
        }
        window.onload = function() {
            inicializarSCORM();
            ${bundle.kioskMode ? 'restoreSCORMState();' : ''}
            renderItem();
            startTimer();
        };

        const feedbackTiming = '${feedbackTiming}';
        let quizData = ${JSON.stringify(items)};
        ${bundle.shuffleQuestions ? `
        (function() {
            const questionsOnly = quizData.filter(function(i) { return i.type === 'question'; });
            for (var i = questionsOnly.length - 1; i > 0; i--) {
                var j = Math.floor(Math.random() * (i + 1));
                var temp = questionsOnly[i];
                questionsOnly[i] = questionsOnly[j];
                questionsOnly[j] = temp;
            }
            var qIdx = 0;
            quizData = quizData.map(function(item) {
                if (item.type === 'question') {
                    return questionsOnly[qIdx++];
                }
                return item;
            });
        })();
        ` : ''}
        let currentIndex = 0;
        let score = 0;
        let answers = [];

        // === Save / Restore state for Kiosk/Sequential enforcement ===
        function saveSCORMState() {
            const state = {
                currentIndex: currentIndex,
                score: score,
                answers: answers
            };
            const stateStr = JSON.stringify(state);
            localStorage.setItem('scorm_quiz_state_' + '${title.replace(/[^a-zA-Z0-9]/g, "_")}', stateStr);
            if (scormAPI) {
                scormAPI.LMSSetValue("cmi.suspend_data", stateStr);
                scormAPI.LMSCommit("");
            }
        }

        function restoreSCORMState() {
            let stateStr = null;
            if (scormAPI) {
                stateStr = scormAPI.LMSGetValue("cmi.suspend_data");
            }
            if (!stateStr) {
                stateStr = localStorage.getItem('scorm_quiz_state_' + '${title.replace(/[^a-zA-Z0-9]/g, "_")}');
            }
            if (stateStr) {
                try {
                    const state = JSON.parse(stateStr);
                    if (state && typeof state.currentIndex === 'number') {
                        currentIndex = state.currentIndex;
                        score = state.score || 0;
                        answers = state.answers || [];
                    }
                } catch(e) {
                    console.error("State restore error:", e);
                }
            }
        }

        function renderBullets() {
            const nav = document.getElementById('nav-bullets');
            if (!nav) return;
            nav.innerHTML = quizData.map((item, idx) => {
                const isActive = idx === currentIndex;
                const isCompleted = answers.some(ans => ans.q === idx) || (quizData[idx].type === 'content' && idx < currentIndex);
                const isKiosk = ${bundle.kioskMode ? 'true' : 'false'};
                
                let btnStyle = "min-w-[28px] h-7 px-2 rounded-full text-[10px] font-bold flex items-center justify-center gap-0.5 transition-all duration-200 ";
                if (isActive) {
                    btnStyle += "bg-[${selectedTheme.accent}] text-slate-900 ring-2 ring-white/25 scale-110";
                } else if (isCompleted) {
                    btnStyle += "bg-emerald-500/20 border border-emerald-500/35 text-emerald-400";
                } else {
                    btnStyle += "bg-white/5 border border-white/10 text-white/40";
                }

                let label = String(idx + 1);
                if (item.type === 'question') {
                    const answered = answers.some(ans => ans.q === idx);
                    if (answered) {
                        label = (idx + 1) + '<span style="font-size: 8px; margin-left: 2px;">✓</span>';
                    } else {
                        label = (idx + 1) + '<span style="font-size: 8px; margin-left: 2px; opacity: 0.6;">⚪</span>';
                    }
                } else {
                    label = (idx + 1) + '<span style="font-size: 8px; margin-left: 2px; opacity: 0.6;">📖</span>';
                }

                if (isKiosk) {
                    return \`<span class="\${btnStyle} cursor-not-allowed" title="Elemento \${idx + 1} (🔒 Modo Kiosco)">\${label}</span>\`;
                } else {
                    return \`<button onclick="jumpTo(\${idx})" class="\${btnStyle} hover:bg-white/10 hover:text-white" title="Ir a elemento \${idx + 1}">\${label}</button>\`;
                }
            }).join('');
        }

        function jumpTo(idx) {
            if (idx >= 0 && idx < quizData.length && idx !== currentIndex) {
                currentIndex = idx;
                playNavigationSound();
                renderItem();
            }
        }

        function renderItem() {
            const item = quizData[currentIndex];
            const container = document.getElementById('content');
            const progress = ((currentIndex + 1) / quizData.length) * 100;
            document.getElementById('progress-fill').style.width = progress + '%';
            renderBullets();

            // Clear any warning container on navigation
            const warnContainer = document.getElementById('warning-container');
            if (warnContainer) {
                warnContainer.classList.add('hidden');
                warnContainer.innerHTML = '';
            }

            if (item.type === 'content') {
                container.innerHTML = \`
                    \${item.data.imageUrl ? '<img src="' + item.data.imageUrl + '" class="w-full aspect-[2/1] object-cover rounded-xl mb-6 shadow-lg border border-white/10" referrerPolicy="no-referrer">' : ''}
                    <h2 class="bungee text-2xl mb-4" style="color: ${selectedTheme.accent}">\${item.data.title}</h2>
                    <div class="prose prose-invert mb-8">\${item.data.content}</div>
                    
                    <div class="flex items-center justify-between mt-8 pt-6 border-t border-white/10 gap-4">
                        <div>
                            \${currentIndex > 0 ? \`<button onclick="prev()" class="px-5 py-2 rounded-full font-bold text-sm bg-white/5 border border-white/10 hover:bg-white/10 text-white transition-all">← Anterior</button>\` : ''}
                        </div>
                        <div>
                            \${currentIndex < quizData.length - 1 
                                ? \`<button onclick="next()" class="px-6 py-2 rounded-full font-bold text-sm" style="background: ${selectedTheme.accent}; color: ${accentBtnText}">Siguiente →</button>\` 
                                : \`<button onclick="finishQuiz()" class="px-6 py-2 rounded-full font-bold text-sm" style="background: ${selectedTheme.accent}; color: ${accentBtnText}">Finalizar 🏁</button>\`
                            }
                        </div>
                    </div>
                \`;
            } else {
                const question = item.data;
                const existingAnswer = answers.find(ans => ans.q === currentIndex);
                
                let optionsHtml = '';
                if (existingAnswer !== undefined) {
                    optionsHtml = question.options.map((opt, i) => {
                        let btnClass = "btn-option";
                        if (feedbackTiming === 'immediate') {
                            if (i === question.correctAnswer) {
                                btnClass += " correct";
                            } else if (i === existingAnswer.a) {
                                btnClass += " incorrect";
                            }
                        } else {
                            if (i === existingAnswer.a) {
                                btnClass += " border-2 font-bold";
                                btnClass += " border-[" + '${selectedTheme.accent}' + "] text-[" + '${selectedTheme.accent}' + "]";
                            }
                        }
                        return \`<button class="\${btnClass}" disabled>\${opt}</button>\`;
                    }).join('');
                } else {
                    optionsHtml = question.options.map((opt, i) => \`
                        <button class="btn-option" onclick="checkAnswer(\${i})">\${opt}</button>
                    \`).join('');
                }

                container.innerHTML = \`
                    <div class="flex items-center justify-between gap-4 mb-3 flex-wrap">
                        <span class="text-xs font-bold opacity-50 uppercase tracking-widest">Pregunta \${currentIndex + 1} de \${quizData.length}</span>
                        \${existingAnswer !== undefined 
                            ? \`<span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-emerald-500/15 border border-emerald-500/30 text-emerald-400">✓ Respondida</span>\` 
                            : \`<span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-amber-500/15 border border-amber-500/30 text-amber-500 animate-pulse">⚪ Pendiente</span>\`
                        }
                    </div>
                    \${question.imageUrl ? '<img src="' + question.imageUrl + '" class="w-full aspect-[2/1] object-cover rounded-xl mb-6 shadow-lg border border-white/10" referrerPolicy="no-referrer">' : ''}
                    <h2 class="text-xl font-bold mb-6">\${question.question}</h2>
                    <div id="options">
                        \${optionsHtml}
                    </div>
                    <div id="feedback" class="mt-6 \${(existingAnswer !== undefined && feedbackTiming === 'immediate') ? '' : 'hidden'} p-4 rounded-lg bg-white/5 border border-white/10">
                        <p class="font-bold mb-1">Feedback:</p>
                        <p id="feedback-text"></p>
                    </div>

                    <div class="flex items-center justify-between mt-8 pt-6 border-t border-white/10 gap-4">
                        <div>
                            \${currentIndex > 0 ? \`<button onclick="prev()" class="px-5 py-2 rounded-full font-bold text-sm bg-white/5 border border-white/10 hover:bg-white/10 text-white transition-all">← Anterior</button>\` : ''}
                        </div>
                        <div>
                            \${currentIndex < quizData.length - 1 
                                ? (existingAnswer !== undefined 
                                    ? \`<button onclick="next()" class="px-6 py-2 rounded-full font-bold text-sm" style="background: ${selectedTheme.accent}; color: ${accentBtnText}">Siguiente →</button>\`
                                    : \`<button onclick="next()" class="px-5 py-2 rounded-full font-bold text-sm bg-white/5 border border-white/10 hover:bg-white/10 text-white transition-all">Siguiente →</button>\`
                                  )
                                : \`<button onclick="finishQuiz()" class="px-6 py-2 rounded-full font-bold text-sm" style="background: ${selectedTheme.accent}; color: ${accentBtnText}">Finalizar 🏁</button>\`
                            }
                        </div>
                    </div>
                \`;

                if (existingAnswer !== undefined && feedbackTiming === 'immediate') {
                    showSpecificFeedback(existingAnswer.a, question);
                }
            }
        }

        function showSpecificFeedback(index, question) {
            let specificFeedback = '';
            if (question.optionsFeedback && question.optionsFeedback[index]) {
                specificFeedback = question.optionsFeedback[index];
            }
            
            const fbText = document.getElementById('feedback-text');
            if (fbText) {
                let html = '';
                if (specificFeedback) {
                    html += '<div class="mb-3 p-2.5 rounded bg-white/5 border-l-4 ' + (index === question.correctAnswer ? 'border-green-500' : 'border-red-500') + '"><strong>Su respuesta:</strong> ' + specificFeedback + '</div>';
                }
                if (question.feedback) {
                    html += '<div class="text-sm opacity-90 font-light"><strong>Explicación general:</strong> ' + question.feedback + '</div>';
                }
                if (!specificFeedback && !question.feedback) {
                    html += '<div>' + (index === question.correctAnswer ? '¡Respuesta correcta!' : 'Respuesta incorrecta.') + '</div>';
                }
                fbText.innerHTML = html;
            }
        }

        function checkAnswer(index) {
            const item = quizData[currentIndex];
            const question = item.data;
            
            let isCorrect = index === question.correctAnswer;
            if (isCorrect) {
                score++;
                playCorrectSound();
            } else {
                playIncorrectSound();
            }

            answers.push({ q: currentIndex, a: index, correct: isCorrect });
            saveSCORMState();
            
            if (feedbackTiming === 'immediate') {
                renderItem();
            } else {
                renderBullets();
                setTimeout(next, 400);
            }
        }

        function prev() {
            if (currentIndex > 0) {
                currentIndex--;
                playNavigationSound();
                saveSCORMState();
                renderItem();
            }
        }

        function next() {
            if (currentIndex < quizData.length - 1) {
                currentIndex++;
                playNavigationSound();
                saveSCORMState();
                renderItem();
            } else {
                finishQuiz();
            }
        }

        function finishQuiz() {
            const unanswered = [];
            quizData.forEach((item, idx) => {
                if (item.type === 'question') {
                    const answered = answers.some(ans => ans.q === idx);
                    if (!answered) {
                        unanswered.push(idx + 1);
                    }
                }
            });

            const warnContainer = document.getElementById('warning-container');
            if (unanswered.length > 0) {
                if (warnContainer) {
                    warnContainer.innerHTML = \`
                        <div class="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-200 text-sm flex flex-col gap-2">
                            <div class="flex items-center gap-2 font-bold text-red-400">
                                <span>⚠️ Cuestionario Incompleto</span>
                            </div>
                            <p>No puedes entregar el cuestionario todavía. Debes responder todas las preguntas. Te faltan las siguientes:</p>
                            <div class="flex flex-wrap gap-1.5 mt-1">
                                \${unanswered.map(num => \`<button onclick="jumpTo(\${num - 1})" class="px-2.5 py-1 rounded bg-red-500/20 border border-red-500/30 hover:bg-red-500/40 text-red-300 font-bold text-xs transition-colors">Pregunta \${num}</button>\`).join('')}
                            </div>
                        </div>
                    \`;
                    warnContainer.classList.remove('hidden');
                    warnContainer.scrollIntoView({ behavior: 'smooth' });
                } else {
                    alert('Por favor responde todas las preguntas antes de finalizar. Preguntas faltantes: ' + unanswered.join(', '));
                }
            } else {
                if (warnContainer) {
                    warnContainer.classList.add('hidden');
                    warnContainer.innerHTML = '';
                }
                showResults();
            }
        }

        function showResults() {
            if (timerId) clearInterval(timerId);
            document.getElementById('timer-container').classList.add('hidden');
            if (document.getElementById('nav-bullets')) {
                document.getElementById('nav-bullets').classList.add('hidden');
            }
            
            localStorage.removeItem('scorm_quiz_state_' + '${title.replace(/[^a-zA-Z0-9]/g, "_")}');
            if (scormAPI) {
                scormAPI.LMSSetValue("cmi.suspend_data", "");
            }
            
            const totalQuestions = quizData.filter(i => i.type === 'question').length;
            const pointsPerQuestion = ${bundle.pointsPerQuestion ?? 10};
            const passingScore = ${bundle.passingScore ?? 60};
            const totalPoints = totalQuestions * pointsPerQuestion;
            const obtainedPoints = score * pointsPerQuestion;
            const percentage = totalQuestions > 0 ? Math.round((score / totalQuestions) * 100) : 0;
            const isPassed = percentage >= passingScore;
            
            if (scormAPI) {
                scormAPI.LMSSetValue("cmi.core.score.raw", String(percentage));
                scormAPI.LMSSetValue("cmi.core.lesson_status", isPassed ? "passed" : "failed");
                scormAPI.LMSCommit("");
                scormAPI.LMSFinish("");
            }

            let reviewHtml = '';
            if (feedbackTiming === 'end') {
                reviewHtml += '<div class="mt-12 text-left border-t border-white/10 pt-8 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">';
                reviewHtml += '  <h3 class="bungee text-lg mb-6 text-center" style="color: ' + '${selectedTheme.accent}' + '">Revisión de Respuestas</h3>';
                
                quizData.forEach((item, idx) => {
                    if (item.type === 'question') {
                        const question = item.data;
                        const ans = answers.find(a => a.q === idx);
                        const isCorrect = ans ? ans.correct : false;
                        const chosenOpt = ans ? question.options[ans.a] : 'Sin respuesta';
                        const correctOpt = question.options[question.correctAnswer];
                        
                        reviewHtml += '<div class="mb-6 p-4 rounded-xl bg-white/5 border border-white/10">';
                        reviewHtml += '  <div class="flex items-center justify-between gap-2 mb-2">';
                        reviewHtml += '    <span class="text-xs font-bold opacity-50 uppercase tracking-widest">Pregunta ' + (idx + 1) + '</span>';
                        if (ans) {
                            if (isCorrect) {
                                reviewHtml += '    <span class="text-xs font-bold text-emerald-400 uppercase tracking-widest bg-emerald-500/15 px-2 py-0.5 rounded-md border border-emerald-500/30">✓ Correcta</span>';
                            } else {
                                reviewHtml += '    <span class="text-xs font-bold text-red-400 uppercase tracking-widest bg-red-500/15 px-2 py-0.5 rounded-md border border-red-500/30">✗ Incorrecta</span>';
                            }
                        } else {
                            reviewHtml += '    <span class="text-xs font-bold text-amber-400 uppercase tracking-widest bg-amber-500/15 px-2 py-0.5 rounded-md border border-amber-500/30">Sin responder</span>';
                        }
                        reviewHtml += '  </div>';
                        
                        const cleanQuestion = question.question.replace(/'/g, "\\'");
                        reviewHtml += '  <p class="font-semibold text-sm mb-3">' + cleanQuestion + '</p>';
                        
                        const cleanChosen = chosenOpt.replace(/'/g, "\\'");
                        const cleanCorrect = correctOpt.replace(/'/g, "\\'");
                        
                        reviewHtml += '  <div class="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs mb-3">';
                        reviewHtml += '    <div class="p-2.5 rounded-lg ' + (isCorrect ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400' : 'bg-red-500/10 border border-red-500/20 text-red-400') + '">';
                        reviewHtml += '      <strong>Tu respuesta:</strong> ' + cleanChosen;
                        reviewHtml += '    </div>';
                        reviewHtml += '    <div class="p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">';
                        reviewHtml += '      <strong>Respuesta correcta:</strong> ' + cleanCorrect;
                        reviewHtml += '    </div>';
                        reviewHtml += '  </div>';
                        
                        if (ans && question.optionsFeedback && question.optionsFeedback[ans.a]) {
                            const cleanOptFb = question.optionsFeedback[ans.a].replace(/'/g, "\\'");
                            reviewHtml += '<div class="mt-2 p-2.5 rounded-lg bg-white/5 border border-white/5 text-xs opacity-90">';
                            reviewHtml += '  <strong>Retroalimentación:</strong> ' + cleanOptFb;
                            reviewHtml += '</div>';
                        }
                        
                        if (question.feedback) {
                            const cleanFb = question.feedback.replace(/'/g, "\\'");
                            reviewHtml += '<div class="mt-2 p-2.5 rounded-lg bg-white/5 border border-white/5 text-xs opacity-85 font-light">';
                            reviewHtml += '  <strong>Explicación:</strong> ' + cleanFb;
                            reviewHtml += '</div>';
                        }
                        
                        reviewHtml += '</div>';
                    }
                });
                reviewHtml += '</div>';
            }

            document.getElementById('content').innerHTML = \`
                <div class="text-center">
                    <h2 class="bungee text-4xl mb-4" style="color: ${selectedTheme.accent}">\${isPassed ? '¡APROBADO!' : 'REPROBADO'}</h2>
                    <div id="results-chart" class="flex justify-center mb-6"></div>
                    <div class="text-6xl font-bold mb-2">\${percentage}%</div>
                    <p class="text-xl mb-2 font-semibold">\${obtainedPoints} de \${totalPoints} puntos</p>
                    <p class="text-xs opacity-60 mb-8">(\${score} de \${totalQuestions} respuestas correctas • Mínimo para aprobar: \${passingScore}%)</p>
                    <p class="opacity-70 text-sm mb-4">Tu resultado ha sido enviado al LMS.</p>
                </div>
                \` + reviewHtml;

            // Render Chart
            const options = {
                series: [score, totalQuestions - score],
                chart: {
                    type: 'donut',
                    width: 280,
                    animations: {
                        enabled: true,
                        speed: 800,
                        animateGradually: { enabled: true, delay: 150 },
                        dynamicAnimation: { enabled: true, speed: 350 }
                    }
                },
                labels: ['Correctas', 'Incorrectas'],
                colors: ['${selectedTheme.accent}', '#ef4444'],
                dataLabels: { enabled: false },
                legend: { show: false },
                stroke: { show: false },
                plotOptions: {
                    pie: {
                        donut: {
                            size: '75%',
                            background: 'transparent',
                        }
                    }
                },
                tooltip: {
                    theme: '${theme === 'neon' || theme === 'high-contrast' ? 'dark' : 'light'}',
                    y: {
                        formatter: function(val) { return val + " preguntas" }
                    }
                }
            };
            const chart = new ApexCharts(document.querySelector("#results-chart"), options);
            chart.render();
        }
    </script>
</body>
</html>`;
};
