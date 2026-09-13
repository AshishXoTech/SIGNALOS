"use client";

import { useState, useRef, useCallback } from "react";

export function useVoiceRecorder() {
  const [recording, setRecording] = useState(false);
  const [blob, setBlob] = useState<Blob | null>(null);
  const [url, setUrl] = useState<string | null>(null);
  const [seconds, setSeconds] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [supported, setSupported] = useState(true);

  const mediaRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const clearTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  const stopStream = () => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  };

  const reset = useCallback(() => {
    clearTimer();
    stopStream();
    if (url) URL.revokeObjectURL(url);
    setBlob(null);
    setUrl(null);
    setSeconds(0);
    setRecording(false);
    setError(null);
    chunksRef.current = [];
    mediaRef.current = null;
  }, [url]);

  const start = useCallback(async () => {
    setError(null);
    if (typeof window === "undefined" || !navigator.mediaDevices?.getUserMedia) {
      setSupported(false);
      setError("Voice notes not supported on this browser");
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const mime = MediaRecorder.isTypeSupported("audio/webm")
        ? "audio/webm"
        : MediaRecorder.isTypeSupported("audio/mp4")
        ? "audio/mp4"
        : "";

      const recorder = mime
        ? new MediaRecorder(stream, { mimeType: mime })
        : new MediaRecorder(stream);

      chunksRef.current = [];
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      recorder.onstop = () => {
        const b = new Blob(chunksRef.current, {
          type: recorder.mimeType || "audio/webm",
        });
        const u = URL.createObjectURL(b);
        setBlob(b);
        setUrl(u);
        stopStream();
        clearTimer();
        setRecording(false);
      };

      mediaRef.current = recorder;
      recorder.start(250);
      setRecording(true);
      setSeconds(0);
      timerRef.current = setInterval(() => {
        setSeconds((s) => {
          if (s >= 59) {
            // auto-stop at 60s
            try {
              recorder.stop();
            } catch {}
            return 60;
          }
          return s + 1;
        });
      }, 1000);
    } catch {
      setError("Microphone permission denied");
      setSupported(false);
      stopStream();
    }
  }, []);

  const stop = useCallback(() => {
    if (mediaRef.current && mediaRef.current.state === "recording") {
      mediaRef.current.stop();
    } else {
      setRecording(false);
      clearTimer();
      stopStream();
    }
  }, []);

  return {
    recording,
    blob,
    url,
    seconds,
    error,
    supported,
    start,
    stop,
    reset,
  };
}