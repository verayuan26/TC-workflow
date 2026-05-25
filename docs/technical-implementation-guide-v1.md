# Tiger Workflow App 技术员工作需求指南 V1

> 本文是 V1 正式使用版实施指南。接口标准以 `docs/openapi-workflow-app-v1-draft.yaml` 为准，不在本文重新设计接口。

## 1. V1 目标（一次到位，不分长周期）

V1 必须完整支持以下 10 项：
1. AI_DRAFT 任务导入
2. 任务编辑与分配
3. Vera 审核
4. SYSTEM_BLOCK
5. UTM 生成
6. Publish Queue 发布队列
7. Distribution Export 分发出口
8. Published URL 回填
9. Metrics Manual Input 手动数据回填
10. Weekly Report 周复盘

## 2. 开发优先级（仅 P0 / P1 / P2）

### P0（本次必须交付，正式可用）
- 任务主流程：导入、编辑、提交、审核、状态流转。
- 风控主流程：SYSTEM_BLOCK 拦截、Vera 审核门禁。
- 发布闭环：发布队列创建/查询/更新、标记已发布、publish_url 回填。
- 数据闭环：UTM 生成、手动指标回填、周复盘读取。
- 分发出口：可复制文本 + CSV/表格导出（不自动发平台）。

### P1（预留但不阻塞上线）
- CRM feedback 深化联动（仍为 mock 输入，不接真实 CRM）。
- AI run 审计增强（仍不接真实 OpenAI API）。

### P2（后续增强）
- 真正外部平台 API 对接、自动发布、预算自动调优（当前禁止）。

## 3. 第一阶段必须做的接口（V1 必做）

必须实现并可联调（以 OpenAPI 草案为标准）：
- `POST /api/tasks/import-ai-draft`
- `GET /api/tasks`
- `PATCH /api/tasks/{task_id}`
- `POST /api/tasks/{task_id}/submit`
- `POST /api/tasks/{task_id}/review`
- `GET /api/reviews`
- `POST /api/utm/generate`
- `POST /api/publish-queue`
- `GET /api/publish-queue`
- `PATCH /api/publish-queue/{id}`
- `POST /api/publish-queue/{id}/mark-published`
- `POST /api/metrics/manual-input`
- `GET /api/reports/weekly`
- `POST /api/briefs`
- `GET /api/briefs`
- `POST /api/agents/longxia/generate-tasks`
- `POST /api/crm-feedback`
- `GET /api/crm-feedback`
- `POST /api/ai-runs`
- `GET /api/ai-runs`

## 4. 数据库表建议（V1）

既有：`tasks`, `task_reviews`, `briefs`, `crm_feedback`, `ai_runs`  
新增（本次必须落库）：
- `publish_queue`
- `published_records`
- `metrics_manual_inputs`
- `weekly_reports`

### 4.1 publish_queue（新增）
关键字段：
- `id`, `task_id`, `platform`, `caption`, `hashtags`, `cta`, `utm_url`, `asset_url`, `scheduled_time`, `owner`
- `status` enum: `DRAFT | WAIT_VERA | READY_TO_PUBLISH | PUBLISHED | FAILED | NEED_EDIT`
- `system_block_check_required`, `created_at`, `updated_at`

### 4.2 published_records（新增）
- `id`, `publish_queue_id`, `task_id`, `platform`, `publish_url`, `published_at`, `publisher`, `note`

### 4.3 metrics_manual_inputs（新增）
- `id`, `task_id`, `content_id`, `platform`, `campaign`, `utm_source`, `utm_medium`, `utm_campaign`
- `crm_tags[]`, `business_vertical[]`
- `impressions`, `clicks`, `comments`, `dm`, `forms`, `valid_leads`, `sql_count`, `cost`
- `input_by`, `input_at`

### 4.4 weekly_reports（新增）
- `id`, `week_start`, `week_end`
- 维度：`platform`, `content_id`, `crm_tag`, `business_vertical`, `campaign`
- 聚合指标：曝光/点击/留资/有效线索/SQL/花费
- 判断字段：`decision` enum: `CONTINUE | FIX | PAUSE`
- `summary`, `generated_at`, `generated_by`

## 5. 角色权限（V1）

- **小S/小M/小C/小A**：创建/编辑草稿、提交审核、查看结果。
- **Vera**：审核任务（通过/驳回/要求修改），决定高风险内容能否进入发布队列。
- **PM/胖虎**：分配 owner、调整排期、查看周复盘。
- **系统规则**：不是用户角色，但强制执行 SYSTEM_BLOCK 和审核门禁。

## 6. 强制边界（必须实现为技术规则）

1. 不接真实社媒 API。
2. 不自动发布。
3. 不接真实广告平台。
4. 不自动改广告预算。
5. 不自动承诺清关、时效、价格、赔付。
6. `SYSTEM_BLOCK` 任务禁止进入 `publish_queue`。
7. 高风险且未通过 Vera 审核的任务禁止进入 `publish_queue`。

## 7. Vera 审核与 SYSTEM_BLOCK 技术验收标准

### Vera 审核门禁
- 若 `requires_vera_review=true` 且任务未 `APPROVED`，`POST /api/publish-queue` 必须返回 4xx 拒绝。
- `review_reason` 必须为数组；高风险任务不得为空。

### SYSTEM_BLOCK 门禁
- 命中拦截词（如“100%清关”“保证到货”“最低价”等）时，任务状态切换为 `SYSTEM_BLOCK`。
- `SYSTEM_BLOCK` 状态下：
  - 不可提交发布队列；
  - `/api/publish-queue/*` 创建与状态推进均返回拒绝。

## 8. 技术员开工前确认清单

- [ ] 已阅读并对齐：
  - `docs/ai-task-import-json-standard-v1.md`
  - `docs/field-mapping-ai-json-to-task.md`
  - `docs/openapi-workflow-app-v1-draft.yaml`
  - `docs/openapi-consistency-review-v1.md`
- [ ] 本次仅做 Workflow App V1，不扩展微服务。
- [ ] 所有外部系统连接保持 mock/placeholder。
- [ ] 已建立 4 张新增表：`publish_queue` / `published_records` / `metrics_manual_inputs` / `weekly_reports`。
- [ ] 已实现发布门禁与 SYSTEM_BLOCK 门禁自动校验。
- [ ] 已准备 CSV/表格导出用于 Distribution Export（仅导出，不自动发布）。
