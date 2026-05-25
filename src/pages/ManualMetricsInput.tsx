import { useState } from 'react';
import { manualInputMetrics } from '../services/workflowApi';

export function ManualMetricsInput() {
  const [taskId] = useState('S-001');
  const [saved, setSaved] = useState(false);
  return <div className='p-6'><h2 className='text-base font-semibold mb-3'>Metrics Manual Input</h2><button className='px-3 py-1 rounded bg-gold-500/20 text-xs' onClick={async ()=>{await manualInputMetrics({task_id:taskId,content_id:'CONT-1',platform:'VK',campaign:'wk21',crm_tags:['vk'],business_vertical:['logistics'],impressions:1000,clicks:100,comments:12,dm:8,form:5,valid_leads:4,sql:2,cost:300});setSaved(true);}}>提交 mock 指标</button>{saved && <p className='text-xs mt-2 text-emerald-400'>已保存</p>}</div>;
}
