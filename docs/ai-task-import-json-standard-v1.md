# 《Workflow App AI 任务导入 JSON 标准 V1》

> 适用范围：Tiger Workflow App 的 AI 任务草稿导入。  
> 版本：V1（字段名固定，向后兼容优先）。  
> 原则：只用于任务草稿结构化，不直接发布、不分配真实员工、不承诺业务结果。

---

## 1. 设计目标与适用场景

本标准用于统一三类已验证业务场景的任务导入结构：

1. 广州服装供应链展会商旅获客  
2. 俄罗斯客户来中国采购童装/女装供应商  
3. 中国到俄罗斯白关物流获客内容  

核心作用：

- 固定字段，避免每周变形；
- 支持社媒流量放大、广告投放、流量数字化、Vera 风格内容协同；
- 强制审核边界与系统拦截词机制；
- 让 AI 多做整理、人只做判断。

---

## 2. 顶层字段（固定）

| 字段名 | 类型 | 必填 | 说明 |
|---|---|---:|---|
| `plan_name` | string | 是 | 本次周计划名称。 |
| `plan_period` | object | 是 | 计划时间范围对象。 |
| `stage_focus` | string[] | 是 | 当前阶段主线标签（如社媒流量放大、广告投放等）。 |
| `target_proposal` | object | 是 | **提案值**（proposal），不是业务承诺。 |
| `orchestrator_note` | string | 是 | 龙虾边界说明（仅草稿，不发布，不承诺）。 |
| `system_block_rules` | object | 是 | 系统拦截规则配置。 |
| `tasks` | object[] | 是 | 任务数组（固定任务字段结构）。 |

---

## 3. `plan_period` 字段规范

| 字段名 | 类型 | 必填 | 说明 |
|---|---|---:|---|
| `start_date` | string | 是 | 开始日期，格式 `YYYY-MM-DD`。 |
| `end_date` | string | 是 | 结束日期，格式 `YYYY-MM-DD`。 |
| `timezone` | string | 是 | 固定为 `Asia/Shanghai`。 |

---

## 4. `target_proposal` 字段规范（非承诺）

| 字段名 | 类型 | 必填 | 说明 |
|---|---|---:|---|
| `valid_leads_target_proposal` | number | 是 | 有效线索提案值。 |
| `sql_target_proposal` | number | 是 | SQL 提案值。 |
| `attribution_rate_target_proposal` | number | 是 | 归因率提案值（0~1）。 |

> 说明：`target_proposal` 仅作目标提案，**不得解释为结果承诺**。

---

## 5. `system_block_rules` 使用方式

| 字段名 | 类型 | 必填 | 说明 |
|---|---|---:|---|
| `blocked_phrases` | string[] | 是 | 禁止进入发布队列的表达。 |
| `block_action` | string | 是 | 拦截动作，建议固定：`SYSTEM_BLOCK_AND_STOP_PUBLISH_QUEUE`。 |

### 推荐默认拦截词（可扩展）

- `100%清关`
- `保证到货`
- `最低价`
- `零风险`
- `包赔一切损失`
- `绝对安全`
- `固定天数必达`

---

## 6. `tasks[]` 内每个任务字段（固定）

> 每个任务必须带固定 `task_id`，并遵循角色段：  
> `S-001~S-003`、`M-001~M-002`、`C-001~C-003`、`A-001~A-002`。

| 字段名 | 类型 | 必填 | 说明 |
|---|---|---:|---|
| `task_id` | string | 是 | 任务唯一ID（固定编号体系）。 |
| `role` | string | 是 | 角色：`小S` / `小M` / `小C` / `小A`。 |
| `title` | string | 是 | 任务标题。 |
| `description` | string | 是 | 任务描述。 |
| `priority` | string | 是 | 优先级：`P0` / `P1` / `P2`。 |
| `status` | string | 是 | 默认值固定 `AI_DRAFT`。 |
| `due_at` | string | 是 | 截止时间（ISO8601，`+08:00`）。 |
| `deliverables` | string[] | 是 | 交付物列表。 |
| `acceptance_criteria` | string[] | 是 | 验收标准列表。 |
| `requires_vera_review` | boolean | 是 | 是否需要 Vera 审核。 |
| `review_reason` | string[] | 是 | **必须是数组**。不审核时为 `[]`。 |
| `risk_level` | string | 是 | 风险等级：`低` / `中` / `高`。 |
| `channels` | string[] | 是 | 对应渠道。 |
| `crm_tags` | string[] | 是 | CRM 标签。 |
| `requires_utm` | boolean | 是 | 是否需要 UTM。 |
| `business_vertical` | string[] | 是 | **必须为数组**（如 `["kidswear"]`）。 |
| `target_customer` | string | 是 | 目标客户描述。 |
| `related_page` | string | 是 | 关联页面路径。 |
| `cta_type` | string | 是 | CTA类型；内部运营页统一 `not_applicable`。 |
| `system_block_check_required` | boolean | 是 | 是否强制执行拦截词检查。建议对外内容相关任务设为 `true`。 |

---

## 7. 强制规则（V1）

1. `status` 默认且固定为 `AI_DRAFT`。  
2. `plan_period.timezone` 固定为 `Asia/Shanghai`。  
3. `target_proposal` 是提案值，不是业务承诺。  
4. `business_vertical` 必须使用数组。  
5. `review_reason` 必须是数组：  
   - `requires_vera_review=true` → `review_reason` 至少1条；  
   - `requires_vera_review=false` → `review_reason=[]`。  
6. 内部运营页（如 `/ops/*`, `/ads/*` 运营看板/计划页）`cta_type` 必须为 `not_applicable`。  
7. 出现拦截词命中时，执行 `system_block_rules.block_action`，不得进入发布队列。  

