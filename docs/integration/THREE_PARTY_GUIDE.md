# Tiger 三方工作台使用指南

## 老板

登录统一地址后默认看 `/overview`。只处理“需要决定”：产品/市场/预算变化、未确认业务承诺、集中样式。普通修复、剪辑细节、技术 QA 和发布包不逐条审批。外联 30 天试验只有老板能启动。

## 剪辑师

1. 从 `/content` 进入“我的工作”，打开当前 revision。
2. 先看“素材与预览”：必须显示素材库位置和原片下载、锁定脚本与中文核对、Voice Box Vera 独立 WAV、目标语言/中文 SRT、分镜表、预览与工程 ZIP。缺一项就提问题，不凭标题开工。
3. 领取后只改画面裁切、节奏、字幕和观感，不改主题、参数、价格、交期或固定声线。
4. 回传修订 MP4、可继续编辑的真实工程/工程 ZIP、修改说明，并完成任务对应检查项。
5. “云端收齐”不等于“已验收”；等原生产端 ACK 和 Codex QA。被退回时只处理具体失败项。

当前局域网内容入口：`http://video-factory.local:8787/workbench/`。它无独立登录页，只能在能访问该局域网的电脑打开并选择已有成员。统一远程入口上线后改由 Cloudflare Access 本人工作邮箱登录，不再选择/冒充成员。

## Codex

从原 SQLite/NAS/Voice Box/FFmpeg 继续生产；不另建真源。处理云端命令时核对 `request_id + content_id + base_revision + edit_generation`，文件收齐且哈希正确才 ACK。人工回传生成 HUMAN revision 并保护；QA 失败保留人工版本和明确原因。只把真实平台 URL 写为 PUBLISHED。
