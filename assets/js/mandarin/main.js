import { render } from './render.js';
import { onReady as onVoiceReady } from './speech.js';
import { toTraditional, toSimplified } from './convert.js';

// --- Reader panel ---------------------------------------------------------
const input = document.getElementById('mr-input');
const output = document.getElementById('mr-output');
const voiceStatus = document.getElementById('mr-voice-status');

let renderTimer = null;
input.addEventListener('input', () => {
  clearTimeout(renderTimer);
  renderTimer = setTimeout(() => render(output, input.value), 150);
});

onVoiceReady((status) => {
  if (status.available) {
    voiceStatus.hidden = true;
  } else {
    voiceStatus.hidden = false;
    voiceStatus.textContent =
      'No Taiwan Mandarin voice found on this device, so word audio is disabled. ' +
      'Install a zh-TW (or other zh) system voice to enable it.';
  }
});

// --- Converter panel -------------------------------------------------------
const convertInput = document.getElementById('mr-convert-input');
const convertOutput = document.getElementById('mr-convert-output');
const convertBtn = document.getElementById('mr-convert-btn');
const copyBtn = document.getElementById('mr-copy-btn');
const directionBtns = Array.from(document.querySelectorAll('.mr-direction'));

let direction = 's2t'; // 's2t' = Simplified -> Traditional, 't2s' = reverse

directionBtns.forEach((btn) => {
  btn.addEventListener('click', () => {
    direction = btn.getAttribute('data-direction');
    directionBtns.forEach((b) => b.classList.toggle('active', b === btn));
  });
});

convertBtn.addEventListener('click', () => {
  const text = convertInput.value;
  convertOutput.value = direction === 's2t' ? toTraditional(text) : toSimplified(text);
});

copyBtn.addEventListener('click', () => {
  if (!convertOutput.value) return;
  navigator.clipboard.writeText(convertOutput.value).then(() => {
    const original = copyBtn.textContent;
    copyBtn.textContent = 'Copied';
    setTimeout(() => {
      copyBtn.textContent = original;
    }, 1200);
  });
});