---

## 8. 必须进入 Vera 审核的典型内容

- 具体运输时效；
- 清关结果承诺；
- 运费价格与报价表达；
- 白关合规承诺；
- 赔付/保险承诺；
- 客户真实案例；
- 客户货物信息；
- 广告预算；
- 任何绝对化表达（如“保证、100%、最快、最低价、零风险”等）。

---

## 9. 标准示例任务（小S/小M/小C/小A各1条）

```json
[
  {
    "task_id": "S-001",
    "role": "小S",
    "title": "白关客户痛点与报价信息模板",
    "description": "输出白关客户真实痛点与报价基础信息模板（品类/重量/体积/包装/目的城市）。",
    "priority": "P0",
    "status": "AI_DRAFT",
    "due_at": "2026-06-02T18:00:00+08:00",
    "deliverables": ["痛点清单", "报价信息模板", "FAQ 5条"],
    "acceptance_criteria": ["字段完整", "无绝对化承诺词"],
    "requires_vera_review": false,
    "review_reason": [],
    "risk_level": "中",
    "channels": ["SEO", "VK"],
    "crm_tags": ["ru_white_customs", "quote_template"],
    "requires_utm": false,
    "business_vertical": ["white_customs_logistics"],
    "target_customer": "俄罗斯方向白关物流咨询客户",
    "related_page": "/content/white-customs-faq",
    "cta_type": "dm_consultation",
    "system_block_check_required": true
  },
  {
    "task_id": "M-001",
    "role": "小M",
    "title": "短视频执行包与字幕风险检查",
    "description": "根据脚本输出镜头、字幕、封面和发布brief，并进行拦截词检查。",
    "priority": "P0",
    "status": "AI_DRAFT",
    "due_at": "2026-06-03T20:00:00+08:00",
    "deliverables": ["镜头清单", "字幕重点词", "封面文案", "发布brief"],
    "acceptance_criteria": ["Hook清晰", "拦截词命中项已剔除"],
    "requires_vera_review": true,
    "review_reason": ["可能涉及客户案例素材", "可能触及时效/清关边界"],
    "risk_level": "高",
    "channels": ["YouTube Shorts", "TikTok"],
    "crm_tags": ["video_brief", "risk_check"],
    "requires_utm": false,
    "business_vertical": ["white_customs_logistics"],
    "target_customer": "白关物流潜在线索",
    "related_page": "/media/white-customs-video-brief",
    "cta_type": "whatsapp_inquiry",
    "system_block_check_required": true
  },
  {
    "task_id": "C-001",
    "role": "小C",
    "title": "落地页/CTA/UTM/CRM/复盘口径五项强检",
    "description": "投放前完成页面、CTA、UTM、CRM标签、复盘口径检查并输出修复建议。",
    "priority": "P0",
    "status": "AI_DRAFT",
    "due_at": "2026-06-03T12:00:00+08:00",
    "deliverables": ["五项强检清单", "修复清单"],
    "acceptance_criteria": ["五项均有结论", "追踪链路可归因"],
    "requires_vera_review": true,
    "review_reason": ["页面可能涉及报价与服务边界表述"],
    "risk_level": "高",
    "channels": ["Landing Page", "Website"],
    "crm_tags": ["lp_audit", "utm_check", "crm_mapping"],
    "requires_utm": true,
    "business_vertical": ["white_customs_logistics"],
    "target_customer": "白关物流线索",
    "related_page": "/lp/white-customs-logistics",
    "cta_type": "form_submit",
    "system_block_check_required": true
  },
  {
    "task_id": "A-001",
    "role": "小A",
    "title": "四渠道广告假设草案与复盘口径",
    "description": "输出广告角度与测试阈值，预算仅建议不拍板；同步复盘指标口径。",
    "priority": "P1",
    "status": "AI_DRAFT",
    "due_at": "2026-06-04T18:00:00+08:00",
    "deliverables": ["广告假设表", "复盘字段字典"],
    "acceptance_criteria": ["每假设有量化指标", "预算不作最终决策"],
    "requires_vera_review": true,
    "review_reason": ["涉及广告预算建议", "涉及价格表达边界"],
    "risk_level": "高",
    "channels": ["Google", "Yandex", "YouTube", "VK"],
    "crm_tags": ["ads_hypothesis", "weekly_recap"],
    "requires_utm": true,
    "business_vertical": ["white_customs_logistics"],
    "target_customer": "俄罗斯方向白关物流潜在客户",
    "related_page": "/ads/plan-ru-white-customs-weekly",
    "cta_type": "not_applicable",
    "system_block_check_required": true
  }
]
```

---

## 10. 顶层 JSON 参考骨架（V1）

```json
{
  "plan_name": "string",
  "plan_period": {
    "start_date": "YYYY-MM-DD",
    "end_date": "YYYY-MM-DD",
    "timezone": "Asia/Shanghai"
  },
  "stage_focus": ["string"],
  "target_proposal": {
    "valid_leads_target_proposal": 0,
    "sql_target_proposal": 0,
    "attribution_rate_target_proposal": 0.0
  },
  "orchestrator_note": "龙虾只生成任务草稿，不直接发布、不直接分配真实员工、不承诺业务结果。",
  "system_block_rules": {
    "blocked_phrases": ["100%清关", "保证到货", "最低价", "零风险", "包赔一切损失", "绝对安全", "固定天数必达"],
    "block_action": "SYSTEM_BLOCK_AND_STOP_PUBLISH_QUEUE"
  },
  "tasks": []
}
```
