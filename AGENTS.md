# TigerLogistics 项目级 Agent 协作规范（当前阶段）

## 当前项目主线（必须遵守）
当前主线是：
1. 社媒流量放大；
2. Google / Yandex / YouTube / VK 广告投放；
3. 流量数字化追踪与归因；
4. Vera 风格内容持续打磨。

**注意：不是网站基础架构阶段。禁止回到建站底层讨论。**

## Skill 优先级（必须遵守）
1. **Tiger 自定义 Skills（核心业务层）优先级最高**。
2. **通用 Skills 仅作为辅助工具，不作为业务大脑**。
3. 发生冲突时，以 Tiger 自定义 Skills 与 Vera 审核意见为准。

## Tiger 核心 Skills 定位
- `tiger-longxia-orchestrator`：父级任务分发 Skill（龙虾主调度）。
- `tiger-vera-style-script`：Vera 风格短视频脚本核心 Skill。
- `tiger-russian-localizer`：俄语市场本土化核心 Skill。
- `tiger-crm-story-miner`：CRM 反馈提炼核心 Skill。

## 6 个通用 Skills（辅助工具层）
- `content-strategy`
- `video-marketing`
- `social-distribution`
- `copywriting-editor`
- `paid-ads-planner`
- `analytics-utm`

> 以上 6 个 Skill 只能做结构化、格式化、拆解与优化，不得替代业务最终判断。

## Workflow App 导入标准（固定字段）
- 统一标准：`references/workflow-app-ai-task-import-json-standard-v1.md`
- `plan_period.timezone` 固定使用：`Asia/Shanghai`
- 每个任务必须包含：
  - `status`（默认 `AI_DRAFT`）
  - `review_reason`（不需 Vera 审核时必须为空数组 `[]`）
- 后续输出任务 JSON 时，**不得修改字段名**。

## 龙虾如何调用 Skills
建议调用顺序：
1. `tiger-longxia-orchestrator`：先拆周目标、责任、依赖与检查项。
2. `tiger-crm-story-miner`：提炼本周高价值客户问题与内容方向。
3. `content-strategy` / `paid-ads-planner` / `analytics-utm`：做内容-投放-追踪框架草稿。
4. `tiger-vera-style-script`：产出或改写 Vera 风格脚本。
5. `video-marketing` / `social-distribution`：生成拍摄与多平台分发版本。
6. 涉及俄语市场时调用 `tiger-russian-localizer` 做最终本土化。

## 小 S / 小 M / 小 C / 小 A 职责边界
- 小 S（Strategy）：内容、脚本、SEO、CRM 故事改写。
- 小 M（Media）：短视频、封面、字幕、发布 brief。
- 小 C（Conversion/Tech）：链接、UTM、页面检查、技术验收。
- 小 A（Ads/Analysis）：广告角度、投放计划、数据复盘。

## 可自动生成草稿的任务
- 任务拆解初稿、周计划模板。
- 内容主题拆解、分发版本草稿、文案优化稿。
- 投放假设表、素材变体表、UTM 与标签模板。
- CRM 问题聚类、选题建议、周复盘结构化草稿。

## 必须交给 Vera 审核的任务（强制）
以下内容必须进入 Vera 审核后方可对外或执行：
- 客户案例相关表述（含成功案例包装）。
- 客户照片、客户聊天记录、客户隐私相关信息。
- 运输时效、清关结果、赔付边界等承诺性表述。
- 价格、最低价、报价策略相关表述。
- 广告预算增减、渠道配比调整。
- 任何最终业务判断与拍板。

## 执行原则
- AI 多做整理，人只做判断。
- App 多做追踪，人少做汇报。
- CRM 是真实反馈源，不是“美化故事”的素材库。
