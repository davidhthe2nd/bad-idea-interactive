// Traditional <-> Simplified conversion via opencc-js, loaded globally as
// `OpenCC` by a classic <script> tag (see mandarin-reader.html) rather than
// as an ES import, since its UMD build is what the project publishes for
// no-bundler browser use.
//
// The *p presets are phrase-aware, not just character maps: 鼠標 -> 滑鼠,
// 軟件 -> 軟體. Plain character conversion produces text that is technically
// Traditional but reads wrong, which defeats the point of this feature.
let s2twpConverter = null;
let tw2spConverter = null;

export function toTraditional(text) {
  if (!window.OpenCC) return text;
  s2twpConverter = s2twpConverter || window.OpenCC.Converter({ from: 'cn', to: 'twp' });
  return s2twpConverter(text);
}

export function toSimplified(text) {
  if (!window.OpenCC) return text;
  tw2spConverter = tw2spConverter || window.OpenCC.Converter({ from: 'twp', to: 'cn' });
  return tw2spConverter(text);
}
