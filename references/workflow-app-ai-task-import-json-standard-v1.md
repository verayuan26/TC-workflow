# Workflow App AI 任务导入 JSON 标准 V1

> 版本：V1（字段名固定，不可随意改动）

## 1. 顶层结构

| 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|
| plan_name | string | 是 | 本次计划名称 |
| plan_period | object | 是 | 计划时间范围对象 |
| stage_focus | string[] | 是 | 当前阶段主线标签 |
| constraints | object | 是 | 约束与边界说明 |
| tasks | object[] | 是 | 任务数组 |
| vera_mandatory_review_rules | string[] | 是 | 必须进入 Vera 审核的规则清单 |
| orchestrator_note | string | 是 | 龙虾边界说明（仅草稿，不发布、不承诺） |

## 2. plan_period 对象

| 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|
| start_date | string | 是 | 开始日期（YYYY-MM-DD） |
| end_date | string | 是 | 结束日期（YYYY-MM-DD） |
| timezone | string | 是 | 固定为 `Asia/Shanghai` |

## 3. constraints 对象

| 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|
| no_website_infra_discussion | boolean | 是 | 不回到网站基础架构讨论 |
| draft_only_no_publish | boolean | 是 | 仅生成草稿，不直接发布 |
| draft_only_no_real_staff_assignment | boolean | 是 | 不直接分配真实员工 |
| draft_only_no_business_outcome_promise | boolean | 是 | 不承诺业务结果 |

## 4. tasks[] 数组内每个任务对象（固定字段）

| 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|
| task_id | string | 是 | 任务唯一ID（如 S-001） |
| role | string | 是 | 角色：小S/小M/小C/小A |
| task_title | string | 是 | 任务标题 |
| task_description | string | 是 | 任务说明 |
| priority | string | 是 | 优先级：P0/P1/P2 |
| due_time | string | 是 | 截止时间（ISO8601） |
| deliverables | string[] | 是 | 交付物列表 |
| acceptance_criteria | string[] | 是 | 验收标准列表 |
| needs_vera_review | boolean | 是 | 是否需要 Vera 审核 |
| review_reason | string[] | 是 | 审核原因数组；若不需要审核则必须是 `[]` |
| status | string | 是 | 默认 `AI_DRAFT` |
| risk_level | string | 是 | 风险等级：低/中/高 |
| channels | string[] | 是 | 对应渠道 |
| crm_tags | string[] | 是 | CRM 标签 |
| requires_utm | boolean | 是 | 是否需要 UTM |

## 5. 审核与状态规则

1. 所有任务默认：`status = "AI_DRAFT"`。
2. `needs_vera_review = true` 时，`review_reason` 不能为空数组。
3. `needs_vera_review = false` 时，`review_reason` 必须为 `[]`。
4. 涉及以下内容必须 `needs_vera_review = true`：
   - 客户案例、客户照片、客户聊天记录、客户隐私
   - 运输时效承诺、清关承诺、赔付边界
   - 报价、价格策略、广告预算

## 6. 小 S / 小 M / 小 C / 小 A 示例任务（各 1 条）

```json
[
  {
    "task_id": "S-EXAMPLE-001",
    "role": "小S",
    "task_title": "展会FAQ与脚本方向草稿",
    "task_description": "整理展会场景高频问题并输出3条Vera风格脚本方向。",
    "priority": "P0",
    "due_time": "2026-05-27T12:00:00+08:00",
    "deliverables": ["FAQ 5条", "脚本方向3条"],
    "acceptance_criteria": ["每条有痛点与建议", "无空泛营销腔"],
    "needs_vera_review": true,
    "review_reason": ["脚本含价格态度与案例表述风险"],
    "status": "AI_DRAFT",
    "risk_level": "高",
    "channels": ["YouTube Shorts", "VK"],
    "crm_tags": ["event_guangzhou_2026", "content_seed"],
    "requires_utm": false
  },
  {
    "task_id": "M-EXAMPLE-001",
    "role": "小M",
    "task_title": "短视频封面与字幕重点",
    "task_description": "按三条脚本输出封面文案、字幕高亮词和发布brief。",
    "priority": "P1",
    "due_time": "2026-05-28T16:00:00+08:00",
    "deliverables": ["封面文案3版", "字幕重点词表", "发布brief"],
    "acceptance_criteria": ["前3秒hook清晰", "CTA镜头明确"],
    "needs_vera_review": false,
    "review_reason": [],
    "status": "AI_DRAFT",
    "risk_level": "中",
    "channels": ["TikTok", "Instagram Reels"],
    "crm_tags": ["video_brief", "event_guangzhou_2026"],
    "requires_utm": false
  },
  {
    "task_id": "C-EXAMPLE-001",
    "role": "小C",
    "task_title": "UTM链接与落地页CTA检查",
    "task_description": "生成渠道UTM并检查落地页CTA与表单字段一致性。",
    "priority": "P0",
    "due_time": "2026-05-28T12:00:00+08:00",
    "deliverables": ["UTM台账", "页面检查清单"],
    "acceptance_criteria": ["链接命名无冲突", "关键表单字段可入CRM"],
    "needs_vera_review": true,
    "review_reason": ["页面含运输时效表述需审核"],
    "status": "AI_DRAFT",
    "risk_level": "高",
    "channels": ["Google", "Yandex", "Landing Page"],
    "crm_tags": ["utm_ready", "lp_check"],
    "requires_utm": true
  },
  {
    "task_id": "A-EXAMPLE-001",
    "role": "小A",
    "task_title": "四渠道广告假设与复盘字段",
    "task_description": "输出Google/Yandex/YouTube/VK广告角度假设与周复盘字段。",
    "priority": "P0",
    "due_time": "2026-05-29T18:00:00+08:00",
    "deliverables": ["假设表", "复盘模板"],
    "acceptance_criteria": ["每渠道至少2个假设", "每指标有口径"],
    "needs_vera_review": true,
    "review_reason": ["涉及广告预算建议"],
    "status": "AI_DRAFT",
    "risk_level": "高",
    "channels": ["Google", "Yandex", "YouTube", "VK"],
    "crm_tags": ["ads_hypothesis", "weekly_recap"],
    "requires_utm": true
  }
]
```
