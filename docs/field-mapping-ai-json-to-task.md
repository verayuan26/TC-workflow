# 《AI JSON 字段 → Workflow App Task 字段映射表》

> 目标：将《Workflow App AI 任务导入 JSON 标准 V1》字段映射到 Workflow App Task 模型，供技术员按同一口径实现。  
> 范围：仅文档说明，不改代码、不接真实 API。

---

## 1. 顶层字段映射（Plan 级）

| AI JSON 字段 | Task/系统侧对应 | 当前状态 | 说明 |
|---|---|---|---|
| `plan_name` | 建议 `plans.plan_name` | 需新增 | 计划批次名，不属于单任务字段。 |
| `plan_period.start_date` | 建议 `plans.start_date` | 需新增 | 计划开始日期。 |
| `plan_period.end_date` | 建议 `plans.end_date` | 需新增 | 计划结束日期。 |
| `plan_period.timezone` | 建议 `plans.timezone` | 需新增 | 固定 `Asia/Shanghai`。 |
| `stage_focus[]` | 建议 `plans.stage_focus`(json) | 需新增 | 阶段主线标签。 |
| `target_proposal` | 建议 `plans.target_proposal`(json) | 需新增 | 提案值，不是承诺。 |
| `orchestrator_note` | 建议 `plans.orchestrator_note` | 需新增 | 龙虾边界说明。 |
| `system_block_rules` | 建议 `plans.system_block_rules`(json) | 需新增 | 拦截词与动作配置。 |

---

## 2. 任务字段映射（Task 级）

| AI JSON 字段 | Task 字段建议 | 当前状态 | 数据归类 |
|---|---|---|---|
| `task_id` | `tasks.task_id` | 已有/需确认 | 数据库字段 |
| `role` | `tasks.role` | 已有/需确认 | 数据库字段 |
| `title` | `tasks.title` | 已有 | 数据库字段 |
| `description` | `tasks.description` | 已有 | 数据库字段 |
| `priority` | `tasks.priority` | 已有 | 数据库字段 |
| `status` | `tasks.status` | 已有 | 数据库字段 |
| `due_at` | `tasks.due_at` | 已有/需统一命名 | 数据库字段 |
| `deliverables[]` | `tasks.deliverables`(json) | 需新增 | 数据库字段 |
| `acceptance_criteria[]` | `tasks.acceptance_criteria`(json) | 需新增 | 数据库字段 |
| `requires_vera_review` | `tasks.requires_vera_review` | 需新增 | 数据库字段 |
| `review_reason[]` | `tasks.review_reason`(json) | 需新增 | 数据库字段 |
| `risk_level` | `tasks.risk_level` | 需新增 | 数据库字段 |
| `channels[]` | `tasks.channels`(json) | 需新增 | 数据库字段 |
| `crm_tags[]` | `tasks.crm_tags`(json) | 需新增 | 数据库字段 |
| `requires_utm` | `tasks.requires_utm` | 需新增 | 数据库字段 |
| `business_vertical[]` | `tasks.business_vertical`(json) | 需新增 | 数据库字段 |
| `target_customer` | `tasks.target_customer` | 需新增 | 数据库字段 |
| `related_page` | `tasks.related_page` | 需新增 | 数据库字段 |
| `cta_type` | `tasks.cta_type` | 需新增 | 数据库字段 |
| `system_block_check_required` | `tasks.system_block_check_required` | 需新增 | 数据库字段 |

---

## 3. 前端展示字段 vs 数据库字段

- **数据库字段（必须落库）**：以上 Task 级全部字段 + Plan 级全部字段。  
- **前端展示衍生字段（可计算）**：如状态徽章文案、风险颜色、审核队列展示标签。  

---

## 4. 需要 API 支持的字段（最小集）

P0 必须支持：
- `status`（默认 `AI_DRAFT`）
- `requires_vera_review` + `review_reason[]`
- `business_vertical[]`
- `requires_utm`
- `cta_type`
- `system_block_check_required`

P1 建议支持：
- `channels[]`
- `crm_tags[]`
- `deliverables[]`
- `acceptance_criteria[]`

---

## 5. 关键一致性规则

1. `review_reason` 必须为数组，不可为字符串。  
2. `business_vertical` 必须为数组。  
3. 内部页（`/ops/*`, `/ads/*`）`cta_type=not_applicable`。  
4. 命中 SYSTEM_BLOCK 词后，任务不可提交发布链路。  
