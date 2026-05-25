# OpenAPI 一致性审阅 V1（正式使用版）

> PR3 conflict-resolved baseline: keep main standards + V1 formal scope.
## 结论
本次将 V1 范围从“长周期分层”收敛为“正式可用闭环”，OpenAPI 草案已覆盖：
- 内部任务与 Vera 审核
- SYSTEM_BLOCK 拦截
- 发布队列与分发出口
- 发布链接回填
- 手动数据回填
- 周复盘查询

## 必须新增并已纳入草案的接口
- `POST /api/publish-queue`
- `GET /api/publish-queue`
- `PATCH /api/publish-queue/{id}`
- `POST /api/publish-queue/{id}/mark-published`
- `POST /api/metrics/manual-input`
- `GET /api/reports/weekly`

## 关键一致性检查
1. `Task.status` 枚举含 `AI_DRAFT/SYSTEM_BLOCK/VERA_REVIEW/APPROVED/REJECTED`。
2. `priority` 枚举为 `P0/P1/P2`。
3. `review_reason` 为数组。
4. `business_vertical` 为数组。
5. `system_block_check_required` 为 boolean。
6. 发布队列状态枚举：`DRAFT/WAIT_VERA/READY_TO_PUBLISH/PUBLISHED/FAILED/NEED_EDIT`。

## 安全边界检查
- 不接真实社媒 API。
- 不自动发布。
- 不接真实广告平台。
- 不自动改广告预算。
- 不自动承诺清关、时效、价格、赔付。
- SYSTEM_BLOCK 与未过审高风险任务均不得进入发布队列。

## 审阅建议
- 当前草案适合技术员按 mock/stub 实现 V1。
- 真实外部系统联动放到后续版本，避免超范围。
