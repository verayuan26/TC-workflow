# Tiger Content Workflow — Google Sheets 后台结构设计 V2.0

> Phase 4 版本 · 支持龙虾AI Agent、小A广告投放、AI风险评分、预算审批工作流
> 本文档描述 Google Sheets 后台数据结构及 Apps Script API 接口设计，不涉及前端修改。

---

## 目录

1. [表结构总览](#1-表结构总览)
2. [DB_Tasks_任务总控](#2-db_tasks_任务总控)
3. [DB_AI_龙虾任务](#3-db_ai_龙虾任务)
4. [DB_Ads_广告任务](#4-db_ads_广告任务)
5. [DB_PublishQueue_发布队列](#5-db_publishqueue_发布队列)
6. [DB_RiskRules_风险规则](#6-db_riskrules_风险规则)
7. [DB_Materials_素材库](#7-db_materials_素材库)
8. [DB_Reports_复盘数据](#8-db_reports_复盘数据)
9. [任务创建逻辑](#9-任务创建逻辑)
10. [风险判断逻辑](#10-风险判断逻辑)
11. [状态流转逻辑](#11-状态流转逻辑)
12. [Apps Script API 接口](#12-apps-script-api-接口)
13. [Dashboard 字段映射](#13-dashboard-字段映射)
14. [Vera 审核台字段映射](#14-vera-审核台字段映射)
15. [小A 广告工作台字段映射](#15-小a-广告工作台字段映射)
16. [龙虾工作台字段映射](#16-龙虾工作台字段映射)

---

## 1. 表结构总览

| 表名 | 用途 | 主键格式 | 预计行数 |
|------|------|----------|----------|
| DB_Tasks_任务总控 | 所有任务的主控记录，跨角色 | TSC-001, TLR-003 | 500–2000 行 |
| DB_AI_龙虾任务 | 龙虾AI生成任务的详细记录 | AI-2026-001 | 200–800 行 |
| DB_Ads_广告任务 | 广告投放任务（小A）及数据 | AD-2026-001 | 50–200 行 |
| DB_PublishQueue_发布队列 | AI分流后的发布队列状态 | PQ-2026-001 | 100–500 行 |
| DB_RiskRules_风险规则 | AI风险评分规则配置表 | RULE-A1, RULE-V1 | 20–50 行 |
| DB_Materials_素材库 | 视频素材、封面、文案文件记录 | MAT-TSC-001 | 200–1000 行 |
| DB_Reports_复盘数据 | 广告及内容数据复盘报告 | RPT-2026-001 | 30–150 行 |

**表间关系：**
```
DB_Tasks (task_id)
  ├── DB_AI_龙虾任务 (linked_task_id)
  ├── DB_Ads_广告任务 (linked_task_id)
  ├── DB_PublishQueue (task_id)
  ├── DB_Materials (linked_task_id)
  └── DB_Reports (linked_task_id, linked_ad_id)
```

---

## 2. DB_Tasks_任务总控

> 所有任务的主控记录。其他表通过 `task_id` 关联此表。

| # | 字段名 | 类型 | 示例值 | 负责人 | 必填 | 前端模块 |
|---|--------|------|--------|--------|------|----------|
| 1 | task_id | TEXT | TSC-003 | 系统 | Y | 全局 |
| 2 | website | TEXT | tigersourcingchina.com | 系统/小S | Y | 全局 |
| 3 | content_type | TEXT | SEO文章 | 小S | Y | 全局 |
| 4 | title | TEXT | 义乌采购代理服务落地页 | 小S/龙虾 | Y | 全局 |
| 5 | status | TEXT | 03_小C待确认URL | 系统 | Y | 看板/总览 |
| 6 | priority | TEXT | A | 小S/Vera | Y | 看板/全局 |
| 7 | assigned_to | TEXT | 小C | 系统 | Y | 工作台 |
| 8 | is_overdue | BOOLEAN | TRUE | 系统计算 | Y | Dashboard |
| 9 | needs_vera_review | BOOLEAN | TRUE | 系统/AI | Y | Vera审核台 |
| 10 | created_by | TEXT | 小S | 系统 | Y | 操作日志 |
| 11 | created_at | DATETIME | 2026-05-06 09:00 | 系统 | Y | 全局 |
| 12 | updated_at | DATETIME | 2026-05-13 14:30 | 系统 | Y | 全局 |
| 13 | deadline | DATE | 2026-05-20 | 小S | N | 工作台/Dashboard |
| 14 | keywords | TEXT | 义乌采购, sourcing china | 小S | N | 小S工作台 |
| 15 | keyword_source | TEXT | Ahrefs | 小S | N | 小S工作台 |
| 16 | skill | TEXT | SEO长文 | 小S | N | 小S工作台 |
| 17 | ai_output_link | URL | https://docs.google.com/... | 龙虾/系统 | N | 小S工作台 |
| 18 | script_link | URL | https://docs.google.com/... | 小S | N | 小S工作台/小M |
| 19 | seo_article_link | URL | https://tigersourcingchina.com/... | 小C | N | 小S工作台 |
| 20 | cta | TEXT | 立即获取采购报价 | 小S | N | 小S工作台 |
| 21 | crm_tags | TEXT | sourcing_lead,top_funnel | 小S | N | 小S工作台 |
| 22 | review_status | TEXT | 已通过 | 小S | N | 小S工作台 |
| 23 | video_type | TEXT | 短视频 | 小M | N | 小M工作台 |
| 24 | edit_level | TEXT | A精剪 | 小S | N | 小M工作台 |
| 25 | material_id | TEXT | MAT-TSC-001 | 小M | N | 小M工作台 |
| 26 | material_link | URL | https://drive.google.com/... | 小M | N | 小M工作台 |
| 27 | cover_requirements | TEXT | 工厂背景，含"节省30%"数字 | 小S | N | 小M工作台 |
| 28 | subtitle_language | TEXT | 中文+俄文 | 小S | N | 小M工作台 |
| 29 | final_video_link | URL | https://drive.google.com/... | 小M | N | 小M工作台 |
| 30 | return_notes | TEXT | 前5秒需要更有冲击力 | 小S/Vera | N | 小M工作台 |
| 31 | target_url | TEXT | /yiwu-sourcing-agent | 小C | N | 小C工作台 |
| 32 | url_status | TEXT | 已存在，需检查 | 小C | N | 小C工作台 |
| 33 | needs_new_page | BOOLEAN | TRUE | 小C | N | 小C工作台 |
| 34 | lp_brief | TEXT | 主打义乌一件代发，含询价表单 | 小S | N | 小C工作台 |
| 35 | utm_link | URL | https://...?utm_source=... | 小C | N | 小C工作台 |
| 36 | form_status | TEXT | 表单待配置 | 小C | N | 小C工作台 |
| 37 | sitemap_status | TEXT | 待更新 | 小C | N | 小C工作台 |
| 38 | gsc_status | TEXT | 待提交 | 小C | N | 小C工作台 |
| 39 | tech_status | TEXT | 已完成 | 小C | N | 小C工作台 |
| 40 | block_reason | TEXT | 等待客户案例数据确认 | 各角色 | N | 全局/Dashboard |
| 41 | risk_type | TEXT | Landing Page上线前确认/含时效承诺 | AI/Vera | N | Vera审核台 |
| 42 | review_link | URL | https://drive.google.com/... | 小M/小C | N | Vera审核台 |
| 43 | vera_comments | TEXT | 需修改时效表述 | Vera | N | Vera审核台 |
| 44 | risk_level | TEXT | 高 | AI系统 | N | 全局/Vera |
| 45 | ai_risk_score | INTEGER | 85 | AI系统 | N | 全局/Vera |
| 46 | risk_labels | TEXT | 时效风险,Landing Page上线风险 | AI系统 | N | Vera/PublishQueue |
| 47 | auto_approved | BOOLEAN | FALSE | AI系统 | N | PublishQueue |
| 48 | is_intercepted | BOOLEAN | FALSE | AI系统 | N | PublishQueue |
| 49 | intercept_reasons | TEXT | 检测到虚假认证声明 | AI系统 | N | PublishQueue |
| 50 | auto_approval_time | DATETIME | 2026-05-14 18:00 | AI系统 | N | PublishQueue |
| 51 | approval_rules_hit | TEXT | 无价格信息,无时效承诺 | AI系统 | N | TaskModal |
| 52 | ai_decision | TEXT | vera_required | AI系统 | N | 全局 |
| 53 | ai_decision_reason | TEXT | LP含具体时效数字，必须Vera确认 | AI系统 | N | TaskModal |
| 54 | human_decision | TEXT | 通过 | Vera | N | TaskModal |
| 55 | decision_time | DATETIME | 2026-05-15 10:00 | 系统 | N | TaskModal |
| 56 | decision_by | TEXT | Vera | 系统 | N | TaskModal |
| 57 | is_budget_task | BOOLEAN | FALSE | 小A/AI | N | Vera审核台 |
| 58 | budget_change_type | TEXT | 加预算 | 小A | N | Vera审核台 |
| 59 | budget_status | TEXT | 等待Vera确认预算 | 系统 | N | Vera审核台 |
| 60 | proposed_budget | NUMBER | 5000 | 小A/AI | N | Vera审核台 |
| 61 | current_budget | NUMBER | 3000 | 系统 | N | Vera审核台 |
| 62 | budget_note | TEXT | 上月ROI达3.2，建议加量 | 小A/AI | N | Vera审核台 |
| 63 | next_assignee | TEXT | 小M | 系统/小S | N | 工作台 |
| 64 | next_action | TEXT | 成片完成后需Vera审核 | 小S | N | 工作台 |
| 65 | completion_criteria | TEXT | 视频上传并发布至YouTube | 小S | N | 工作台 |
| 66 | notes | TEXT | 2026-05-08 小S: 脚本通过 | 各角色 | N | TaskModal |
| 67 | op_log | TEXT | JSON字符串，见格式说明 | 系统 | N | TaskModal |
| 68 | has_inquiry | BOOLEAN | TRUE | 系统/龙虾 | N | Dashboard/报告 |
| 69 | inquiry_count | INTEGER | 7 | 系统/龙虾 | N | Dashboard/报告 |
| 70 | related_ad_task_id | TEXT | AD-2026-003 | 系统 | N | Dashboard |
| 71 | related_landing_page | TEXT | /ozon-sourcing-service | 系统 | N | Dashboard |

**op_log 字段格式（JSON 字符串）：**
```json
[
  { "time": "2026-05-13 09:00", "action": "小C页面搭建完成", "operator": "小C" },
  { "time": "2026-05-13 09:05", "action": "AI风险判断：高风险，强制转Vera", "operator": "AI系统" }
]
```

---

## 3. DB_AI_龙虾任务

> 记录龙虾AI Agent的任务分配、生成过程及输出结果。

| # | 字段名 | 类型 | 示例值 | 负责人 | 必填 | 前端模块 |
|---|--------|------|--------|--------|------|----------|
| 1 | ai_task_id | TEXT | AI-2026-001 | 系统 | Y | 龙虾工作台 |
| 2 | linked_task_id | TEXT | TSC-002 | 系统 | Y | 龙虾工作台 |
| 3 | task_type | TEXT | 脚本生成 | 系统 | Y | 龙虾工作台 |
| 4 | input_prompt | TEXT | 请生成一篇关于义乌采购的SEO文章... | 小S | Y | 龙虾工作台 |
| 5 | skill_used | TEXT | SEO长文 | 系统 | Y | 龙虾工作台 |
| 6 | target_website | TEXT | tigersourcingchina.com | 系统 | Y | 龙虾工作台 |
| 7 | target_keywords | TEXT | 义乌采购, 找货源 | 小S | N | 龙虾工作台 |
| 8 | language | TEXT | 中文 | 系统 | Y | 龙虾工作台 |
| 9 | content_type | TEXT | SEO文章 | 系统 | Y | 龙虾工作台 |
| 10 | priority | TEXT | B | 小S/系统 | Y | 龙虾工作台 |
| 11 | ai_status | TEXT | 生成完成 | 系统 | Y | 龙虾工作台 |
| 12 | output_link | URL | https://docs.google.com/... | 龙虾 | N | 龙虾工作台/小S工作台 |
| 13 | output_word_count | INTEGER | 2800 | 龙虾 | N | 龙虾工作台 |
| 14 | generation_time_sec | INTEGER | 42 | 系统 | N | 龙虾工作台 |
| 15 | model_used | TEXT | claude-sonnet-4-6 | 系统 | N | 龙虾工作台 |
| 16 | risk_pre_score | INTEGER | 18 | AI系统 | N | 龙虾工作台 |
| 17 | risk_pre_labels | TEXT | 无高风险 | AI系统 | N | 龙虾工作台 |
| 18 | requires_human_review | BOOLEAN | FALSE | AI系统 | N | 龙虾工作台 |
| 19 | submitted_to | TEXT | 小S | 系统 | N | 龙虾工作台 |
| 20 | submitted_at | DATETIME | 2026-05-13 10:45 | 系统 | N | 龙虾工作台 |
| 21 | review_result | TEXT | 通过 | 小S | N | 龙虾工作台 |
| 22 | review_notes | TEXT | 需要补充价格对比数据 | 小S | N | 龙虾工作台 |
| 23 | iteration_count | INTEGER | 2 | 系统 | N | 龙虾工作台 |
| 24 | created_at | DATETIME | 2026-05-13 09:00 | 系统 | Y | 龙虾工作台 |
| 25 | completed_at | DATETIME | 2026-05-13 10:00 | 系统 | N | 龙虾工作台 |

**ai_status 允许值：**
`待生成` / `生成中` / `生成完成` / `待小S审核` / `需重新生成` / `已提交` / `已归档`

**task_type 允许值：**
`脚本生成` / `SEO文章` / `发布文案` / `关键词研究` / `数据分析报告` / `广告素材文案` / `LP文案`

---

## 4. DB_Ads_广告任务

> 广告投放任务的完整记录，包含预算、数据、结果判断。

| # | 字段名 | 类型 | 示例值 | 负责人 | 必填 | 前端模块 |
|---|--------|------|--------|--------|------|----------|
| 1 | ad_task_id | TEXT | AD-2026-001 | 系统 | Y | 小A工作台 |
| 2 | linked_task_id | TEXT | TSC-AD-001 | 系统 | Y | 小A工作台 |
| 3 | ad_platform | TEXT | Google Ads | 小A | Y | 小A工作台 |
| 4 | ad_region | TEXT | 俄罗斯 | 小A | Y | 小A工作台 |
| 5 | ad_objective | TEXT | 询盘转化 | 小A/Vera | Y | 小A工作台 |
| 6 | target_url | TEXT | /yiwu-sourcing-agent | 小C | Y | 小A工作台 |
| 7 | utm_link | URL | https://...?utm_source=google | 小C | Y | 小A工作台 |
| 8 | ad_material_link | URL | https://drive.google.com/... | 小M | N | 小A工作台 |
| 9 | ad_copy_link | URL | https://docs.google.com/... | 龙虾/小A | N | 小A工作台 |
| 10 | ad_status | TEXT | 投放中 | 小A | Y | 小A工作台 |
| 11 | budget_approved | BOOLEAN | TRUE | Vera | Y | 小A工作台/Vera |
| 12 | budget_approved_by | TEXT | Vera | 系统 | N | Vera审核台 |
| 13 | budget_approved_at | DATETIME | 2026-05-14 10:00 | 系统 | N | Vera审核台 |
| 14 | current_budget | NUMBER | 3000 | Vera/小A | Y | 小A工作台 |
| 15 | proposed_budget | NUMBER | 5000 | 小A/AI | N | Vera审核台 |
| 16 | budget_change_type | TEXT | 加预算 | 小A | N | Vera审核台 |
| 17 | budget_status | TEXT | Vera已确认预算 | 系统 | N | Vera审核台 |
| 18 | budget_note | TEXT | 上月ROI达3.2，建议加量 | 小A/AI | N | Vera审核台 |
| 19 | launch_date | DATE | 2026-05-01 | 小A | N | 小A工作台 |
| 20 | end_date | DATE | 2026-05-31 | 小A | N | 小A工作台 |
| 21 | impressions | INTEGER | 15420 | 小A/系统 | N | 小A工作台 |
| 22 | clicks | INTEGER | 320 | 小A/系统 | N | 小A工作台 |
| 23 | ctr | DECIMAL | 2.08 | 系统计算 | N | 小A工作台 |
| 24 | spent | NUMBER | 1240 | 小A/系统 | N | 小A工作台 |
| 25 | cpc | DECIMAL | 3.88 | 系统计算 | N | 小A工作台 |
| 26 | inquiries | INTEGER | 12 | 小A/系统 | N | 小A工作台 |
| 27 | cpl | DECIMAL | 103.33 | 系统计算 | N | 小A工作台 |
| 28 | conversion_rate | DECIMAL | 3.75 | 系统计算 | N | 小A工作台 |
| 29 | data_feedback | TEXT | Google端效果稳定，询盘质量高 | 小A | N | 小A工作台 |
| 30 | has_inquiry | BOOLEAN | TRUE | 小A/系统 | N | Dashboard |
| 31 | should_scale | BOOLEAN | TRUE | AI/Vera | N | Vera审核台/小A |
| 32 | needs_copy_change | BOOLEAN | FALSE | AI/Vera | N | Vera审核台 |
| 33 | needs_video_change | BOOLEAN | FALSE | AI/Vera | N | Vera审核台 |
| 34 | needs_lp_change | BOOLEAN | FALSE | AI/Vera | N | Vera审核台 |
| 35 | should_pause_ad | BOOLEAN | FALSE | AI/Vera | N | Vera审核台 |
| 36 | ai_budget_suggestion | NUMBER | 5000 | AI系统 | N | Vera审核台 |
| 37 | ai_budget_reason | TEXT | CTR高于行业均值50%，建议扩量 | AI系统 | N | Vera审核台 |
| 38 | created_at | DATETIME | 2026-05-01 09:00 | 系统 | Y | 小A工作台 |
| 39 | updated_at | DATETIME | 2026-05-14 16:00 | 系统 | Y | 小A工作台 |

**ad_status 允许值：**
`待建广告` / `待审核素材` / `待确认落地页` / `待上线` / `AI建议预算` / `等待Vera确认预算` / `Vera已确认预算` / `Vera拒绝预算` / `投放中` / `暂停` / `需优化` / `已结束`

---

## 5. DB_PublishQueue_发布队列

> 记录所有经过AI分流后的任务队列状态。

| # | 字段名 | 类型 | 示例值 | 负责人 | 必填 | 前端模块 |
|---|--------|------|--------|--------|------|----------|
| 1 | queue_id | TEXT | PQ-2026-001 | 系统 | Y | 发布队列 |
| 2 | task_id | TEXT | TLC-003 | 系统 | Y | 发布队列 |
| 3 | queue_type | TEXT | auto_approved | AI系统 | Y | 发布队列 |
| 4 | ai_decision | TEXT | auto_approve | AI系统 | Y | 发布队列 |
| 5 | ai_risk_score | INTEGER | 10 | AI系统 | Y | 发布队列 |
| 6 | risk_level | TEXT | 低 | AI系统 | Y | 发布队列 |
| 7 | risk_labels | TEXT | 无高风险内容 | AI系统 | N | 发布队列 |
| 8 | approval_rules_hit | TEXT | 普通SEO文章,无价格承诺 | AI系统 | N | 发布队列 |
| 9 | intercept_reasons | TEXT | — | AI系统 | N | 发布队列 |
| 10 | entered_queue_at | DATETIME | 2026-05-14 18:00 | AI系统 | Y | 发布队列 |
| 11 | vera_reviewed | BOOLEAN | FALSE | Vera | N | 发布队列 |
| 12 | vera_decision | TEXT | — | Vera | N | 发布队列 |
| 13 | vera_reviewed_at | DATETIME | — | 系统 | N | 发布队列 |
| 14 | vera_comments | TEXT | — | Vera | N | 发布队列 |
| 15 | publish_status | TEXT | 待发布 | 系统 | Y | 发布队列 |
| 16 | publish_scheduled_at | DATETIME | 2026-05-15 09:00 | 小S/Vera | N | 发布队列 |
| 17 | published_at | DATETIME | — | 系统 | N | 发布队列 |
| 18 | published_by | TEXT | — | 系统 | N | 发布队列 |
| 19 | publish_url | URL | — | 小C | N | 发布队列 |

**queue_type 允许值：**
`auto_approved` / `vera_required` / `intercepted`

**publish_status 允许值：**
`待发布` / `Vera审核中` / `已放行` / `已拦截` / `已发布` / `发布失败`

---

## 6. DB_RiskRules_风险规则

> Vera可配置的AI风险评分规则，系统据此自动判断任务风险等级。

| # | 字段名 | 类型 | 示例值 | 负责人 | 必填 | 前端模块 |
|---|--------|------|--------|--------|------|----------|
| 1 | rule_id | TEXT | RULE-A1 | Vera | Y | AI规则页 |
| 2 | rule_category | TEXT | auto_approve | Vera | Y | AI规则页 |
| 3 | rule_code | TEXT | A1 | Vera | Y | AI规则页 |
| 4 | condition_desc | TEXT | AI风险评分≤30，且无价格风险标签 | Vera | Y | AI规则页 |
| 5 | condition_field | TEXT | ai_risk_score | 系统 | Y | AI规则页 |
| 6 | condition_operator | TEXT | lte | 系统 | Y | AI规则页 |
| 7 | condition_value | TEXT | 30 | Vera | Y | AI规则页 |
| 8 | exclude_labels | TEXT | 价格风险 | Vera | N | AI规则页 |
| 9 | content_type_filter | TEXT | ALL | Vera | N | AI规则页 |
| 10 | priority_filter | TEXT | ALL | Vera | N | AI规则页 |
| 11 | result_action | TEXT | auto_approve | 系统 | Y | AI规则页 |
| 12 | rule_priority | INTEGER | 10 | Vera | Y | AI规则页 |
| 13 | example_desc | TEXT | 常规SEO文章，无敏感词，评分18 | Vera | N | AI规则页 |
| 14 | is_active | BOOLEAN | TRUE | Vera | Y | AI规则页 |
| 15 | created_by | TEXT | Vera | 系统 | Y | AI规则页 |
| 16 | created_at | DATETIME | 2026-01-01 | 系统 | Y | AI规则页 |
| 17 | last_modified_at | DATETIME | 2026-04-01 | 系统 | Y | AI规则页 |
| 18 | review_cycle | TEXT | 季度 | Vera | Y | AI规则页 |
| 19 | hit_count | INTEGER | 142 | 系统 | N | AI规则页 |

**rule_category 允许值：**
`auto_approve` / `vera_required` / `intercept`

**执行优先级：** intercept (最高) > vera_required > auto_approve (最低)

---

## 7. DB_Materials_素材库

> 记录所有视频素材、封面图、配音文件，与任务关联。

| # | 字段名 | 类型 | 示例值 | 负责人 | 必填 | 前端模块 |
|---|--------|------|--------|--------|------|----------|
| 1 | material_id | TEXT | MAT-TSC-001 | 系统 | Y | 小M工作台 |
| 2 | linked_task_id | TEXT | TSC-001 | 系统 | Y | 小M工作台 |
| 3 | material_type | TEXT | 原始素材 | 小M | Y | 小M工作台 |
| 4 | file_name | TEXT | factory_shoot_batch3.mp4 | 小M | Y | 小M工作台 |
| 5 | drive_link | URL | https://drive.google.com/... | 小M | Y | 小M工作台 |
| 6 | drive_folder_id | TEXT | 1BxiM... | 系统 | N | 小M工作台 |
| 7 | file_size_mb | NUMBER | 1240 | 系统 | N | 小M工作台 |
| 8 | duration_sec | INTEGER | 120 | 系统/小M | N | 小M工作台 |
| 9 | resolution | TEXT | 1920x1080 | 系统 | N | 小M工作台 |
| 10 | website | TEXT | tigersourcingchina.com | 系统 | Y | 小M工作台 |
| 11 | shoot_date | DATE | 2026-05-08 | 小M | N | 小M工作台 |
| 12 | shoot_location | TEXT | 义乌工厂 | 小M | N | 小M工作台 |
| 13 | batch_number | TEXT | 第3批 | 小M | N | 小M工作台 |
| 14 | material_status | TEXT | 可用 | 小M | Y | 小M工作台 |
| 15 | used_in_tasks | TEXT | TSC-001,TSC-005 | 系统 | N | 小M工作台 |
| 16 | cover_image_link | URL | https://drive.google.com/... | 小M | N | 小M工作台 |
| 17 | subtitle_file_link | URL | https://drive.google.com/... | 小M | N | 小M工作台 |
| 18 | notes | TEXT | 第2批补拍，包含包装车间 | 小M | N | 小M工作台 |
| 19 | uploaded_by | TEXT | 小M | 系统 | Y | 小M工作台 |
| 20 | uploaded_at | DATETIME | 2026-05-09 10:00 | 系统 | Y | 小M工作台 |

**material_type 允许值：**
`原始素材` / `剪辑成片` / `封面图` / `字幕文件` / `配音文件` / `广告素材` / `图文素材`

**material_status 允许值：**
`待整理` / `可用` / `已使用` / `已归档` / `版权问题`

---

## 8. DB_Reports_复盘数据

> 广告和内容的数据复盘报告，由龙虾AI或小A整理后提交。

| # | 字段名 | 类型 | 示例值 | 负责人 | 必填 | 前端模块 |
|---|--------|------|--------|--------|------|----------|
| 1 | report_id | TEXT | RPT-2026-001 | 系统 | Y | Dashboard |
| 2 | linked_task_id | TEXT | TSC-001 | 系统 | Y | Dashboard |
| 3 | linked_ad_id | TEXT | AD-2026-001 | 系统 | N | 小A工作台 |
| 4 | report_type | TEXT | 广告复盘 | 系统 | Y | Dashboard |
| 5 | report_period | TEXT | 2026-05 | 小A/龙虾 | Y | Dashboard |
| 6 | website | TEXT | tigersourcingchina.com | 系统 | Y | Dashboard |
| 7 | content_type | TEXT | 短视频 | 系统 | Y | Dashboard |
| 8 | total_views | INTEGER | 8420 | 小A/系统 | N | Dashboard |
| 9 | total_clicks | INTEGER | 320 | 小A/系统 | N | Dashboard |
| 10 | total_impressions | INTEGER | 15420 | 小A/系统 | N | Dashboard |
| 11 | total_inquiries | INTEGER | 12 | 小A/系统 | N | Dashboard |
| 12 | total_spent | NUMBER | 1240 | 小A/系统 | N | 小A工作台 |
| 13 | avg_cpl | DECIMAL | 103.33 | 系统计算 | N | 小A工作台 |
| 14 | avg_ctr | DECIMAL | 2.08 | 系统计算 | N | 小A工作台 |
| 15 | avg_cpc | DECIMAL | 3.88 | 系统计算 | N | 小A工作台 |
| 16 | best_performing_ad | TEXT | AD-2026-003 | 系统 | N | Dashboard |
| 17 | worst_performing_ad | TEXT | AD-2026-005 | 系统 | N | Dashboard |
| 18 | ai_analysis | TEXT | 本月Google Ads表现最优... | 龙虾 | N | Dashboard |
| 19 | recommendations | TEXT | 建议将VK预算调整至Google... | 龙虾/Vera | N | Dashboard |
| 20 | should_scale_ad | TEXT | AD-2026-003 | AI系统 | N | Vera审核台 |
| 21 | should_pause_ad | TEXT | AD-2026-005 | AI系统 | N | Vera审核台 |
| 22 | vera_reviewed | BOOLEAN | TRUE | Vera | N | Vera审核台 |
| 23 | vera_decision | TEXT | 同意按建议调整预算 | Vera | N | Vera审核台 |
| 24 | submitted_by | TEXT | 小A | 系统 | Y | Dashboard |
| 25 | submitted_at | DATETIME | 2026-05-14 17:00 | 系统 | Y | Dashboard |
| 26 | reviewed_at | DATETIME | 2026-05-15 10:00 | 系统 | N | Dashboard |

---

## 9. 任务创建逻辑

### 9.1 龙虾自动创建（无需人工触发）

触发条件及创建逻辑：

| 触发场景 | 自动创建任务类型 | 初始状态 | 说明 |
|---------|----------------|----------|------|
| 小S 在关键词表填入关键词并标记"开始" | DB_AI_龙虾任务（脚本/SEO文章） | 01_AI待生成 | 龙虾读取关键词+Skill模板，自动生成内容 |
| 广告数据回传后，AI检测CTR超过阈值 | DB_AI_龙虾任务（数据分析报告） | 01_AI待生成 | 触发自动生成月度复盘 |
| 定时任务每月1日 | DB_AI_龙虾任务（数据复盘） | 09_数据待复盘 | 为所有上月已发布任务生成复盘框架 |
| 广告AI建议预算（ai_budget_suggestion 生成） | DB_Tasks 预算任务 | 06_Vera待审核 | 自动创建预算确认任务，budget_status = 'AI建议预算' |

### 9.2 Vera确认后才能创建

| 场景 | 说明 |
|------|------|
| 高风险内容（risk_score ≥ 80）通过审核后 | Vera点击"通过"，系统将任务推入下一阶段（如小M待剪辑/待发布） |
| 广告预算任务 Vera 确认后 | budget_status 更新为 'Vera已确认预算'，才允许小A正式上线广告 |
| AI拦截任务被 Vera 手动解除拦截后 | is_intercepted 置 FALSE，重新进入正常流程 |

### 9.3 小C创建

| 场景 | 说明 |
|------|------|
| 新建 Landing Page | 小C 手动创建任务，填写 target_url、lp_brief、form_status |
| URL 检查任务 | 小C 对已有页面发起检查任务，需填写 url_status、sitemap_status |
| UTM 链接配置 | 小C 完成技术部分后，在现有任务上填写 utm_link，不新建任务 |

### 9.4 小M提交成片后系统生成

| 场景 | 说明 |
|------|------|
| 小M 填写 final_video_link 并标记"提交成片" | 系统自动将任务状态从 04_小M待剪辑 → 05_小S待终审，并通知小S |
| 小M 整理完素材后 | DB_Materials 新增记录，linked_task_id 关联回任务 |

### 9.5 广告数据触发创建

| 场景 | 说明 |
|------|------|
| 小A 每周填写广告数据（impressions/clicks/inquiries） | AI系统计算 CTR/CPL/转化率，并根据结果设置 should_scale/should_pause_ad |
| CPL 高于基准线 1.5 倍 | AI 自动创建优化建议任务，needs_copy_change 或 needs_lp_change 置 TRUE |
| CTR 超行业均值 50% | AI 自动生成预算建议任务（DB_Ads 中的 ai_budget_suggestion 字段），同时在 DB_Tasks 创建预算确认任务 |

---

## 10. 风险判断逻辑

### 10.1 低风险 → 自动进入发布队列

满足以下**全部**条件：

```
ai_risk_score ≤ 30
AND '价格风险' NOT IN risk_labels
AND '时效风险' NOT IN risk_labels
AND '法律风险' NOT IN risk_labels
AND content_type NOT IN ('Landing Page') [除非连续通过3次以上]
AND is_intercepted = FALSE
```

处理结果：
- `auto_approved = TRUE`
- `status = '12_自动放行'`
- 写入 DB_PublishQueue，queue_type = 'auto_approved'
- op_log 追加：`AI自动放行，进入发布队列`

### 10.2 中等风险 → Vera 审核台

满足以下**任一**条件：

```
ai_risk_score BETWEEN 31 AND 79
OR '价格风险' IN risk_labels
OR '时效风险' IN risk_labels
OR content_type = '广告预算'
OR '客户数据风险' IN risk_labels OR '法律风险' IN risk_labels
OR (priority = 'A' AND content_type = 'Landing Page')
OR '竞品对比' IN risk_labels
```

处理结果：
- `ai_decision = 'vera_required'`
- `status = '06_Vera待审核'`
- `needs_vera_review = TRUE`
- 写入 DB_PublishQueue，queue_type = 'vera_required'
- op_log 追加：`AI风险判断：中/高风险，转Vera`

### 10.3 广告预算 → 强制 Vera 确认

```
is_budget_task = TRUE
→ budget_status = 'AI建议预算'
→ status = '06_Vera待审核'
→ 无论 ai_risk_score 是多少，均不可自动放行
```

Vera 操作后：
- 确认 → `budget_status = 'Vera已确认预算'`，小A 收到通知可执行
- 拒绝 → `budget_status = 'Vera拒绝预算'`，任务退回小A并附原因

### 10.4 系统自动拦截条件

满足以下**任一**条件立即拦截，不进入 Vera 队列：

| 条件 | 拦截规则编号 |
|------|------------|
| ai_risk_score ≥ 80 | I1 |
| '未授权品牌LOGO' IN risk_labels | I2 |
| '政治敏感' IN risk_labels 或 '违禁词' IN risk_labels | I3 |
| '虚假认证' IN risk_labels 或 '夸大资质' IN risk_labels | I4 |
| '个人隐私数据' IN risk_labels | I5 |

处理结果：
- `is_intercepted = TRUE`
- `status = '11_已拦截'`
- `intercept_reasons` 写入具体原因
- 写入 DB_PublishQueue，queue_type = 'intercepted'
- op_log 追加：`AI系统强制拦截，原因：[具体原因]`
- 通知 Vera（发邮件/Telegram 告警）

---

## 11. 状态流转逻辑

### 完整流程图

```
[任务创建]
    │
    ▼
01_AI待生成 ──────► 龙虾生成内容 ──────► output_link 填入
    │
    ▼
02_小S待审核 ──────► 小S 审核内容
    │                │
    │         [需要返工]
    │                └──► 99_暂停/返工 ──► [修改后重回02]
    │
    ▼ [审核通过]
03_小C待确认URL ───► 小C 检查/创建页面
    │                │
    │         [技术阻塞]
    │                └──► 99_暂停/返工 ──► [解除后重回03]
    │
    ▼ [URL确认]
AI 风险评分
    │
    ├──► [高风险/拦截] ───────────────────► 11_已拦截
    │                                              │
    │                                       [Vera人工解除]
    │                                              │
    ├──► [中等风险] ───────────────────────► 06_Vera待审核
    │                                              │
    │                         ┌────────────────────┤
    │                    [拒绝]│                    │[通过]
    │                         ▼                    │
    │                   99_暂停/返工               ▼
    │                                        ┌───────────┐
    │                                        │ 内容类型？ │
    │                                        └───────────┘
    │                                               │
    ├──► [低风险] ──────────────────► 12_自动放行   │
    │                                               │
    ▼                                               ▼
（无视频任务）                              04_小M待剪辑 [含视频]
    │                                               │
    │                                       小M 剪辑制作
    │                                               │
    │                                    [提交成片后]
    │                                               │
    │                                       05_小S待终审
    │                                               │
    │                               [终审通过/无视频]│
    └───────────────────────────────────────────────┘
                                                    │
                                                    ▼
                                              07_待发布
                                                    │
                                            小S/Vera 执行发布
                                                    │
                                                    ▼
                                              08_已发布
                                                    │
                                      ┌─────────────┴──────────────┐
                                      │                            │
                                      ▼                            ▼
                               [有广告任务]                 09_数据待复盘
                                      │                            │
                               小A配置广告                   龙虾生成复盘
                                      │                            │
                                投放 → 数据回传                    ▼
                                      │                      10_已完成
                               09_数据待复盘
                                      │
                                 龙虾复盘
                                      │
                                 10_已完成
```

### 各状态说明

| 状态码 | 状态名 | 触发条件 | 负责人 | 下一步动作 |
|--------|--------|----------|--------|-----------|
| 01_AI待生成 | AI待生成 | 任务创建完成 | 龙虾 | 龙虾生成内容，填写 ai_output_link |
| 02_小S待审核 | 小S待审核 | 龙虾提交内容 | 小S | 小S审核内容质量与关键词 |
| 03_小C待确认URL | 小C待确认 | 小S初审通过 | 小C | 确认/创建页面URL，配置UTM |
| 04_小M待剪辑 | 小M待剪辑 | 内容类型含视频 + 小C完成 | 小M | 按脚本剪辑，提交成片链接 |
| 05_小S待终审 | 小S待终审 | 小M提交成片 | 小S | 终审视频质量与文案 |
| 06_Vera待审核 | Vera待审核 | AI判断中等风险 或 预算任务 | Vera | 人工审核，决定通过/退回/拦截 |
| 07_待发布 | 待发布 | 通过全部审核 + 已入发布队列 | 小S/Vera | 按计划发布至各平台 |
| 08_已发布 | 已发布 | 发布操作完成 | 系统 | 等待数据回传，触发复盘 |
| 09_数据待复盘 | 数据复盘 | 发布后N天 或 广告数据回传 | 龙虾/小A | 整理数据，生成复盘报告 |
| 10_已完成 | 已完成 | 复盘报告提交并 Vera 确认 | 系统 | 归档 |
| 11_已拦截 | 系统拦截 | AI风险评分≥80 或 命中拦截规则 | Vera(手动解除) | Vera审查，决定解除或永久拦截 |
| 12_自动放行 | 自动放行 | AI评分≤30 且无高风险标签 | 系统 | 自动进入发布队列 07_待发布 |
| 99_暂停/返工 | 暂停/返工 | 任何角色标记阻塞 | 对应角色 | 解除阻塞后回到上一状态 |

---

## 12. Apps Script API 接口

所有接口以 `GET`（获取）和 `POST`（写入/更新）方式调用 Google Apps Script Web App。

### 基础格式

```
GET  ?action=<接口名>[&参数]
POST ?action=<接口名>  Body: JSON
```

---

### 12.1 getTasks

**用途：** 获取任务列表，支持多条件过滤
**方法：** GET
**参数：**

| 参数名 | 类型 | 说明 |
|--------|------|------|
| assigned_to | string | 角色名（小M/小S/小C/小A/Vera/龙虾） |
| website | string | 网站域名（all 或具体域名） |
| content_type | string | 内容类型（all 或具体类型） |
| status | string | 状态码（all 或具体状态） |
| priority | string | 优先级 A/B/C |
| is_overdue | boolean | 是否逾期 |
| needs_vera_review | boolean | 是否需要Vera |

**返回：** `{ tasks: Task[] }`

---

### 12.2 createTask

**用途：** 创建新任务（主要由小S、龙虾、系统调用）
**方法：** POST
**Body：**

```json
{
  "website": "tigersourcingchina.com",
  "content_type": "SEO文章",
  "title": "义乌采购指南2026",
  "priority": "B",
  "assigned_to": "龙虾",
  "keywords": "义乌采购",
  "keyword_source": "Ahrefs",
  "skill": "SEO长文",
  "deadline": "2026-05-25",
  "created_by": "小S"
}
```

**返回：** `{ task_id: "TSC-006", status: "01_AI待生成" }`

---

### 12.3 updateTaskStatus

**用途：** 更新任务状态及操作日志
**方法：** POST
**Body：**

```json
{
  "task_id": "TSC-003",
  "new_status": "05_小S待终审",
  "operator": "小M",
  "action_desc": "小M提交成片",
  "extra_fields": {
    "final_video_link": "https://drive.google.com/..."
  }
}
```

**返回：** `{ success: true, updated_at: "2026-05-15 14:00" }`

---

### 12.4 getDashboardStats

**用途：** 获取 Dashboard 所有统计数据（一次性返回）
**方法：** GET

**返回：**

```json
{
  "total": 44,
  "completed": 18,
  "overdue": 3,
  "blocked": 2,
  "in_progress": 21,
  "auto_approved": 8,
  "intercepted": 3,
  "vera_pending": 9,
  "budget_pending": 4,
  "auto_approve_rate": 18,
  "intercept_rate": 7,
  "risk_dist": { "低": 22, "中": 15, "高": 7 },
  "ad_stats": {
    "total_spent": 8420,
    "total_clicks": 1840,
    "total_inquiries": 47,
    "avg_cpl": 179
  },
  "role_stats": { ... },
  "website_stats": { ... }
}
```

---

### 12.5 getAiTasks

**用途：** 获取龙虾工作台的AI任务列表
**方法：** GET
**参数：**

| 参数名 | 类型 | 说明 |
|--------|------|------|
| ai_status | string | 筛选AI任务状态 |
| website | string | 网站过滤 |

**返回：** `{ ai_tasks: AiTask[] }`

---

### 12.6 createAiTask

**用途：** 龙虾接收到新任务后创建 AI 生成记录
**方法：** POST
**Body：**

```json
{
  "linked_task_id": "TSC-006",
  "task_type": "SEO文章",
  "input_prompt": "请生成...",
  "skill_used": "SEO长文",
  "target_keywords": "义乌采购",
  "language": "中文",
  "priority": "B"
}
```

**返回：** `{ ai_task_id: "AI-2026-022" }`

---

### 12.7 submitAiOutput

**用途：** 龙虾完成生成后提交输出结果
**方法：** POST
**Body：**

```json
{
  "ai_task_id": "AI-2026-022",
  "linked_task_id": "TSC-006",
  "output_link": "https://docs.google.com/...",
  "output_word_count": 2800,
  "generation_time_sec": 38,
  "model_used": "claude-sonnet-4-6",
  "risk_pre_score": 18,
  "risk_pre_labels": "无高风险"
}
```

**返回：** `{ success: true, next_status: "02_小S待审核", notified: "小S" }`

---

### 12.8 getAdTasks

**用途：** 获取小A广告工作台任务列表
**方法：** GET
**参数：**

| 参数名 | 类型 | 说明 |
|--------|------|------|
| ad_status | string | 广告状态过滤 |
| platform | string | 广告平台过滤 |
| budget_approved | boolean | 仅已审批预算 |

**返回：** `{ ad_tasks: AdTask[] }`

---

### 12.9 updateAdData

**用途：** 小A更新广告数据（每周填写）
**方法：** POST
**Body：**

```json
{
  "ad_task_id": "AD-2026-003",
  "impressions": 15420,
  "clicks": 320,
  "spent": 1240,
  "inquiries": 12,
  "data_feedback": "本周询盘质量高，转化稳定"
}
```

**副作用（系统自动计算）：**
- CTR = clicks / impressions × 100
- CPC = spent / clicks
- CPL = spent / inquiries
- 如 CPL > 基准线 × 1.5，自动设 needs_copy_change 或 needs_lp_change

**返回：** `{ success: true, computed: { ctr: 2.08, cpc: 3.88, cpl: 103.33 }, ai_suggestion: "..." }`

---

### 12.10 confirmBudget

**用途：** Vera 确认或拒绝广告预算申请
**方法：** POST
**Body：**

```json
{
  "task_id": "BUD-001",
  "ad_task_id": "AD-2026-003",
  "decision": "approved",
  "approved_budget": 5000,
  "vera_comments": "同意加量，请小A尽快配置",
  "operator": "Vera"
}
```

**返回：** `{ success: true, new_budget_status: "Vera已确认预算", notified: "小A" }`

---

### 12.11 getPublishQueue

**用途：** 获取发布队列（按分流类型分组）
**方法：** GET
**参数：**

| 参数名 | 类型 | 说明 |
|--------|------|------|
| queue_type | string | auto_approved / vera_required / intercepted |
| publish_status | string | 发布状态过滤 |

**返回：** `{ queue: PublishQueueItem[], counts: { auto: 8, vera: 9, intercepted: 3 } }`

---

### 12.12 approvePublish

**用途：** Vera 审核后放行或拒绝发布队列中的任务
**方法：** POST
**Body：**

```json
{
  "queue_id": "PQ-2026-008",
  "task_id": "TLC-003",
  "decision": "approved",
  "vera_comments": "内容符合规范，可发布",
  "operator": "Vera"
}
```

**返回：** `{ success: true, new_status: "07_待发布" }`

---

### 12.13 blockTask

**用途：** 任意角色标记任务为阻塞/暂停
**方法：** POST
**Body：**

```json
{
  "task_id": "OZL-004",
  "block_reason": "等待客户案例数据确认，预计5月20日后重启",
  "operator": "Vera",
  "estimated_resume_date": "2026-05-20"
}
```

**返回：** `{ success: true, new_status: "99_暂停/返工" }`

---

### 12.14 getRiskRules

**用途：** 获取当前生效的所有风险规则（供 AI 规则页展示及 AI 评分使用）
**方法：** GET
**参数：**

| 参数名 | 类型 | 说明 |
|--------|------|------|
| category | string | auto_approve / vera_required / intercept / all |
| is_active | boolean | 仅返回生效规则 |

**返回：** `{ rules: RiskRule[], last_updated: "2026-04-01" }`

---

### 12.15 evaluateRisk

**用途：** 对指定任务执行 AI 风险评分（在任务内容完成后调用）
**方法：** POST
**Body：**

```json
{
  "task_id": "TSC-007",
  "content_text": "...",
  "content_type": "Landing Page",
  "website": "tigersourcingchina.com",
  "priority": "A"
}
```

**执行逻辑：**
1. 扫描内容文本，检测风险标签（价格/时效/竞品/品牌等）
2. 根据 DB_RiskRules 中的规则配置计算 ai_risk_score
3. 按优先级判断最终决策：intercept > vera_required > auto_approve
4. 更新 DB_Tasks 对应字段
5. 写入 DB_PublishQueue

**返回：**

```json
{
  "task_id": "TSC-007",
  "ai_risk_score": 72,
  "risk_level": "中",
  "risk_labels": ["价格风险", "Landing Page上线风险"],
  "ai_decision": "vera_required",
  "ai_decision_reason": "含价格信息且为Landing Page",
  "rules_triggered": ["V2", "V7"]
}
```

---

### 12.16 scanDriveFolders

**用途：** 龙虾定期扫描 Google Drive 指定目录，自动登记新素材到 DB_Materials
**方法：** POST
**Body：**

```json
{
  "folder_ids": ["1BxiM...", "1CyiN..."],
  "website_filter": "tigersourcingchina.com",
  "operator": "龙虾"
}
```

**执行逻辑：**
1. 列出文件夹中所有新文件（与 DB_Materials 中已有记录比对）
2. 自动识别文件类型（video/image/doc）
3. 尝试从文件名解析关联 task_id
4. 批量写入 DB_Materials

**返回：** `{ new_materials: 12, linked: 8, unlinked: 4, material_ids: [...] }`

---

## 13. Dashboard 字段映射

> Dashboard 所需数据来源于 DB_Tasks 和 DB_Ads_广告任务，由 `getDashboardStats` 一次性返回。

### 完成度总览区

| UI 元素 | 数据来源字段 | 计算方式 |
|---------|------------|----------|
| 完成率环形图 | status | COUNT(status IN ['08_已发布','10_已完成']) / COUNT(*) |
| 总任务数 | task_id | COUNT(*) |
| 已完成数 | status | COUNT(status IN ['08_已发布','10_已完成']) |
| 逾期任务数 | is_overdue | COUNT(is_overdue = TRUE) |
| 阻塞任务数 | block_reason, status | COUNT(status = '99_暂停/返工' OR block_reason IS NOT NULL) |

### 按角色完成度区

| UI 元素 | 数据来源字段 |
|---------|------------|
| 各角色任务数 | assigned_to |
| 各角色完成数 | assigned_to + status |
| 各角色逾期数 | assigned_to + is_overdue |

### AI自动化指标区

| UI 元素 | 数据来源字段 | 计算方式 |
|---------|------------|----------|
| 自动放行率 | auto_approved | COUNT(auto_approved=TRUE) / COUNT(*) |
| 高风险拦截率 | is_intercepted | COUNT(is_intercepted=TRUE) / COUNT(*) |
| Vera待处理数 | status | COUNT(status='06_Vera待审核') |
| 预算待确认数 | is_budget_task + budget_status | COUNT(is_budget_task=TRUE AND budget_status='等待Vera确认预算') |
| AI生成任务数 | op_log | COUNT(op_log CONTAINS '龙虾') |
| 风险分布 | risk_level | GROUP BY risk_level COUNT |

### 广告投放概览区

| UI 元素 | 数据来源表 | 字段 |
|---------|-----------|------|
| 本周广告花费 | DB_Ads_广告任务 | SUM(spent) |
| 本周点击 | DB_Ads_广告任务 | SUM(clicks) |
| 本周询盘 | DB_Ads_广告任务 | SUM(inquiries) |
| 平均CPL | DB_Ads_广告任务 | SUM(spent) / SUM(inquiries) |
| 最佳广告 | DB_Ads_广告任务 | MAX(inquiries) |
| 需优化广告 | DB_Ads_广告任务 | WHERE ad_status = '需优化' |

---

## 14. Vera 审核台字段映射

> VeraReview 4个区域所需字段：

### 区域1：今日必须审核

从 DB_Tasks 筛选条件：
```
status = '06_Vera待审核'
AND is_budget_task = FALSE
AND is_intercepted = FALSE
ORDER BY ai_risk_score DESC, priority ASC
```

所需字段：`task_id, title, website, content_type, priority, status, is_overdue, risk_level, ai_risk_score, risk_labels, vera_comments, review_link, deadline`

### 区域2：可快速通过

从 DB_Tasks 筛选条件：
```
auto_approved = TRUE
AND ai_risk_score <= 30
AND status IN ('12_自动放行', '07_待发布')
```

所需字段：`task_id, title, website, content_type, risk_level, ai_risk_score, approval_rules_hit, auto_approval_time`

### 区域3：预算确认

从 DB_Tasks 筛选条件：
```
is_budget_task = TRUE
AND budget_status = '等待Vera确认预算'
```

所需字段：`task_id, title, website, ad_platform (via linked ad_task), priority, budget_change_type, current_budget, proposed_budget, budget_note, ai_budget_reason`

### 区域4：已自动放行记录

从 DB_PublishQueue 筛选条件：
```
queue_type = 'auto_approved'
ORDER BY entered_queue_at DESC
```

所需字段：`queue_id, task_id, title, ai_risk_score, risk_level, approval_rules_hit, entered_queue_at, publish_status`

### 老板决策区

所需聚合数据（来自 getDashboardStats）：
`completionPct, mostBlockedRole, worstSite, highestSpend, bestInquiry, shouldPause, shouldScale, pausedContent`

---

## 15. 小A 广告工作台字段映射

> 主要使用 DB_Ads_广告任务，通过 linked_task_id 关联 DB_Tasks。

### 广告任务列表区

所需字段：
```
ad_task_id, linked_task_id, title (via DB_Tasks), ad_platform, ad_region,
ad_status, budget_approved, current_budget, launch_date, end_date
```

### 广告数据录入区

可写字段：
```
impressions, clicks, spent, inquiries, data_feedback
```

系统自动计算：
```
ctr = clicks / impressions × 100
cpc = spent / clicks
cpl = spent / inquiries
conversion_rate = inquiries / clicks × 100
```

### 预算申请区

可写字段：
```
budget_change_type, proposed_budget, budget_note
```

提交后触发：
- budget_status → '等待Vera确认预算'
- 在 DB_Tasks 创建预算确认任务
- 通知 Vera

### 结果判断区

AI 根据数据自动设置（小A 可手动确认）：
```
should_scale, needs_copy_change, needs_video_change, needs_lp_change, should_pause_ad
```

---

## 16. 龙虾工作台字段映射

> 主要使用 DB_AI_龙虾任务，同时读取 DB_Tasks 获取待生成任务。

### 任务队列区

从 DB_Tasks 筛选：
```
status = '01_AI待生成'
ORDER BY priority ASC, created_at ASC
```

所需字段：`task_id, title, website, content_type, priority, keywords, keyword_source, skill, deadline, input_prompt (如有)`

### 生成任务详情区

从 DB_AI_龙虾任务：
```
ai_task_id, linked_task_id, task_type, input_prompt, skill_used,
target_keywords, language, ai_status, output_link, output_word_count,
generation_time_sec, model_used, risk_pre_score, requires_human_review
```

### 提交结果区

龙虾可写字段：
```
output_link, output_word_count, generation_time_sec, model_used,
risk_pre_score, risk_pre_labels
```

提交后触发：
1. 调用 `evaluateRisk` 进行完整风险评分
2. 根据结果更新 DB_Tasks.status → '02_小S待审核'
3. 通知小S

### 素材扫描区

触发 `scanDriveFolders` 接口，返回：
```
new_materials (数量), linked (已关联), unlinked (待处理), material_ids
```

---

*文档版本：V2.0 · Phase 4 · 2026-05-15*
*下次评审时间：2026-08-01（季度复盘）*
