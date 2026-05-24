import type { Task } from '../types';
import type { PMBrief } from '../types/brief';
import { MOCK_TASKS as TASKS_FROM_TASK_API, PM_BRIEFS as BRIEFS_FROM_TASK_API, TASK_DRAFTS as DRAFTS_FROM_TASK_API } from './taskApi';

// Temporary compatibility layer: keep canonical mock data centralized in services.
export const MOCK_TASKS: Task[] = TASKS_FROM_TASK_API;
export const MOCK_PM_BRIEFS: PMBrief[] = BRIEFS_FROM_TASK_API as PMBrief[];
export const MOCK_TASK_DRAFTS: Task[] = DRAFTS_FROM_TASK_API;
