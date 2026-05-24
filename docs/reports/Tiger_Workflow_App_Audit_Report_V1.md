# Tiger Workflow App 字段差异检查与完善建议 V1

检查对象：`TC-workflow-main (1).zip`
检查时间：2026-05-24

## 1. 当前项目结论

当前 Tiger Workflow App 已经不是普通原型，而是一个较完整的 **内容/视频/广告/审核/发布队列工作台**。

技术栈：
- Vite + React + TypeScript
- Tailwind CSS
- mock data 本地任务数据
- 已预留 Google Apps Script / Google Sheets API 方向

已有页面：
- 总览 Dashboard
- 小 M 工作台
- 小 S 工作台
- 小 C 工作台
- 小 A 广告工作台
- Vera 审核台
- 发布队列
- AI 规则页

项目已经包含 `BACKEND_SCHEMA_V2.md`，说明 Bolt 已经按“Google Sheets 后台 + Apps Script API”的方向设计了比较完整的数据结构。

## 2. 技术检查结果

### 2.1 build 结果

执行：

```bash
npm ci
npm run build
```

结果：build 成功。

### 2.2 typecheck 结果

执行：

```bash
npm run typecheck
```

结果：失败。

报错：

```text
src/pages/Dashboard.tsx(218,22): error TS6133: 'role' is declared but its value is never read.
```

修复方式：

```tsx
// 当前：
ROLES.forEach(({ role, label }, i) => {

// 修改为：
ROLES.forEach(({ label }, i) => {
```

这是小问题，P0 修复即可。

## 3. 当前字段与胖虎父级 PM 需求的匹配情况

### 3.1 已经做得比较好的字段

当前 Task 类型已包含以下重要字段：

| 需求 | 当前是否已有 | 当前字段 |
|---|---:|---|
| 任务 ID | 已有 | `id` |
| 所属网站 | 已有 | `website` |
| 内容类型 | 已有 | `contentType` |
| 任务标题 | 已有 | `title` |
| 状态 | 已有 | `status` |
| 优先级 | 已有 | `priority` |
| 负责人 | 已有 | `assignedTo` |
| 是否逾期 | 已有 | `isOverdue` |
| 是否需要老板审核 | 已有 | `needsVeraReview` |
| 关键词 | 已有 | `keywords` |
| CTA | 已有 | `cta` |
| CRM 标签 | 已有 | `crmTags` |
| URL / 页面 | 已有 | `targetUrl` |
| UTM | 已有 | `utmLink` |
| 视频素材 | 已有 | `materialLink` |
| 成片链接 | 已有 | `finalVideoLink` |
| 广告平台 | 已有 | `adPlatform` |
| 广告数据 | 已有 | `impressions`, `clicks`, `ctr`, `spent`, `cpl` 等 |
| 风险评分 | 已有 | `riskLevel`, `aiRiskScore`, `riskLabels` |
| 人工决策 | 已有 | `humanDecision`, `decisionBy`, `decisionTime` |
| 预算审批 | 已有 | `isBudgetTask`, `budgetStatus`, `proposedBudget`, `currentBudget` |
| 操作日志 | 已有 | `opLog` |

结论：Bolt 当前版本已经覆盖了“小 S / 小 M / 小 C / 小 A / Vera 审核”的大部分基础字段。

## 4. 主要缺口

### P0 缺口 1：缺少父级 PM / 胖虎视角

当前 App 有执行线工作台，但没有父级 PM 视角。

建议新增：
- 胖虎 PM 总控页
- 本周目标
- 本周 Sprint
- 五条线任务分配总表
- 每条线阻塞原因
- 本周最终老板周报

建议新增字段：

| 字段 | 说明 |
|---|---|
| `sprintId` | 本周任务批次，例如 `WEEK-2026-05-24` |
| `weeklyGoal` | 本周老板级目标 |
| `workstream` | 所属执行线：SEO / 视频 / 技术 / 广告 / CRM / PM |
| `ownerRole` | 小 S / 小 M / 小 C / 广告小 A / CRM / 胖虎 |
| `pmSummary` | 胖虎总结 |
| `pmRiskNote` | 胖虎风险判断 |
| `pmNextStep` | 胖虎下一步建议 |

