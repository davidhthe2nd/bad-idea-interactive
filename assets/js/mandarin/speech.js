// Web Speech API wrapper. Kept behind this one-file boundary so swapping in
// a server-side TTS later doesn't touch any caller.
let voice = null;
let ready = false;
const readyCallbacks = [];

function pickVoice(voices) {
  return (
    voices.find((v) => v.lang.toLowerCase() === 'zh-tw') ||
    voices.find((v) => v.lang.toLowerCase().startsWith('zh')) ||
    null
  );
}

function getStatus() {
  return { available: !!voice, voiceName: voice ? voice.name : null };
}

function markReady() {
  ready = true;
  readyCallbacks.splice(0).forEach((cb) => cb(getStatus()));
}

function refreshVoices() {
  const voices = window.speechSynthesis.getVoices();
  // getVoices() can return [] on the first call; wait for a populated list —
  // but some browsers/OSes have no synthesis voices installed at all and
  // never fire voiceschanged again, so this alone can't be trusted to mean
  // "not loaded yet". The startup timeout below treats "still empty" as
  // final so the UI doesn't wait forever to show the unavailable message.
  if (voices.length === 0) return;
  voice = pickVoice(voices);
  markReady();
}

export function onReady(callback) {
  if (ready) {
    callback(getStatus());
  } else {
    readyCallbacks.push(callback);
  }
}

// Speaks `text`. Returns false (and does nothing) if no zh-TW/zh-* voice is
// available, so callers can show/keep the "audio unavailable" state instead
// of playing an English voice mangling the hanzi.
export function speak(text) {
  if (!voice) return false;
  window.speechSynthesis.cancel(); // drop any queued/backlogged utterances
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.voice = voice;
  utterance.lang = voice.lang;
  window.speechSynthesis.speak(utterance);
  return true;
}

if (window.speechSynthesis) {
  window.speechSynthesis.addEventListener('voiceschanged', refreshVoices);
  refreshVoices();
  // Give voiceschanged one chance to fire, then treat "still empty" as final
  // rather than leaving onReady callers waiting forever.
  setTimeout(() => {
    if (!ready) markReady();
  }, 1000);
} else {
  markReady(); // no Web Speech API at all — report unavailable immediately
}
