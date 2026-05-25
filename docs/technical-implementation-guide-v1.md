# Tiger Workflow App 技术员工作需求指南 V1

> 面向对象：后端/全栈技术员（实施 V1）  
> 版本：V1  
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
- 支持 AI 任务草稿导入、任务查询/编辑、审核流转、UTM 生成、CRM反馈记录（mock）、AI运行记录（mock）。
- 服务于：社媒流量放大、广告投放、流量数字化、Vera 风格内容审核。

### 1.2 当前禁止项（V1 禁止接入）
- 禁止接真实 CRM 系统。
- 禁止接真实广告平台（Google/Yandex/YouTube/VK）。
- 禁止接真实 OpenAI API。
- 禁止自动发布到任何外部平台。

> 结论：V1 只做 Workflow App 内部流程与 mock 数据闭环。

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
7. `POST /api/utm/generate`

### 必做规则
- `status` 默认 `AI_DRAFT`。
- `plan_period.timezone` 仅接受 `Asia/Shanghai`。
- `target_proposal` 作为提案值处理，不参与“承诺结果”判断。
- `business_vertical` 必须是数组。
- `review_reason` 必须是数组（不审核时 `[]`）。
- 内部运营页（如 `/ops/*`, `/ads/*`）`cta_type=not_applicable`。
- 命中 SYSTEM_BLOCK 词：任务状态改 `SYSTEM_BLOCK`，并禁止进入提交/发布队列。

### P0 验收目标
- 技术员可完整演示：AI草稿导入 → 任务编辑 → 提交审核 → Vera审核 → 审核记录可查。

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

- 与真实 CRM 对接。
- 与真实广告平台对接。
- 与真实 LLM（OpenAI API）对接。
- 自动发布能力。

> 注意：P2 不在本次开发范围，不应提前侵入 P0/P1 架构。

---

## 3. 第一阶段接口实施清单（按 OpenAPI 草案）

> 不重新设计接口，严格按 `docs/openapi-workflow-app-v1-draft.yaml` 实现。

1. 实现 `import-ai-draft` 的字段级校验（required/enum/数组类型）。
2. 实现 `tasks` 列表查询与分页过滤。
3. 实现任务 PATCH（状态变更 + 字段更新）。
4. 实现 submit/review 状态机：
   - `AI_DRAFT` -> `SUBMITTED` / `VERA_REVIEW`
   - `VERA_REVIEW` -> `APPROVED` / `REJECTED`
   - `SYSTEM_BLOCK` 不允许 submit
5. 实现 reviews 查询。
6. 实现 UTM 生成接口（规则拼装 + content_id 返回）。

---

## 4. 数据库表建议（V1）

> 目标：支持 P0 完整闭环，P1 平滑扩展。

## 4.1 `plans`（计划批次）
建议字段：
- `id` (pk)
- `plan_name`
- `start_date`
- `end_date`
- `timezone`（固定 `Asia/Shanghai`）
- `stage_focus` (json/array)
- `target_proposal` (json)
- `orchestrator_note`
- `system_block_rules` (json)
- `created_at`, `updated_at`

## 4.2 `tasks`
建议字段：
- `id` (pk)
- `plan_id` (fk -> plans.id)
- `task_id`（业务ID，如 `S-001`）
- `role`, `title`, `description`, `priority`, `status`, `due_at`
- `deliverables` (json/array)
- `acceptance_criteria` (json/array)
- `requires_vera_review` (bool)
- `review_reason` (json/array)
- `risk_level`
- `channels` (json/array)
- `crm_tags` (json/array)
- `requires_utm` (bool)
- `business_vertical` (json/array)
- `target_customer`
- `related_page`
- `cta_type`
- `system_block_check_required` (bool)
- `system_block_hit` (bool)
- `system_block_matched_phrases` (json/array)
- `created_at`, `updated_at`

## 4.3 `task_reviews`
建议字段：
- `id` (pk)
- `task_id` (fk -> tasks.id)
- `reviewer_role`（vera/reviewer/admin）
- `decision`（APPROVED/REJECTED）
- `comment`
- `created_at`

## 4.4 `briefs`（P1）
- `id`, `brief_type`, `title`, `content`, `related_task_ids`(json), `created_at`

## 4.5 `crm_feedback`（P1 mock）
- `id`, `source`, `feedback_text`, `is_desensitized`, `tags`(json), `created_at`

## 4.6 `ai_runs`（P1 mock）
- `id`, `run_type`, `input_summary`, `mock_provider`, `status`, `created_at`

## 4.7 `utm_records`（可选）
- `id`, `source`, `medium`, `campaign`, `content`, `term`, `base_url`, `utm_url`, `content_id`, `created_at`

---

## 5. 角色权限（V1）

