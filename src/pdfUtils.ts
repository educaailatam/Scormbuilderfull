/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { jsPDF } from 'jspdf';
import { QuizBundle, Question, ContentSlide } from './types';

export const generateQuizPdf = (bundle: QuizBundle, includeAnswers: boolean, includeConfigSummary: boolean = false) => {
  const doc = new jsPDF();
  const margin = 20;
  let y = 30;

  // Header
  doc.setFontSize(22);
  doc.setFont('helvetica', 'bold');
  doc.text(bundle.title, margin, y);
  y += 10;

  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100);
  doc.text(`Generado por SCORM Builder - ${new Date().toLocaleDateString()}`, margin, y);
  y += 20;

  bundle.items.forEach((item, index) => {
    // Check if we need a new page
    if (y > 270) {
      doc.addPage();
      y = 30;
    }

    if (item.type === 'content') {
      const content = item.data as ContentSlide;
      
      // Add image if exists
      if (content.imageUrl) {
        if (y > 200) { doc.addPage(); y = 30; }
        try {
          doc.addImage(content.imageUrl, 'PNG', margin, y, 170, 85);
          y += 95;
        } catch (e) { console.error("PDF Image add error", e); }
      }

      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(0);
      doc.text(`${index + 1}. ${content.title}`, margin, y);
      y += 10;

      doc.setFontSize(12);
      doc.setFont('helvetica', 'normal');
      const splitText = doc.splitTextToSize(content.content.replace(/<[^>]*>?/gm, ''), 170);
      doc.text(splitText, margin, y);
      y += splitText.length * 7 + 10;
    } else {
      const q = item.data as Question;

      // Add image if exists
      if (q.imageUrl) {
        if (y > 200) { doc.addPage(); y = 30; }
        try {
          doc.addImage(q.imageUrl, 'PNG', margin, y, 170, 85);
          y += 95;
        } catch (e) { console.error("PDF Image add error", e); }
      }

      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(0);
      doc.text(`${index + 1}. ${q.question}`, margin, y);
      y += 10;

      doc.setFontSize(12);
      doc.setFont('helvetica', 'normal');
      q.options.forEach((opt, optIdx) => {
        const isCorrect = includeAnswers && optIdx === q.correctAnswer;
        const prefix = isCorrect ? '[X] ' : '[  ] ';
        
        if (isCorrect) doc.setTextColor(0, 150, 0); // Green for correct answer if shown
        else doc.setTextColor(0);

        doc.text(`${prefix}${opt}`, margin + 5, y);
        y += 7;
      });

      if (includeAnswers) {
        let textFeedback = q.feedback || '';
        if (q.optionsFeedback) {
          const optFeedbacks = q.optionsFeedback
            .map((fb, idx) => fb && fb.trim() ? `- Opción ${idx + 1}: ${fb}` : '')
            .filter(fb => fb !== '');
          if (optFeedbacks.length > 0) {
            textFeedback += (textFeedback ? '\n' : '') + '\nFeedback por respuesta:\n' + optFeedbacks.join('\n');
          }
        }

        if (textFeedback) {
          y += 3;
          doc.setFontSize(10);
          doc.setFont('helvetica', 'italic');
          doc.setTextColor(100);
          const feedbackText = doc.splitTextToSize(`Feedback: ${textFeedback}`, 170);
          doc.text(feedbackText, margin + 5, y);
          y += feedbackText.length * 5 + 5;
        } else {
          y += 10;
        }
      } else {
        y += 10;
      }
    }
  });

  if (includeConfigSummary) {
    doc.addPage();
    let yConf = 35;
    
    // Background card effect
    doc.setFillColor(248, 250, 252); // slate-50
    doc.rect(15, 15, 180, 267, 'F');
    doc.setDrawColor(226, 232, 240); // slate-200
    doc.setLineWidth(1);
    doc.rect(15, 15, 180, 267, 'S');
    
    // Header section for config
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42); // slate-900
    doc.text('Resumen de Configuración Técnica', 25, yConf);
    yConf += 10;
    
    // Divider
    doc.setDrawColor(203, 213, 225); // slate-300
    doc.line(25, yConf, 185, yConf);
    yConf += 12;
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 116, 139); // slate-500
    const descText = doc.splitTextToSize('Este reporte detalla todas las especificaciones técnicas y configuraciones del cuestionario interactivo para su correcta importación y ejecución en plataformas LMS o visualización estática.', 160);
    doc.text(descText, 25, yConf);
    yConf += descText.length * 5 + 10;
    
    const getFriendlyThemeName = (theme: string) => {
      switch (theme) {
        case 'neon': return 'Espacio Neon (Cyberpunk)';
        case 'corporate': return 'Corporativo / Académico';
        case 'minimal': return 'Minimalista Elegante';
        case 'high-contrast': return 'Alto Contraste (Accesibilidad)';
        default: return theme;
      }
    };

    const configRows = [
      { label: 'Título del Cuestionario', value: bundle.title },
      { label: 'Tema Visual Seleccionado', value: getFriendlyThemeName(bundle.theme) },
      { label: 'Cantidad de Preguntas', value: `${bundle.items.filter(it => it.type === 'question').length} preguntas` },
      { label: 'Cantidad de Diapositivas', value: `${bundle.items.filter(it => it.type === 'content').length} contenidos` },
      { label: 'Límite de Tiempo', value: bundle.timeLimit ? `${bundle.timeLimit} minutos` : 'Sin límite de tiempo (Ilimitado)' },
      { label: 'Mezclar Preguntas', value: bundle.shuffleQuestions ? 'Activado (Orden aleatorio)' : 'Desactivado (Orden secuencial)' },
      { label: 'Modo Kiosco (Bloqueo)', value: bundle.kioskMode ? 'Activado (Obligatorio completar para finalizar)' : 'Desactivado (Navegación libre)' },
      { label: 'Momento de Feedback', value: bundle.feedbackTiming === 'immediate' ? 'Inmediato (Al responder cada pregunta)' : 'Al Finalizar (Revisión al terminar el intento)' }
    ];
    
    configRows.forEach((row) => {
      // Background row strip for a clean aesthetic look
      doc.setFillColor(255, 255, 255);
      doc.rect(25, yConf - 6, 160, 15, 'F');
      doc.setDrawColor(241, 245, 249); // slate-100
      doc.rect(25, yConf - 6, 160, 15, 'S');
      
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.setTextColor(71, 85, 105); // slate-600
      doc.text(row.label, 30, yConf + 3);
      
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      doc.setTextColor(15, 23, 42); // slate-900
      
      // Handle potential long values nicely
      const valText = doc.splitTextToSize(String(row.value), 80);
      doc.text(valText, 100, yConf + 3);
      
      yConf += 19;
    });
    
    // Footer on summary page
    doc.setFontSize(9);
    doc.setFont('helvetica', 'italic');
    doc.setTextColor(148, 163, 184); // slate-400
    doc.text('Generado automáticamente por SCORM Builder - Reporte Técnico', 105, 268, { align: 'center' });
  }

  return doc;
};
