// Taiwan Mandarin reading overrides.
//
// pinyin-pro's dictionary follows PRC standard readings. This map corrects
// specific words to the reading actually used in Taiwan, applied via
// pinyin-pro's customPinyin() at startup (see pinyin-setup.js).
//
// This is a living document, not a config set once — grow it as readings are
// found wrong. Only add entries at the WORD level where the Taiwan reading is
// unambiguous. Do not add single-character overrides: many characters (e.g.
// 和) have a reading that depends on the word/context — 和 as the conjunction
// "and" is commonly "hàn" in Taiwan but "hé" is correct in most other words
// it appears in, so a blanket single-character override would break those.
export const taiwanReadings = {
  '垃圾': 'lè sè',      // not lā jī
  '星期': 'xīng qí',    // not xīng qī
  '危險': 'wéi xiǎn',   // not wēi xiǎn
  '企業': 'qì yè',      // not qǐ yè
  '法國': 'Fà guó',     // not Fǎ guó
  '液體': 'yì tǐ',      // not yè tǐ
  '攜帶': 'xí dài',     // not xié dài
  '曝光': 'pù guāng',   // not bào guāng
  '蝸牛': 'guā niú',    // not wō niú
};
