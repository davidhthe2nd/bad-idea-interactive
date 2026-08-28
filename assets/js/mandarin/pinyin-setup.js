// Configures pinyin-pro once at module load: loads the extended dictionary
// (the built-in one is deliberately small and misidentifies polyphones in
// less-common words) and applies the Taiwan reading overrides. Other modules
// must import `pinyin` / `segment` from HERE, not from pinyin-pro directly,
// so this setup is guaranteed to have run first.
import { addDict, customPinyin, pinyin, segment, OutputFormat } from 'https://esm.sh/pinyin-pro@3.29.3';
import modernDict from 'https://esm.sh/@pinyin-pro/data@1.3.1/modern';
import { taiwanReadings } from './taiwan-readings.js';
import { polyphoneFixes } from './polyphone-fixes.js';

addDict(modernDict);
customPinyin(taiwanReadings);
customPinyin(polyphoneFixes);

export { pinyin, segment, OutputFormat };
