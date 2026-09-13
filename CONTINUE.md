# TC-workflow 续跑状态

- 更新时间：2026-09-13（Asia/Shanghai）
- 分支：`codex/tiger-workbench-integration-v1`
- 当前阶段：M0—M6 可执行项完成；M7 已完成 GitHub 推送与真实 D1 初始化，Access/R2 待账户启用；M4 真人回传约定周一由剪辑师完成
- 上游基线：`356f6bb059889ca9314ea54cee098364dbea3b02`
- 内容来源：d940fe0 对应增量，9 个文件哈希一致
- 外联来源：ebcd960，业务规则已读取，待迁入共享 D1
- 生产源：本机 `ai-media-tools` / `library.sqlite` / NAS，禁止新建第二套
- 内容入口（现有局域网）：`http://video-factory.local:8787/workbench/`
- 统一入口：本地 Worker 已验证 `/overview`、`/content`、`/outreach`、`/settings`；为避免无 Access 保护的公开入口，远程 Worker 尚未发布

## 已确认

- 只保留老板、Codex、剪辑师三方内容流转。
- 指定剪辑师的真实邮箱、社媒登录和私有映射不进入公共仓库。
- Tiger 视频语音固定为 Voice Box `Vera Russian Clone v1`，服务身份已绑定；旧系统声线不能作为新验收依据。
- 固定产能为每周 2 母题、俄英 4 母版、4 份配套内容、五渠道 10 次；每 4 周增加 1 条同产品长片。
- 演练、生产、交付、验收、发布分别存储，不从 UI 位置推断状态。

## 已完成

- Access JWT、D1 0001—0003、R2、稳定 person_id、服务身份、审计和私有 dry-run/import 已实现。
- 外联 V2 规则与 CAS 已迁入；30 天试验保持 draft。
- 4 条 18 秒 Vera r2、双 SRT、分镜、脚本、收据、工程和完整剪辑包均已生成；r1 已保留。
- 剪辑师任务投影已收紧：只显示 owner=EDITOR、short_video、revision>=2 且完整包为 READY_FOR_EDITOR 的 4 条 r2；4 份 r1 配套图文不再进入剪辑领取区。
- AMT 已增加受控语义词表和素材评分器，排除不存在的旧路径并输出匹配理由；两母题素材已重新选取、人工看样、重新打包，原 r2 已归档保留。
- 素材匹配根因与统计证据见 `docs/integration/AMT-material-match-audit-20260913.md`。
- 第一周 10 槽发布包已生成，状态 `PREPARED_NOT_SCHEDULED`。
- 两轮本地联测、生产 workbench 测试、类型、lint、build 和 0 漏洞扫描通过。
- GitHub 分支 `codex/tiger-workbench-integration-v1` 已经由 SSH 推送；真实 D1 `tiger-unified-workbench` 已创建并完成 0001—0003 迁移。

## 下一步

1. 周一由真实剪辑师在现有局域网页领取一条 r2，修改并回传 MP4+工程；Codex QA 并保护 HUMAN revision。
2. 老板在已打开的 Cloudflare 页面登录，并为账户启用 Zero Trust Access 与 R2；当前 API 分别返回 `access.api.error.not_enabled` 和 `10042`，这是剩余的账户级人工门槛。
3. 启用后只导入老板和阿旺两位试用成员，建立邮箱 Allow 策略、上传工作包、部署统一入口并完成两人跨设备测试；通过后才邀请其他人。
4. 远程两轮通过后切统一域名；旧入口先只读观察，不能删除。

## 禁止

- 不删除旧记录，不把演练写入生产，不让前端自报角色。
- 不提交真实花名册、邮箱、令牌、Access 配置或社媒账号。
- 未收到生产端回执时，命令只能标为 `PENDING_PRODUCER`。
