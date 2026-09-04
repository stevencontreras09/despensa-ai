'use client';

import { useState, useRef } from 'react';
import { Camera, Upload, AlertCircle, Loader2, Sparkles, Image as ImageIcon } from 'lucide-react';

interface TicketUploaderProps {
  householdId: string;
  onExtractionComplete: (data: any) => void;
}

export function TicketUploader({ householdId, onExtractionComplete }: TicketUploaderProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Por favor selecciona un archivo de imagen válido (JPG, PNG, WEBP).');
      return;
    }

    setError(null);
    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  };

  const handleUploadAndScan = async () => {
    if (!selectedFile) return;

    setIsLoading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('ticket', selectedFile);

      const response = await fetch(`/api/v1/households/${householdId}/ai/scan-ticket`, {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error al procesar el ticket con IA');
      }

      onExtractionComplete(data);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Error de conexión con el servidor');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      {error && (
        <div className="p-4 rounded-2xl bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-900/50 flex items-start gap-3 text-red-700 dark:text-red-300 text-sm">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-red-500" />
          <span>{error}</span>
        </div>
      )}

      {/* Hidden Inputs */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
      />
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={handleFileChange}
      />

      {/* Upload Box / Preview */}
      {!previewUrl ? (
        <div className="border-2 border-dashed border-stone-300 dark:border-stone-700 hover:border-emerald-500 dark:hover:border-emerald-500 rounded-3xl p-8 text-center transition-all bg-white dark:bg-stone-900 flex flex-col items-center justify-center min-h-[260px]">
          <div className="w-16 h-16 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-4 shadow-sm">
            <Camera className="w-8 h-8" />
          </div>
          <h3 className="text-base font-bold text-stone-900 dark:text-white">
            Escanea o sube la foto de tu ticket
          </h3>
          <p className="text-xs text-stone-500 dark:text-stone-400 max-w-xs mt-1 mb-6">
            Gemini 3.7 Flash normaliza los productos, descarta no-comestibles y calcula la caducidad
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => cameraInputRef.current?.click()}
              className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-md flex items-center gap-2 active:scale-95"
            >
              <Camera className="w-4 h-4" />
              Tomar Foto con Cámara
            </button>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="px-4 py-2.5 rounded-xl bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 dark:hover:bg-stone-700 text-stone-800 dark:text-stone-200 text-xs font-semibold transition-all flex items-center gap-2 active:scale-95"
            >
              <Upload className="w-4 h-4" />
              Subir desde Galería
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-white dark:bg-stone-900 rounded-3xl p-5 border border-stone-200 dark:border-stone-800 shadow-md">
          <div className="relative rounded-2xl overflow-hidden max-h-80 bg-stone-100 dark:bg-stone-950 flex items-center justify-center mb-4">
            <img
              src={previewUrl}
              alt="Ticket Preview"
              className="w-full h-full object-contain max-h-80"
            />
          </div>

          <div className="flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => {
                setSelectedFile(null);
                setPreviewUrl(null);
              }}
              disabled={isLoading}
              className="px-4 py-2.5 rounded-xl border border-stone-300 dark:border-stone-700 text-stone-700 dark:text-stone-300 text-xs font-semibold hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
            >
              Cambiar foto
            </button>

            <button
              type="button"
              onClick={handleUploadAndScan}
              disabled={isLoading}
              className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-md shadow-emerald-600/25 flex items-center gap-2 disabled:opacity-60"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Analizando con Gemini 3.7 Flash...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-emerald-200" />
                  <span>Procesar Ticket con IA</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
