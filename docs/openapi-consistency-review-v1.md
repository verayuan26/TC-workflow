# OpenAPI 一致性审阅 V1（clean v2）

> 目标：核对 `docs/openapi-workflow-app-v1-draft.yaml` 与 V1 正式使用版范围的一致性。

---

## 1. 一致性通过项

- 保留原有 V1 主链路接口：
  - `/api/tasks/import-ai-draft`
  - `/api/tasks`
  - `/api/tasks/{task_id}`
  - `/api/tasks/{task_id}/submit`
  - `/api/tasks/{task_id}/review`
  - `/api/reviews`
  - `/api/briefs`
  - `/api/agents/longxia/generate-tasks`
  - `/api/crm-feedback`
  - `/api/utm/generate`
  - `/api/ai-runs`
- 新增正式使用版范围接口：
  - `/api/publish-queue`
  - `/api/publish-queue/{task_id}/enqueue`
  - `/api/distribution/exports`
  - `/api/distribution/published-url`
  - `/api/metrics/manual`
  - `/api/reports/weekly`
- 硬边界明确：
  - 不接真实社媒 API；
  - 不自动发布；
  - 不接真实广告平台；
  - 不接 OpenAI API。

---

## 2. 技术员实施提醒

1. 所有导入任务默认 `status=AI_DRAFT`。  
2. 时区统一 `Asia/Shanghai`。  
3. `review_reason` 与 `business_vertical` 必须数组化。  
4. 命中 SYSTEM_BLOCK 词后阻断提交与发布入队。  
5. 高风险且未通过 Vera 审核的任务，不得进入发布队列。  
6. Distribution Export 仅导出发布素材/文案包，不触发外部平台发布。  
7. Published URL 为人工回填，不依赖外部平台 webhook。
8. 所有任务对象必须包含 `status` 与 `review_reason` 字段；`review_reason` 无需审核时必须为 `[]`。

---

## 3. 后续可增强项（非 V1 必须）

- 补充更完整 schema components；
- 增加示例 request/response payload；
- 增加鉴权（JWT/API Key）细节；
- 增加分页和排序标准字段约束；
- 未来 P2 再评估外部 API 对接策略。
