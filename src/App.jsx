import { useState, useRef } from "react";

const VOICE_STYLES = [
  {
    id: "warm",
    label: "Warm and friendly",
    voice: "Leda",
    instruction: "Say in a warm, friendly, conversational tone, like talking to a friend",
  },
  {
    id: "professional",
    label: "Confident and professional",
    voice: "Charon",
    instruction: "Say in a confident, clear, professional tone, like a brand voiceover",
  },
  {
    id: "energetic",
    label: "Energetic and upbeat",
    voice: "Puck",
    instruction: "Say in an energetic, upbeat, excited tone, like a hype social media reel",
  },
  {
    id: "calm",
    label: "Calm storyteller",
    voice: "Kore",
    instruction: "Say in a calm, slow, storytelling tone, like a reflective narration",
  },
];

const YOUTHFUL_INSTRUCTION =
  "Say in a bright, playful, higher-energy, youthful voice, with light and bouncy delivery";

const LANGUAGES = [
  { id: "en-US", label: "American English", code: "en-US", translate: false },
  { id: "en-GB", label: "British English", code: "en-GB", translate: false },
  { id: "en-IN", label: "Indian English", code: "en-IN", translate: false },
  { id: "hi-IN", label: "Hindi", code: "hi-IN", translate: true, name: "Hindi" },
  { id: "ja-JP", label: "Japanese", code: "ja-JP", translate: true, name: "Japanese" },
];

const DEFAULT_TEXT_MODEL = "gemini-3.6-flash";
const DEFAULT_TTS_MODEL = "gemini-2.5-flash-preview-tts";

const c = {
  bg: "#faf7f2",
  panel: "#ffffff",
  border: "#e8e1d6",
  ink: "#241f1a",
  inkDim: "#7a7266",
  inkFaint: "#a89f90",
  plum: "#7d3358",
  plumBg: "#f6e9ee",
  plumDark: "#5c2540",
  teal: "#2f6f62",
  tealBg: "#e7f2ee",
  red: "#a13c3c",
  redBg: "#fbecec",
};

const s = {
  page: {
    minHeight: "100vh",
    background: c.bg,
    color: c.ink,
    padding: "2rem 1rem",
    fontFamily: "system-ui, -apple-system, sans-serif",
  },
  container: { maxWidth: 720, margin: "0 auto" },
  header: {
    borderBottom: `1px solid ${c.border}`,
    paddingBottom: "1rem",
    marginBottom: "1.75rem",
  },
  title: {
    fontSize: "1.75rem",
    fontWeight: 700,
    letterSpacing: "-0.01em",
    fontFamily: "Georgia, 'Times New Roman', serif",
    margin: 0,
  },
  subtitle: { color: c.inkDim, fontSize: "0.875rem", marginTop: 4 },
  label: {
    display: "block",
    fontSize: "0.7rem",
    textTransform: "uppercase",
    letterSpacing: "0.05em",
    color: c.inkFaint,
    marginBottom: 6,
  },
  textarea: {
    width: "100%",
    boxSizing: "border-box",
    borderRadius: 8,
    background: c.panel,
    border: `1px solid ${c.border}`,
    padding: "0.85rem",
    fontSize: "0.95rem",
    lineHeight: 1.6,
    color: c.ink,
    outline: "none",
    resize: "vertical",
    fontFamily: "Georgia, 'Times New Roman', serif",
  },
  section: { marginBottom: "1.5rem" },
  row: { display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" },
  btn: (bg, textColor, disabled) => ({
    borderRadius: 7,
    background: disabled ? "#00000014" : bg,
    color: disabled ? c.inkFaint : textColor,
    border: "none",
    padding: "0.55rem 1rem",
    fontSize: "0.85rem",
    fontWeight: 600,
    cursor: disabled ? "not-allowed" : "pointer",
  }),
  input: {
    width: "100%",
    boxSizing: "border-box",
    borderRadius: 7,
    background: c.panel,
    border: `1px solid ${c.border}`,
    padding: "0.5rem 0.75rem",
    fontSize: "0.85rem",
    color: c.ink,
    outline: "none",
  },
  grid2: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 },
  voiceGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 10,
    marginTop: 8,
  },
  voiceCard: (active) => ({
    borderRadius: 8,
    border: `1px solid ${active ? c.plum : c.border}`,
    background: active ? c.plumBg : c.panel,
    padding: "0.7rem 0.85rem",
    cursor: "pointer",
    fontSize: "0.85rem",
    fontWeight: active ? 600 : 400,
    color: active ? c.plumDark : c.ink,
  }),
  card: {
    borderRadius: 10,
    border: `1px solid ${c.border}`,
    background: c.panel,
    padding: "1rem",
  },
  errorBox: {
    borderRadius: 8,
    border: `1px solid #d6a3a3`,
    background: c.redBg,
    color: c.red,
    padding: "0.7rem 1rem",
    fontSize: "0.85rem",
    marginBottom: "1.25rem",
  },
  issueItem: {
    borderLeft: `3px solid ${c.red}`,
    paddingLeft: 10,
    marginBottom: 10,
    fontSize: "0.85rem",
  },
  issueOriginal: { color: c.red, textDecoration: "line-through" },
  issueSuggestion: { color: c.teal, fontWeight: 600 },
  issueExplain: { color: c.inkDim, marginTop: 2 },
  cleanBox: {
    borderRadius: 8,
    border: `1px solid #b9d6cc`,
    background: c.tealBg,
    color: c.teal,
    padding: "0.7rem 1rem",
    fontSize: "0.85rem",
    fontWeight: 600,
  },
  footer: {
    marginTop: "2.5rem",
    paddingTop: "1rem",
    borderTop: `1px solid ${c.border}`,
    fontSize: "0.75rem",
    color: c.inkFaint,
  },
};

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

