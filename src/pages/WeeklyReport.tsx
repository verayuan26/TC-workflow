import { useEffect, useState } from 'react';
import { getWeeklyReport } from '../services/workflowApi';
import type { WeeklyReportRow } from '../types/workflowV1';

export function WeeklyReport() {
  const [rows, setRows] = useState<WeeklyReportRow[]>([]);
  useEffect(()=>{getWeeklyReport().then(setRows);},[]);
  return <div className='p-6'><h2 className='text-base font-semibold mb-3'>Weekly Report</h2><div className='space-y-2'>{rows.map((r,idx)=><div key={idx} className='card p-3 text-xs'>{r.platform} / {r.content_id} / {r.crm_tag} / {r.business_vertical} / {r.campaign} · imp {r.impressions} clk {r.clicks} leads {r.leads} sql {r.sql} cost {r.cost} · decision {r.decision}</div>)}</div></div>;
}
