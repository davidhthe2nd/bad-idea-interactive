// Converts an already-resolved toned pinyin syllable to Zhuyin (Bopomofo).
//
// Deliberately NOT a dictionary lookup. Zhuyin is derived from the pinyin
// pinyin-setup.js already produced (which already has taiwan-readings.js /
// polyphone-fixes.js baked in), so a correction made there — e.g. 垃圾 ->
// "lè sè" — automatically changes the zhuyin too. A parallel hanzi -> zhuyin
// dictionary would silently disagree with the pinyin the moment an override
// fires. One pronunciation source, two renderings of it.
//
// Built as initial + medial/final tables rather than ~400 syllables spelled
// out individually, so every row is easy to audit by hand. The tables below
// are intentionally small; the exceptions (empty-rime i, the ü spelled "u"
// after j/q/x, the y-/w- spelling devices, and -iu/-ui/-un/-ong's "hidden"
// full forms) are handled as explicit rules in pinyinToZhuyin(), not folded
// into the tables, so each irregularity stays visible as a single line of
// code rather than a table entry that looks like all the regular ones.

// Toned vowel -> { plain letter, tone 1-4 }. 'v' stands in for ü throughout
// this module (ASCII-safe internal key) — pinyin never uses the letter v for
// anything else, so this is unambiguous. ü only ever appears written after
// n/l (nu vs nü are a real, distinct pair); after j/q/x/y it's spelled "u"/
// "yu" and handled by the rules in pinyinToZhuyin(), not by this table.
const TONED_VOWELS = {
  'ā': { plain: 'a', tone: 1 }, 'á': { plain: 'a', tone: 2 }, 'ǎ': { plain: 'a', tone: 3 }, 'à': { plain: 'a', tone: 4 },
  'ē': { plain: 'e', tone: 1 }, 'é': { plain: 'e', tone: 2 }, 'ě': { plain: 'e', tone: 3 }, 'è': { plain: 'e', tone: 4 },
  'ī': { plain: 'i', tone: 1 }, 'í': { plain: 'i', tone: 2 }, 'ǐ': { plain: 'i', tone: 3 }, 'ì': { plain: 'i', tone: 4 },
  'ō': { plain: 'o', tone: 1 }, 'ó': { plain: 'o', tone: 2 }, 'ǒ': { plain: 'o', tone: 3 }, 'ò': { plain: 'o', tone: 4 },
  'ū': { plain: 'u', tone: 1 }, 'ú': { plain: 'u', tone: 2 }, 'ǔ': { plain: 'u', tone: 3 }, 'ù': { plain: 'u', tone: 4 },
  'ǖ': { plain: 'v', tone: 1 }, 'ǘ': { plain: 'v', tone: 2 }, 'ǚ': { plain: 'v', tone: 3 }, 'ǜ': { plain: 'v', tone: 4 },
  'ü': { plain: 'v', tone: null }, // unmarked ü, e.g. tone-1 nǖ if it's ever spelled bare
};

// The 21 consonant initials (声母). zh/ch/sh must be matched before z/c/s/h,
// so they're kept in this one table and split into two lookup sets by
// length below rather than hand-duplicated.
const INITIAL_SYMBOLS = {
  b: 'ㄅ', p: 'ㄆ', m: 'ㄇ', f: 'ㄈ',
  d: 'ㄉ', t: 'ㄊ', n: 'ㄋ', l: 'ㄌ',
  g: 'ㄍ', k: 'ㄎ', h: 'ㄏ',
  j: 'ㄐ', q: 'ㄑ', x: 'ㄒ',
  zh: 'ㄓ', ch: 'ㄔ', sh: 'ㄕ', r: 'ㄖ',
  z: 'ㄗ', c: 'ㄘ', s: 'ㄙ',
};
const TWO_CHAR_INITIALS = new Set(Object.keys(INITIAL_SYMBOLS).filter((k) => k.length === 2));
const ONE_CHAR_INITIALS = new Set(Object.keys(INITIAL_SYMBOLS).filter((k) => k.length === 1));

// zhi/chi/shi/ri/zi/ci/si: the final "i" is a placeholder for the buzz of
// the consonant itself, not a vowel — it gets no symbol of its own.
const EMPTY_RIME_INITIALS = new Set(['zh', 'ch', 'sh', 'r', 'z', 'c', 's']);

