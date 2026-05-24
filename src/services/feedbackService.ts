import type { Task } from '../types';

export async function getFeedbackMaterials(tasks: Task[]): Promise<Task[]> {
  return Promise.resolve(tasks.filter((t) => !!t.crmFeedbackSummary || !!t.realCustomerStorySnippet));
}
