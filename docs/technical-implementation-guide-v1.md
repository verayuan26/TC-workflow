# Tiger Workflow App 技术员工作需求指南 V1（clean v2）

> 面向对象：后端/全栈技术员（实施 V1 正式使用版）  
> 版本：V1 clean v2  
> 性质：实施指南（不重新设计接口，按既有草案落地）

---

## 0. 依据文档（唯一标准来源）

本指南仅基于以下文件整理，不另起标准：

1. `docs/ai-task-import-json-standard-v1.md`
2. `docs/field-mapping-ai-json-to-task.md`
3. `docs/openapi-workflow-app-v1-draft.yaml`
4. `docs/openapi-consistency-review-v1.md`

**执行原则：**
- 接口定义以 `docs/openapi-workflow-app-v1-draft.yaml` 为准；
- 字段语义以 JSON 标准与字段映射文档为准；
- 一致性冲突以 `openapi-consistency-review-v1.md` 修正意见为准。

---

## 1. 项目范围与硬边界（必须遵守）

### 1.1 当前阶段目标
- 支持 AI 任务草稿导入、任务查询/编辑、审核流转。
- 支持 Publish Queue、Distribution Export、Published URL 回填、Metrics Manual Input、Weekly Report。
- 服务于：社媒流量放大、广告投放、流量数字化、Vera 风格内容审核。

### 1.2 当前禁止项（V1 禁止接入）
- 禁止接真实社媒 API。
- 禁止自动发布到任何外部平台。
- 禁止接真实广告平台（Google/Yandex/YouTube/VK）。
- 禁止接真实 CRM 系统。
- 禁止接真实 OpenAI API。

> 结论：V1 只做 Workflow App 内部流程与人工/手工闭环。

---

## 2. 开发优先级（P0 / P1 / P2）

## P0（第一阶段必须完成）

### 必做接口（必须可用）
1. `POST /api/tasks/import-ai-draft`
2. `GET /api/tasks`
3. `PATCH /api/tasks/{task_id}`
4. `POST /api/tasks/{task_id}/submit`
5. `POST /api/tasks/{task_id}/review`
6. `GET /api/reviews`
7. `GET /api/publish-queue`
8. `POST /api/publish-queue/{task_id}/enqueue`
9. `POST /api/distribution/exports`
10. `POST /api/distribution/published-url`
11. `POST /api/metrics/manual`
12. `GET /api/metrics/manual`
13. `GET /api/reports/weekly`
14. `POST /api/utm/generate`

### 必做规则
- `status` 默认 `AI_DRAFT`。
- `plan_period.timezone` 仅接受 `Asia/Shanghai`。
- `target_proposal` 作为提案值处理，不参与“承诺结果”判断。
- `business_vertical` 必须是数组。
- `review_reason` 必须是数组（不审核时 `[]`）。
- 每个任务对象必须包含 `status` 与 `review_reason`（满足 Workflow App 导入标准）。
- 内部运营页（如 `/ops/*`, `/ads/*`）`cta_type=not_applicable`。
- 命中 SYSTEM_BLOCK 词：任务状态改 `SYSTEM_BLOCK`，并禁止提交与发布入队。
- 未通过 Vera 审核的高风险任务：禁止进入发布队列。
- Published URL 仅人工回填，不接 webhook 自动同步。

### P0 验收目标
- 可完整演示：AI草稿导入 → 任务编辑 → 提交审核 → Vera审核 → 入发布队列 → 导出分发包 → 人工发布后 URL 回填 → 手工录入指标 → 周报聚合。

---

## P1（第二阶段建议完成）

### 接口
1. `POST /api/briefs`
2. `GET /api/briefs`
3. `POST /api/agents/longxia/generate-tasks`（mock模板生成）
4. `POST /api/crm-feedback`（mock）
5. `GET /api/crm-feedback`（mock）
6. `POST /api/ai-runs`（mock）
7. `GET /api/ai-runs`（mock）

### P1 目标
- 提升运营使用体验（brief、CRM反馈记录、AI run审计）
- 不改变 P0 主流程。

---

## P2（预留）

- 与真实社媒平台 API 对接。
- 与真实广告平台对接。
- 与真实 CRM 对接。
- 与真实 LLM（OpenAI API）对接。
- 自动发布能力。