// y-/w- are pinyin spelling devices, not initials or independent sounds —
// yi/wu/yu are just how the medials i/u/ü are spelled with no consonant in
// front. Rewriting to the "with-initial" spelling lets the one FINALS table
// below serve both cases (e.g. "ye" and "-ie" as in "die" both -> ㄧㄝ).
const YW_NORMALIZE = {
  yi: 'i', ya: 'ia', ye: 'ie', yao: 'iao', you: 'iou',
  yan: 'ian', yin: 'in', yang: 'iang', ying: 'ing', yong: 'iong',
  wu: 'u', wa: 'ua', wo: 'uo', wai: 'uai', wei: 'uei',
  wan: 'uan', wen: 'uen', wang: 'uang', weng: 'ueng',
  yu: 'v', yue: 've', yuan: 'van', yun: 'vn',
};

// -iu, -ui, -un are pinyin's abbreviated spellings of the full sounds
// -iou, -uei, -uen; look those full forms up in FINALS instead.
const REST_ALIASES = { iu: 'iou', ui: 'uei', un: 'uen' };

// Medials + finals (韵母), keyed by the post-initial, post-normalization
// spelling. Grouped by medial so each group can be eyeballed against the
// bare-vowel row above it.
const FINALS = {
  // no medial
  a: 'ㄚ', o: 'ㄛ', e: 'ㄜ',
  ai: 'ㄞ', ei: 'ㄟ', ao: 'ㄠ', ou: 'ㄡ',
  an: 'ㄢ', en: 'ㄣ', ang: 'ㄤ', eng: 'ㄥ',
  ong: 'ㄨㄥ', // really "ung" — u-medial despite the spelling
  er: 'ㄦ',

  // ㄧ medial
  i: 'ㄧ', ia: 'ㄧㄚ', ie: 'ㄧㄝ', iao: 'ㄧㄠ', iou: 'ㄧㄡ',
  ian: 'ㄧㄢ', in: 'ㄧㄣ', iang: 'ㄧㄤ', ing: 'ㄧㄥ',
  iong: 'ㄩㄥ', // spelled with i, but the medial is really ü (e.g. 窮 qióng)

  // ㄨ medial
  u: 'ㄨ', ua: 'ㄨㄚ', uo: 'ㄨㄛ', uai: 'ㄨㄞ', uei: 'ㄨㄟ',
  uan: 'ㄨㄢ', uen: 'ㄨㄣ', uang: 'ㄨㄤ', ueng: 'ㄨㄥ',

  // ㄩ medial ("v" = ü)
  v: 'ㄩ', ve: 'ㄩㄝ', van: 'ㄩㄢ', vn: 'ㄩㄣ',
};

// Tone 1 is unmarked (opposite of pinyin, which marks it with a macron).
// Neutral gets a leading dot (opposite of pinyin, which leaves it bare) —
// the renderer is responsible for placing it before the symbols instead of
// after; see the comment on the return value below.
const TONE_MARK_SYMBOLS = { 1: '', 2: 'ˊ', 3: 'ˇ', 4: 'ˋ', neutral: '˙' };

function toToneless(syllable) {
  const s = syllable.normalize('NFC').toLowerCase();
  let tone = null;
  let toneless = '';
  for (const ch of s) {
    const mapped = TONED_VOWELS[ch];
    if (mapped) {
      tone = mapped.tone;
      toneless += mapped.plain;
    } else {
      toneless += ch;
    }
  }
  return { toneless, tone };
}

// syllable: a single toned pinyin syllable, e.g. "shuì", "de", "Fà".
// Returns { symbols, toneMark } — kept separate (rather than one combined
// string) so the caller decides placement: toneMark goes AFTER symbols for
// tones 2-4, but BEFORE symbols for the neutral tone. Concatenating them
// here would bake in one placement rule and hide the one most likely to be
// implemented backwards.
export function pinyinToZhuyin(syllable) {
  const { toneless, tone } = toToneless(syllable);

  let initial = '';
  if (TWO_CHAR_INITIALS.has(toneless.slice(0, 2))) {
    initial = toneless.slice(0, 2);
  } else if (ONE_CHAR_INITIALS.has(toneless[0])) {
    initial = toneless[0];
  }

  let rest = toneless.slice(initial.length);

  if (initial === '' && YW_NORMALIZE[toneless] !== undefined) {
    rest = YW_NORMALIZE[toneless];
  }

  if (EMPTY_RIME_INITIALS.has(initial) && rest === 'i') {
    rest = '';
  }

  // ü is always spelled "u" after j/q/x — real "u" never follows them.
  if ((initial === 'j' || initial === 'q' || initial === 'x') && rest[0] === 'u') {
    rest = 'v' + rest.slice(1);
  }

  rest = REST_ALIASES[rest] || rest;

  const initialSymbol = INITIAL_SYMBOLS[initial] || '';
  const finalSymbol = rest ? FINALS[rest] || '' : '';
  const toneMark = tone ? TONE_MARK_SYMBOLS[tone] : TONE_MARK_SYMBOLS.neutral;

  return { symbols: initialSymbol + finalSymbol, toneMark };
}
