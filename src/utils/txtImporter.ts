import { LessonItem, Question } from '../types';

export interface ParseResult {
  items: LessonItem[];
  successCount: number;
  ignoredLines: { lineNum: number; content: string; reason: string }[];
}

/**
 * Parses a plain text file (.txt) where each non-empty line has the format:
 * Pregunta|Opcion1|Opcion2|...|RespuestaCorrecta
 * 
 * Examples:
 * - ¿De qué color es el cielo?|Azul|Rojo|Verde|Azul
 * - ¿El Sol es una estrella?|Verdadero|Falso|0
 * - Un byte equivale a:|4 bits|8 bits|16 bits|32 bits|1
 */
export function parseTxtQuestions(rawText: string): ParseResult {
  const lines = rawText.split(/\r?\n/);
  const items: LessonItem[] = [];
  const ignoredLines: { lineNum: number; content: string; reason: string }[] = [];
  let successCount = 0;

  lines.forEach((line, index) => {
    const lineNum = index + 1;
    const trimmedLine = line.trim();

    // Skip empty lines or comment lines starting with # or //
    if (!trimmedLine || trimmedLine.startsWith('#') || trimmedLine.startsWith('//')) {
      return;
    }

    const parts = trimmedLine.split('|').map(p => p.trim());

    // Validation: We need at least 4 parts: Question, Option1, Option2, CorrectAnswer
    // Note: The user's specification states (Pregunta|Opcion1|Opcion2|RespuestaCorrecta)
    if (parts.length < 4) {
      ignoredLines.push({
        lineNum,
        content: line,
        reason: 'Formato incorrecto. Debe tener al menos una pregunta, dos opciones y la respuesta correcta, separados por "|".'
      });
      return;
    }

    const questionText = parts[0];
    const rawCorrectAnswer = parts[parts.length - 1];
    const options = parts.slice(1, parts.length - 1);

    // Validate that the question and options are not empty
    if (!questionText) {
      ignoredLines.push({
        lineNum,
        content: line,
        reason: 'La pregunta no puede estar vacía.'
      });
      return;
    }

    if (options.some(opt => !opt)) {
      ignoredLines.push({
        lineNum,
        content: line,
        reason: 'Una o más opciones de respuesta están vacías.'
      });
      return;
    }

    // Determine correct answer index
    let correctAnswerIdx = -1;

    // 1. Try to parse as integer (0-based or 1-based index)
    const intVal = parseInt(rawCorrectAnswer, 10);
    if (!isNaN(intVal)) {
      // Check if it matches index in options bounds (0-based)
      if (intVal >= 0 && intVal < options.length) {
        correctAnswerIdx = intVal;
      }
      // Check if it matches index in options bounds (1-based)
      else if (intVal >= 1 && intVal <= options.length) {
        correctAnswerIdx = intVal - 1;
      }
    }

    // 2. If index didn't resolve, try exact string matching (case-insensitive)
    if (correctAnswerIdx === -1) {
      const lowerCorrect = rawCorrectAnswer.toLowerCase();
      correctAnswerIdx = options.findIndex(opt => opt.toLowerCase() === lowerCorrect);
    }

    // 3. Fallback to 0 if not matching or valid
    if (correctAnswerIdx === -1) {
      correctAnswerIdx = 0;
      // Log warning but don't reject the line, we just fallback to the first option
    }

    const id = crypto.randomUUID();
    const type = options.length === 2 && 
                 options.some(o => o.toLowerCase() === 'verdadero' || o.toLowerCase() === 'verdadero') &&
                 options.some(o => o.toLowerCase() === 'falso' || o.toLowerCase() === 'falso')
                 ? 'true-false' 
                 : 'multiple-choice';

    const questionItem: LessonItem = {
      type: 'question',
      data: {
        id,
        type,
        question: questionText,
        options,
        correctAnswer: correctAnswerIdx,
        feedback: `La respuesta correcta es: ${options[correctAnswerIdx]}.`,
        isDraft: false
      } as Question
    };

    items.push(questionItem);
    successCount++;
  });

  return {
    items,
    successCount,
    ignoredLines
  };
}
