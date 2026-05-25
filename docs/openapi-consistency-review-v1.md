# OpenAPI 一致性审阅 V1

> 目标：核对 `docs/openapi-workflow-app-v1-draft.yaml` 与 JSON 标准 V1 的一致性。

---

## 1. 一致性通过项

- 覆盖了 V1 目标接口集合：
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
- 明确为 draft/mock，不接真实 CRM、广告平台、OpenAI API。

---

## 2. 技术员实施提醒

1. 所有导入任务默认 `status=AI_DRAFT`。  
2. 时区统一 `Asia/Shanghai`。  
3. `review_reason` 与 `business_vertical` 必须数组化。  
4. 命中 SYSTEM_BLOCK 词后阻断提交。  
5. `requires_vera_review=true` 的任务必须进入审核链路。  

---

## 3. 后续可增强项（非 V1 必须）

- 补充更完整 schema components；
- 增加示例 request/response payload；
- 增加鉴权（JWT/API Key）细节；
- 增加分页和排序标准字段约束。
