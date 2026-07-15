/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef } from 'react';
import { Upload, File, X, Loader2, FileWarning } from 'lucide-react';
import * as mammoth from 'mammoth';
import * as pdfjsLib from 'pdfjs-dist';

// Configure PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;

interface Props {
  onTextExtracted: (text: string) => void;
  maxFiles?: number;
}

export const FileUpload: React.FC<Props> = ({ onTextExtracted, maxFiles = 3 }) => {
  const [files, setFiles] = useState<File[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []) as File[];
    if (files.length + selectedFiles.length > maxFiles) {
      setError(`Solo puedes subir hasta ${maxFiles} archivos.`);
      return;
    }

    const validFiles = selectedFiles.filter(f => 
      f.type === 'text/plain' || 
      f.type === 'application/pdf' || 
      f.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
      f.name.endsWith('.txt') || f.name.endsWith('.pdf') || f.name.endsWith('.docx')
    );

    if (validFiles.length < selectedFiles.length) {
      setError('Algunos archivos tienen formatos no soportados (solo PDF, DOCX, TXT).');
    } else {
      setError(null);
    }

    const newFiles = [...files, ...validFiles];
    setFiles(newFiles);
    processFiles(newFiles);
  };

  const processFiles = async (allFiles: File[]) => {
    if (allFiles.length === 0) return;
    setIsProcessing(true);
    let combinedText = "";

    try {
      for (const file of allFiles) {
        if (file.name.endsWith('.txt') || file.type === 'text/plain') {
          const text = await file.text();
          combinedText += `\n--- Archivo: ${file.name} ---\n${text}\n`;
        } else if (file.name.endsWith('.docx')) {
          const arrayBuffer = await file.arrayBuffer();
          const result = await mammoth.extractRawText({ arrayBuffer });
          combinedText += `\n--- Archivo: ${file.name} ---\n${result.value}\n`;
        } else if (file.name.endsWith('.pdf')) {
          const arrayBuffer = await file.arrayBuffer();
          const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
          let pdfText = "";
          for (let i = 1; i <= pdf.numPages; i++) {
            const page = await pdf.getPage(i);
            const textContent = await page.getTextContent();
            pdfText += textContent.items.map((item: any) => item.str).join(' ') + '\n';
          }
          combinedText += `\n--- Archivo: ${file.name} ---\n${pdfText}\n`;
        }
      }
      onTextExtracted(combinedText);
    } catch (err) {
      console.error('Error processing files:', err);
      setError('Hubo un error al procesar los archivos. Intenta de nuevo.');
    } finally {
      setIsProcessing(false);
    }
  };

  const removeFile = (index: number) => {
    const newFiles = files.filter((_, i) => i !== index);
    setFiles(newFiles);
    processFiles(newFiles);
  };

  return (
    <div className="space-y-4">
      <div 
        onClick={() => fileInputRef.current?.click()}
        className="border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-2xl p-8 text-center hover:border-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/10 transition-all cursor-pointer group"
      >
        <input 
          type="file" 
          ref={fileInputRef} 
          onChange={handleFileChange} 
          multiple 
          accept=".pdf,.docx,.txt"
          className="hidden"
        />
        <div className="bg-indigo-100 dark:bg-indigo-900/30 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
          <Upload className="text-indigo-600 dark:text-indigo-400" size={28} />
        </div>
        <h3 className="font-bold text-lg text-slate-800 dark:text-white">Sube tus documentos</h3>
        <p className="text-slate-500 dark:text-slate-400 text-sm max-w-xs mx-auto">
          Arrastra o selecciona hasta 3 archivos (PDF, Word o Texto) para generar las preguntas.
        </p>
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 p-3 rounded-lg flex items-center gap-2 text-sm border border-red-100 dark:border-red-900/50">
          <FileWarning size={16} />
          {error}
        </div>
      )}

      {files.length > 0 && (
        <div className="grid gap-2">
          {files.map((file, i) => (
            <div key={i} className="flex items-center justify-between p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-sm">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-slate-100 dark:bg-slate-700 rounded-lg">
                  <File size={18} className="text-slate-600 dark:text-slate-400" />
                </div>
                <div className="flex flex-col">
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-200 truncate max-w-[200px]">{file.name}</span>
                  <span className="text-[10px] text-slate-400 uppercase">{(file.size / 1024).toFixed(1)} KB</span>
                </div>
              </div>
              <button 
                onClick={(e) => { e.stopPropagation(); removeFile(i); }}
                className="text-slate-400 hover:text-red-500 p-1"
              >
                <X size={18} />
              </button>
            </div>
          ))}
        </div>
      )}

      {isProcessing && (
        <div className="flex items-center justify-center gap-2 text-indigo-600 dark:text-indigo-400 font-medium py-2">
          <Loader2 className="animate-spin" size={18} />
          <span className="text-sm">Analizando documentos...</span>
        </div>
      )}
    </div>
  );
};
