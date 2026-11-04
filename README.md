# GKD 订阅 - 红果短剧广告页自动上滑

只针对 `com.phoenix.read`（红果免费短剧）短剧播放页：识别底部「上滑继续观看短剧」/「X秒后可继续上滑观看短剧」两类无障碍文本节点，用 GKD 的 `swipe` 动作上滑。不使用截图、OCR 或云端识别，不解析倒计时数字，不含任何全局规则（其他应用不参与匹配）。

订阅地址（GKD → 订阅 → 添加 → 链接）：

```
https://fastly.jsdelivr.net/gh/ys8952/gkd-subscription@main/dist/gkd.json5
```

直连 GitHub 的备用地址（网络可达时用）：

```
https://raw.githubusercontent.com/ys8952/gkd-subscription/main/dist/gkd.json5
```

需要 GKD >= 1.12.0（`swipe` 动作从该版本开始支持）；建议 1.13.0-beta-3 及以上，该版本起支持「页面切换或规则失效后中断待执行的滑动」。

## 改参数

`actionDelay`（首次等待）、`actionCd`（首滑到补滑的间隔）在 [src/apps/com.phoenix.read.ts](src/apps/com.phoenix.read.ts)。改完在项目根目录执行（本机没装 pnpm，用 npm 即可）：

```
npm run build && npm run verify && git add -A && git commit -m "tune swipe timing" && git push && npm run verify:published
```

`build` 会递增 `version`；`id` 保持不变，手机上的 GKD 即可自动更新。jsDelivr 有约 5 分钟缓存，`verify:published` 显示不一致时稍等再跑一次。

## 本地校验

- `npm run verify`：[scripts/verify-ad-text.ts](scripts/verify-ad-text.ts) 用 GKD 真实选择器引擎和 Kotlin 正则 Wasm 引擎，对构建产物 `dist/gkd.json5` 做界面文本分类断言，并包含变异测试（去掉正则锚定、去掉倒计时排除守卫、注入非法正则都必须失败）。
- `npm run verify:published`：抓取线上地址，解析后与本地产物逐字段比对。
- `npm run export`：导出一份格式化的 `hongguo-swipe.gkd.json5`，用于不走地址、直接本地文件导入的场景。

订阅依赖 GKD 的 `swipe` 动作，规则只用文本节点，不含截图/OCR/云端识别。
