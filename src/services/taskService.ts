import type { Task, FilterState } from '../types';
import { MOCK_TASKS } from './mockData';

export async function getTasks(): Promise<Task[]> {
  return Promise.resolve(MOCK_TASKS);
}

export async function updateTaskField(id: string, field: string, value: unknown): Promise<void> {
  console.log('[taskService] updateTaskField', { id, field, value });
  return Promise.resolve();
}

export function filterTasks(tasks: Task[], filters: Partial<FilterState>): Task[] {
  return tasks.filter((t) => {
    if (filters.assignedTo && filters.assignedTo !== 'all' && t.assignedTo !== filters.assignedTo) return false;
    if (filters.website && filters.website !== 'all' && t.website !== filters.website) return false;
    if (filters.contentType && filters.contentType !== 'all' && t.contentType !== filters.contentType) return false;
    if (filters.status && filters.status !== 'all' && t.status !== filters.status) return false;
    if (filters.priority && filters.priority !== 'all' && t.priority !== filters.priority) return false;
    if (filters.isOverdue === true && !t.isOverdue) return false;
    if (filters.needsVeraReview === true && !t.needsVeraReview) return false;
    return true;
  });
}