### P0 缺口 2：缺少 CRM 执行线

当前 Role 类型没有 CRM，导航也没有 CRM 工作台。

当前：

```ts
export type Role = '小M' | '小S' | '小C' | '小A' | 'Vera' | '龙虾';
```

建议修改为：

```ts
export type Role = '胖虎' | '小M' | '小S' | '小C' | '广告小A' | 'CRM' | 'Vera' | '龙虾' | 'Codex' | 'Bolt' | 'ChatGPT';
```

或者保留 `小A`，但前端展示为 `广告小A`。

建议新增 CRM 工作台字段：

| 字段 | 说明 |
|---|---|
| `leadSource` | YouTube / VK / Google Ads / Website / WhatsApp 等 |
| `leadStatus` | 未联系 / 已联系 / 有效 / 高意向 / 无效 / 成交 / 归档 |
| `leadCount` | 总线索数 |
| `validLeadCount` | 有效线索数 |
| `highIntentLeadCount` | 高意向线索数 |
| `customerQuestions` | 客户高频问题 |
| `salesFeedback` | 销售反馈 |
| `crmApiStatus` | CRM API 同步状态 |
| `crmRecordLink` | CRM 记录链接 |

### P0 缺口 3：缺少 Codex / Bolt / ChatGPT 工具介入字段

目前有龙虾 AI 任务表，但没有明确记录 Codex / Bolt / ChatGPT 在每个任务中的作用。

建议新增：

| 字段 | 说明 |
|---|---|
| `needsCodex` | 是否需要 Codex |
| `codexRole` | Codex-SEO / Codex-Page / Codex-Landing / Codex-QA / Codex-Data |
| `codexTaskPrompt` | 给 Codex 的任务指令 |
| `allowedFiles` | Codex 允许修改的文件 |
| `gitBranch` | Git 分支 / worktree |
| `buildStatus` | build 是否成功 |
| `deployPreviewUrl` | 预览链接 |
| `needsBolt` | 是否需要 Bolt |
| `boltTaskPrompt` | 给 Bolt 的任务指令 |
| `needsChatGPT` | 是否需要 ChatGPT 协助文案/策略 |

### P0 缺口 4：任务字段没有完全覆盖“输入材料 → 输出物 → 验收标准”

当前有 `completionCriteria`，但没有统一字段承接胖虎的任务派发格式。

建议新增：

| 字段 | 说明 |
|---|---|
| `taskGoal` | 任务目标 |
| `inputMaterials` | 输入材料 |
| `expectedOutput` | 预期产出物 |
| `acceptanceCriteria` | 验收标准 |
| `requiresHumanReviewReason` | 为什么需要人工审核 |
| `dataResult` | 数据结果 |
| `feedbackSummary` | 执行反馈摘要 |

### P1 缺口 5：FilterBar 常量滞后

`FilterBar.tsx` 中：

- 负责人缺少 `小A`
- 状态缺少 `11_已拦截`、`12_自动放行`
- 内容类型缺少 `客户案例`、`广告素材`、`广告预算`

这会导致筛选器不能完整覆盖 Task 类型。

### P1 缺口 6：任务 API 仍是 mock

当前：

```ts
getTasks() => MOCK_TASKS
updateTaskField() => console.log
```

这说明前端目前只能展示，不能真正保存任务状态。

建议下一步：
- 先接 Google Apps Script API
- 或先接 Supabase / 你们自建 CRM API
- 至少要让任务状态、备注、审核结果可写回

### P1 缺口 7：没有任务创建 / 编辑表单

当前主要是查看和筛选，缺少：
- 新建任务
- 编辑任务
- 变更状态
- 添加反馈
- 添加数据结果
- 添加老板审核意见

