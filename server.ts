/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';
import Groq from 'groq-sdk';
import dotenv from 'dotenv';

dotenv.config();

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  app.post("/api/generate-illustration", async (req, res) => {
  try {
    const { title, type } = req.body;
    if (!title) {
      return res.status(400).json({ error: "Title is required" });
    }

    const ai = getGeminiClient();
    
    // Prompt optimizado para ilustraciones educativas
    const prompt = `Una ilustración educativa y profesional de estilo plano o vectorial para el tema: "${title}". 
    El estilo debe ser limpio, con colores vibrantes y fondo blanco o neutro para que se integre bien en un curso online. 
    Debe representar el concepto de forma clara y amigable.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.1-flash-lite-image',
      contents: {
        parts: [{ text: prompt }],
      },
      config: {
        imageConfig: {
          aspectRatio: "1:1"
        }
      }
    });

    let imageData = null;
    for (const part of response.candidates[0].content.parts) {
      if (part.inlineData) {
        imageData = `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
        break;
      }
    }

    if (!imageData) {
      throw new Error("No se pudo generar la imagen");
    }

    res.json({ imageUrl: imageData });
  } catch (error: any) {
    console.error("Image generation error:", error);
    res.status(500).json({ error: error.message || "Error al generar la ilustración" });
  }
});

app.post("/api/improve-item", async (req, res) => {
  try {
    const { item } = req.body;
    if (!item) return res.status(400).json({ error: "Item is required" });

    const complexity = item.data.complexity || 'intermedio';
    
    let prompt = "";
    if (item.type === 'question') {
      prompt = `
        Mejora la siguiente pregunta educativa para hacerla más efectiva pedagógicamente.
        Objetivo:
        1. Refinar el enunciado para que sea claro y unívoco.
        2. Crear distractores (opciones incorrectas) que sean plausibles y obliguen a pensar (no absurdos).
        3. Mejorar el feedback general para que explique brevemente el "porqué" de la respuesta correcta.
        4. Opcional pero muy recomendado: Proporcionar un array llamado "optionsFeedback" del mismo tamaño de las opciones, con una explicación adaptada para el alumno en caso de que elija cada opción correspondiente (por ejemplo explicando por qué tal opción es incorrecta o por qué es la correcta).
        
        REGLA CRÍTICA DE REDACCIÓN PARA EL FEEDBACK Y OPTIONSFEEDBACK:
        Bajo ninguna circunstancia incluyas frases que hagan referencia explícita a que un "texto" o "presentación" es la fuente de información. No uses frases como "El texto indica", "según la presentación", "El texto menciona", "El texto afirma", "El texto explícitamente advierte:", ni "El texto enfatiza:". Explica o justifica los conceptos de manera directa, objetiva y autónoma (por ejemplo, escribe "La fotosíntesis ocurre en..." en lugar de "El texto indica que la fotosíntesis ocurre en...").

        Mantén el nivel de complejidad: ${complexity}.
        Pregunta actual:
        Enunciado: ${item.data.question}
        Opciones: ${JSON.stringify(item.data.options)}
        Respuesta correcta (índice): ${item.data.correctAnswer}
        Feedback actual: ${item.data.feedback}
        Feedback por opciones actual: ${JSON.stringify(item.data.optionsFeedback || [])}
        
        Responde ÚNICAMENTE con un JSON que contenga los campos "question", "options" (array de strings), "correctAnswer", "feedback" y "optionsFeedback" (un array de strings con un mensaje pedagógico claro para cada opción).
      `;
    } else {
      prompt = `
        Mejora el siguiente contenido educativo para hacerlo más conciso, profesional y fácil de entender.
        Título actual: ${item.data.title}
        Contenido actual: ${item.data.content}
        
        Responde ÚNICAMENTE con un JSON que contenga los campos "title" y "content".
      `;
    }

    let improvedData;
    if (process.env.GROQ_API_KEY) {
      const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
      const completion = await groq.chat.completions.create({
        messages: [{ role: 'user', content: prompt }],
        model: 'llama-3.3-70b-versatile',
        response_format: { type: 'json_object' }
      });
      improvedData = JSON.parse(completion.choices[0]?.message?.content || '{}');
    } else {
      const ai = getGeminiClient();
      const result = await callGeminiWithFallback(ai, {
        contents: prompt,
        config: { responseMimeType: 'application/json' }
      });
      improvedData = JSON.parse(result.text || '{}');
    }

    if (item.type === 'question') {
      improvedData = sanitizeQuestionFeedbacks(improvedData);
    }

    res.json(improvedData);
  } catch (error: any) {
    console.error("Improvement error:", error);
    res.status(500).json({ error: error.message || "Error al mejorar el contenido" });
  }
});

