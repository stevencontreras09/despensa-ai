'use client';

import { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Sparkles, Loader2, AlertCircle, Send } from 'lucide-react';

interface VoiceDictationProps {
  householdId: string;
  onExtractionComplete: (data: any) => void;
}

export function VoiceDictation({ householdId, onExtractionComplete }: VoiceDictationProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [speechSupported, setSpeechSupported] = useState(true);

  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setSpeechSupported(false);
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'es-ES';

    recognition.onresult = (event: any) => {
      let current = '';
      for (let i = 0; i < event.results.length; i++) {
        current += event.results[i][0].transcript + ' ';
      }
      setTranscript(current.trim());
    };

    recognition.onerror = (event: any) => {
      console.error('Speech recognition error:', event.error);
      setIsRecording(false);
      if (event.error === 'not-allowed') {
        setError('Acceso al micrófono denegado. Puedes escribir la compra manualmente abajo.');
      }
    };

    recognition.onend = () => {
      setIsRecording(false);
    };

    recognitionRef.current = recognition;

    return () => {
      recognition.stop();
    };
  }, []);

  const toggleRecording = () => {
    if (!speechSupported) {
      setError('El reconocimiento de voz no es compatible con este navegador. Puedes escribir el texto directamente.');
      return;
    }

    setError(null);
    if (isRecording) {
      recognitionRef.current?.stop();
      setIsRecording(false);
    } else {
      try {
        recognitionRef.current?.start();
        setIsRecording(true);
      } catch (err) {
        console.error(err);
      }
    }
  };

  const handleProcessDictation = async () => {
    if (!transcript.trim()) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/v1/households/${householdId}/ai/scan-ticket`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: transcript.trim() }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error procesando el dictado con IA');
      }

      onExtractionComplete(data);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Error de conexión');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-3xl p-6 shadow-md space-y-5">
      {error && (
        <div className="p-4 rounded-2xl bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-900/50 flex items-start gap-3 text-red-700 dark:text-red-300 text-sm">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-red-500" />
          <span>{error}</span>
        </div>
      )}

      {/* Mic Button & Pulse */}
      <div className="flex flex-col items-center justify-center py-4">
        <div className="relative">
          {isRecording && (
            <div className="absolute -inset-3 rounded-full bg-emerald-500/30 animate-ping pointer-events-none" />
          )}
          <button
            type="button"
            onClick={toggleRecording}
            className={`w-20 h-20 rounded-full flex items-center justify-center transition-all shadow-xl active:scale-95 ${
              isRecording
                ? 'bg-red-500 hover:bg-red-600 text-white shadow-red-500/30'
                : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/30'
            }`}
          >
            {isRecording ? <MicOff className="w-8 h-8" /> : <Mic className="w-8 h-8" />}
          </button>
        </div>

        <div className="text-center mt-4">
          <span className="text-sm font-bold text-stone-900 dark:text-white">
            {isRecording ? 'Escuchando tu compra...' : 'Toca el micrófono para dictar'}
          </span>
          <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
            Ej: &quot;Compré 2 litros de leche entera, medio kilo de salmón y 6 plátanos&quot;
          </p>
        </div>
      </div>

      {/* Editable Transcription Textarea */}
      <div>
        <label
          htmlFor="dictation-text"
          className="block text-xs font-semibold uppercase tracking-wider text-stone-700 dark:text-stone-300 mb-1.5"
        >
          Texto Reconocido o Escrito
        </label>
        <textarea
          id="dictation-text"
          rows={3}
          value={transcript}
          onChange={(e) => setTranscript(e.target.value)}
          placeholder="El texto dictado aparecerá aquí, o puedes escribirlo directamente..."
          className="w-full p-4 rounded-2xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-800/60 text-stone-900 dark:text-white placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm resize-none"
        />
      </div>

      <button
        type="button"
        onClick={handleProcessDictation}
        disabled={!transcript.trim() || isLoading}
        className="w-full py-3.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition-all shadow-md shadow-emerald-600/25 active:scale-98 disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center gap-2"
      >
        {isLoading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>Normalizando con Gemini 3.7 Flash...</span>
          </>
        ) : (
          <>
            <Sparkles className="w-4 h-4 text-emerald-200" />
            <span>Procesar Compra Dictada con IA</span>
          </>
        )}
      </button>
    </div>
  );
}