> 注意：P2 不在本次开发范围，不应提前侵入 P0/P1 架构。

---

## 3. 第一阶段接口实施清单（按 OpenAPI 草案）

1. 实现 `import-ai-draft` 的字段级校验（required/enum/数组类型）。
2. 实现 `tasks` 列表查询与分页过滤。
3. 实现任务 PATCH（状态变更 + 字段更新）。
4. 实现 submit/review 状态机：
   - `AI_DRAFT` -> `SUBMITTED` / `VERA_REVIEW`
   - `VERA_REVIEW` -> `APPROVED` / `REJECTED`
   - `SYSTEM_BLOCK` 不允许 submit
5. 实现发布队列入队校验：
   - `SYSTEM_BLOCK` 不可入队
   - 高风险且未 Vera 审核通过不可入队
6. 实现 Distribution Export（仅导出，不触发自动发布）。
7. 实现 Published URL 回填接口（人工输入 URL + 渠道 + 发布时间）。
8. 实现 Metrics Manual Input（按任务/渠道/日期录入核心指标）。
9. 实现 Weekly Report 聚合（任务、发布 URL、手工指标）。
10. 实现 UTM 生成接口（规则拼装 + content_id 返回）。

---

## 4. 数据库表建议（V1）

## 4.1 `plans`
- `id`, `plan_name`, `start_date`, `end_date`, `timezone`, `stage_focus`, `target_proposal`, `orchestrator_note`, `system_block_rules`, `created_at`, `updated_at`

## 4.2 `tasks`
- 保留原任务字段，并新增：
- `publish_queue_status`
- `distribution_export_id`
- `published_urls`(json)

## 4.3 `task_reviews`
- `id`, `task_id`, `reviewer_role`, `decision`, `comment`, `created_at`

## 4.4 `publish_queue`
- `id`, `task_id`, `queue_status`, `queued_by`, `queued_at`, `note`

## 4.5 `distribution_exports`
- `id`, `task_id`, `channels`(json), `export_payload`(json), `exported_at`

## 4.6 `published_links`
- `id`, `task_id`, `channel`, `url`, `published_at`, `filled_by`, `created_at`

## 4.7 `manual_metrics`
- `id`, `task_id`, `channel`, `metric_date`, `impressions`, `clicks`, `leads`, `cost`, `filled_by`, `created_at`

## 4.8 `weekly_reports`
- `id`, `report_week`, `scope`, `summary_json`, `generated_at`

---

## 5. 角色权限（V1）

| 角色 | 主要权限 | 禁止 |
|---|---|---|
| `longxia_agent` | 导入 AI 草稿、生成草稿、提交审核 | 直接通过 Vera 审核 |
| `operator` | 编辑任务、提交审核、入发布队列、回填URL、录入指标 | 越权审批高风险任务 |
| `reviewer` | 普通审核（按规则） | 替代 Vera 审核强制项 |
| `vera` | 高风险任务最终审核权 | 无 |
| `admin` | 全量读写与治理配置 | 无 |

### 强制规则
- 命中 Vera 强制审核条件任务：必须进入 `VERA_REVIEW`。
- 命中 SYSTEM_BLOCK 任务：任何角色都不能进入发布队列。

---

## 6. 技术验收用例（建议最小集）

1. 合法 JSON 导入后任务状态均为 `AI_DRAFT`。  
2. `requires_vera_review=true` 且 `review_reason=[]` 返回 `422`。  
3. `business_vertical` 非数组返回 `422`。  
4. `timezone!=Asia/Shanghai` 返回 `422`。  
5. `/ops/*` 页面且 `cta_type!=not_applicable` 返回 `422`。  
6. 含 SYSTEM_BLOCK 词导入后状态= `SYSTEM_BLOCK`。  
7. `SYSTEM_BLOCK` 任务 submit 返回 `409`。  
8. 高风险任务 submit 后进入 `VERA_REVIEW`。  
9. 未 Vera 通过的高风险任务 enqueue 返回 `409`。  
10. Distribution Export 成功生成导出包且不触发外部调用。  
11. Published URL 可人工回填并关联 task/channel。  
12. Manual Metrics 可按日录入并被 Weekly Report 聚合。
