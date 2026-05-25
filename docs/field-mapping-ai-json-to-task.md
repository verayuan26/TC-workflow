# 《AI JSON 字段 → Workflow App Task 字段映射表》（V1 正式使用版）

> 目标：将《Workflow App AI 任务导入 JSON 标准 V1》字段映射到 Workflow App Task 模型，并补齐发布队列与手动指标闭环所需字段。  
> 范围：仅文档说明，不改代码、不接真实 API。

---

## 1. 顶层字段映射（Plan 级）

| AI JSON 字段 | Task/系统侧对应 | 当前状态 | 说明 |
|---|---|---|---|
| `plan_name` | `plans.plan_name` | 需新增 | 计划批次名，不属于单任务字段。 |
| `plan_period.start_date` | `plans.start_date` | 需新增 | 计划开始日期。 |
| `plan_period.end_date` | `plans.end_date` | 需新增 | 计划结束日期。 |
| `plan_period.timezone` | `plans.timezone` | 需新增 | 固定 `Asia/Shanghai`。 |
| `stage_focus[]` | `plans.stage_focus`(json) | 需新增 | 阶段主线标签。 |
| `target_proposal` | `plans.target_proposal`(json) | 需新增 | 提案值，不是承诺。 |
| `orchestrator_note` | `plans.orchestrator_note` | 需新增 | 龙虾边界说明。 |
| `system_block_rules` | `plans.system_block_rules`(json) | 需新增 | 拦截词与动作配置。 |

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
| `published_urls[]` | `tasks.published_urls`(json) | 需新增 | 发布回填字段 |
| `distribution_export_id` | `tasks.distribution_export_id` | 需新增 | 发布导出关联 |
| `publish_queue_status` | `tasks.publish_queue_status` | 需新增 | 发布队列状态 |

---

## 3. 发布与指标闭环字段（新增）

| 模块 | 字段建议 | 说明 |
|---|---|---|
| Publish Queue | `publish_queue.task_id` / `queue_status` / `queued_at` | 仅内部排队，不自动发布。 |
| Distribution Export | `distribution_exports.export_id` / `channels` / `payload` | 导出素材包给人工发布。 |
| Published URL 回填 | `published_links.task_id` / `channel` / `url` / `published_at` | 人工发布后回填。 |
| Metrics Manual Input | `manual_metrics.task_id` / `channel` / `metric_date` / `impressions` / `clicks` / `leads` / `cost` | 手工录入指标，不接广告 API。 |
| Weekly Report | `weekly_reports.report_week` / `summary_json` | 由任务+URL+手工指标聚合生成。 |

---

## 4. 关键一致性规则

> Workflow App 导入约束补充：每个任务都必须包含 `status` 字段（默认 `AI_DRAFT`）与 `review_reason` 字段（无需审核时 `[]`）。

1. `review_reason` 必须为数组，不可为字符串。  
2. `business_vertical` 必须为数组。  
3. 内部页（`/ops/*`, `/ads/*`）`cta_type=not_applicable`。  
4. 命中 SYSTEM_BLOCK 词后，任务不可提交且不可进入发布队列。  
5. 未通过 Vera 审核的高风险任务，不可进入发布队列。  
6. Published URL 只能手工回填，不通过外部 webhook 自动写回。
