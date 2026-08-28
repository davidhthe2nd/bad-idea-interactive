// Renders Traditional Chinese text as word-level units: hanzi on top,
// pinyin below (coloured per syllable by tone), each unit clickable for TTS.
//
// Word-level, not character-level: per-character rendering would throw away
// the segmentation that resolves polyphones correctly (e.g. 睡覺 -> shuìjiào
// vs 覺得 -> juéde).
//
// Uses segment(text, { format: OutputFormat.AllArray }) rather than a
// separate pinyin() call per word: that format gives per-character pinyin
// *within* each word's already-correctly-resolved context in a single pass.
// A second, isolated pinyin() call per word looked equivalent but wasn't —
// context-dependent single-character segments (e.g. sentence-final 了, which
// must read "le" not its more common isolated reading "liǎo") silently came
// back wrong when re-queried outside the sentence they were resolved in.
import { segment, OutputFormat } from './pinyin-setup.js';
import { speak } from './speech.js';

// CJK Unified Ideographs + Extension A + Compatibility Ideographs, as \u
// escapes to avoid any literal-glyph encoding issues in this source file.
const HAN_CHARS = '㐀-䶿一-鿿豈-﫿';
const HAN_SPLIT = new RegExp('([' + HAN_CHARS + ']+)');
const HAN_FULL = new RegExp('^[' + HAN_CHARS + ']+$');

// First toned vowel found in a syllable determines its tone; no toned vowel
// means the neutral/light tone (e.g. "de", "le", "zi").
const TONE_MARKS = {
  'ā': 1, 'ē': 1, 'ī': 1, 'ō': 1, 'ū': 1, 'ǖ': 1, // ǖ
  'á': 2, 'é': 2, 'í': 2, 'ó': 2, 'ú': 2, 'ǘ': 2, // ǘ
  'ǎ': 3, 'ě': 3, 'ǐ': 3, 'ǒ': 3, 'ǔ': 3, 'ǚ': 3, // ǚ
  'à': 4, 'è': 4, 'ì': 4, 'ò': 4, 'ù': 4, 'ǜ': 4, // ǜ
};

function toneClass(syllable) {
  for (const ch of syllable || '') {
    const tone = TONE_MARKS[ch.toLowerCase()];
    if (tone) return 'tone-' + tone;
  }
  return 'tone-neutral';
}

function buildWordUnit(chars) {
  const hanzi = chars.map((c) => c.origin).join('');

  const unit = document.createElement('button');
  unit.type = 'button';
  unit.className = 'mr-word';
  unit.setAttribute('data-text', hanzi);
  unit.setAttribute('aria-label', hanzi + ', click to hear it read aloud');

  const hanziRow = document.createElement('span');
  hanziRow.className = 'mr-word-hanzi';
  hanziRow.textContent = hanzi;

  // Pinyin row is its own annotation row so a second row (e.g. zhuyin, once
  // that's built) can sit alongside it without restructuring this markup.
  const pinyinRow = document.createElement('span');
  pinyinRow.className = 'mr-word-pinyin';

  chars.forEach((c) => {
    const syl = document.createElement('span');
    syl.className = 'mr-syllable ' + toneClass(c.result);
    syl.textContent = c.result || c.origin;
    pinyinRow.appendChild(syl);
  });

  unit.appendChild(hanziRow);
  unit.appendChild(pinyinRow);
  unit.addEventListener('click', () => {
    speak(hanzi);
  });

  return unit;
}

function buildPlainUnit(text) {
  const span = document.createElement('span');
  span.className = 'mr-plain';
  span.textContent = text;
  return span;
}

export function render(container, text) {
  container.innerHTML = '';
  if (!text) return;

  // Split into alternating Han-character runs and everything else (Latin,
  // digits, whitespace, punctuation), so punctuation/latin pass through
  // unstyled instead of being fed to the segmenter.
  const parts = text.split(HAN_SPLIT).filter((p) => p !== '');

  parts.forEach((part) => {
    if (HAN_FULL.test(part)) {
      const words = segment(part, { format: OutputFormat.AllArray });
      words.forEach((chars) => {
        container.appendChild(buildWordUnit(chars));
      });
    } else {
      container.appendChild(buildPlainUnit(part));
    }
  });
}
