import type { FlowStep } from '../config/roleFlows';

interface WorkflowStepperProps {
  steps: FlowStep[];
  activeStepId: string;
  counts: Record<string, number>;
  onStepClick: (stepId: string) => void;
}

export function WorkflowStepper({ steps, activeStepId, counts, onStepClick }: WorkflowStepperProps) {
  return (
    <div className="border-b border-surface-800 bg-surface-900/50 px-4 md:px-6 py-4 overflow-x-auto">
      <div className="max-w-4xl mx-auto flex gap-2 min-w-max md:min-w-0">
        {steps.map((step, i) => {
          const active = step.id === activeStepId;
          const count = counts[step.id] ?? 0;
          return (
            <button
              key={step.id}
              type="button"
              onClick={() => onStepClick(step.id)}
              className={`flex-1 min-w-[100px] md:min-w-0 text-left px-3 py-2.5 rounded-lg border transition-all ${
                active
                  ? 'bg-gold-400/10 border-gold-500/30 text-gold-300'
                  : 'border-surface-700/80 text-surface-400 hover:border-surface-600 hover:text-surface-300'
              }`}
            >
              <div className="flex items-center justify-between gap-2 mb-0.5">
                <span className="text-[10px] font-medium uppercase tracking-wide opacity-70">
                  {i + 1}/{steps.length}
                </span>
                {count > 0 && (
                  <span
                    className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                      active ? 'bg-gold-400/20 text-gold-300' : 'bg-surface-700 text-surface-300'
                    }`}
                  >
                    {count}
                  </span>
                )}
              </div>
              <p className="text-xs font-semibold leading-tight">{step.label}</p>
              <p className="text-[9px] opacity-60 mt-0.5 line-clamp-1">{step.hint}</p>
            </button>
          );
        })}
      </div>
    </div>
  );
}
