import { useState, useRef, useEffect } from "react";

const VOICE_STYLES = [
  { id: "warm", label: "Warm & friendly", voice: "Leda", icon: "🎤", instruction: "Say in a warm, friendly, conversational tone, like talking to a friend" },
  { id: "professional", label: "Pro & confident", voice: "Charon", icon: "💼", instruction: "Say in a confident, clear, professional tone, like a brand voiceover" },
  { id: "energetic", label: "Energetic & hype", voice: "Puck", icon: "⚡", instruction: "Say in an energetic, upbeat, excited tone, like a hype social media reel" },
  { id: "calm", label: "Calm & stories", voice: "Kore", icon: "🌙", instruction: "Say in a calm, slow, storytelling tone, like a reflective narration" },
];

const LANGUAGES = [
  { id: "en-US", label: "🇺🇸 American", code: "en-US", translate: false },
  { id: "en-GB", label: "🇬🇧 British", code: "en-GB", translate: false },
  { id: "en-IN", label: "🇮🇳 Indian", code: "en-IN", translate: false },
  { id: "hi-IN", label: "🇮🇳 Hindi", code: "hi-IN", translate: true, name: "Hindi" },
  { id: "ja-JP", label: "🇯🇵 Japanese", code: "ja-JP", translate: true, name: "Japanese" },
];

const SAMPLE_TEXTS = [
  "Just launched our new product! It's going to change everything. Check it out and let me know what you think! 🚀",
  "Morning coffee thoughts: Life is too short for boring ideas. Dream big, work hard, and make it happen.",
  "Thank you everyone for 100K followers! This journey has been amazing. Here's to 1M! 🎉",
  "Quick reminder: Your success is measured by the problems you solve, not the mistakes you make.",
];

const DEFAULT_TEXT_MODEL = "gemini-3.6-flash";
const DEFAULT_TTS_MODEL = "gemini-2.5-flash-preview-tts";

function pcmToWavBlob(base64Pcm, sampleRate = 24000) {
  const binary = atob(base64Pcm);
  const len = binary.length;
  const pcmBytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) pcmBytes[i] = binary.charCodeAt(i);
  const numChannels = 1;
  const bitsPerSample = 16;
  const byteRate = (sampleRate * numChannels * bitsPerSample) / 8;
  const blockAlign = (numChannels * bitsPerSample) / 8;
  const buffer = new ArrayBuffer(44 + pcmBytes.length);
  const view = new DataView(buffer);
  const writeStr = (offset, str) => {
    for (let i = 0; i < str.length; i++) view.setUint8(offset + i, str.charCodeAt(i));
  };
  writeStr(0, "RIFF");
  view.setUint32(4, 36 + pcmBytes.length, true);
  writeStr(8, "WAVE");
  writeStr(12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, byteRate, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, bitsPerSample, true);
  writeStr(36, "data");
  view.setUint32(40, pcmBytes.length, true);
  new Uint8Array(buffer, 44).set(pcmBytes);
  return new Blob([buffer], { type: "audio/wav" });
}

