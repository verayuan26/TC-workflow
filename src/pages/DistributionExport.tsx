import { useEffect, useState } from 'react';
import { exportDistribution } from '../services/workflowApi';

export function DistributionExport() {
  const [rows, setRows] = useState<any[]>([]);
  useEffect(() => { exportDistribution().then((r) => setRows(r.items)); }, []);
  return <div className='p-6'><h2 className='text-base font-semibold mb-3'>Distribution Export</h2><p className='text-xs mb-3 text-surface-400'>CSV / 表格导出占位（仅 mock，不自动发布）。</p><div className='space-y-2'>{rows.map((r, i)=><div key={i} className='card p-3 text-xs'>{r.platform} | {r.title} | {r.hashtag} | {r.cta} | {r.utm}</div>)}</div></div>;
}
