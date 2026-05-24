# Tiger Workflow App V1 Acceptance Checklist

静态验收项（不依赖真实 API / 数据库）：

1. 无 CRM 工作台入口（导航仅包含胖虎/执行线/Vera/发布队列/规则）。
2. 无 ChatGPT / OpenAI API 调用。
3. 无 Bolt API 调用。
4. 无 Codex API 调用。
5. 无 `OPENAI_API_KEY` 字符串。
6. 无真实 API key / token 明文。
7. 员工工作台仅显示 distributed 后任务（过滤 not_distributed / draft / needs_vera_check / rejected）。
8. CRM 仅作为反馈源字段存在，不作为执行线工作台。
9. 外部工具仅做字段记录（`needsExternalAI` / `needsCodex` / `needsBolt` / `externalToolResultLink`），不接 API。
10. `npm run build` 与 `npm run typecheck` 必须通过。

执行建议：
- 发布前执行：
  - `npm run build`
  - `npm run typecheck`
- 代码扫描关键词：
  - `OPENAI_API_KEY`, `apiKey`, `Authorization: Bearer`, `openai`, `chatgpt api`, `bolt api`, `codex api`
