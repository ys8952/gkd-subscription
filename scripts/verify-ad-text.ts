import { readFileSync } from 'node:fs';
import JSON5 from 'json5';
import { Selector, SelectorCompileResult } from '@gkd-kit/selector';
import { toMatches } from 'regex-wasm';

type A11yNode = { text: string; visible: boolean };
type SwipeArg = {
  start: { x: string; y: string };
  end: { x: string; y: string };
  duration: number;
};
type Rule = {
  key: number;
  name: string;
  action?: string;
  matches: string | string[];
  excludeMatches?: string[];
  actionDelay?: number;
  actionCd?: number;
  actionMaximum?: number;
  matchTime?: number;
  forcedTime?: number;
  swipeArg?: SwipeArg;
};
type Group = { key: number; rules: Rule[]; activityIds?: string[] };
type App = { id: string; groups: Group[] };

const sub = JSON5.parse(
  readFileSync(new URL('../dist/gkd.json5', import.meta.url), 'utf-8'),
);

let failed = 0;
const check = (label: string, actual: unknown, expected: unknown) => {
  const ok = JSON.stringify(actual) === JSON.stringify(expected);
  if (!ok) failed++;
  console.log(
    `${ok ? 'PASS' : 'FAIL'}  ${label}${ok ? '' : `  actual=${JSON.stringify(actual)} expected=${JSON.stringify(expected)}`}`,
  );
};

// 引擎预热: regex-wasm 首次调用可能未就绪, 不做这一步会让断言假绿
if (toMatches('[0-9]+')('123') !== true)
  throw new Error('regex-wasm 引擎未就绪');

const apps = sub.apps as App[];
check(
  '订阅只包含红果一个应用',
  apps.map((a) => a.id),
  ['com.phoenix.read'],
);
check('没有全局规则(其他应用不参与匹配)', sub.globalGroups, []);
const group = apps[0].groups[0];
check('规则组锁定在短剧播放页', group.activityIds, [
  'com.dragon.read.component.shortvideo.impl.ShortSeriesActivity',
  'com.dragon.read.component.shortvideo.impl.fullscreen.ShortSeriesLandActivity',
]);

const shortRule = group.rules.find((r) => r.key === 1)!;
const waitRule = group.rules.find((r) => r.key === 2)!;
check(
  '短提示: 只滑 1 次',
  [shortRule.action, shortRule.actionMaximum, shortRule.actionCd],
  ['swipe', 1, 8000],
);
check(
  '倒计时: 4.5 秒首滑 + 5.5 秒补滑 + 最多 2 次',
  [
    waitRule.action,
    waitRule.actionDelay,
    waitRule.actionCd,
    waitRule.actionMaximum,
  ],
  ['swipe', 4500, 5500, 2],
);
check(
  '倒计时: 匹配存活期覆盖两次滑动',
  [waitRule.matchTime, waitRule.forcedTime],
  [20000, 15000],
);
check('两条规则使用同一段上滑轨迹', shortRule.swipeArg, waitRule.swipeArg);
check(
  '上滑轨迹为屏幕中部自下而上',
  [
    shortRule.swipeArg?.start,
    shortRule.swipeArg?.end,
    shortRule.swipeArg?.duration,
  ],
  [
    { x: 'screenWidth/2', y: 'screenHeight * 0.7' },
    { x: 'screenWidth/2', y: 'screenHeight * 0.3' },
    200,
  ],
);

const selectors: string[] = [];
for (const r of group.rules) {
  for (const s of [r.matches].flat()) selectors.push(s);
  for (const s of r.excludeMatches ?? []) selectors.push(s);
}
for (const s of selectors) {
  const result = Selector.compile(s);
  const err =
    result instanceof SelectorCompileResult.Failure ? result.error.message : '';
  check(
    `GKD 选择器引擎接受: ${s}`,
    result instanceof SelectorCompileResult.Success,
    true,
  );
  if (err) console.log(`      ${err}`);
}

/** 本订阅只使用 [text~="正则"][visibleToUser=true] 这一种形态 */
function parseSelector(source: string): (node: A11yNode) => boolean {
  const match = /^\[text~="(.*)"\]\[visibleToUser=true\]$/.exec(source);
  if (!match) throw new Error(`选择器形态超出校验脚本覆盖范围: ${source}`);
  if (match[1].includes('\\')) {
    throw new Error(
      `选择器正则含反斜杠, 需要四重转义才能通过 GKD 字符串解析, 请改写或先验证: ${source}`,
    );
  }
  const matches = toMatches(match[1]);
  return (node) => node.visible && matches(node.text);
}

