# M7 Cloudflare 切换与回滚手册

当前结论（2026-09-13）：老板确认所有素材、剪辑包和真人回传只存现有 NAS，R2 不启用。外网使用 Cloudflare Tunnel 把统一域名转到原 8787 生产服务，Cloudflare Access 只负责登录保护；不建立第二套文件库或渲染系统。

当前执行状态（2026-09-13 15:25）：Cloudflare Tunnel `tiger-workbench`、`workbench.tigersourcingchina.com` DNS 和指向 `http://127.0.0.1:8787` 的 ingress 已创建并校验通过。Cloudflare API 返回 `Access is not enabled`，所以 Tunnel 故意保持停止，尚未形成无保护公网入口。待老板在 Zero Trust 控制台完成 Access Free 启用后，继续建立仅老板与阿旺可登录的 Self-hosted 应用并启动 Tunnel。

## 切换前门槛

1. 首周 r2、工作资料和历史版本非删除式同步到现有 NAS 交付目录；8787 的 `TIGER_WORKBENCH_STORAGE_ROOT` 指向该目录，并验证实际下载来自 NAS。
2. 建立 Cloudflare Tunnel，把统一域名转到 `http://127.0.0.1:8787`；老板在 Cloudflare 控制台启用 Zero Trust Access 并建立 Self-hosted 应用。
3. 第一轮只允许老板和阿旺两位工作邮箱。部署后先对这两位做私有映射 dry-run，0 conflict 才实际导入；其余成员不得提前邀请。
4. 建立 `service_content_producer`，只授予 `content:sync`、`content:commands`、`content:artifacts`；令牌只交原生产电脑。
5. 不上传 R2。核对 NAS 中 4 个 r2 ZIP、12 项任务资料、8 个内容记录 / 剪辑师只见 4 个 r2 / 41 slots / 2 位试用成员。
6. 用老板和阿旺两个真实身份各登录一次；验证默认入口、数据范围、下载和 403。
7. 指定剪辑师跑一条真实 claim→下载→handback；原生产端 ACK 后 Codex QA，确认 HUMAN revision 被保护。
8. 两人两轮远程测试通过后才切统一域名；旧 8787/旧页面先改只读观察，不删除。测试完成并得到老板确认后再邀请其他员工。

## 恢复

- 切换前备份原 SQLite、保存 Tunnel/Access 配置与 NAS 文件清单；NAS 使用现有备份机制。
- 新入口异常时恢复上一个 Worker 版本或把流量切回旧入口；命令保留为 pending/rejected，不伪造 ACK。
- 投影恢复只接受比现有 revision 更高的原生产快照；不得用云端数据反写覆盖原 SQLite。
- 人工 HUMAN revision 和已发布 URL 永不由回滚清除。

## 切换后验收

- 共享地址能从非生产电脑访问；Access 登出后无法读取 API 或 NAS 文件。
- 老板不见逐条普通修复；剪辑师只见具备完整工作包的 r2 视频，不见 r1 配套图文。
- 旧入口至少保留一个观察周期；确认无回退需要后再按单独授权下线。
