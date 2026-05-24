import type { Task } from '../types';

export async function getPendingReviews(tasks: Task[]): Promise<Task[]> {
  return Promise.resolve(tasks.filter((t) => t.needsVeraReview));
}