export default function VoicePost() {
  const [apiKey, setApiKey] = useState("");
  const [textModel, setTextModel] = useState(DEFAULT_TEXT_MODEL);
  const [ttsModel, setTtsModel] = useState(DEFAULT_TTS_MODEL);
  const [text, setText] = useState("");
  const [styleId, setStyleId] = useState(VOICE_STYLES[0].id);
  const [languageId, setLanguageId] = useState(LANGUAGES[0].id);
  const [youthful, setYouthful] = useState(false);

  const [checking, setChecking] = useState(false);
  const [grammarResult, setGrammarResult] = useState(null);

  const [converting, setConverting] = useState(false);
  const [audioUrl, setAudioUrl] = useState(null);

  const [error, setError] = useState("");
  const audioRef = useRef(null);

  const activeStyle = VOICE_STYLES.find((v) => v.id === styleId);
  const activeLanguage = LANGUAGES.find((l) => l.id === languageId);

  const callGemini = async (model, body) => {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      }
    );
    if (!res.ok) {
      const errBody = await res.json().catch(() => ({}));
      throw new Error(errBody?.error?.message || `Request failed (${res.status})`);
    }
    return res.json();
  };

  const checkGrammar = async () => {
    if (!apiKey.trim()) return setError("Enter your Gemini API key first.");
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
      const data = await callGemini(textModel, {
        contents: [{ parts: [{ text: prompt }] }],
      });
      const raw =
        data?.candidates?.[0]?.content?.parts?.map((p) => p.text).join("") || "";
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

  const convertToVoice = async () => {
    if (!apiKey.trim()) return setError("Enter your Gemini API key first.");
    if (!text.trim()) return setError("Write some content first.");
    setError("");
    setConverting(true);
    setAudioUrl(null);
    try {
      let speakText = text.trim();

      if (activeLanguage.translate) {
        const translateData = await callGemini(textModel, {
          contents: [
            {
              parts: [
                {
                  text: `Translate the following text into natural, conversational ${activeLanguage.name}. Respond with ONLY the translated text, nothing else.\n\n"${speakText}"`,
                },
              ],
            },
          ],
        });
        const translated =
          translateData?.candidates?.[0]?.content?.parts
            ?.map((p) => p.text)
            .join("")
            .trim() || speakText;
        speakText = translated;
      }

      const toneInstruction = youthful
        ? YOUTHFUL_INSTRUCTION
        : activeStyle.instruction;

      const data = await callGemini(ttsModel, {
        contents: [{ parts: [{ text: `${toneInstruction}: ${speakText}` }] }],
        generationConfig: {
          responseModalities: ["AUDIO"],
          speechConfig: {
            languageCode: activeLanguage.code,
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: activeStyle.voice },
            },
          },
        },
      });
      const part = data?.candidates?.[0]?.content?.parts?.[0];
      const base64 = part?.inlineData?.data || part?.inline_data?.data;
      if (!base64) throw new Error("No audio returned from the model.");
      const blob = pcmToWavBlob(base64);
      setAudioUrl(URL.createObjectURL(blob));
    } catch (e) {
      setError(e.message || "Voice conversion failed.");
    } finally {
      setConverting(false);
    }
  };

  return (
    <div style={s.page}>
      <div style={s.container}>
        <header style={s.header}>
          <h1 style={s.title}>Voice post</h1>
          <p style={s.subtitle}>
            Write your caption, catch typos, hear it read back in a voice that fits.
          </p>
        </header>

        <section style={{ ...s.section, ...s.grid2 }}>
          <div>
            <label style={s.label}>Gemini API key</label>
            <input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="Paste your key (session only)"
              style={s.input}
            />
          </div>
          <div style={s.grid2}>
            <div>
              <label style={s.label}>Text model</label>
              <input
                type="text"
                value={textModel}
                onChange={(e) => setTextModel(e.target.value)}
                style={s.input}
              />
            </div>
            <div>
              <label style={s.label}>Voice model</label>
              <input
                type="text"
                value={ttsModel}
                onChange={(e) => setTtsModel(e.target.value)}
                style={s.input}
              />
            </div>
          </div>
        </section>

        <section style={s.section}>
          <label style={s.label}>Your post</label>
          <textarea
            value={text}
            onChange={(e) => {
              setText(e.target.value);
              setGrammarResult(null);
            }}
            placeholder="Write the caption or script you want to turn into audio"
            rows={6}
            style={s.textarea}
          />
        </section>

        <section style={s.section}>
          <div style={s.row}>
            <button
              onClick={checkGrammar}
              disabled={checking}
              style={s.btn(c.teal, "#fff", checking)}
            >
              {checking ? "Checking..." : "Check grammar"}
            </button>
          </div>

          {grammarResult && grammarResult.has_errors && (
            <div style={{ ...s.card, marginTop: 12 }}>
              {grammarResult.issues.map((issue, i) => (
                <div key={i} style={s.issueItem}>
                  <span style={s.issueOriginal}>{issue.original}</span>
                  {"  →  "}
                  <span style={s.issueSuggestion}>{issue.suggestion}</span>
                  <div style={s.issueExplain}>{issue.explanation}</div>
                </div>
              ))}
              <button
                onClick={applyCorrected}
                style={{ ...s.btn(c.plum, "#fff", false), marginTop: 4 }}
              >
                Use corrected text
              </button>
            </div>
          )}

          {grammarResult && !grammarResult.has_errors && (
            <div style={{ ...s.cleanBox, marginTop: 12 }}>
              No grammar issues found. Ready to convert.
            </div>
          )}
        </section>

        <section style={s.section}>
          <label style={s.label}>Voice style</label>
          <div style={s.voiceGrid}>
            {VOICE_STYLES.map((v) => (
              <div
                key={v.id}
                onClick={() => setStyleId(v.id)}
                style={s.voiceCard(styleId === v.id)}
              >
                {v.label}
              </div>
            ))}
          </div>
        </section>

        <section style={s.section}>
          <label style={s.label}>Language / accent</label>
          <div style={s.voiceGrid}>
            {LANGUAGES.map((l) => (
              <div
                key={l.id}
                onClick={() => setLanguageId(l.id)}
                style={s.voiceCard(languageId === l.id)}
              >
                {l.label}
              </div>
            ))}
          </div>
          {activeLanguage.translate && (
            <p style={{ ...s.subtitle, marginTop: 8 }}>
              Your text will be translated into {activeLanguage.name} before it's spoken.
            </p>
          )}
        </section>

        <section style={s.section}>
          <label style={{ ...s.row, cursor: "pointer", fontSize: "0.85rem" }}>
            <input
              type="checkbox"
              checked={youthful}
              onChange={(e) => setYouthful(e.target.checked)}
            />
            Youthful / child-like tone (experimental)
          </label>
          {youthful && (
            <p style={{ ...s.subtitle, marginTop: 4 }}>
              Gemini has no dedicated child voice — this steers an adult voice toward a
              brighter, more playful delivery. It won't reliably sound like an actual child.
            </p>
          )}
        </section>

        {error && <div style={s.errorBox}>{error}</div>}

        <section style={s.section}>
          <button
            onClick={convertToVoice}
            disabled={converting}
            style={{ ...s.btn(c.plum, "#fff", converting), width: "100%", padding: "0.7rem" }}
          >
            {converting ? "Generating audio..." : "Convert to voice"}
          </button>
        </section>

        {audioUrl && (
          <section style={{ ...s.card, ...s.section }}>
            <label style={s.label}>Preview</label>
            <audio ref={audioRef} controls src={audioUrl} style={{ width: "100%", marginBottom: 12 }} />
            <a
              href={audioUrl}
              download="voice-post.wav"
              style={{ ...s.btn(c.teal, "#fff", false), display: "inline-block", textDecoration: "none" }}
            >
              Download audio
            </a>
          </section>
        )}

        <footer style={s.footer}>
          Your API key stays in this browser tab only and is sent only to Google's Gemini API.
        </footer>
      </div>
    </div>
  );
}
