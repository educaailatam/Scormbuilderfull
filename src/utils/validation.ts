import { LessonItem, Question, ContentSlide } from '../types';

export interface ValidationIssue {
  itemId: string;
  itemType: 'question' | 'content';
  itemTitle: string;
  severity: 'error' | 'warning';
  message: string;
}

export function validateLessonItem(item: LessonItem, index: number): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const id = item.data.id;

  if (item.type === 'question') {
    const q = item.data as Question;
    const title = q.question.trim() || `[Pregunta ${index + 1} sin texto]`;

    // 1. Check empty or too short question text
    if (!q.question || q.question.trim().length === 0) {
      issues.push({
        itemId: id,
        itemType: 'question',
        itemTitle: title,
        severity: 'error',
        message: 'El enunciado de la pregunta está vacío.'
      });
    } else if (q.question.trim().length < 10) {
      issues.push({
        itemId: id,
        itemType: 'question',
        itemTitle: title,
        severity: 'warning',
        message: 'El enunciado de la pregunta es muy corto (menos de 10 caracteres).'
      });
    }

    // 2. Check options for multiple choice
    if (q.type === 'multiple-choice') {
      if (!q.options || q.options.length < 2) {
        issues.push({
          itemId: id,
          itemType: 'question',
          itemTitle: title,
          severity: 'error',
          message: 'Una pregunta de opción múltiple debe tener al menos 2 opciones de respuesta.'
        });
      } else {
        // Check for empty options
        q.options.forEach((opt, idx) => {
          if (!opt || opt.trim().length === 0) {
            issues.push({
              itemId: id,
              itemType: 'question',
              itemTitle: title,
              severity: 'error',
              message: `La opción de respuesta ${idx + 1} está vacía.`
            });
          }
        });

        // Check for duplicate options (ignoring case & extra whitespace)
        const simplifiedOptions = q.options.map(o => o.trim().toLowerCase()).filter(o => o.length > 0);
        const uniqueOptions = new Set(simplifiedOptions);
        if (uniqueOptions.size < simplifiedOptions.length) {
          issues.push({
            itemId: id,
            itemType: 'question',
            itemTitle: title,
            severity: 'warning',
            message: 'Hay opciones de respuesta duplicadas o muy similares.'
          });
        }
      }

      // Check correctAnswer bounds
      if (typeof q.correctAnswer !== 'number' || q.correctAnswer < 0 || q.correctAnswer >= q.options.length) {
        issues.push({
          itemId: id,
          itemType: 'question',
          itemTitle: title,
          severity: 'error',
          message: 'La respuesta correcta seleccionada no es válida o no está definida.'
        });
      }
    }

    // 3. Check options for true-false
    if (q.type === 'true-false') {
      if (!q.options || q.options.length < 2) {
        issues.push({
          itemId: id,
          itemType: 'question',
          itemTitle: title,
          severity: 'error',
          message: 'Una pregunta de Verdadero/Falso debe tener al menos 2 opciones.'
        });
      }
      if (typeof q.correctAnswer !== 'number' || q.correctAnswer < 0 || q.correctAnswer >= q.options.length) {
        issues.push({
          itemId: id,
          itemType: 'question',
          itemTitle: title,
          severity: 'error',
          message: 'La respuesta correcta seleccionada no es válida o no está definida.'
        });
      }
    }

    // 4. Check feedback
    if (!q.feedback || q.feedback.trim().length === 0) {
      issues.push({
        itemId: id,
        itemType: 'question',
        itemTitle: title,
        severity: 'warning',
        message: 'Falta la retroalimentación o feedback explicativo general para la pregunta.'
      });
    } else if (q.feedback.trim().length < 8) {
      issues.push({
        itemId: id,
        itemType: 'question',
        itemTitle: title,
        severity: 'warning',
        message: 'La retroalimentación explicativa es demasiado corta (menos de 8 caracteres).'
      });
    }

    // 5. Check image warning (specifically asked "ej. imágenes faltantes")
    if (!q.imageUrl) {
      issues.push({
        itemId: id,
        itemType: 'question',
        itemTitle: title,
        severity: 'warning',
        message: 'La pregunta no tiene una imagen o ilustración de apoyo.'
      });
    }

  } else if (item.type === 'content') {
    const c = item.data as ContentSlide;
    const title = c.title.trim() || `[Contenido ${index + 1} sin título]`;

    // 1. Check title
    if (!c.title || c.title.trim().length === 0) {
      issues.push({
        itemId: id,
        itemType: 'content',
        itemTitle: title,
        severity: 'error',
        message: 'El título de la diapositiva de contenido está vacío.'
      });
    } else if (c.title.trim().length < 3) {
      issues.push({
        itemId: id,
        itemType: 'content',
        itemTitle: title,
        severity: 'warning',
        message: 'El título de la diapositiva es muy corto.'
      });
    }

    // 2. Check content
    if (!c.content || c.content.trim().length === 0) {
      issues.push({
        itemId: id,
        itemType: 'content',
        itemTitle: title,
        severity: 'error',
        message: 'El texto de contenido de la diapositiva está vacío.'
      });
    } else if (c.content.trim().length < 15) {
      issues.push({
        itemId: id,
        itemType: 'content',
        itemTitle: title,
        severity: 'warning',
        message: 'El contenido de la diapositiva es muy corto (menos de 15 caracteres).'
      });
    }

    // 3. Check image warning
    if (!c.imageUrl) {
      issues.push({
        itemId: id,
        itemType: 'content',
        itemTitle: title,
        severity: 'warning',
        message: 'La diapositiva no tiene una imagen o ilustración asociada.'
      });
    }
  }

  return issues;
}

export function validateAllLessonItems(items: LessonItem[]): ValidationIssue[] {
  const allIssues: ValidationIssue[] = [];
  items.forEach((item, index) => {
    allIssues.push(...validateLessonItem(item, index));
  });
  return allIssues;
}
