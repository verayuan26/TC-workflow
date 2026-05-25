# AI JSON 字段 → Workflow App Task 字段映射表

> PR3 conflict-resolved baseline: keep main standards + V1 formal scope.
## 1. 任务字段映射（V1正式使用版）

| AI JSON 字段 | Task/后端字段 | 当前状态 | 分类 |
|---|---|---|---|
| task_id | tasks.task_id | 已有 | DB |
| role | tasks.role | 已有 | DB |
| title | tasks.title | 已有 | DB |
| description | tasks.description | 已有 | DB |
| priority (P0/P1/P2) | tasks.priority | 已有 | DB |
| status (AI_DRAFT/SYSTEM_BLOCK/VERA_REVIEW/APPROVED/REJECTED) | tasks.status | 已有 | DB |
| due_at (+08:00) | tasks.due_at | 已有 | DB |
| deliverables[] | tasks.deliverables_json | 需新增 | DB |
| acceptance_criteria[] | tasks.acceptance_criteria_json | 需新增 | DB |
| requires_vera_review | tasks.requires_vera_review | 已有 | DB |
| review_reason[] | tasks.review_reason_json | 已有 | DB |
| risk_level | tasks.risk_level | 已有 | DB |
| channels[] | tasks.channels_json | 已有 | DB |
| crm_tags[] | tasks.crm_tags_json | 已有 | DB |
| requires_utm | tasks.requires_utm | 已有 | DB |
| business_vertical[] | tasks.business_vertical_json | 已有 | DB |
| target_customer | tasks.target_customer | 已有 | DB |
| related_page | tasks.related_page | 已有 | DB |
| cta_type | tasks.cta_type | 已有 | DB |
| system_block_check_required | tasks.system_block_check_required | 已有 | DB |

## 2. 新增业务闭环字段映射

### Publish Queue
| AI/业务字段 | 建议字段 |
|---|---|
| platform/caption/hashtags/cta/utm_url/asset_url/scheduled_time/owner/status | publish_queue.* |
| publish_url/published_at/publisher/platform | published_records.* |

### Metrics Manual Input
| AI/业务字段 | 建议字段 |
|---|---|
| impressions/clicks/comments/dm/forms/valid_leads/sql_count/cost | metrics_manual_inputs.* |
| content_id/crm_tags/business_vertical/campaign | metrics_manual_inputs.* |

### Weekly Report
| AI/业务字段 | 建议字段 |
|---|---|
| platform/content_id/crm_tag/business_vertical/campaign | weekly_reports.dimension_* |
| continue/fix/pause | weekly_reports.decision |

## 3. API 支持要求（V1）

P0 必须支持：
- `/api/publish-queue`（POST/GET/PATCH/mark-published）
- `/api/metrics/manual-input`（POST）
- `/api/reports/weekly`（GET）

并保持：
- `SYSTEM_BLOCK` 禁止入发布队列
- 未通过 Vera 的高风险任务禁止入发布队列
- `/ops/*` `/ads/*` 的 `cta_type=not_applicable`
