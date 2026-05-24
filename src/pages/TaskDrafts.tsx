import { MOCK_TASK_DRAFTS } from '../services/mockData';

export function TaskDrafts() {
  return (
    <div className="p-4 md:p-6 space-y-4">
      <h2 className="text-sm font-semibold text-surface-100">任务草稿池 / Task Drafts</h2>
      {MOCK_TASK_DRAFTS.map((t) => (
        <div key={t.id} className="card p-3 border border-surface-700">
          <p className="text-xs text-surface-400">{t.id} · {t.workstream} · {t.draftStatus} · {t.distributionStatus}</p>
          <p className="text-sm text-surface-100 font-medium mt-1">{t.title}</p>
          <p className="text-xs text-surface-500 mt-1">owner: {t.assignedTo} · deadline: {t.unifiedDeadline || '-'}</p>
        </div>
      ))}
    </div>
  );
}