| 角色 | 主要权限 | 禁止 |
|---|---|---|
| `longxia_agent` | 导入 AI 草稿、生成草稿、提交审核 | 直接通过 Vera 审核 |
| `operator` | 编辑任务、提交审核、创建 brief | 越权审批高风险任务 |
| `reviewer` | 普通审核（按规则） | 替代 Vera 审核强制项 |
| `vera` | 高风险任务最终审核权 | 无 |
| `admin` | 全量读写与治理配置 | 无 |

### 强制规则
- 命中 Vera 强制审核条件的任务：必须进入 `VERA_REVIEW`。
- 命中 SYSTEM_BLOCK 的任务：任何角色都不能提交进入发布链路。

---

## 6. Vera 审核规则（技术落地）

以下任一命中，`requires_vera_review=true` 且 `review_reason` 必须非空：
- 具体运输时效；
- 清关结果承诺；
- 运费价格；
- 白关合规承诺；
- 赔付/保险承诺；
- 客户真实案例；
- 客户货物信息；
- 广告预算；
- 绝对化表达（保证、100%、最快、最低价、零风险等）。

### 验收标准
- 后端校验：`requires_vera_review=true` 时 `review_reason.length >= 1`。
- 提交任务时自动判路由：普通审核队列或 Vera 审核队列。

---

## 7. SYSTEM_BLOCK 规则（技术落地）

## 7.1 拦截词（默认）
- `100%清关`
- `保证到货`
- `最低价`
- `零风险`
- `包赔一切损失`
- `绝对安全`
- `固定天数必达`

## 7.2 处理机制
- 导入/编辑/提交环节执行命中检测（至少导入与提交必检）。
- 命中后：
  - `status = SYSTEM_BLOCK`
  - 记录 `system_block_matched_phrases`
  - 返回错误码 `SYSTEM_BLOCK`
  - 阻止进入发布/提交下游

## 7.3 验收标准
- 任一拦截词命中可复现阻断。
- 响应中可见命中词与阻断原因。

---

## 8. 错误响应规范（按 OpenAPI）

统一结构：
- `error_code`：
  - `VALIDATION_ERROR`
  - `SYSTEM_BLOCK`
  - `REVIEW_RULE_VIOLATION`
  - `NOT_FOUND`
  - `FORBIDDEN`
  - `CONFLICT`
  - `INTERNAL_ERROR`
- `message`
- `details`（可选对象）

---

## 9. 技术验收用例（建议最小集）

1. **导入成功用例**：合法 JSON 导入，任务状态均为 `AI_DRAFT`。  
2. **审核规则用例**：`requires_vera_review=true` 但 `review_reason=[]` 时返回 `422`。  
3. **数组规则用例**：`business_vertical` 非数组时返回 `422`。  
4. **时区规则用例**：`timezone!=Asia/Shanghai` 时返回 `422`。  
5. **内部页 CTA 用例**：`related_page` 为 `/ops/*` 且 `cta_type!=not_applicable` 返回 `422`。  
6. **SYSTEM_BLOCK 用例**：包含“100%清关”文本导入后状态= `SYSTEM_BLOCK`。  
7. **提交流程用例**：`SYSTEM_BLOCK` 任务调用 submit 返回 `409`。  
8. **Vera流转用例**：高风险任务 submit 后进入 `VERA_REVIEW`。  
9. **审核记录用例**：review 后 `GET /api/reviews` 可查询。  
10. **UTM 生成用例**：返回 `utm_url` 与 `content_id`。

---

## 10. 技术员开工前确认清单（必勾）

- [ ] 已阅读并对齐 4 份标准文档（JSON标准、字段映射、OpenAPI草案、一致性审阅）。
- [ ] 已确认 V1 范围：只做 mock，不接真实 CRM/广告/OpenAI，不做自动发布。
- [ ] 已确认 P0 接口优先落地清单与开发顺序。
- [ ] 已确认数据库最小表结构（plans/tasks/task_reviews）与数组字段存储方案。
- [ ] 已确认状态机与权限矩阵。
- [ ] 已确认 Vera 审核触发规则实现方式。
- [ ] 已确认 SYSTEM_BLOCK 拦截点（导入/提交）与错误码。
- [ ] 已准备最小验收测试用例（第9节）。
- [ ] 已确认所有时间字段统一 `Asia/Shanghai` 语义。
- [ ] 已确认 `target_proposal` 仅作提案值，不进入业务承诺逻辑。

---

## 11. 实施建议顺序（1周节奏）

- Day 1-2：表结构 + `import-ai-draft` + 基础校验  
- Day 3：`tasks` 查询/编辑 + submit 状态机  
- Day 4：review 流 + reviews 查询 + SYSTEM_BLOCK 完整闭环  
- Day 5：UTM 生成 + 回归测试 + 文档补齐  

> P1 接口（briefs/crm-feedback/ai-runs/longxia-generate）在 P0 验收通过后进入。
