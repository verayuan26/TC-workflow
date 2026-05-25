---
name: social-distribution
description: 通用多平台分发改写工具。将单条内容拆分为 VK、Telegram、YouTube Shorts、Instagram、TikTok、Facebook、LinkedIn 等平台版本。
---

# social-distribution

## 什么时候触发
- 一条内容需要跨平台发布时。
- 需要按平台语法调整标题、长度、标签、CTA时。
- 需要建立“同主题多平台版本”分发清单时。

## 什么时候不要触发
- 不用于定义业务主线与战略优先级。
- 不用于替代 `tiger-russian-localizer` 的俄语本土化判断。
- 不用于生成虚假互动、夸张承诺标题党。

## 输入材料
- 原始内容（脚本/文章/帖子）。
- 目标平台列表。
- 每个平台目标动作（评论/私信/跳转）。
- 合规限制与禁用词。

## 工作步骤
1. 提炼“跨平台不变核心信息”。
2. 按平台改写语气、长度、标签与CTA。
3. 为每个平台分配唯一追踪标识（content_id）。
4. 标注需要俄语本土化的平台内容。
5. 输出发布时间建议与复用顺序。

## 固定输出格式
### A. 核心信息
- 不变主张：
- 不变CTA目标：

### B. 平台版本表
| 平台 | 版本文案 | 长度建议 | 话题标签 | CTA | content_id |
|---|---|---|---|---|---|

### C. 发布节奏
- Day 1：
- Day 2：

### D. 协同与审核
- 需 `tiger-russian-localizer`：
- 需 Vera 审核项：

## 禁止事项
- 禁止一稿硬发全平台不做语境调整。
- 禁止输出与原意冲突的改写。
- 禁止出现敏感承诺或未经证实案例。

## 与 Tiger 自定义 Skills 的关系
- 本 Skill 负责“分发适配”，不是业务内容定稿器。
- 涉及俄语市场时，`tiger-russian-localizer`优先；涉及核心叙事风格时，`tiger-vera-style-script`优先。
