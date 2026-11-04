import { defineGkdSubscription } from '@gkd-kit/define';
import { batchImportApps } from '@gkd-kit/tools';
import categories from './categories';
import globalGroups from './globalGroups';

export default defineGkdSubscription({
  id: 20261104,
  name: '红果短剧广告上滑(私有)',
  version: 1,
  author: 'ys8952',
  updateUrl:
    'https://fastly.jsdelivr.net/gh/ys8952/gkd-subscription@main/dist/gkd.json5',
  checkUpdateUrl:
    'https://fastly.jsdelivr.net/gh/ys8952/gkd-subscription@main/dist/gkd.version.json5',
  supportUri: 'https://github.com/ys8952/gkd-subscription',
  categories,
  globalGroups,
  apps: await batchImportApps(`${import.meta.dirname}/apps`),
});
