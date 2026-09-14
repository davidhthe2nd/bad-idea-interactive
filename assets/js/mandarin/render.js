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

// Punctuation that must never be left starting a row on its own. Trailing
// marks (and closing brackets/quotes, which behave the same way) bind to the
// unit BEFORE them; opening brackets bind to the unit AFTER them.
const BINDS_BACK = new Set([...'。，、！？；：…—．）」』】》〉”’〕｝,.!?;:)]}']);
const BINDS_FORWARD = new Set([...'（「『【《〈“‘〔｛([{']);

// Tested on the whole plain unit, not character by character: a unit is
// punctuation only if it is nothing BUT punctuation (plus the space that
// often trails it). "abc, def" is prose and binds to nothing.
function bindsBack(text) {
  const trimmed = text.trimEnd();
  return trimmed.length > 0 && [...trimmed].every((ch) => BINDS_BACK.has(ch));
}

function bindsForward(text) {
  const trimmed = text.trimStart();
  return trimmed.length > 0 && [...trimmed].every((ch) => BINDS_FORWARD.has(ch));
}

// Collapses bound units into groups. A group of one stays a bare unit — the
// common case keeps exactly the DOM it had before.
function groupBoundUnits(items) {
  const groups = [];
  let pending = []; // openers held back until the unit they bind to arrives

  items.forEach((item) => {
    if (item.bindsForward) {
      pending.push(item.el);
      return;
    }
    if (item.bindsBack && pending.length === 0 && groups.length) {
      groups[groups.length - 1].push(item.el);
      return;
    }
    groups.push(pending.concat(item.el));
    pending = [];
  });

  // A line ending on an opening bracket has nothing to bind forward to, so it
  // falls back to binding to what precedes it rather than being left loose.
  if (pending.length) {
    if (groups.length) groups[groups.length - 1].push(...pending);
    else groups.push(pending);
  }

  return groups;
}

// Bound units share one flex item, so the line can only wrap around the pair,
// never between them.
function wrapBound(els, extraClass) {
  const bound = document.createElement('span');
  bound.className = extraClass ? 'mr-bind ' + extraClass : 'mr-bind';
  els.forEach((el) => bound.appendChild(el));
  return bound;
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
  const items = [];

  parts.forEach((part) => {
    if (HAN_FULL.test(part)) {
      const words = segment(part, { format: OutputFormat.AllArray });
      words.forEach((chars) => {
        items.push({ el: buildWordUnit(chars), bindsBack: false, bindsForward: false });
      });
    } else {
      items.push({
        el: buildPlainUnit(part),
        bindsBack: bindsBack(part),
        bindsForward: bindsForward(part),
      });
    }
  });

  groupBoundUnits(items).forEach((group) => {
    line.appendChild(group.length === 1 ? group[0] : wrapBound(group));
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

const ORPHAN_GUARD = 'mr-orphan-guard';

// Which items share a row, read off the rendered geometry — there is no way
// to ask a flex container where its wrap points landed. .mr-line bottom-aligns
// its items, so everything on one row shares a bottom edge to within rounding.
function rowsOf(items) {
  const rows = [];
  let bottom = null;

  items.forEach((el) => {
    const edge = el.getBoundingClientRect().bottom;
    if (bottom === null || Math.abs(edge - bottom) > 1) {
      rows.push([]);
      bottom = edge;
    }
    rows[rows.length - 1].push(el);
  });

  return rows;
}

// Guards are undone before every re-measure: a guard that was needed at one
// width is usually wrong at the next, and measuring around a stale one would
// compound the error.
function releaseGuards(line) {
  Array.from(line.children)
    .filter((el) => el.classList.contains(ORPHAN_GUARD))
    .forEach((guard) => {
      while (guard.firstChild) line.insertBefore(guard.firstChild, guard);
      line.removeChild(guard);
    });
}

// The read half: which two units, if any, need pulling together so the final
// row is not one unit on its own. Returns null when the line is already fine.
function orphanPair(line) {
  const items = Array.from(line.children);
  // With two units there is nothing to pull down that does not just move the
  // problem up a row.
  if (items.length < 3) return null;

  const rows = rowsOf(items);
  if (rows.length < 2 || rows[rows.length - 1].length !== 1) return null;

  const orphan = items[items.length - 1];
  const previous = items[items.length - 2];
  const gap = parseFloat(getComputedStyle(line).columnGap) || 0;
  // A pair too wide for the line would overflow it instead of wrapping, which
  // is worse than the orphan it fixes.
  if (previous.offsetWidth + gap + orphan.offsetWidth > line.clientWidth) return null;

  return { line, previous, orphan };
}

// The write half. Applied once per line, never iterated: binding the pair can
// leave the row above it short, but that row is not the one this rule is
// about, and chasing it up the line would not terminate.
function bindPair({ line, previous, orphan }) {
  const guard = wrapBound([], ORPHAN_GUARD);
  line.insertBefore(guard, previous);
  guard.appendChild(previous);
  guard.appendChild(orphan);
}

// Measures rendered geometry, so it must run after the lines are in the
// document and again whenever their width or the units' widths change — see
// the resize and mode-switch callers in main.js.
//
// Three passes rather than one loop: all the writes that invalidate layout
// happen before any read, and all the reads before the next write. A single
// loop would interleave them and force the browser to re-lay-out once per
// line instead of once for the whole block.
export function balance(container) {
  const lines = Array.from(container.children)
    .filter((el) => el.classList.contains('mr-line'));

  lines.forEach(releaseGuards);
  lines.map(orphanPair).filter(Boolean).forEach(bindPair);
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

  balance(container);
}
