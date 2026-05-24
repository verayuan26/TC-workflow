export type BriefStatus = 'draft' | 'ready_for_breakdown' | 'broken_down' | 'vera_review' | 'distributed';

export interface PMBrief {
  id: string;
  weeklyTheme: string;
  bossGoal: string;
  executionPeriod: string;
  coreKeywords: string;
  corePages: string;
  coreChannels: string;
  coreMaterials: string;
  expectedOutputs: string;
  strategyBriefText: string;
  createdBy: string;
  briefStatus: BriefStatus;
}
