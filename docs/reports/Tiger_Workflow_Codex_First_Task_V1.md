# Codex 首轮修改指令：Tiger Workflow App V1.1

任务名称：Tiger Workflow App V1.1 字段补齐与 PM 总控页

## 先读文件

请先阅读：
- src/types/index.ts
- src/components/FilterBar.tsx
- src/components/Layout.tsx
- src/pages/Dashboard.tsx
- src/services/taskApi.ts
- BACKEND_SCHEMA_V2.md

## 目标

在不重写全站、不改变现有 UI 风格的前提下，补齐胖虎父级 PM、CRM 执行线、Codex/Bolt/ChatGPT 工具介入所需字段。

## 允许修改文件

1. src/types/index.ts
2. src/components/FilterBar.tsx
3. src/components/Layout.tsx
4. src/App.tsx
5. src/pages/Dashboard.tsx
6. src/services/taskApi.ts
7. 可新增 src/pages/PMWorkstation.tsx

## 禁止

1. 不要重写全站
2. 不要删除现有页面
3. 不要改 package.json
4. 不要接真实 API
5. 不要大改视觉风格
6. 不要修改无关组件

## 具体要求

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
   - npm run typecheck
   - npm run build

## 输出要求

请最后输出：
1. 修改了哪些文件
2. 新增了哪些文件
3. typecheck 是否通过
4. build 是否通过
5. 还有哪些后续建议
