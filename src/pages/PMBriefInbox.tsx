import { MOCK_PM_BRIEFS } from '../services/mockData';

export function PMBriefInbox() {
  return (
    <div className="p-4 md:p-6 space-y-4">
      <h2 className="text-sm font-semibold text-surface-100">胖虎任务入口 / PM Brief Inbox</h2>
      {MOCK_PM_BRIEFS.map((b) => (
        <div key={b.id} className="card p-4 border border-surface-700">
          <p className="text-xs text-surface-300">{b.id} · {b.briefStatus}</p>
          <h3 className="text-sm text-surface-100 font-semibold mt-1">{b.weeklyTheme}</h3>
          <p className="text-xs text-surface-400 mt-1">目标：{b.bossGoal}</p>
          <p className="text-xs text-surface-500 mt-1">周期：{b.executionPeriod}</p>
          <p className="text-xs text-surface-500 mt-1">策略：{b.strategyBriefText}</p>
        </div>
      ))}
    </div>
  );
}
