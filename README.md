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

`actionDelay`（首次等待）、`actionCd`（首滑到补滑的间隔）在 [src/apps/com.phoenix.read.ts](src/apps/com.phoenix.read.ts)。改完在项目根目录执行：

```
pnpm run build && pnpm run verify && git add -A && git commit -m "tune swipe timing" && git push
```

`build` 会递增 `version`；`id` 保持不变，手机上的 GKD 即可自动更新。

## 本地校验

`scripts/verify-ad-text.ts` 用 GKD 真实选择器引擎和 Kotlin 正则 Wasm 引擎，对构建产物 `dist/gkd.json5` 做界面文本分类断言，并包含变异测试（去掉正则锚定、去掉倒计时排除守卫、注入非法正则都必须失败）。
