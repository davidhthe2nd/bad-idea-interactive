// Polyphone corrections for words pinyin-pro resolves incorrectly, even with
// the @pinyin-pro/data "complete" dictionary loaded. These are NOT Taiwan-vs-
// mainland variants (see taiwan-readings.js for those) — they're standard
// Mandarin everywhere; the library just picks the wrong character reading
// for these specific words. Found by testing the polyphone set called out in
// the tool's own spec; more will surface with use — treat this as a living
// document the same way as taiwan-readings.js.
export const polyphoneFixes = {
  '睡覺': 'shuì jiào',  // not shuì jué
  '重複': 'chóng fù',   // not zhòng fù
  '音樂': 'yīn yuè',    // not yīn lè
  '長大': 'zhǎng dà',   // not cháng dà
  '銀行': 'yín háng',   // not yín xíng
  '還好': 'hái hǎo',    // not huán hǎo
};
