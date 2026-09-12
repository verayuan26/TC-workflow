# TC-workflow 续跑状态

- 更新时间：2026-09-12（Asia/Shanghai）
- 分支：`codex/tiger-workbench-integration-v1`
- 当前阶段：M0—M6 可执行项完成；M7 远程切换待授权/资源，M4 真人回传待指定剪辑师
- 上游基线：`356f6bb059889ca9314ea54cee098364dbea3b02`
- 内容来源：d940fe0 对应增量，9 个文件哈希一致
- 外联来源：ebcd960，业务规则已读取，待迁入共享 D1
- 生产源：本机 `ai-media-tools` / `library.sqlite` / NAS，禁止新建第二套
- 内容入口（现有局域网）：`http://video-factory.local:8787/workbench/`
- 统一入口：本地 Worker 已验证 `/overview`、`/content`、`/outreach`、`/settings`；未部署远程地址

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
- 第一周 10 槽发布包已生成，状态 `PREPARED_NOT_SCHEDULED`。
- 两轮本地联测、生产 workbench 测试、类型、lint、build 和 0 漏洞扫描通过。

## 下一步

1. 指定剪辑师在现有局域网页完成一条真实领取、修改和 MP4+工程回传；Codex QA 并保护 HUMAN revision。
2. 获得明确切换授权后创建目标 D1/R2/Access、导入私有成员、上传工作包并跑三身份远程测试。
3. 远程两轮通过后切统一域名；旧入口先只读观察，不能删除。

## 禁止

- 不删除旧记录，不把演练写入生产，不让前端自报角色。
- 不提交真实花名册、邮箱、令牌、Access 配置或社媒账号。
- 未收到生产端回执时，命令只能标为 `PENDING_PRODUCER`。
