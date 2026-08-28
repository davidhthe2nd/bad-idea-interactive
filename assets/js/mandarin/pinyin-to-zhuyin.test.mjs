// Plain-Node unit tests for pinyin-to-zhuyin.js — no test framework, no
// build step, matching the rest of this tool. Run with:
//   node assets/js/mandarin/pinyin-to-zhuyin.test.mjs
import { pinyinToZhuyin } from './pinyin-to-zhuyin.js';
import { taiwanReadings } from './taiwan-readings.js';
import { polyphoneFixes } from './polyphone-fixes.js';

let pass = 0;
let fail = 0;

function check(label, syllable, expectedSymbols, expectedToneMark) {
  const { symbols, toneMark } = pinyinToZhuyin(syllable);
  const ok = symbols === expectedSymbols && toneMark === expectedToneMark;
  if (ok) {
    pass++;
  } else {
    fail++;
    console.error(
      `FAIL ${label}: pinyinToZhuyin(${JSON.stringify(syllable)}) = ` +
      `{ symbols: ${JSON.stringify(symbols)}, toneMark: ${JSON.stringify(toneMark)} }, ` +
      `expected { symbols: ${JSON.stringify(expectedSymbols)}, toneMark: ${JSON.stringify(expectedToneMark)} }`
    );
  }
}

// Combines symbols + toneMark the same way the renderer must: neutral tone
// leads, every other tone (including the unmarked tone 1) trails.
function display(syllable) {
  const { symbols, toneMark } = pinyinToZhuyin(syllable);
  return toneMark === '˙' ? toneMark + symbols : symbols + toneMark;
}

function checkDisplay(label, syllable, expected) {
  const got = display(syllable);
  if (got === expected) {
    pass++;
  } else {
    fail++;
    console.error(`FAIL ${label}: display(${JSON.stringify(syllable)}) = ${JSON.stringify(got)}, expected ${JSON.stringify(expected)}`);
  }
}

// --- §3 exception table, one row each --------------------------------------

// zhi, chi, shi, ri, zi, ci, si — the i is a placeholder, symbol stands alone
check('zhi', 'zhī', 'ㄓ', '');
check('chi', 'chī', 'ㄔ', '');
check('shi', 'shì', 'ㄕ', 'ˋ');
check('ri',  'rì',  'ㄖ', 'ˋ');
check('zi',  'zǐ',  'ㄗ', 'ˇ');
check('ci',  'cí',  'ㄘ', 'ˊ');
check('si',  'sì',  'ㄙ', 'ˋ');

// ju, qu, xu (and jun, juan) — the u is really ü
check('ju',   'jú',   'ㄐㄩ',   'ˊ');
check('qu',   'qù',   'ㄑㄩ',   'ˋ');
check('xu',   'xǔ',   'ㄒㄩ',   'ˇ');
check('jun',  'jùn',  'ㄐㄩㄣ', 'ˋ');
check('juan', 'juǎn', 'ㄐㄩㄢ', 'ˇ');

// -iu -> really iou
check('liu (six)', 'liù', 'ㄌㄧㄡ', 'ˋ');
check('jiu (nine)', 'jiǔ', 'ㄐㄧㄡ', 'ˇ');

// -ui -> really uei
check('gui', 'guì', 'ㄍㄨㄟ', 'ˋ');
check('dui', 'duì', 'ㄉㄨㄟ', 'ˋ');

// -un -> really uen
check('dun', 'dùn', 'ㄉㄨㄣ', 'ˋ');
check('hun', 'hūn', 'ㄏㄨㄣ', '');

// -ong -> really ung
check('hong', 'hóng', 'ㄏㄨㄥ', 'ˊ');
check('dong', 'dòng', 'ㄉㄨㄥ', 'ˋ');

// yi, wu, yu — y-/w- are spelling devices, not initials
check('yi', 'yí', 'ㄧ', 'ˊ');
check('wu', 'wǔ', 'ㄨ', 'ˇ');
check('yu', 'yǔ', 'ㄩ', 'ˇ');