如果不加这些，胖虎只能“看任务”，不能真正派发任务。

## 5. 建议的最小可用版本 V1.1

不建议现在重写全 App。建议只做 6 个小改动：

1. 修复 TypeScript 报错。
2. 补齐 Role / FilterBar 常量。
3. 新增 `workstream`、`taskGoal`、`inputMaterials`、`expectedOutput`、`acceptanceCriteria` 字段。
4. 新增 Codex / Bolt / ChatGPT 介入字段。
5. 新增 CRM 关键字段。
6. 新增胖虎 PM 总控页，先做只读版。

## 6. 给 Codex 的首轮修改指令

```text
任务名称：Tiger Workflow App V1.1 字段补齐与 PM 总控页

请先阅读：
- src/types/index.ts
- src/components/FilterBar.tsx
- src/components/Layout.tsx
- src/pages/Dashboard.tsx
- src/services/taskApi.ts
- BACKEND_SCHEMA_V2.md

目标：
在不重写全站、不改变现有 UI 风格的前提下，补齐胖虎父级 PM、CRM 执行线、Codex/Bolt/ChatGPT 工具介入所需字段。

允许修改文件：
1. src/types/index.ts
2. src/components/FilterBar.tsx
3. src/components/Layout.tsx
4. src/App.tsx
5. src/pages/Dashboard.tsx
6. src/services/taskApi.ts
7. 可新增 src/pages/PMWorkstation.tsx

禁止：
1. 不要重写全站
2. 不要删除现有页面
3. 不要改 package.json
4. 不要接真实 API
5. 不要大改视觉风格

具体要求：
1. 修复 Dashboard.tsx 的 TypeScript 未使用变量报错。
2. Role 增加：胖虎、CRM、Codex、Bolt、ChatGPT。小A展示名可改为广告小A。
3. ContentType 增加：客户案例、广告素材、广告预算。
4. FilterBar 同步所有 Role / Status / ContentType。
5. Task 增加字段：
   - sprintId
   - weeklyGoal
   - workstream
   - ownerRole
   - taskGoal
   - inputMaterials
   - expectedOutput
   - acceptanceCriteria
   - feedbackSummary
   - dataResult
   - requiresHumanReviewReason
   - needsCodex
   - codexRole
   - codexTaskPrompt
   - allowedFiles
   - gitBranch
   - buildStatus
   - deployPreviewUrl
   - needsBolt
   - boltTaskPrompt
   - needsChatGPT
   - leadSource
   - leadStatus
   - leadCount
   - validLeadCount
   - highIntentLeadCount
   - customerQuestions
   - salesFeedback
   - crmApiStatus
   - crmRecordLink
6. 新增 PMWorkstation 页面，展示：
   - 本周目标
   - 五条线任务数量
   - P0 / P1 / P2 任务
   - 阻塞任务
   - 需要老板审核任务
   - 需要 Codex / Bolt / ChatGPT 的任务
   - CRM 反馈摘要
7. 修改 Layout 增加“胖虎总控”入口。
8. App.tsx 接入 PMWorkstation。
9. 修改 MOCK_TASKS 中至少 3 条任务，补充新增字段示例。
10. 最后运行：
   npm run typecheck
   npm run build
11. 输出：
   - 修改了哪些文件
   - 新增了哪些文件
   - typecheck 是否通过
   - build 是否通过
   - 还有哪些后续建议
```

## 7. 建议给胖虎的使用结论

当前 Tiger Workflow App 可以作为基础工作台继续使用，但还不能直接承担“父级 PM 总控系统”。

原因：
- 已有执行工作台，但缺少胖虎总控页。
- 已有广告、审核、发布队列，但缺少 CRM 线索闭环。
- 已有任务字段，但缺少 Codex/Bolt/ChatGPT 工具介入字段。
- 已有 mock 数据，但没有真实写入 API。

建议先做 V1.1 字段补齐，再跑第一周增长闭环。
