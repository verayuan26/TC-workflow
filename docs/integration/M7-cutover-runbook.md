# M7 Cloudflare 切换与回滚手册

当前结论（2026-09-13）：老板已授权外网统一入口、Access、试用员工邀请、域名切换和 GitHub 推送。GitHub 分支已推送；真实 D1 `tiger-unified-workbench` 已创建并完成 0001—0003 迁移。Cloudflare API 明确返回 Access 未启用、R2 未启用；在老板完成这两个账户级开通动作前，不发布一个缺少 Access 保护或缺少文件存储的残缺入口。

## 切换前门槛

1. 保留已创建的专用 D1；老板在 Cloudflare 控制台启用 R2 后创建专用 bucket 并验证上传/下载。
2. 老板在 Cloudflare 控制台启用 Zero Trust Access；为统一域名建立 Self-hosted 应用，Audience 与 team domain 作为 Worker 变量。
3. 第一轮只允许老板和阿旺两位工作邮箱。部署后先对这两位做私有映射 dry-run，0 conflict 才实际导入；其余成员不得提前邀请。
4. 建立 `service_content_producer`，只授予 `content:sync`、`content:commands`、`content:artifacts`；令牌只交原生产电脑。
5. 生产器先 `--files true` 上传 4 个 r2 工作包，再同步 source_revision；核对 8 个内容记录 / 剪辑师只见 4 个 r2 / 41 slots / 2 位试用成员。
6. 用老板和阿旺两个真实身份各登录一次；验证默认入口、数据范围、下载和 403。
7. 指定剪辑师跑一条真实 claim→下载→handback；原生产端 ACK 后 Codex QA，确认 HUMAN revision 被保护。
8. 两人两轮远程测试通过后才切统一域名；旧 8787/旧页面先改只读观察，不删除。测试完成并得到老板确认后再邀请其他员工。

## 恢复

- 切换前导出 D1、保存 R2 对象清单和部署版本；原 SQLite 使用现有备份机制。
- 新入口异常时恢复上一个 Worker 版本或把流量切回旧入口；命令保留为 pending/rejected，不伪造 ACK。
- 投影恢复只接受比现有 revision 更高的原生产快照；不得用云端数据反写覆盖原 SQLite。
- 人工 HUMAN revision 和已发布 URL 永不由回滚清除。

## 切换后验收

- 共享地址能从非生产电脑访问；Access 登出后无法读取 API 或 R2 文件。
- 老板不见逐条普通修复；剪辑师只见具备完整工作包的 r2 视频，不见 r1 配套图文。
- 旧入口至少保留一个观察周期；确认无回退需要后再按单独授权下线。
