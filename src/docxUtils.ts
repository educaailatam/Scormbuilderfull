/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Document, Packer, Paragraph, TextRun, HeadingLevel, Table, TableRow, TableCell, WidthType, BorderStyle, AlignmentType } from 'docx';
import { QuizBundle, Question, ContentSlide } from './types';

export const generateQuizDocx = async (bundle: QuizBundle, includeAnswers: boolean, includeConfigSummary: boolean = false): Promise<Blob> => {
  const children: any[] = [];

  // Document Title
  children.push(
    new Paragraph({
      text: bundle.title,
      heading: HeadingLevel.HEADING_1,
      spacing: { before: 200, after: 100 },
    })
  );

  // Metadata
  children.push(
    new Paragraph({
      children: [
        new TextRun({
          text: `Generado por SCORM Builder - ${new Date().toLocaleDateString()}`,
          color: "64748B", // slate-500
          italics: true,
          size: 20, // 10pt
        }),
      ],
      spacing: { after: 400 },
    })
  );

  // Add Divider
  children.push(
    new Paragraph({
      children: [
        new TextRun({
          text: "_________________________________________________________________________________ ",
          color: "CBD5E1", // slate-300
        })
      ],
      spacing: { after: 400 }
    })
  );

  // Process items (Questions and Content slides)
  bundle.items.forEach((item, index) => {
    if (item.type === 'content') {
      const content = item.data as ContentSlide;

      // Slide Title
      children.push(
        new Paragraph({
          children: [
            new TextRun({
              text: `${index + 1}. ${content.title}`,
              bold: true,
              size: 28, // 14pt
              color: "0F172A", // slate-900
            })
          ],
          spacing: { before: 300, after: 150 },
        })
      );

      // Clean HTML tags from content
      const cleanText = content.content.replace(/<[^>]*>?/gm, '');

      // Content text
      children.push(
        new Paragraph({
          children: [
            new TextRun({
              text: cleanText,
              size: 24, // 12pt
              color: "334155", // slate-700
            })
          ],
          spacing: { after: 300 },
        })
      );

    } else {
      const q = item.data as Question;

      // Question Title
      children.push(
        new Paragraph({
          children: [
            new TextRun({
              text: `${index + 1}. ${q.question}`,
              bold: true,
              size: 28, // 14pt
              color: "0F172A", // slate-900
            })
          ],
          spacing: { before: 300, after: 150 },
        })
      );

      // Options
      q.options.forEach((opt, optIdx) => {
        const isCorrect = includeAnswers && optIdx === q.correctAnswer;
        const prefix = isCorrect ? '[X] ' : '[  ] ';
        
        children.push(
          new Paragraph({
            children: [
              new TextRun({
                text: prefix,
                bold: isCorrect,
                color: isCorrect ? "16A34A" : "475569", // green-600 vs slate-600
                size: 24, // 12pt
              }),
              new TextRun({
                text: opt,
                bold: isCorrect,
                color: isCorrect ? "16A34A" : "334155", // green-600 vs slate-700
                size: 24, // 12pt
              })
            ],
            indent: { left: 720 }, // 0.5 inch indent
            spacing: { after: 100 },
          })
        );
      });

      // Feedback if requested
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
          children.push(
            new Paragraph({
              children: [
                new TextRun({
                  text: "Retroalimentación: ",
                  bold: true,
                  italics: true,
                  size: 20, // 10pt
                  color: "475569", // slate-600
                }),
                new TextRun({
                  text: textFeedback,
                  italics: true,
                  size: 20, // 10pt
                  color: "64748B", // slate-500
                })
              ],
              indent: { left: 720 },
              spacing: { before: 100, after: 250 },
            })
          );
        } else {
          children.push(new Paragraph({ spacing: { after: 200 } }));
        }
      } else {
        children.push(new Paragraph({ spacing: { after: 200 } }));
      }
    }
  });

  // Include Technical Config Summary Page if selected
  if (includeConfigSummary) {
    // Spacer page break or visual divider
    children.push(
      new Paragraph({
        children: [
          new TextRun({
            text: "\n\n",
          })
        ],
        pageBreakBefore: true,
      })
    );

    // Config Title
    children.push(
      new Paragraph({
        text: "Resumen de Configuración Técnica",
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 200, after: 150 },
      })
    );

    // Config Description
    children.push(
      new Paragraph({
        children: [
          new TextRun({
            text: "Este reporte detalla todas las especificaciones técnicas y configuraciones del cuestionario interactivo para su correcta importación y ejecución en plataformas LMS o visualización estática.",
            color: "475569", // slate-600
            size: 22, // 11pt
          })
        ],
        spacing: { after: 300 },
      })
    );

    const getFriendlyThemeName = (theme: string) => {
      switch (theme) {
        case 'neon': return 'Espacio Neon (Cyberpunk)';
        case 'corporate': return 'Corporativo / Académico';
        case 'minimal': return 'Minimalista Elegante';
        case 'high-contrast': return 'Alto Contraste (Accesibilidad)';
        default: return theme;
      }
    };

    const configRowsData = [
      { label: 'Título del Cuestionario', value: bundle.title },
      { label: 'Tema Visual Seleccionado', value: getFriendlyThemeName(bundle.theme) },
      { label: 'Cantidad de Preguntas', value: `${bundle.items.filter(it => it.type === 'question').length} preguntas` },
      { label: 'Cantidad de Diapositivas', value: `${bundle.items.filter(it => it.type === 'content').length} contenidos` },
      { label: 'Límite de Tiempo', value: bundle.timeLimit ? `${bundle.timeLimit} minutos` : 'Sin límite de tiempo (Ilimitado)' },
      { label: 'Mezclar Preguntas', value: bundle.shuffleQuestions ? 'Activado (Orden aleatorio)' : 'Desactivado (Orden secuencial)' },
      { label: 'Modo Kiosco (Bloqueo)', value: bundle.kioskMode ? 'Activado (Obligatorio completar para finalizar)' : 'Desactivado (Navegación libre)' },
      { label: 'Momento de Feedback', value: bundle.feedbackTiming === 'immediate' ? 'Inmediato (Al responder cada pregunta)' : 'Al Finalizar (Revisión al terminar el intento)' }
    ];

    // Build Word Table
    const tableRows = configRowsData.map((row) => {
      return new TableRow({
        children: [
          new TableCell({
            children: [
              new Paragraph({
                children: [
                  new TextRun({
                    text: row.label,
                    bold: true,
                    size: 20, // 10pt
                    color: "334155",
                  })
                ]
              })
            ],
            width: { size: 40, type: WidthType.PERCENTAGE },
            shading: { fill: "F8FAFC" }, // slate-50 background
            margins: { top: 120, bottom: 120, left: 150, right: 150 },
          }),
          new TableCell({
            children: [
              new Paragraph({
                children: [
                  new TextRun({
                    text: row.value,
                    size: 20, // 10pt
                    color: "0F172A",
                  })
                ]
              })
            ],
            width: { size: 60, type: WidthType.PERCENTAGE },
            margins: { top: 120, bottom: 120, left: 150, right: 150 },
          }),
        ]
      });
    });

    const table = new Table({
      rows: tableRows,
      width: { size: 100, type: WidthType.PERCENTAGE },
      borders: {
        top: { style: BorderStyle.SINGLE, size: 8, color: "E2E8F0" },
        bottom: { style: BorderStyle.SINGLE, size: 8, color: "E2E8F0" },
        left: { style: BorderStyle.SINGLE, size: 8, color: "E2E8F0" },
        right: { style: BorderStyle.SINGLE, size: 8, color: "E2E8F0" },
        insideHorizontal: { style: BorderStyle.SINGLE, size: 4, color: "F1F5F9" },
        insideVertical: { style: BorderStyle.SINGLE, size: 4, color: "F1F5F9" },
      },
    });

    children.push(table);

    // Technical Summary Footer
    children.push(
      new Paragraph({
        children: [
          new TextRun({
            text: "\nReporte Técnico generado automáticamente por SCORM Builder.",
            italics: true,
            size: 18, // 9pt
            color: "94A3B8", // slate-400
          })
        ],
        alignment: AlignmentType.CENTER,
        spacing: { before: 400 },
      })
    );
  }

  const doc = new Document({
    sections: [
      {
        properties: {},
        children,
      },
    ],
  });

  return await Packer.toBlob(doc);
};
