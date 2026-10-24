'use client';
import { useCallback, useEffect, useRef, useState } from 'react';

/** Minimal shapes for the (still untyped-in-lib.dom) Web Speech API. */
interface SpeechResultAlt { transcript: string }
interface SpeechResultItem { 0: SpeechResultAlt; isFinal: boolean; length: number }
interface SpeechResultList { length: number; [i: number]: SpeechResultItem }
interface SpeechEvent { resultIndex: number; results: SpeechResultList }
interface SpeechErrorEvent { error: string }
interface SpeechRecognitionLike {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  start(): void;
  stop(): void;
  abort(): void;
  onresult: ((e: SpeechEvent) => void) | null;
  onerror: ((e: SpeechErrorEvent) => void) | null;
  onend: (() => void) | null;
}
type RecognitionCtor = new () => SpeechRecognitionLike;

/**
 * Voice input for Indian shop owners. Uses the browser's Web Speech API
 * (Chrome handles hi-IN/ta-IN/te-IN/en-IN via its speech service); when the
 * browser lacks it, callers fall back to a recorded-blob upload which the
 * server transcribes with Groq Whisper.
 */
export function useSpeechRecognition(langCode: string) {
  const [listening, setListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [interim, setInterim] = useState('');
  const [error, setError] = useState<string | null>(null);
  const recRef = useRef<SpeechRecognitionLike | null>(null);
  const langRef = useRef(langCode);
  langRef.current = langCode;

  const getCtor = (): RecognitionCtor | null => {
    if (typeof window === 'undefined') return null;
    const w = window as unknown as { SpeechRecognition?: RecognitionCtor; webkitSpeechRecognition?: RecognitionCtor };
    return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
  };
  const supported = getCtor() !== null;

  const stop = useCallback(() => {
    try { recRef.current?.stop(); } catch { /* noop */ }
    setListening(false);
  }, []);

  const start = useCallback(() => {
    setError(null);
    const Ctor = getCtor();
    if (!Ctor) {
      setError('Voice input is not supported in this browser — type instead, or record and upload below.');
      return;
    }
    try {
      const rec = new Ctor();
      rec.lang = langRef.current;
      rec.continuous = true;
      rec.interimResults = true;
      rec.onresult = (e: SpeechEvent) => {
        let final = '';
        let temp = '';
        for (let i = e.resultIndex; i < e.results.length; i++) {
          const r = e.results[i];
          if (r.isFinal) final += r[0].transcript;
          else temp += r[0].transcript;
        }
        if (final) setTranscript((t) => (t ? t + ' ' : '') + final.trim());
        setInterim(temp);
      };
      rec.onerror = (e: SpeechErrorEvent) => {
        setError(
          e.error === 'not-allowed'
            ? 'Microphone permission was blocked. Allow mic access and try again.'
            : 'Could not hear you — please try again.'
        );
        setListening(false);
      };
      rec.onend = () => setListening(false);
      try { recRef.current?.abort(); } catch { /* noop */ }
      recRef.current = rec;
      rec.start();
      setListening(true);
    } catch {
      setError('Could not start the microphone — please type instead.');
    }
  }, []);

  useEffect(() => () => { try { recRef.current?.abort(); } catch { /* noop */ } }, []);

  const reset = useCallback(() => { setTranscript(''); setInterim(''); setError(null); }, []);

  return { supported, listening, transcript, interim, error, start, stop, reset, setTranscript };
}

/** Read text aloud — free TTS for coach lines in Indic languages. */
export function speak(text: string, langCode = 'en-IN') {
  try {
    if (!('speechSynthesis' in window)) return false;
    const u = new SpeechSynthesisUtterance(text);
    u.lang = langCode;
    u.rate = 0.98;
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(u);
    return true;
  } catch {
    return false;
  }
}
