let voices = [];
let voicesReady = false;

function loadVoices() {
  const v = window.speechSynthesis.getVoices();
  if (v.length > 0) {
    voices = v;
    voicesReady = true;
  }
}

if (typeof window !== 'undefined' && window.speechSynthesis) {
  // Load immediately (works in Firefox)
  loadVoices();
  // Also listen for async load (Chrome loads voices async)
  window.speechSynthesis.onvoiceschanged = loadVoices;
}

// ── Speech Recognition ───────────────────────────────────
const SR = window.SpeechRecognition || window.webkitSpeechRecognition || null;

export function createRecognition(lang = 'de-DE', onResult, onEnd) {
  if (!SR) return null;
  const rec = new SR();
  rec.lang = lang;
  rec.interimResults = false;
  rec.maxAlternatives = 1;
  rec.onresult = (e) => {
    const transcript = e.results[0]?.[0]?.transcript || '';
    onResult(transcript);
  };
  rec.onerror = () => onEnd();
  rec.onend = () => onEnd();
  return rec;
}

export function speak(text, lang = 'de-DE', rate = 0.85) {
  if (!text || !window.speechSynthesis) return;

  // Cancel any current speech first
  window.speechSynthesis.cancel();

  const doSpeak = () => {
    const utter = new SpeechSynthesisUtterance(text);
    utter.lang = lang;
    utter.rate = rate;
    utter.pitch = 1;
    utter.volume = 1;

    // Find best voice: exact lang match → prefix match → any
    const available = voices.length ? voices : window.speechSynthesis.getVoices();
    const voice =
      available.find(v => v.lang === lang) ||
      available.find(v => v.lang.startsWith(lang.split('-')[0])) ||
      null;

    if (voice) utter.voice = voice;

    window.speechSynthesis.speak(utter);
  };

  if (voicesReady) {
    // Voices already loaded — tiny delay so cancel() clears first
    setTimeout(doSpeak, 50);
  } else {
    // Voices not ready yet — wait for them then speak
    window.speechSynthesis.onvoiceschanged = () => {
      loadVoices();
      setTimeout(doSpeak, 50);
    };
    // Fallback: speak anyway after 300ms even if voices never fire
    setTimeout(() => {
      if (!voicesReady) doSpeak();
    }, 300);
  }
}