app.post("/api/rewrite-question", async (req, res) => {
  try {
    const { questionText } = req.body;
    if (!questionText || !questionText.trim()) {
      return res.status(400).json({ error: "El enunciado de la pregunta es requerido." });
    }

    const prompt = `
      Reescribe el siguiente enunciado de una pregunta de evaluación para hacerlo más claro, preciso, profesional y directo.
      El enunciado reescrito debe ser auto-contenido y no debe hacer referencia a "el texto", "la presentación" o "el material de lectura" (regla crítica: explica los conceptos de manera directa y autónoma sin referenciar el material de origen).
      
      Enunciado actual:
      ${questionText}
      
      Responde ÚNICAMENTE con un objeto JSON con la siguiente estructura:
      {
        "rewrittenText": "Texto de la pregunta mejorado y reescrito"
      }
    `;

    const ai = getGeminiClient();
    const result = await callGeminiWithFallback(ai, {
      contents: prompt,
      config: { 
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            rewrittenText: { type: Type.STRING }
          },
          required: ['rewrittenText']
        }
      }
    });
    
    const data = JSON.parse(result.text || '{}');
    res.json(data);
  } catch (error: any) {
    console.error("Error in /api/rewrite-question:", error);
    res.status(500).json({ error: error.message || "Error al reescribir la pregunta" });
  }
});

app.post("/api/generate-distractors", async (req, res) => {
  try {
    const { question } = req.body;
    if (!question || typeof question !== 'object') {
      return res.status(400).json({ error: "La pregunta es requerida." });
    }

    const complexity = question.complexity || 'intermedio';
    const type = question.type || 'multiple-choice';
    const questionText = question.question;
    const currentOptions = question.options || [];
    const correctAnswerIndex = typeof question.correctAnswer === 'number' ? question.correctAnswer : 0;
    
    const hasCorrectAnswerText = currentOptions[correctAnswerIndex] && currentOptions[correctAnswerIndex].trim().length > 0;
    const correctAnswerText = hasCorrectAnswerText ? currentOptions[correctAnswerIndex] : '';

    const prompt = `
      Analiza la siguiente pregunta de evaluación e identifica o genera la respuesta correcta y las opciones distractoras (incorrectas) correspondientes.
      
      Tipo de pregunta: ${type}
      Nivel de complejidad: ${complexity}
      Enunciado de la pregunta: ${questionText}
      Opciones actuales (si existen): ${JSON.stringify(currentOptions)}
      Respuesta correcta actual (índice): ${correctAnswerIndex}
      ${correctAnswerText ? `La respuesta correcta esperada es: "${correctAnswerText}"` : 'Por favor deduce cuál es la respuesta correcta apropiada para este enunciado y colócala en las opciones.'}
      
      INSTRUCCIONES:
      1. Si el tipo es "true-false", genera exactamente dos opciones: ["Verdadero", "Falso"] o similar, y determina cuál es el índice correcto (0 o 1).
      2. Si el tipo es "multiple-choice", genera exactamente 4 opciones de respuesta lógicas y plausibles. Una de ellas debe ser la respuesta correcta.
      3. Genera un feedback general explicativo ("feedback") breve sobre por qué la respuesta correcta es la que es.
      4. Genera un array de feedback por opción ("optionsFeedback") del mismo tamaño que las opciones, proporcionando un micro-comentario pedagógico para cada opción (explicando por qué es correcta o por qué es un distractor incorrecto).
      
      REGLA CRÍTICA DE REDACCIÓN (FEEDBACK Y OPTIONSFEEDBACK):
      Bajo ninguna circunstancia utilices frases que hagan referencia a un texto de origen o presentación, tales como: 'El texto indica', 'según la presentación', 'El texto menciona', 'El texto afirma', 'El texto explícitamente advierte:', 'El texto enfatiza:' o variaciones similares. Las explicaciones deben redactarse de manera conceptual, autónoma e impersonal.
      
      Responde ÚNICAMENTE con un JSON válido con la siguiente estructura:
      {
        "options": ["Opción 1", "Opción 2", "Opción 3", "Opción 4"],
        "correctAnswer": 0,
        "feedback": "Feedback explicativo general",
        "optionsFeedback": ["Micro-feedback opción 1", "Micro-feedback opción 2", "Micro-feedback opción 3", "Micro-feedback opción 4"]
      }
    `;

    const ai = getGeminiClient();
    const result = await callGeminiWithFallback(ai, {
      contents: prompt,
      config: { 
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            options: { type: Type.ARRAY, items: { type: Type.STRING } },
            correctAnswer: { type: Type.INTEGER },
            feedback: { type: Type.STRING },
            optionsFeedback: { type: Type.ARRAY, items: { type: Type.STRING } }
          },
          required: ['options', 'correctAnswer', 'feedback', 'optionsFeedback']
        }
      }
    });
    
    let responseData = JSON.parse(result.text || '{}');
    responseData = sanitizeQuestionFeedbacks(responseData);
    res.json(responseData);
  } catch (error: any) {
    console.error("Error in /api/generate-distractors:", error);
    res.status(500).json({ error: error.message || "Error al generar distractores" });
  }
});

