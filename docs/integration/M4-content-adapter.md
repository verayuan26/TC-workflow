# M4 内容生产适配与回执

## 单一真源

内容任务、claim、handback、QA、revision 和 publication 的权威来源仍是现有 `ai-media-tools/.data/library.sqlite`。统一 Worker 只存：

- 单调递增的生产快照投影；
- 经 Access 身份提交的幂等命令；
- 文件仍由原生产服务流式读写 NAS；云端不保存第二份素材或回传文件；
- 原生产端返回的 ACK / REJECTED / FAILED 回执。

命令在原生产端确认前保持 `PENDING_PRODUCER`，页面不得显示已领取、已交付或已验收。

## 生产器

`adapters/content/producer.mjs` 支持两种单次执行：

```bash
TIGER_PRODUCER_TOKEN=... node adapters/content/producer.mjs \
  --source http://127.0.0.1:8787 --target https://<统一工作台>

TIGER_PRODUCER_TOKEN=... TIGER_EDITOR_SOURCE_MEMBER_ID=... \
  node adapters/content/producer.mjs --source http://127.0.0.1:8787 \
  --target https://<统一工作台> --once commands
```

生产外网入口使用 Cloudflare Tunnel 把受 Access 保护的统一域名转到原 8787 服务。预览、完整剪辑包、Vera WAV、SRT、分镜、脚本、收据和工程均由该服务从 NAS 流式读取；回传也直接写入 NAS。

生产器由原生产电脑定时执行，不创建第二套渲染队列。服务 token 与剪辑师的原系统成员 ID 只放部署环境。

## 当前真实内容

- CYCLE01 / W1 共 8 份内容任务、41 个四周发布槽位。
- 四条短片当前为 r2，均为 1080×1920、30fps、18.000 秒。
- 旁白固定 `Voice Box / Vera Russian Clone v1`，四条均有独立生成收据。
- 每条视频工作包有 11 个文件项：原片、预览、无字母版、Vera WAV、双 SRT、分镜、脚本、Voice Box 收据、工程 ZIP、完整剪辑包。
- r1 系统声线版本已移入 `_superseded/system-voice-r1-20260912` 并登记为非当前历史，没有删除。
- 第一周发布包为 `PREPARED_NOT_SCHEDULED`，不能据此回填 SCHEDULED/PUBLISHED。