const CSS = `
* { margin: 0; padding: 0; box-sizing: border-box; }
html, body, #root { width: 100%; min-height: 100%; }

:root {
  --bg-dark: #546af6;
  --bg-card: #111629;
  --bg-card-hover: #16203d;
  --border: #1e2747;
  --text: #f0f4f8;
  --text-dim: #8b92a9;
  --accent: #00d9ff;
  --accent-2: #b366ff;
  --glow: rgba(0, 217, 255, 0.2);
  --glow-2: rgba(179, 102, 255, 0.15);
  --success: #1dd1a1;
  --success-glow: rgba(29, 209, 161, 0.2);
}

html, body, #root {
  background: linear-gradient(135deg, #111637 0%, #25174d 50%, #171c39 100%);
}

body {
  color: var(--text);
  font-family: 'Segoe UI', system-ui, -apple-system, sans-serif;
  overflow-x: hidden;
}

.app-container {
  min-height: 100vh;
  padding: 2rem 1.5rem;
  background: 
    radial-gradient(ellipse 800px 600px at 10% 20%, rgba(0, 217, 255, 0.08), transparent 60%),
    radial-gradient(ellipse 900px 500px at 95% 80%, rgba(179, 102, 255, 0.06), transparent 50%),
    linear-gradient(135deg, #111637 0%, #25174d 50%, #171c39 100%);
}

.shell { max-width: 1400px; margin: 0 auto; }

.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 2.5rem;
  padding-bottom: 1.5rem;
  border-bottom: 1px solid var(--border);
}

.logo-section { display: flex; align-items: center; gap: 14px; }
.pulse-dot {
  width: 12px; height: 12px; border-radius: 50%;
  background: var(--accent);
  box-shadow: 0 0 20px var(--glow), inset 0 0 10px rgba(0,217,255,0.4);
  animation: pulse-glow 2s ease-in-out infinite;
}
@keyframes pulse-glow {
  0%, 100% { opacity: 1; box-shadow: 0 0 20px var(--glow), inset 0 0 10px rgba(0,217,255,0.4); }
  50% { opacity: 0.5; box-shadow: 0 0 40px var(--glow), inset 0 0 5px rgba(0,217,255,0.2); }
}

.success-pulse {
  animation: success-burst 0.6s ease-out;
}
@keyframes success-burst {
  0% { transform: scale(0.8); opacity: 1; filter: drop-shadow(0 0 20px var(--success-glow)); }
  100% { transform: scale(1.1); opacity: 0; filter: drop-shadow(0 0 0px transparent); }
}

.title-section h1 {
  font-size: 1.8rem; font-weight: 700; letter-spacing: -0.02em;
  background: linear-gradient(90deg, var(--accent), var(--accent-2));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin-bottom: 4px;
}
.subtitle { font-size: 0.9rem; color: var(--text-dim); }

.settings-toggle {
  background: rgba(17, 22, 41, 0.8);
  border: 1px solid var(--border);
  color: var(--text-dim);
  padding: 0.6rem 1.2rem;
  border-radius: 10px;
  cursor: pointer;
  font-size: 0.85rem;
  font-weight: 600;
  transition: all 0.25s ease;
  backdrop-filter: blur(10px);
}
.settings-toggle:hover {
  border-color: var(--accent);
  color: var(--accent);
  background: rgba(0, 217, 255, 0.05);
}

.settings-drawer {
  max-height: 0;
  opacity: 0;
  overflow: hidden;
  transition: max-height 0.35s ease, opacity 0.3s ease, margin 0.35s ease;
  margin-bottom: 0;
}
.settings-drawer.open {
  max-height: 200px;
  opacity: 1;
  margin-bottom: 2rem;
}

.settings-content {
  background: linear-gradient(135deg, rgba(17, 22, 41, 0.9), rgba(30, 39, 71, 0.6));
  border: 1px solid var(--border);
  border-radius: 14px;
  padding: 1.4rem;
  backdrop-filter: blur(20px);
  display: grid;
  grid-template-columns: 1.5fr 1fr 1fr;
  gap: 1.2rem;
}
@media (max-width: 900px) {
  .settings-content { grid-template-columns: 1fr; }
}

.input-group label {
  display: block; font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.08em;
  color: var(--text-dim); margin-bottom: 8px; font-weight: 700;
}
.input-group input {
  width: 100%;
  background: rgba(15, 20, 40, 0.8);
  border: 1px solid var(--border);
  color: var(--text);
  padding: 0.65rem 0.9rem;
  border-radius: 8px;
  font-size: 0.85rem;
  outline: none;
  transition: all 0.2s ease;
  font-family: 'Courier New', monospace;
}
.input-group input:focus {
  border-color: var(--accent);
  box-shadow: 0 0 15px var(--glow);
  background: rgba(0, 217, 255, 0.03);
}

.main-grid {
  display: grid;
  grid-template-columns: 1.3fr 1fr;
  gap: 1.8rem;
  align-items: start;
}
@media (max-width: 1000px) {
  .main-grid { grid-template-columns: 1fr; }
}

.panel {
  background: linear-gradient(135deg, rgba(17, 22, 41, 0.9), rgba(30, 39, 71, 0.5));
  border: 1px solid var(--border);
  border-radius: 16px;
  padding: 1.6rem;
  backdrop-filter: blur(20px);
  transition: all 0.3s ease;
}
.panel:hover {
  border-color: var(--border);
  box-shadow: 0 8px 32px rgba(0, 217, 255, 0.08);
}

.panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1.2rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid var(--border);
}
.panel-title {
  font-size: 1.1rem; font-weight: 700; letter-spacing: -0.01em;
}
.panel-meta { font-size: 0.8rem; color: var(--text-dim); }

.editor-wrapper {
  position: relative;
  margin-bottom: 1.2rem;
}
.char-count {
  position: absolute; top: 8px; right: 10px;
  font-size: 0.75rem; color: var(--text-dim);
  background: rgba(0, 0, 0, 0.3);
  padding: 4px 8px;
  border-radius: 6px;
}

textarea.editor {
  width: 100%;
  min-height: 220px;
  background: rgba(15, 20, 40, 0.8);
  border: 1px solid var(--border);
  color: var(--text);
  padding: 1rem;
  border-radius: 12px;
  font-size: 1rem;
  line-height: 1.7;
  outline: none;
  resize: vertical;
  font-family: 'Segoe UI', system-ui, sans-serif;
  transition: all 0.2s ease;
}
textarea.editor:focus {
  border-color: var(--accent);
  box-shadow: 0 0 20px var(--glow);
  background: rgba(0, 217, 255, 0.02);
}

.input-actions {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  align-items: center;
  margin-bottom: 1rem;
}

.recording-status {
  font-size: 0.8rem;
  color: #ff6b6b;
  font-weight: 600;
  animation: pulse-text 1s ease-in-out infinite;
}
@keyframes pulse-text {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

.sample-text-btn {
  padding: 0.5rem 1rem;
  font-size: 0.8rem;
  background: rgba(179, 102, 255, 0.1);
  border: 1px solid var(--accent-2);
  color: var(--accent-2);
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
}
.sample-text-btn:hover {
  background: rgba(179, 102, 255, 0.2);
  box-shadow: 0 0 15px var(--glow-2);
}

.btn {
  border: none;
  border-radius: 10px;
  padding: 0.7rem 1.4rem;
  font-size: 0.9rem;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.25s ease;
  font-family: inherit;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  display: flex;
  align-items: center;
  gap: 6px;
}
.btn:active { transform: scale(0.95); }
.btn:disabled { opacity: 0.4; cursor: not-allowed; }

.btn-primary {
  background: linear-gradient(135deg, var(--accent), #00a8cc);
  color: #000;
  box-shadow: 0 0 20px var(--glow);
}
.btn-primary:hover:not(:disabled) {
  box-shadow: 0 0 30px var(--glow);
  transform: translateY(-2px);
}

.btn-secondary {
  background: linear-gradient(135deg, var(--accent-2), #9933ff);
  color: #fff;
  box-shadow: 0 0 20px var(--glow-2);
}
.btn-secondary:hover:not(:disabled) {
  box-shadow: 0 0 30px var(--glow-2);
  transform: translateY(-2px);
}

.btn-ghost {
  background: transparent;
  border: 1px solid var(--border);
  color: var(--text-dim);
}
.btn-ghost:hover:not(:disabled) {
  border-color: var(--accent);
  color: var(--accent);
  background: rgba(0, 217, 255, 0.05);
}

.btn-small {
  padding: 0.5rem 0.9rem;
  font-size: 0.8rem;
  letter-spacing: 0.03em;
}

.btn-block { width: 100%; }

.error-box {
  background: rgba(255, 100, 100, 0.1);
  border: 1px solid rgba(255, 100, 100, 0.3);
  color: #ff9999;
  padding: 1rem;
  border-radius: 10px;
  font-size: 0.9rem;
  margin-bottom: 1.2rem;
  animation: shake 0.3s ease;
}
@keyframes shake {
  0%, 100% { transform: translateX(0); }
  25% { transform: translateX(-5px); }
  75% { transform: translateX(5px); }
}

.success-box {
  background: rgba(0, 217, 255, 0.1);
  border: 1px solid var(--accent);
  color: var(--accent);
  padding: 1rem;
  border-radius: 10px;
  font-size: 0.9rem;
  margin-bottom: 1.2rem;
}

.copy-feedback {
  position: fixed;
  bottom: 20px;
  right: 20px;
  background: var(--success);
  color: #000;
  padding: 0.8rem 1.2rem;
  border-radius: 8px;
  font-weight: 600;
  font-size: 0.9rem;
  animation: slide-up 0.4s ease-out;
  z-index: 999;
}
@keyframes slide-up {
  from { transform: translateY(100px); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
}

.issues-list { margin-top: 1.2rem; }
.issue {
  background: rgba(255, 100, 100, 0.08);
  border-left: 3px solid #ff6464;
  padding: 0.8rem;
  margin-bottom: 0.8rem;
  border-radius: 8px;
  font-size: 0.9rem;
}
.issue-old { color: #ff9999; text-decoration: line-through; }
.issue-new { color: var(--accent); font-weight: 700; }
.issue-reason { color: var(--text-dim); font-size: 0.8rem; margin-top: 4px; }

.voice-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.9rem;
  margin-bottom: 1.2rem;
}

.voice-card {
  background: rgba(15, 20, 40, 0.8);
  border: 1px solid var(--border);
  padding: 0.9rem;
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.2s ease;
  text-align: center;
  font-size: 0.9rem;
  font-weight: 600;
}
.voice-card:hover { border-color: var(--accent-2); background: rgba(179, 102, 255, 0.1); }
.voice-card.active {
  background: linear-gradient(135deg, rgba(179, 102, 255, 0.3), rgba(0, 217, 255, 0.15));
  border-color: var(--accent);
  color: var(--accent);
  box-shadow: 0 0 20px rgba(0, 217, 255, 0.2);
}
.voice-icon { font-size: 1.4rem; margin-bottom: 4px; }

.audio-container { margin-top: 1.5rem; }
.audio-player {
  width: 100%;
  margin-bottom: 1rem;
  border-radius: 10px;
  accent-color: var(--accent);
}

.toggle-group {
  background: rgba(15, 20, 40, 0.8);
  border: 1px solid var(--border);
  padding: 0.9rem;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1.2rem;
}
.toggle-label { font-size: 0.9rem; font-weight: 600; }

.toggle-switch {
  position: relative;
  width: 44px;
  height: 24px;
  cursor: pointer;
}
.toggle-switch input { opacity: 0; width: 0; height: 0; }
.toggle-track {
  position: absolute;
  inset: 0;
  background: var(--border);
  border-radius: 20px;
  transition: background 0.3s ease;
}
.toggle-switch input:checked + .toggle-track { background: var(--accent); }
.toggle-thumb {
  position: absolute;
  top: 3px;
  left: 3px;
  width: 18px;
  height: 18px;
  background: #fff;
  border-radius: 50%;
  transition: transform 0.3s ease;
}
.toggle-switch input:checked + .toggle-track .toggle-thumb { transform: translateX(20px); }

.waveform {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 5px;
  height: 60px;
  margin: 1.5rem 0;
}
.wave-bar {
  width: 5px;
  border-radius: 3px;
  background: linear-gradient(180deg, var(--accent), var(--accent-2));
}
.wave-bar.idle { height: 8px; opacity: 0.4; }
.wave-bar.active { animation: wave-bounce 0.8s ease-in-out infinite; }
@keyframes wave-bounce {
  0%, 100% { height: 10px; }
  50% { height: 50px; }
}

.voice-input-waveform {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  height: 40px;
  margin: 0.5rem 0;
}
.voice-wave-bar {
  width: 3px;
  border-radius: 2px;
  background: #ff6b6b;
  animation: voice-bounce 0.6s ease-in-out infinite;
}
@keyframes voice-bounce {
  0%, 100% { height: 4px; }
  50% { height: 30px; }
}

.hint { font-size: 0.8rem; color: var(--text-dim); margin-top: 8px; line-height: 1.5; }

.footer {
  text-align: center;
  margin-top: 3rem;
  padding-top: 1.5rem;
  border-top: 1px solid var(--border);
  font-size: 0.8rem;
  color: var(--text-dim);
}

@media (max-width: 640px) {
  .header { flex-direction: column; align-items: flex-start; gap: 1rem; }
  .main-grid { grid-template-columns: 1fr; }
  .voice-grid { grid-template-columns: 1fr; }
  .settings-content { grid-template-columns: 1fr; }
  .input-actions { flex-direction: column; }
  .input-actions > * { width: 100%; }
}
`;

