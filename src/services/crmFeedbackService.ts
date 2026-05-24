import type { Task } from '../types';
import { MOCK_TASKS } from './mockData';

export async function getCrmFeedbackTasks(): Promise<Task[]> {
  return Promise.resolve(MOCK_TASKS.filter((t) => !!t.crmFeedbackSummary));
}
