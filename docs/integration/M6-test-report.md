# M6 两轮联测报告

日期：2026-09-12。环境：隔离本地 Cloudflare Worker/D1/R2 + 原 8787 生产服务；未访问真实平台发布接口。

## 第一轮：正常路径

| 检查 | 结果 | 证据摘要 |
|---|---|---|
| 更新包与内容补丁 | PASS | 包内 SHA256 全通过；9 个内容文件与 d940fe0 一致 |
| D1 迁移 | PASS | 0001—0003 全部执行成功 |
| 员工 dry-run / 导入 | PASS | 首次 9 new / 0 conflict；导入 9 人、6 个独立社媒资产 |
| 重复员工导入 | PASS | 再次为 9 match / 0 new / 0 conflict，不增员 |
| 内容投影 | PASS | source_revision 2；8 tasks；41 publications |
| 外联共享状态 | PASS | draft 初始化，老板保存范围后 revision 1→2，未启动计时 |
| R2 文件往返 | PASS | 实际 RU SRT 444 bytes，下载 SHA256 与源文件一致 |
| 角色数据范围 | PASS | 剪辑 8 条内容；协调 8 条；业务访问内容为 403；采购无分配时 0 task / 0 publication |
| 生产剪辑包 | PASS | 4 条 18.000 秒视频均含 video+audio；4 个 ZIP 完整；Vera profile 与收据一致 |
| 代码检查 | PASS | TypeScript app/Worker、ESLint、17 条领域断言、生产 workbench 3 测试、Vite build |
| 依赖漏洞 | PASS | `npm audit` 0 vulnerabilities |

## 第二轮：冲突、重试与恢复

| 检查 | 结果 | 期望行为 |
|---|---|---|
| 外联 stale If-Match | PASS | HTTP 409，旧表单不能覆盖新 revision |
| 未知 Access 成员 | PASS | HTTP 403，不自动创建老板 |
| 相同 content request_id 重试 | PASS | 返回既有结果，`idempotent=true` |
| 同 request_id 不同命令 | PASS | HTTP 409 |
| 重复 source_revision 同步 | PASS | 生产器返回 `UNCHANGED / idempotent=true`；投影不倒退 |
| 未领取直接回传 | PASS | HTTP 403 |
| 旧内容版本保护 | PASS | r1 非当前但仍登记；r2 当前；人工版保护逻辑的生产测试通过 |
| SPA 深链接 | PASS | `/content` 返回 200；Worker 静态 fallback 生效 |

## 未执行且不能标 PASS

- 指定剪辑师使用本人真实 Access 登录、领取 r2、下载素材、修改、上传 MP4 与工程。
- Codex 对该真人回传执行技术 QA 并生成新 HUMAN revision。
- 外网 Access、真实 D1/R2、员工邀请、生产域名和恢复切换。
- 五渠道实际定时或发布；当前只有本地发布包。