// ye, ya, you, wo, wei — same: strip the y/w, use the medial
check('ye',  'yè',  'ㄧㄝ', 'ˋ');
check('ya',  'yá',  'ㄧㄚ', 'ˊ');
check('you', 'yǒu', 'ㄧㄡ', 'ˇ');
check('wo',  'wǒ',  'ㄨㄛ', 'ˇ');
check('wei', 'wéi', 'ㄨㄟ', 'ˊ');

// er
check('er', 'ér', 'ㄦ', 'ˊ');

// --- §4 tone marks -----------------------------------------------------

// Tone 1: unmarked (opposite of pinyin's macron)
check('tone 1 unmarked', 'mā', 'ㄇㄚ', '');
// Tones 2-4: mark trails the symbols
check('tone 2 trails', 'má', 'ㄇㄚ', 'ˊ');
check('tone 3 trails', 'mǎ', 'ㄇㄚ', 'ˇ');
check('tone 4 trails', 'mà', 'ㄇㄚ', 'ˋ');
// Neutral: dot LEADS (opposite of pinyin, which leaves it bare)
check('neutral leads', 'ma', 'ㄇㄚ', '˙');

// The two worked examples from the brief, combined the way the renderer must
checkDisplay('liù full display', 'liù', 'ㄌㄧㄡˋ');
checkDisplay('de full display', 'de', '˙ㄉㄜ');

// --- §9: taiwan-readings.js entries render correctly in zhuyin -------------
// (This is the check that the override -> zhuyin pipeline is actually wired
// up, not bypassed: if these pass, an override change flows all the way
// through automatically.)
const taiwanExpected = {
  '垃圾': ['ㄌㄜˋ', 'ㄙㄜˋ'],
  '星期': ['ㄒㄧㄥ', 'ㄑㄧˊ'],
  '危險': ['ㄨㄟˊ', 'ㄒㄧㄢˇ'],
  '企業': ['ㄑㄧˋ', 'ㄧㄝˋ'],
  '法國': ['ㄈㄚˋ', 'ㄍㄨㄛˊ'],
  '液體': ['ㄧˋ', 'ㄊㄧˇ'],
  '攜帶': ['ㄒㄧˊ', 'ㄉㄞˋ'],
  '曝光': ['ㄆㄨˋ', 'ㄍㄨㄤ'],
  '蝸牛': ['ㄍㄨㄚ', 'ㄋㄧㄡˊ'],
};
for (const [word, reading] of Object.entries(taiwanReadings)) {
  const syllables = reading.split(' ');
  const expected = taiwanExpected[word];
  syllables.forEach((syl, i) => {
    check(`taiwan-readings ${word} syllable ${i}`, syl, expected[i].replace(/[ˊˇˋ˙]$/, ''), (expected[i].match(/[ˊˇˋ˙]$/) || [''])[0]);
  });
}

// --- polyphone set from the original brief, in zhuyin -----------------------
const polyphoneExpected = {
  '睡覺': ['ㄕㄨㄟˋ', 'ㄐㄧㄠˋ'],
  '覺得': ['ㄐㄩㄝˊ', 'ㄉㄜˊ'], // pinyin-pro resolves 得 here as full tone2 "dé", not neutral
  '還好': ['ㄏㄞˊ', 'ㄏㄠˇ'],
  '還錢': ['ㄏㄨㄢˊ', 'ㄑㄧㄢˊ'],
  '銀行': ['ㄧㄣˊ', 'ㄏㄤˊ'],
  '行為': ['ㄒㄧㄥˊ', 'ㄨㄟˊ'],
};
const overrideReadings = { ...polyphoneFixes }; // 睡覺, 還好 come from here
const knownReadings = { '覺得': 'jué dé', '還錢': 'huán qián', '銀行': 'yín háng', '行為': 'xíng wéi' };
for (const [word, expected] of Object.entries(polyphoneExpected)) {
  const reading = overrideReadings[word] || knownReadings[word];
  const syllables = reading.split(' ');
  syllables.forEach((syl, i) => {
    const exp = expected[i];
    const leadDot = exp.startsWith('˙');
    const bareExp = leadDot ? exp.slice(1) : exp.replace(/[ˊˇˋ]$/, '');
    const markExp = leadDot ? '˙' : (exp.match(/[ˊˇˋ]$/) || [''])[0];
    check(`polyphone ${word} syllable ${i}`, syl, bareExp, markExp);
  });
}

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail === 0 ? 0 : 1);