const BARS = [12, 28, 18, 35, 20, 40, 16, 32, 22, 38, 14, 30];

export default function VoicePostPro() {
  const [apiKey, setApiKey] = useState(() => localStorage.getItem("voiceStudio_apiKey") || "");
  const [textModel, setTextModel] = useState(DEFAULT_TEXT_MODEL);
  const [ttsModel, setTtsModel] = useState(DEFAULT_TTS_MODEL);
  const [settingsOpen, setSettingsOpen] = useState(false);

  const [text, setText] = useState("");
  const [styleId, setStyleId] = useState("warm");
  const [languageId, setLanguageId] = useState("en-US");
  const [youthful, setYouthful] = useState(false);

  const [checking, setChecking] = useState(false);
  const [grammarResult, setGrammarResult] = useState(null);

  const [converting, setConverting] = useState(false);
  const [audioUrl, setAudioUrl] = useState(null);
  const [successPulse, setSuccessPulse] = useState(false);

  const [error, setError] = useState("");
  const [copyFeedback, setCopyFeedback] = useState("");
  const audioRef = useRef(null);

  const [isRecording, setIsRecording] = useState(false);
  const recognitionRef = useRef(null);

  const activeStyle = VOICE_STYLES.find((v) => v.id === styleId);
  const activeLanguage = LANGUAGES.find((l) => l.id === languageId);
  const wordCount = text.trim() ? text.trim().split(/\s+/).length : 0;

  // Save API key to localStorage
  useEffect(() => {
    localStorage.setItem("voiceStudio_apiKey", apiKey);
  }, [apiKey]);

  // Initialize speech recognition
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US";

    recognition.onresult = (event) => {
      let finalChunk = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) finalChunk += transcript + " ";
      }
      if (finalChunk) setText((prev) => (prev + " " + finalChunk).trim());
    };

    recognition.onend = () => {
      if (isRecording) {
        try { recognition.start(); } catch (e) {}
      }
    };

    recognitionRef.current = recognition;
    return () => { recognition.onend = null; recognition.stop(); };
  }, [isRecording]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "g") {
        e.preventDefault();
        checkGrammar();
      }
      if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
        e.preventDefault();
        convertToVoice();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [text, apiKey, styleId, languageId, youthful]);

  const toggleVoiceInput = () => {
    if (isRecording) {
      setIsRecording(false);
      recognitionRef.current.onend = null;
      recognitionRef.current.stop();
    } else {
      setIsRecording(true);
      try { recognitionRef.current.start(); } catch (e) {}
    }
  };

  const insertSampleText = () => {
    const sample = SAMPLE_TEXTS[Math.floor(Math.random() * SAMPLE_TEXTS.length)];
    setText(sample);
  };

  const clearAll = () => {
    setText("");
    setGrammarResult(null);
    setAudioUrl(null);
    setError("");
  };

  const callGemini = async (model, body) => {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
      { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }
    );
    if (!res.ok) {
      const errBody = await res.json().catch(() => ({}));
      throw new Error(errBody?.error?.message || `Request failed (${res.status})`);
    }
    return res.json();
  };

  const checkGrammar = async () => {
    if (!apiKey.trim()) return setError("Enter your Gemini API key in settings.");
    if (!text.trim()) return setError("Write some content first.");
    setError("");
    setChecking(true);
    setGrammarResult(null);
    try {
      const prompt = `Check the following social media post for grammar, spelling, and punctuation errors only (not tone or style). Respond with ONLY a raw JSON object, no markdown fences, in this exact shape:
{
  "has_errors": true or false,
  "issues": [{"original": "exact wrong snippet", "suggestion": "corrected snippet", "explanation": "short reason"}],
  "corrected_text": "the full text with all fixes applied"
}
If there are no errors, return has_errors: false, issues: [], and corrected_text equal to the original text.

Post:
"${text.trim()}"`;
      const data = await callGemini(textModel, { contents: [{ parts: [{ text: prompt }] }] });
      const raw = data?.candidates?.[0]?.content?.parts?.map((p) => p.text).join("") || "";
      const cleaned = raw.replace(/```json|```/g, "").trim();
      setGrammarResult(JSON.parse(cleaned));
    } catch (e) {
      setError(e.message || "Grammar check failed.");
    } finally {
      setChecking(false);
    }
  };

  const applyCorrected = () => {
    if (grammarResult?.corrected_text) {
      setText(grammarResult.corrected_text);
      setGrammarResult(null);
    }
  };

  const copyToClipboard = () => {
    if (grammarResult?.corrected_text) {
      navigator.clipboard.writeText(grammarResult.corrected_text);
      setCopyFeedback("✓ Copied to clipboard!");
      setTimeout(() => setCopyFeedback(""), 2000);
    }
  };

  const convertToVoice = async () => {
    if (!apiKey.trim()) return setError("Enter your Gemini API key in settings.");
    if (!text.trim()) return setError("Write some content first.");
    setError("");
    setConverting(true);
    setAudioUrl(null);
    try {
      let speakText = text.trim();
      if (activeLanguage.translate) {
        const translateData = await callGemini(textModel, {
          contents: [{ parts: [{ text: `Translate the following text into natural, conversational ${activeLanguage.name}. Respond with ONLY the translated text, nothing else.\n\n"${speakText}"` }] }],
        });
        speakText = translateData?.candidates?.[0]?.content?.parts?.map((p) => p.text).join("").trim() || speakText;
      }
      const toneInstruction = youthful ? "Say in a bright, playful, higher-energy, youthful voice, with light and bouncy delivery" : activeStyle.instruction;
      const data = await callGemini(ttsModel, {
        contents: [{ parts: [{ text: `${toneInstruction}: ${speakText}` }] }],
        generationConfig: {
          responseModalities: ["AUDIO"],
          speechConfig: {
            languageCode: activeLanguage.code,
            voiceConfig: { prebuiltVoiceConfig: { voiceName: activeStyle.voice } },
          },
        },
      });
      const part = data?.candidates?.[0]?.content?.parts?.[0];
      const base64 = part?.inlineData?.data || part?.inline_data?.data;
      if (!base64) throw new Error("No audio returned from the model.");
      const url = URL.createObjectURL(pcmToWavBlob(base64));
      setAudioUrl(url);
      setSuccessPulse(true);
      setTimeout(() => setSuccessPulse(false), 600);
    } catch (e) {
      setError(e.message || "Voice conversion failed.");
    } finally {
      setConverting(false);
    }
  };

  return (
    <div className="app-container">
      <style>{CSS}</style>
      <div className="shell">
        <div className="header">
          <div className="logo-section">
            <span className="pulse-dot" />
            <div className="title-section">
              <h1>TextVoice Studio</h1>
              <p className="subtitle">AI-powered text-to-voice in seconds</p>
            </div>
          </div>
          <button className="settings-toggle" onClick={() => setSettingsOpen((v) => !v)}>
            {settingsOpen ? "✕ Close" : "⚙️ API Setup"}
          </button>
        </div>

        <div className={`settings-drawer ${settingsOpen ? "open" : ""}`}>
          <div className="settings-content">
            <div className="input-group">
              <label>API Key</label>
              <input type="password" value={apiKey} onChange={(e) => setApiKey(e.target.value)} placeholder="Paste Gemini key (saved locally)" />
            </div>
            <div className="input-group">
              <label>Text Model</label>
              <input type="text" value={textModel} onChange={(e) => setTextModel(e.target.value)} />
            </div>
            <div className="input-group">
              <label>Voice Model</label>
              <input type="text" value={ttsModel} onChange={(e) => setTtsModel(e.target.value)} />
            </div>
          </div>
        </div>

        {error && <div className="error-box">⚠️ {error}</div>}
        {copyFeedback && <div className="copy-feedback">{copyFeedback}</div>}

        <div className="main-grid">
          <div>
            <div className="panel">
              <div className="panel-header">
                <h2 className="panel-title">📝 Your Content</h2>
                <span className="panel-meta">{wordCount} words</span>
              </div>
              <div className="editor-wrapper">
                <span className="char-count">{text.length} chars</span>
                <textarea
                  className="editor"
                  value={text}
                  onChange={(e) => {
                    setText(e.target.value);
                    setGrammarResult(null);
                    setAudioUrl(null);
                  }}
                  placeholder="Write your caption, script, or post here... (Ctrl+G for grammar, Ctrl+Enter to convert)"
                />
              </div>
              <div className="input-actions">
                <button className="btn btn-primary" onClick={checkGrammar} disabled={checking}>
                  {checking ? "✓ Checking..." : "🔍 Check Grammar"}
                </button>
                <button className="btn btn-ghost" onClick={toggleVoiceInput} type="button">
                  {isRecording ? "⏹ Stop recording" : "🎙️ Speak"}
                </button>
                <button className="btn btn-ghost btn-small" onClick={insertSampleText}>
                  📋 Sample
                </button>
                <button className="btn btn-ghost btn-small" onClick={clearAll}>
                  🗑️ Clear
                </button>
                {isRecording && <span className="recording-status">Listening…</span>}
              </div>

              {isRecording && (
                <div className="voice-input-waveform">
                  {[...Array(8)].map((_, i) => (
                    <span key={i} className="voice-wave-bar" style={{ animationDelay: `${i * 0.08}s` }} />
                  ))}
                </div>
              )}

              {grammarResult && grammarResult.has_errors && (
                <div className="issues-list">
                  {grammarResult.issues.map((issue, i) => (
                    <div key={i} className="issue">
                      <span className="issue-old">{issue.original}</span> → <span className="issue-new">{issue.suggestion}</span>
                      <div className="issue-reason">{issue.explanation}</div>
                    </div>
                  ))}
                  <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
                    <button className="btn btn-ghost" onClick={applyCorrected}>
                      Apply Corrections
                    </button>
                    <button className="btn btn-ghost btn-small" onClick={copyToClipboard}>
                      📋 Copy
                    </button>
                  </div>
                </div>
              )}
              {grammarResult && !grammarResult.has_errors && <div className="success-box">✓ No grammar issues found!</div>}
            </div>

            {audioUrl && (
              <div className={`panel ${successPulse ? "success-pulse" : ""}`}>
                <div className="panel-header">
                  <h2 className="panel-title">🎵 Your Audio</h2>
                </div>
                <audio ref={audioRef} controls src={audioUrl} className="audio-player" />
                <a href={audioUrl} download="voice-post.wav" className="btn btn-secondary btn-block">
                  ⬇️ Download Audio
                </a>
              </div>
            )}
          </div>

          <div>
            <div className="panel">
              <div className="panel-header">
                <h2 className="panel-title">🎤 Voice Style</h2>
              </div>
              <div className="voice-grid">
                {VOICE_STYLES.map((v) => (
                  <div key={v.id} className={`voice-card ${styleId === v.id ? "active" : ""}`} onClick={() => setStyleId(v.id)}>
                    <div className="voice-icon">{v.icon}</div>
                    {v.label}
                  </div>
                ))}
              </div>
            </div>

            <div className="panel">
              <div className="panel-header">
                <h2 className="panel-title">🌍 Language</h2>
              </div>
              <div className="voice-grid">
                {LANGUAGES.map((l) => (
                  <div key={l.id} className={`voice-card ${languageId === l.id ? "active" : ""}`} onClick={() => setLanguageId(l.id)}>
                    {l.label}
                  </div>
                ))}
              </div>
              {activeLanguage.translate && <p className="hint">📌 Text will auto-translate to {activeLanguage.name}</p>}

              <div className="toggle-group">
                <span className="toggle-label">Youthful Tone</span>
                <label className="toggle-switch">
                  <input type="checkbox" checked={youthful} onChange={(e) => setYouthful(e.target.checked)} />
                  <span className="toggle-track"><span className="toggle-thumb" /></span>
                </label>
              </div>
              {youthful && <p className="hint">✨ Brighter, more playful delivery (experimental)</p>}
            </div>

            <div className="panel">
              <div className="waveform">
                {BARS.map((h, i) => (
                  <span key={i} className={`wave-bar ${converting ? "active" : "idle"}`} style={converting ? { animationDelay: `${i * 0.05}s` } : { height: h / 2 }} />
                ))}
              </div>
              <button className="btn btn-secondary btn-block" onClick={convertToVoice} disabled={converting}>
                {converting ? "⏳ Generating..." : "🎙️ Convert to Voice"}
              </button>
              <p className="hint" style={{ textAlign: "center", marginTop: 10 }}>
                💡 Ctrl+G for grammar • Ctrl+Enter to convert
              </p>
            </div>
          </div>
        </div>

        <div className="footer">Your API key is saved locally in your browser. Never shared or stored elsewhere.</div>
      </div>
    </div>
  );
}
