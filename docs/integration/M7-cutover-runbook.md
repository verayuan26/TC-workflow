# M7 Cloudflare 切换与回滚手册

当前结论：Cloudflare CLI 已有可用账户身份，但目标 D1 不存在，目标 R2 未验证/不存在；GitHub CLI 未登录。本轮没有授权创建远程资源、邀请员工、推送 PR、改 DNS 或切换生产入口，因此以下保持“已准备、未执行”。

## 切换前门槛

1. 创建专用 D1 与 R2，替换 `wrangler.jsonc` 中占位 database_id；分别建立 preview / production 配置。
2. 为统一域名建立 Cloudflare Access Self-hosted 应用，Audience 与 team domain 作为 Worker 变量；只允许 9 位本人工作邮箱。
3. 部署 Worker 后，老板身份先导入私有映射：先 `/api/admin/members/import/dry-run`，0 conflict 才实际导入。
4. 建立 `service_content_producer`，只授予 `content:sync`、`content:commands`、`content:artifacts`；令牌只交原生产电脑。
5. 生产器先 `--files true` 上传 r2 工作包，再同步 source_revision；核对 8 tasks / 41 slots / 9 members。
6. 用老板、指定剪辑师、业务员三个真实身份各登录一次；验证默认入口、数据范围和 403。
7. 指定剪辑师跑一条真实 claim→下载→handback；原生产端 ACK 后 Codex QA，确认 HUMAN revision 被保护。
8. 两轮远程测试通过后才切统一域名；旧 8787/旧页面先改只读观察，不删除。

## 恢复

- 切换前导出 D1、保存 R2 对象清单和部署版本；原 SQLite 使用现有备份机制。
- 新入口异常时恢复上一个 Worker 版本或把流量切回旧入口；命令保留为 pending/rejected，不伪造 ACK。
- 投影恢复只接受比现有 revision 更高的原生产快照；不得用云端数据反写覆盖原 SQLite。
- 人工 HUMAN revision 和已发布 URL 永不由回滚清除。

## 切换后验收

- 共享地址能从非生产电脑访问；Access 登出后无法读取 API 或 R2 文件。
- 老板不见逐条普通修复；剪辑师只见内容任务；业务员只见分配客户；采购无任务时为空。
- 旧入口至少保留一个观察周期；确认无回退需要后再按单独授权下线。