// Helper to make Gemini API calls robust with retries and fallback models
async function callGeminiWithFallback(ai: any, params: { contents: any; config?: any }) {
  const modelsToTry = ['gemini-3.5-flash', 'gemini-3.1-flash-lite', 'gemini-flash-latest'];
  let lastError: any = null;

  for (let i = 0; i < modelsToTry.length; i++) {
    const currentModel = modelsToTry[i];
    const maxRetries = 1; // 1 reintento (2 intentos en total por modelo) para evitar timeouts acumulados
    
    for (let attempt = 1; attempt <= maxRetries + 1; attempt++) {
      try {
        console.log(`[Gemini API] Modelo: ${currentModel} - Intento ${attempt}/${maxRetries + 1}`);
        const response = await ai.models.generateContent({
          model: currentModel,
          contents: params.contents,
          config: params.config,
        });
        console.log(`[Gemini API] Éxito usando el modelo ${currentModel} en el intento ${attempt}`);
        return response;
      } catch (error: any) {
        lastError = error;
        const status = error.status || error.code || (error.message && (error.message.includes('503') || error.message.includes('unavailable')) ? 503 : null);
        console.warn(`[Gemini API] Modelo ${currentModel} intento ${attempt} falló. Código: ${status}. Error: ${error.message}`);
        
        // Si el error es de alta demanda/sobrecarga (503) o límite de tarifa (429), pasamos directamente al siguiente modelo de fallback
        if (status === 503 || status === 429) {
          console.log(`[Gemini API] Sobrecarga detectada en ${currentModel}. Saltando de inmediato al siguiente modelo de fallback.`);
          break; // Sale del bucle de reintentos para este modelo y va al siguiente
        }

        // Si hay intentos restantes, esperar con retroceso exponencial antes del siguiente reintento
        if (attempt <= maxRetries) {
          const delayMs = attempt * 1000;
          console.log(`[Gemini API] Esperando ${delayMs}ms antes de reintentar con el modelo ${currentModel}...`);
          await new Promise(resolve => setTimeout(resolve, delayMs));
        }
      }
    }

    // Si todos los intentos para este modelo fallan, esperar un momento antes del siguiente modelo de fallback
    if (i < modelsToTry.length - 1) {
      const fallbackDelayMs = 500;
      console.log(`[Gemini API] Cambiando al siguiente modelo de fallback en ${fallbackDelayMs}ms...`);
      await new Promise(resolve => setTimeout(resolve, fallbackDelayMs));
    }
  }

  throw lastError || new Error("Todos los modelos de fallback y reintentos fallaron");
}

// Helper for shared client
function getGeminiClient() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY no configurada");
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      }
    }
  });
}

