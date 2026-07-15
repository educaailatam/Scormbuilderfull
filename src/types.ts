/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type ThemeType = 'neon' | 'corporate' | 'minimal' | 'high-contrast' | 'sunset' | 'forest' | 'cosmic';
export type ComplexityLevel = 'básico' | 'intermedio' | 'avanzado';

export interface Question {
  id: string;
  type: 'multiple-choice' | 'true-false';
  question: string;
  options: string[];
  correctAnswer: number;
  feedback: string;
  optionsFeedback?: string[];
  complexity?: ComplexityLevel;
  imageUrl?: string;
  imageAlt?: string;
  isDraft?: boolean;
}

export interface ContentSlide {
  id: string;
  title: string;
  content: string;
  imageUrl?: string;
  imageAlt?: string;
  isDraft?: boolean;
}

export type LessonItem = { type: 'question'; data: Question } | { type: 'content'; data: ContentSlide };

export interface QuizBundle {
  title: string;
  theme: ThemeType;
  items: LessonItem[];
  timeLimit?: number; // in minutes
  shuffleQuestions?: boolean;
  kioskMode?: boolean;
  feedbackTiming?: 'immediate' | 'end';
  pointsPerQuestion?: number;
  passingScore?: number;
  neonPrimaryColor?: string;
  neonAccentColor?: string;
}