const hit = (rule: Rule, screen: A11yNode[]) => {
  const target = parseSelector([rule.matches].flat().at(-1)!);
  const blocked = (rule.excludeMatches ?? []).map(parseSelector);
  return (
    screen.some(target) && !screen.some((node) => blocked.some((f) => f(node)))
  );
};

const SHORT = '上滑继续观看短剧';
const WAIT = '3秒后可继续上滑观看短剧';
const drama: A11yNode[] = [
  { text: '选集', visible: true },
  { text: '第6集', visible: true },
  { text: '剧备字〔2024〕第1234号', visible: true },
];
const unreadable: A11yNode[] = [];

type Screen = {
  name: string;
  nodes: A11yNode[];
  short: boolean;
  wait: boolean;
};
const screens: Screen[] = [
  {
    name: '广告-短提示',
    nodes: [{ text: SHORT, visible: true }],
    short: true,
    wait: false,
  },
  {
    name: '广告-短提示含空格',
    nodes: [{ text: '上滑  继续 观看 短剧', visible: true }],
    short: true,
    wait: false,
  },
  {
    name: '广告-短提示前后带文字',
    nodes: [{ text: `提示：${SHORT}即可继续观看`, visible: true }],
    short: true,
    wait: false,
  },
  {
    name: '广告-倒计时3秒',
    nodes: [{ text: WAIT, visible: true }],
    short: false,
    wait: true,
  },
  {
    name: '广告-倒计时15秒',
    nodes: [{ text: '15秒后可继续上滑观看短剧', visible: true }],
    short: false,
    wait: true,
  },
  {
    name: '广告-倒计时带前后缀文案',
    nodes: [
      { text: '温馨提示 5秒后可继续上滑观看短剧 请勿退出', visible: true },
    ],
    short: false,
    wait: true,
  },
  {
    name: '广告-两种提示同时可见',
    nodes: [
      { text: SHORT, visible: true },
      { text: '5秒后可继续上滑观看短剧', visible: true },
    ],
    short: false,
    wait: true,
  },
  { name: '正剧播放页', nodes: drama, short: false, wait: false },
  {
    name: '正剧-出现上滑查看下一集',
    nodes: [...drama, { text: '上滑查看下一集', visible: true }],
    short: false,
    wait: false,
  },
  {
    name: '非上滑类倒计时(3秒后可关闭广告)',
    nodes: [{ text: '3秒后可关闭广告', visible: true }],
    short: false,
    wait: false,
  },
  {
    name: '读不到文字/节点未就绪',
    nodes: unreadable,
    short: false,
    wait: false,
  },
  {
    name: '短提示存在但不可见',
    nodes: [{ text: SHORT, visible: false }],
    short: false,
    wait: false,
  },
];

for (const s of screens) {
  check(`${s.name} -> 短提示上滑`, hit(shortRule, s.nodes), s.short);
  check(`${s.name} -> 倒计时上滑`, hit(waitRule, s.nodes), s.wait);
}

/** 变异测试: 去掉两处守卫, 断言必须变红, 否则说明守卫是死的 */
const screenNamed = (name: string) =>
  screens.find((s) => s.name === name)!.nodes;
const strip = (rule: Rule, patch: Partial<Rule>): Rule => ({
  ...rule,
  ...patch,
});
const unanchored = strip(shortRule, {
  matches: shortRule.matches.toString().replace('".*', '"').replace('.*"', '"'),
});
check(
  '变异-去掉 .* 锚定后, 前后缀文案用例应不再命中',
  hit(unanchored, screenNamed('广告-短提示前后带文字')),
  false,
);
const noExclude = strip(shortRule, { excludeMatches: undefined });
check(
  '变异-去掉 excludeMatches 后, 双提示用例应误判为短提示',
  hit(noExclude, screenNamed('广告-两种提示同时可见')),
  true,
);
check(
  '变异-非法正则应被选择器引擎拒绝',
  Selector.compile('[text~=".*(未闭合"]') instanceof
    SelectorCompileResult.Failure,
  true,
);

if (failed) {
  console.log(`\n${failed} 项未通过`);
  process.exit(1);
}
console.log('\n全部通过');