const PORT = 3000;

  // AI Generation Route (Supports Gemini)
  app.post('/api/adapt-quiz', async (req, res) => {
    try {
      const { text, systemPrompt } = req.body;
      if (!text || !text.trim()) {
        return res.status(400).json({ error: 'El contenido del cuestionario es requerido.' });
      }

      const prompt = `
        ${systemPrompt ? `ROLES Y ENFOQUE PEDAGÓGICO DE LA IA (APLICAR ESTRICTAMENTE ESTE TONO Y ENFOQUE):
        ${systemPrompt}
        
        --------------------------------------------------` : ''}

        Analiza el siguiente texto que contiene un cuestionario/evaluación ya redactado por un docente.
        Tu tarea es extraer, estructurar y adaptar TODAS las preguntas al formato JSON requerido conservando la intención original pero enriqueciéndolas pedagógicamente.
        
        INSTRUCCIONES DE ADAPTACIÓN:
        1. Extrae cada pregunta con sus opciones disponibles.
        2. Determina el índice de la respuesta correcta (comenzando en 0 para la primera opción, 1 para la segunda, etc.). Si el cuestionario no indica explícitamente cuál es la correcta, analízala racionalmente y deduce la respuesta correcta para colocar el índice idóneo.
        3. Para cada pregunta, define un nivel de complejidad adecuado: 'básico', 'intermedio' o 'avanzado' según la dificultad pedagógica del tema.
        4. Redacta una explicación pedagógica general y breve ("feedback") explicando por qué la respuesta correcta es la que es.
        5. Redacta un micro-comentario pedagógico para cada opción de respuesta ("optionsFeedback"), explicando brevemente por qué esa opción en particular es correcta o incorrecta. Esto es indispensable para el LMS SCORM.
        6. Clasificación de tipo:
           - Si la pregunta posee solo 2 opciones típicas como Verdadero/Falso, Sí/No, configúrala como "true-false".
           - Si posee 3 o más opciones, configúrala como "multiple-choice".
        7. REGLA CRÍTICA DE REDACCIÓN (FEEDBACK Y OPTIONSFEEDBACK):
           Bajo ninguna circunstancia utilices frases que refieran a un texto de origen o presentación, tales como: 'El texto indica', 'según la presentación', 'El texto menciona', 'El texto afirma', 'El texto explícitamente advierte:', 'El texto enfatiza:' o variaciones similares. Las explicaciones deben redactarse de manera conceptual, autónoma e impersonal (por ejemplo, escribe 'La fotosíntesis es...' en lugar de 'El texto menciona que la fotosíntesis es...').

        Responde ÚNICAMENTE con un JSON válido que sea un array de objetos con esta estructura exacta:
        [
          {
            "type": "multiple-choice" | "true-false",
            "complexity": "básico" | "intermedio" | "avanzado",
            "question": "Texto de la pregunta",
            "options": ["Opción 1", "Opción 2", "Opción 3", ...],
            "correctAnswer": 0,
            "feedback": "Explicación pedagógica general",
            "optionsFeedback": ["Micro-feedback opción 1", "Micro-feedback opción 2", ...]
          }
        ]

        CUESTIONARIO PROVISTO POR EL USUARIO:
        ${text}
      `;

      if (process.env.GEMINI_API_KEY) {
        const ai = new GoogleGenAI({
          apiKey: process.env.GEMINI_API_KEY,
          httpOptions: { headers: { 'User-Agent': 'aistudio-build' } }
        });

        const result = await callGeminiWithFallback(ai, {
          contents: prompt,
          config: {
            responseMimeType: 'application/json',
            responseSchema: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  type: { type: Type.STRING, enum: ['multiple-choice', 'true-false'] },
                  complexity: { type: Type.STRING, enum: ['básico', 'intermedio', 'avanzado'] },
                  question: { type: Type.STRING },
                  options: { type: Type.ARRAY, items: { type: Type.STRING } },
                  correctAnswer: { type: Type.INTEGER },
                  feedback: { type: Type.STRING },
                  optionsFeedback: { type: Type.ARRAY, items: { type: Type.STRING } }
                },
                required: ['type', 'complexity', 'question', 'options', 'correctAnswer', 'feedback', 'optionsFeedback']
              }
            }
          }
        });
        
        const questions = JSON.parse(result.text || '[]').map(sanitizeQuestionFeedbacks);
        return res.json(questions);
      }

      res.status(500).json({ error: 'La clave GEMINI_API_KEY no está configurada en el servidor.' });
    } catch (error: any) {
      console.error('Error in /api/adapt-quiz:', error);
      res.status(500).json({ error: error.message || 'Error al adaptar el cuestionario.' });
    }
  });

  // AI Generation Route (Supports Gemini)
  app.post('/api/generate-questions', async (req, res) => {
    try {
      const { text, breakdown, trueFalseCount = 0, systemPrompt } = req.body;
      
      const complexityLevels = ['básico', 'intermedio', 'avanzado'];
      const complexityInstructions = {
        'básico': 'Usa un lenguaje sencillo y directo. Enfócate en conceptos fundamentales y definiciones claras.',
        'intermedio': 'Usa un lenguaje técnico moderado. Requiere que el usuario relacione conceptos.',
        'avanzado': 'Usa un lenguaje profesional avanzado. Requiere razonamiento crítico y distractores plausibles.'
      };

      if (!breakdown || typeof breakdown !== 'object') {
        return res.status(400).json({ error: 'Breakdown is required' });
      }

      const mcCount = Object.values(breakdown).reduce((a: any, b: any) => a + (Number(b) || 0), 0) as number;
      const totalRequested = mcCount + Number(trueFalseCount);
      if (totalRequested === 0) return res.json([]);

      const prompt = `
        ${systemPrompt ? `ROLES Y ENFOQUE PEDAGÓGICO DE LA IA (APLICAR ESTRICTAMENTE ESTE TONO Y ENFOQUE):
        ${systemPrompt}
        
        --------------------------------------------------` : ''}

        Analiza el siguiente texto y genera EXACTAMENTE ${totalRequested} preguntas de evaluación.
        
        REQUISITOS DE FORMATO Y CANTIDAD:
        1. Preguntas de Opción Múltiple (múltiple-choice): Genera EXACTAMENTE ${mcCount} preguntas de opción múltiple (con 4 opciones de respuesta).
           Su distribución por dificultad debe ser:
           ${Object.entries(breakdown).map(([level, count]) => `- ${level}: ${count} preguntas`).join('\n')}
        
        2. Preguntas de Verdadero o Falso (true-false): Genera EXACTAMENTE ${trueFalseCount} preguntas de tipo verdadero o falso.
           Cada una de estas preguntas debe tener exactamente dos opciones: ["Verdadero", "Falso"].
           Distribuye su nivel de complejidad equitativamente o según corresponda.
        
        Instrucciones de complejidad por nivel:
        ${complexityLevels.map(l => `- ${l}: ${complexityInstructions[l as keyof typeof complexityInstructions]}`).join('\n')}

        IMPORTANTE: Cada objeto en el JSON resultante DEBE incluir un campo "complexity" con el nivel asignado ('básico', 'intermedio' o 'avanzado').

        REGLA CRÍTICA DE REDACCIÓN PARA FEEDBACK Y OPTIONSFEEDBACK:
        Bajo ninguna circunstancia incluyas menciones o frases que hagan referencia explícita al texto fuente o presentación, tales como: 'El texto indica', 'según la presentación', 'El texto menciona', 'El texto afirma', 'El texto explícitamente advierte:', 'El texto enfatiza:' o variaciones similares. Las explicaciones deben redactarse de manera autónoma, conceptual e impersonal, justificando la respuesta correcta o explicando el error de forma directa sin referenciar el material de origen (por ejemplo, escribe 'La fotosíntesis es...' en lugar de 'El texto menciona que la fotosíntesis es...').
        
        Responde ÚNICAMENTE con un JSON válido que sea un array de objetos con esta estructura:
        [
          {
            "type": "multiple-choice" | "true-false",
            "complexity": "básico" | "intermedio" | "avanzado",
            "question": "texto de la pregunta",
            "options": ["opcion1", "opcion2", ...],
            "correctAnswer": 0,
            "feedback": "explicación pedagógica breve",
            "optionsFeedback": ["feedback1", "feedback2", ...]
          }
        ]
        
        Texto fuente:
        ${text}
      `;

      if (process.env.GEMINI_API_KEY) {
        const ai = new GoogleGenAI({
          apiKey: process.env.GEMINI_API_KEY,
          httpOptions: { headers: { 'User-Agent': 'aistudio-build' } }
        });

        const result = await callGeminiWithFallback(ai, {
          contents: prompt,
          config: {
            responseMimeType: 'application/json',
            responseSchema: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  type: { type: Type.STRING, enum: ['multiple-choice', 'true-false'] },
                  complexity: { type: Type.STRING, enum: ['básico', 'intermedio', 'avanzado'] },
                  question: { type: Type.STRING },
                  options: { type: Type.ARRAY, items: { type: Type.STRING } },
                  correctAnswer: { type: Type.INTEGER },
                  feedback: { type: Type.STRING },
                  optionsFeedback: { type: Type.ARRAY, items: { type: Type.STRING } }
                },
                required: ['type', 'complexity', 'question', 'options', 'correctAnswer', 'feedback', 'optionsFeedback']
              }
            }
          }
        });
        
        const questions = JSON.parse(result.text || '[]').map(sanitizeQuestionFeedbacks);
        return res.json(questions);
      }

      res.status(500).json({ error: 'GEMINI_API_KEY is not configured' });
    } catch (error) {
      console.error('Error generating questions:', error);
      res.status(500).json({ error: 'Failed to generate questions' });
    }
  });

  // Tutor Mode: Pedagogy and Wording Review
  app.post('/api/tutor-review', async (req, res) => {
    try {
      const { questions, systemPrompt } = req.body;
      if (!questions || !Array.isArray(questions) || questions.length === 0) {
        return res.status(400).json({ error: 'Se requiere una lista de preguntas para analizar.' });
      }

      const prompt = `
        ${systemPrompt ? `ROLES Y ENFOQUE PEDAGÓGICO DE LA IA (APLICAR ESTRICTAMENTE ESTE TONO Y ENFOQUE):
        ${systemPrompt}
        
        --------------------------------------------------` : ''}

        Eres un Diseñador Instruccional Experto y Tutor Pedagógico.
        Tu tarea es revisar las preguntas de este cuestionario y proponer mejoras en su redacción, rigor pedagógico, claridad y efectividad de la retroalimentación.
        
        PREGUNTAS DEL CUESTIONARIO A REVISAR:
        ${JSON.stringify(questions)}
        
        REGLA CRÍTICA DE REDACCIÓN (FEEDBACK Y OPTIONSFEEDBACK):
        Bajo ninguna circunstancia incluyas menciones o frases que hagan referencia explícita al texto fuente o presentación, tales como: 'El texto indica', 'según la presentación', 'El texto menciona', 'El texto afirma', 'El texto explícitamente advierte:', 'El texto enfatiza:' o variaciones similares. Las explicaciones deben redactarse de manera autónoma, conceptual e impersonal, justificando la respuesta correcta o explicando el error de forma directa sin referenciar el material de origen.

        Para cada pregunta provista, analiza si cumple con altos estándares pedagógicos (enunciado unívoco, sin dobles negativos, opciones bien diferenciadas y feedback constructivo). Proporciona sugerencias de mejora estructuradas para todas las preguntas.
        
        Responde ÚNICAMENTE con un JSON válido con la siguiente estructura:
        {
          "overallEvaluation": "Evaluación pedagógica general de todo el cuestionario, indicando fortalezas y aspectos de mejora global.",
          "reviews": [
            {
              "id": "id_de_la_pregunta",
              "hasSuggestions": true,
              "critique": "Breve explicación pedagógica de por qué se sugiere modificar la redacción o estructura para mejorar la claridad.",
              "suggestedQuestion": "Texto de la pregunta reescrito para mayor claridad",
              "suggestedOptions": ["Opción 1 corregida", "Opción 2 corregida", "Opción 3 corregida", "Opción 4 corregida"],
              "suggestedFeedback": "Feedback general corregido y mejorado para fines pedagógicos",
              "suggestedOptionsFeedback": ["Feedback opción 1 corregido", "Feedback opción 2 corregido", ...]
            }
          ]
        }
      `;

      if (process.env.GEMINI_API_KEY) {
        const ai = new GoogleGenAI({
          apiKey: process.env.GEMINI_API_KEY,
          httpOptions: { headers: { 'User-Agent': 'aistudio-build' } }
        });

        const result = await callGeminiWithFallback(ai, {
          contents: prompt,
          config: {
            responseMimeType: 'application/json',
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                overallEvaluation: { type: Type.STRING },
                reviews: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      id: { type: Type.STRING },
                      hasSuggestions: { type: Type.BOOLEAN },
                      critique: { type: Type.STRING },
                      suggestedQuestion: { type: Type.STRING },
                      suggestedOptions: { type: Type.ARRAY, items: { type: Type.STRING } },
                      suggestedFeedback: { type: Type.STRING },
                      suggestedOptionsFeedback: { type: Type.ARRAY, items: { type: Type.STRING } }
                    },
                    required: ['id', 'hasSuggestions', 'critique', 'suggestedQuestion', 'suggestedOptions', 'suggestedFeedback', 'suggestedOptionsFeedback']
                  }
                }
              },
              required: ['overallEvaluation', 'reviews']
            }
          }
        });

        const responseData = JSON.parse(result.text || '{}');
        
        // Sanitize the feedback fields of each suggested review
        if (responseData && Array.isArray(responseData.reviews)) {
          responseData.reviews = responseData.reviews.map((r: any) => {
            if (r.suggestedFeedback) {
              r.suggestedFeedback = cleanFeedbackPhrases(r.suggestedFeedback);
            }
            if (Array.isArray(r.suggestedOptionsFeedback)) {
              r.suggestedOptionsFeedback = r.suggestedOptionsFeedback.map((f: any) =>
                typeof f === 'string' ? cleanFeedbackPhrases(f) : f
              );
            }
            return r;
          });
        }

        return res.json(responseData);
      }

      res.status(500).json({ error: 'La clave GEMINI_API_KEY no está configurada en el servidor.' });
    } catch (error: any) {
      console.error('Error in /api/tutor-review:', error);
      res.status(500).json({ error: error.message || 'Error al ejecutar el tutor de IA.' });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

function cleanFeedbackPhrases(text: string): string {
  if (!text) return text;
  
  let cleaned = text;

  // Replace forbidden phrases with empty string or clean up gracefully
  cleaned = cleaned.replace(/el texto explícitamente advierte:\s*/gi, '');
  cleaned = cleaned.replace(/el texto enfatiza:\s*"/gi, '');
  cleaned = cleaned.replace(/el texto enfatiza:\s*/gi, '');
  cleaned = cleaned.replace(/el texto indica que\s+/gi, '');
  cleaned = cleaned.replace(/el texto indica\s+/gi, '');
  cleaned = cleaned.replace(/según la presentación,?\s*/gi, '');
  cleaned = cleaned.replace(/el texto menciona que\s+/gi, '');
  cleaned = cleaned.replace(/el texto menciona\s+/gi, '');
  cleaned = cleaned.replace(/el texto afirma que\s+/gi, '');
  cleaned = cleaned.replace(/el texto afirma\s+/gi, '');

  // Trim and fix capitalization of the first letter if needed
  cleaned = cleaned.trim();
  if (cleaned.length > 0) {
    if (cleaned.startsWith('"') && cleaned.length > 1) {
      cleaned = '"' + cleaned.charAt(1).toUpperCase() + cleaned.slice(2);
    } else {
      cleaned = cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
    }
  }

  return cleaned;
}

function sanitizeQuestionFeedbacks(question: any): any {
  if (!question || typeof question !== 'object') return question;
  
  if (typeof question.feedback === 'string') {
    question.feedback = cleanFeedbackPhrases(question.feedback);
  }
  
  if (Array.isArray(question.optionsFeedback)) {
    question.optionsFeedback = question.optionsFeedback.map((f: any) => 
      typeof f === 'string' ? cleanFeedbackPhrases(f) : f
    );
  }
  
  return question;
}

startServer();
