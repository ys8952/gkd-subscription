import { readFileSync } from 'node:fs';
import JSON5 from 'json5';

const local = JSON5.parse(
  readFileSync(new URL('../dist/gkd.json5', import.meta.url), 'utf-8'),
);
const localVersion = JSON5.parse(
  readFileSync(new URL('../dist/gkd.version.json5', import.meta.url), 'utf-8'),
);

const targets = [
  'https://raw.githubusercontent.com/ys8952/gkd-subscription/main/dist/gkd.json5',
  'https://fastly.jsdelivr.net/gh/ys8952/gkd-subscription@main/dist/gkd.json5',
  'https://fastly.jsdelivr.net/gh/ys8952/gkd-subscription@main/dist/gkd.version.json5',
];

let failed = 0;
for (const url of targets) {
  const label = url.replace(/^https:\/\//, '').slice(0, 62);
  try {
    const res = await fetch(url, { cache: 'no-store' });
    if (!res.ok) {
      failed++;
      console.log(`FAIL  ${label}  HTTP ${res.status}`);
      continue;
    }
    const text = await res.text();
    const parsed = JSON5.parse(text);
    if (url.endsWith('gkd.version.json5')) {
      const ok =
        parsed.id === localVersion.id &&
        parsed.version === localVersion.version;
      if (!ok) failed++;
      console.log(
        `${ok ? 'PASS' : 'FAIL'}  ${label}  {id:${parsed.id},version:${parsed.version}}`,
      );
      continue;
    }
    const equal = JSON.stringify(parsed) === JSON.stringify(local);
    if (!equal) failed++;
    console.log(
      `${equal ? 'PASS' : 'FAIL'}  ${label}  ${(text.length / 1024).toFixed(2)}KB id=${parsed.id} version=${parsed.version} apps=${parsed.apps?.length}`,
    );
    if (!equal) {
      console.log('      线上与本地产物不一致, 差异字段:');
      for (const k of ['id', 'version', 'updateUrl', 'checkUpdateUrl']) {
        if (JSON.stringify(parsed[k]) !== JSON.stringify(local[k]))
          console.log(
            `      ${k}: 线上=${JSON.stringify(parsed[k])} 本地=${JSON.stringify(local[k])}`,
          );
      }
      if (JSON.stringify(parsed.apps) !== JSON.stringify(local.apps))
        console.log('      apps 规则内容不一致');
    }
  } catch (e) {
    failed++;
    console.log(`FAIL  ${label}  ${String(e).slice(0, 100)}`);
  }
}
console.log(
  failed ? `\n${failed} 项未通过` : '\n线上地址可用, 内容与本地产物一致',
);
process.exit(failed ? 1 : 0);
