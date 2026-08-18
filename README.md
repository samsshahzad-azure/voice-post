# Voice Post

Turn a social media caption into checked, polished audio. Write your text, catch grammar mistakes before you post, pick a voice style and language, and download the result as a `.wav` file.

Built with React + Vite, powered by the Gemini API.

## What it does

- **Grammar check** — scans your text for spelling, grammar, and punctuation issues. Each issue shows the original snippet, the suggested fix, and a short explanation. One click applies all corrections.
- **Voice styles** — four preset tones to match different content: Warm and friendly, Confident and professional, Energetic and upbeat, Calm storyteller.
- **Language / accent** — American English, British English, and Indian English read your text as written; Hindi and Japanese automatically translate your text first, then speak it in that language.
- **Youthful tone (experimental)** — an optional toggle that steers a voice toward a brighter, more playful delivery. Note: Gemini has no dedicated child voice, so this won't reliably sound like an actual child — it's a stylistic nudge, not a different voice.
- **Download** — the generated audio is a standard `.wav` file you can save and use directly in your posts, edits, or video projects.

## Requirements

- [Node.js](https://nodejs.org) (LTS version)
- A [Gemini API key](https://aistudio.google.com/apikey) (free to generate with a Google account)
- Chrome or Edge is recommended for best compatibility

## Setup

Clone the repo and install dependencies:

```bash
git clone https://github.com/samsshahzad-azure/voice-post.git
cd voice-post
npm install
```

Run the app locally:

```bash
npm run dev
```

Open the printed URL (usually `http://localhost:5173`) in your browser.

## Using the app

1. Paste your Gemini API key into the **Gemini API key** field. It stays in your browser session only — it's never saved to a file or sent anywhere except Google's Gemini API.
2. Write your caption or script in the text box.
3. Click **Check grammar** to review any flagged issues, and optionally click **Use corrected text** to apply the fixes.
4. Pick a **voice style** and a **language / accent**.
5. (Optional) Toggle **Youthful / child-like tone** for a brighter, more playful delivery.
6. Click **Convert to voice** to generate the audio.
7. Click **Download audio** to save the `.wav` file.

## Model names

The app uses two configurable model fields:

- **Text model** (grammar check + translation) — defaults to `gemini-3.6-flash`
- **Voice model** (text-to-speech) — defaults to `gemini-2.5-flash-preview-tts`

Google occasionally retires or renames models. If you see an error saying a model is no longer available, it will usually tell you the replacement name directly in the error message — just type that new name into the relevant field in the app.

## Notes

- No API key or personal data is stored anywhere in this codebase. The key lives only in the browser tab's memory for the current session and must be re-entered each time you reload the page.
- `node_modules` is excluded from version control via `.gitignore` and gets rebuilt locally by `npm install`.

## Tech stack

- React
- Vite
- Gemini API (text generation + text-to-speech)
