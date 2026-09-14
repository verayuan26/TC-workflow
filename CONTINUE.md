# TC-workflow 续跑状态

- 更新时间：2026-09-14（Asia/Shanghai）
- 分支：`codex/tiger-workbench-integration-v1`
- 当前阶段：Outreach O0—O3 技术项完成，O4 等待获授权业务员邮箱与 8 家分配范围；内容模块 M0—M6 可执行项完成，M7 的三人跨设备回传证据仍待补
- 上游基线：`356f6bb059889ca9314ea54cee098364dbea3b02`
- 内容来源：d940fe0 对应增量，9 个文件哈希一致
- 外联来源：ebcd960，业务规则已迁入共享 D1；本次部署代码见 `cb1f6c0`
- 生产源：本机 `ai-media-tools` / `library.sqlite` / NAS，禁止新建第二套
- 统一入口（已上线）：`https://workbench.tigersourcingchina.com/workbench/`
- 客户开发入口（已上线）：`https://workbench.tigersourcingchina.com/outreach`
- 局域网恢复入口：`http://video-factory.local:8787/workbench/`
- Cloudflare Access 应用、三人邮箱白名单与 One-time PIN 登录已启用；未登录公网访问已验证返回 Access 登录页，不直通 8787/NAS

## Outreach O0—O4（2026-09-14）

- 部署代码提交：`cb1f6c0`；Worker 生产版本：`f38f0dfe-2f2d-4e80-a54b-533e2f6df6f8`。
- D1：沿用 `tiger-unified-workbench`（`f6bf2bbf-68d7-49c7-b5ec-76fc7e85e548`），已应用 `0004`、`0005`；没有第二套客户数据库。
- 附件：`com.tiger.outreach.files` 在 `127.0.0.1:8788` 运行，Tunnel 只代理 `/outreach-files/*`；文件落在受控本机目录，不启用 R2。
- Multica：TIG-370 合成交接测试完成；TIG-371 正式 8 家入库完成并由 Codex 复核关闭。正式回执为新增 8、重复关联 0、待补 0、冲突/失败 0；重复投递 `idempotent=true`。
- 生产真值：非测试客户 8、来源 8、首联任务 8、批次条目 8；全部 `unassigned`、`uncontacted`，需求和中国供货确认均为 `unknown`；试验保持 `draft`。
- 技术闭环：虚拟隔离身份已通过查看、开始、附件 SHA/回执、真实提交事件、Codex pass/needs_more、同任务补交、下一任务、重启恢复；部分失败批次按条返回 `matched + needs_more`，不会拖垮合格条目。
- 入口证据：公网 `/outreach`、`/workbench/`、`/legacy`、附件均由 Access 返回 302；服务域无令牌 401，非 Outreach 路径 404，伪造邮箱头仍被 Access 拦截；生产 API 以服务身份返回 8 客户/8 任务。
- 恢复点：`/Users/mac/Library/Application Support/TigerOutreach/backups/predeploy-20260914/`。Tunnel 配置、旧内容服务和 D1 导出均已保留。
- 唯一下一步：取得获授权业务员登录邮箱和 8 家分配范围后，写入现有 Access/成员范围，完成本人登录、本人任务可见和内部演练回传；完成前不得写成“业务员已启用”。
- 详细验收：`docs/integration/OUTREACH_O0_O4_20260914.md`。

## 已确认

- 只保留老板、Codex、剪辑师三方内容流转。
- 指定剪辑师的真实邮箱、社媒登录和私有映射不进入公共仓库。
- Tiger 视频语音固定为 Voice Box `Vera Russian Clone v1`，服务身份已绑定；旧系统声线不能作为新验收依据。
- 固定产能为每周 2 母题、俄英 4 母版、4 份配套内容、五渠道 10 次；每 4 周增加 1 条同产品长片。
- 演练、生产、交付、验收、发布分别存储，不从 UI 位置推断状态。

## 已完成

- Access JWT、D1 0001—0003、稳定 person_id、服务身份、审计和私有 dry-run/import 已实现；R2 代码仅保留为历史实现，不作为生产文件层。
- 外联 V2 规则与 CAS 已迁入；30 天试验保持 draft。
- 4 条 18 秒 Vera r2、双 SRT、分镜、脚本、收据、工程和完整剪辑包均已生成；r1 已保留。
- 剪辑师任务投影已收紧：只显示 owner=EDITOR、short_video、revision>=2 且完整包为 READY_FOR_EDITOR 的 4 条 r2；4 份 r1 配套图文不再进入剪辑领取区。
- AMT 已增加受控语义词表和素材评分器，排除不存在的旧路径并输出匹配理由；两母题素材已重新选取、人工看样、重新打包，原 r2 已归档保留。
- 素材匹配根因与统计证据见 `docs/integration/AMT-material-match-audit-20260913.md`。
- 第一周 10 槽发布包已生成，状态 `PREPARED_NOT_SCHEDULED`。
- 两轮本地联测、生产 workbench 测试、类型、lint、build 和 0 漏洞扫描通过。
- GitHub 分支 `codex/tiger-workbench-integration-v1` 已经由 SSH 推送；真实 D1 `tiger-unified-workbench` 已创建并完成 0001—0003 迁移。
- Cloudflare Tunnel 已由独立 LaunchAgent `com.tiger.workbench.cloudflared` 持续运行；统一域名 DNS 生效，公网未登录 302 拦截、局域网源站 200 均已实测。
- Access Self-hosted 应用只允许老板、阿旺和张永琪（Age）三名既有私有身份；One-time PIN 邮箱验证码已添加，没有邀请其他员工。

## 下一步

1. 周一由真实剪辑师从统一入口领取一条 r2，修改并回传 MP4+工程；Codex QA 并保护 HUMAN revision。
2. 首周 r2 与历史版本已非删除式同步到现有 NAS 交付目录，8787 服务存储根已切到 NAS 并通过实际字节核对；Cloudflare Tunnel `tiger-workbench`、统一域名 DNS 和本机 ingress 已创建并校验通过。
3. Zero Trust 组织、Access 应用、三人白名单、邮箱验证码和 Tunnel 已完成。下一步只让老板、阿旺、张永琪在各自设备登录，完成下载/回传两轮实测；通过前不邀请其他人。临时 API 令牌完成配置后不再使用，最迟随 7 天 TTL 自动失效；R2 不启用、不上传。
4. 统一域名当前只作为三人试运行入口；远程两轮通过后再标记为正式切换，旧入口至少保留一个观察周期，不能删除。

## 禁止

- 不删除旧记录，不把演练写入生产，不让前端自报角色。
- 不提交真实花名册、邮箱、令牌、Access 配置或社媒账号。
- 未收到生产端回执时，命令只能标为 `PENDING_PRODUCER`。
