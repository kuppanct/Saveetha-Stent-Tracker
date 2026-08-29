"use client";

import { useState, useEffect, useRef } from "react";
import { Mic, MicOff, Sparkles, Check, X, Volume2, AlertCircle } from "lucide-react";
import { parseVoiceDictation, VoiceParsedStent } from "@/lib/voice-parser";

interface VoiceDictateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApply: (data: VoiceParsedStent) => void;
}

export default function VoiceDictateModal({ isOpen, onClose, onApply }: VoiceDictateModalProps) {
  const [isListening, setIsListening] = useState<boolean>(false);
  const [transcript, setTranscript] = useState<string>("");
  const [parsedPreview, setParsedPreview] = useState<VoiceParsedStent | null>(null);
  const [supported, setSupported] = useState<boolean>(true);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setSupported(false);
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-IN"; // English (India) for optimal medical terms recognition

    recognition.onresult = (event: any) => {
      let current = "";
      for (let i = 0; i < event.results.length; i++) {
        current += event.results[i][0].transcript + " ";
      }
      setTranscript(current);
      const parsed = parseVoiceDictation(current);
      setParsedPreview(parsed);
    };

    recognition.onerror = (event: any) => {
      console.warn("Speech Recognition Error:", event.error);
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognitionRef.current = recognition;

    return () => {
      try {
        recognition.stop();
      } catch (e) {}
    };
  }, []);

  useEffect(() => {
    if (isOpen && supported && recognitionRef.current) {
      setTranscript("");
      setParsedPreview(null);
      startListening();
    } else {
      stopListening();
    }
  }, [isOpen]);

  const startListening = () => {
    if (!recognitionRef.current) return;
    try {
      recognitionRef.current.start();
      setIsListening(true);
    } catch (e) {
      // Already running
    }
  };

  const stopListening = () => {
    if (!recognitionRef.current) return;
    try {
      recognitionRef.current.stop();
      setIsListening(false);
    } catch (e) {}
  };

  const handleToggle = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  const handleApply = () => {
    if (parsedPreview) {
      onApply(parsedPreview);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fadeIn">
      <div className="bg-white dark:bg-[#111827] rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-lg w-full p-6 space-y-5 text-slate-900 dark:text-slate-100">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center space-x-2">
            <div className="p-2 rounded-xl bg-purple-100 dark:bg-purple-950/60 text-purple-600 dark:text-purple-300">
              <Mic className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h2 className="text-base font-bold">Operation Theatre Voice Dictation</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">Speak hands-free to auto-fill stent form</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition text-slate-400"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {!supported ? (
          <div className="p-4 bg-amber-50 dark:bg-amber-950/40 rounded-2xl border border-amber-200 dark:border-amber-800 text-xs text-amber-900 dark:text-amber-200 space-y-1">
            <p className="font-bold flex items-center space-x-1.5">
              <AlertCircle className="w-4 h-4 text-amber-600" />
              <span>Voice Recognition Not Supported in this browser</span>
            </p>
            <p>Please open StentSync in Google Chrome, Safari on iPhone, or Microsoft Edge for microphone dictation support.</p>
          </div>
        ) : (
          <>
            {/* Mic Pulse Center Button */}
            <div className="flex flex-col items-center justify-center py-3 space-y-2">
              <button
                type="button"
                onClick={handleToggle}
                className={`relative p-5 rounded-full transition-all shadow-lg ${
                  isListening
                    ? "bg-rose-600 text-white ring-8 ring-rose-500/20 animate-pulse"
                    : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200"
                }`}
              >
                {isListening ? <Mic className="w-7 h-7" /> : <MicOff className="w-7 h-7" />}
              </button>
              <span className="text-xs font-bold text-slate-600 dark:text-slate-400">
                {isListening ? "Listening to resident dictation..." : "Tap microphone to speak"}
              </span>
            </div>

            {/* Live Spoken Transcript */}
            <div className="bg-slate-50 dark:bg-slate-900/80 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 max-h-28 overflow-y-auto">
              <p className="text-[11px] uppercase tracking-wider font-bold text-slate-400 mb-1">Live Dictation Transcript:</p>
              <p className="text-xs font-medium text-slate-800 dark:text-slate-200 italic">
                {transcript || "Speak clearly (e.g., 'Patient Ramesh, Left kidney, Carbothane stent, Dr. Farooq, no residual stone')..."}
              </p>
            </div>

            {/* Smart Parsed Fields Preview */}
            {parsedPreview && (
              <div className="bg-purple-50/60 dark:bg-purple-950/30 p-3.5 rounded-2xl border border-purple-200 dark:border-purple-800 space-y-2 text-xs">
                <p className="text-[11px] uppercase tracking-wider font-bold text-purple-900 dark:text-purple-300 flex items-center space-x-1">
                  <Sparkles className="w-3.5 h-3.5 text-purple-600" />
                  <span>Auto-Detected Clinical Fields:</span>
                </p>
                <div className="grid grid-cols-2 gap-2 text-slate-700 dark:text-slate-300">
                  {parsedPreview.uhid && (
                    <div><span className="font-semibold text-slate-500">UHID:</span> <strong>{parsedPreview.uhid}</strong></div>
                  )}
                  {parsedPreview.name && (
                    <div><span className="font-semibold text-slate-500">Patient:</span> <strong>{parsedPreview.name}</strong></div>
                  )}
                  {parsedPreview.laterality && (
                    <div><span className="font-semibold text-slate-500">Laterality:</span> <strong>{parsedPreview.laterality}</strong></div>
                  )}
                  {parsedPreview.material && (
                    <div><span className="font-semibold text-slate-500">Material:</span> <strong>{parsedPreview.material}</strong></div>
                  )}
                  {parsedPreview.unit && (
                    <div><span className="font-semibold text-slate-500">Unit:</span> <strong>{parsedPreview.unit}</strong></div>
                  )}
                  {parsedPreview.inserted_by && (
                    <div><span className="font-semibold text-slate-500">Surgeon:</span> <strong>{parsedPreview.inserted_by}</strong></div>
                  )}
                  {parsedPreview.residual_stone !== undefined && (
                    <div><span className="font-semibold text-slate-500">Residual Stone:</span> <strong>{parsedPreview.residual_stone ? "Yes" : "No"}</strong></div>
                  )}
                </div>
              </div>
            )}

            {/* Quick Voice Hints */}
            <div className="text-[11px] text-slate-400 flex items-center space-x-1">
              <Volume2 className="w-3.5 h-3.5 text-purple-500 flex-shrink-0" />
              <span>Voice commands supported: Side, Material (Carbothane/Regular/Silicone), Surgeon name, Unit 1/2.</span>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleApply}
                disabled={!transcript.trim()}
                className="px-5 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold shadow-md transition disabled:opacity-50 flex items-center space-x-1.5"
              >
                <Check className="w-4 h-4" />
                <span>Fill Form Fields</span>
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
