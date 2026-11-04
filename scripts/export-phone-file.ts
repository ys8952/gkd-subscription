import { readFileSync, writeFileSync } from 'node:fs';
import assert from 'node:assert';
import JSON5 from 'json5';

const built = JSON5.parse(
  readFileSync(new URL('../dist/gkd.json5', import.meta.url), 'utf-8'),
);
const pretty = JSON5.stringify(built, null, 2);
const out = new URL('../../hongguo-swipe.gkd.json5', import.meta.url);
writeFileSync(out, pretty + '\n', 'utf-8');

const roundTrip = JSON5.parse(readFileSync(out, 'utf-8'));
assert.deepStrictEqual(roundTrip, built, '格式化文件与构建产物不一致');
console.log('已写出 hongguo-swipe.gkd.json5, 与 dist/gkd.json5 结构一致');
console.log('规则组:', built.apps[0].groups[0].name);
for (const r of built.apps[0].groups[0].rules) {
  console.log(
    ` - [${r.key}] ${r.name} actionDelay=${r.actionDelay ?? '-'} actionCd=${r.actionCd ?? '-'} actionMaximum=${r.actionMaximum ?? '-'}`,
  );
}
