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
import { pinyinToZhuyin } from './pinyin-to-zhuyin.js';

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

  // Pinyin and zhuyin are separate annotation rows, both always built (mode
  // switching is pure CSS via #mr-output[data-mode] — see main.js — so it
  // never re-segments or re-converts). Kept as siblings, not merged into one
  // row, so a vertical-ruby layout could replace this without a rewrite.
  const pinyinRow = document.createElement('span');
  pinyinRow.className = 'mr-annotation mr-annotation-pinyin';

  const zhuyinRow = document.createElement('span');
  zhuyinRow.className = 'mr-annotation mr-annotation-zhuyin';

  chars.forEach((c) => {
    // Same tone class drives both rows, derived once from the pinyin — never
    // re-derived from the zhuyin symbols — so the two can never disagree.
    const cls = 'mr-syllable ' + toneClass(c.result);

    const pinyinSyl = document.createElement('span');
    pinyinSyl.className = cls;
    pinyinSyl.textContent = c.result || c.origin;
    pinyinRow.appendChild(pinyinSyl);

    const { symbols, toneMark } = pinyinToZhuyin(c.result || '');
    const zhuyinSyl = document.createElement('span');
    zhuyinSyl.className = cls;
    // Neutral tone's dot leads; every other tone (including unmarked tone 1)
    // trails — this placement rule lives here, not in pinyin-to-zhuyin.js.
    zhuyinSyl.textContent = toneMark === '˙' ? toneMark + symbols : symbols + toneMark;
    zhuyinRow.appendChild(zhuyinSyl);
  });

  unit.appendChild(hanziRow);
  unit.appendChild(pinyinRow);
  unit.appendChild(zhuyinRow);
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

// One input line -> one block-level flex row of units. Units wrap within the
// row (a long line still wraps, which is correct); separate lines are separate
// elements, so two lines can never flow into each other.
function buildLine(text) {
  const line = document.createElement('div');
  line.className = 'mr-line';

  // Split into alternating Han-character runs and everything else (Latin,
  // digits, whitespace, punctuation), so punctuation/latin pass through
  // unstyled instead of being fed to the segmenter.
  const parts = text.split(HAN_SPLIT).filter((p) => p !== '');

  parts.forEach((part) => {
    if (HAN_FULL.test(part)) {
      const words = segment(part, { format: OutputFormat.AllArray });
      words.forEach((chars) => {
        line.appendChild(buildWordUnit(chars));
      });
    } else {
      line.appendChild(buildPlainUnit(part));
    }
  });

  return line;
}

// A blank input line is a paragraph break, so it gets a real element with real
// height (see .mr-blank-line) — an empty flex child collapses to zero and the
// break disappears.
function buildBlankLine() {
  const spacer = document.createElement('div');
  spacer.className = 'mr-blank-line';
  spacer.setAttribute('aria-hidden', 'true');
  return spacer;
}

export function render(container, text) {
  container.innerHTML = '';
  if (!text) return;

  // Split on newlines FIRST, then segment each line independently. The
  // segmenter treats its input as one stream and will merge characters across
  // a newline into a single word, resolving polyphones against a context that
  // doesn't exist in the text — so segmenting the whole blob and reinserting
  // the breaks afterwards bakes wrong readings in at every line boundary.
  text.split('\n').forEach((rawLine) => {
    // Trailing \r from CRLF input would otherwise render as a stray plain unit.
    const line = rawLine.replace(/\r$/, '');
    container.appendChild(line.trim() === '' ? buildBlankLine() : buildLine(line));
  });
}
