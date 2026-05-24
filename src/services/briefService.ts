import type { PMBrief } from '../types/brief';
import { MOCK_PM_BRIEFS } from './mockData';

export async function getBriefs(): Promise<PMBrief[]> {
  return Promise.resolve(MOCK_PM_BRIEFS);
}
