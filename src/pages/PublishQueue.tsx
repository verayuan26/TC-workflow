import { useEffect, useState } from 'react';
import { createPublishQueueItem, getPublishQueue, getTasks, markPublished } from '../services/workflowApi';
import type { PublishQueueItem, WorkflowTask } from '../types/workflowV1';

export function PublishQueue() {
  const [tasks, setTasks] = useState<WorkflowTask[]>([]);
  const [items, setItems] = useState<PublishQueueItem[]>([]);

  const load = async () => {
    setTasks(await getTasks());
    setItems(await getPublishQueue());
  };
  useEffect(() => { load(); }, []);

  return (
    <div className='p-6'>
      <h2 className='text-base font-semibold mb-3'>Publish Queue</h2>
      <p className='text-xs text-surface-400 mb-4'>SYSTEM_BLOCK 与未通过 Vera 的高风险任务不可入队。</p>

      <div className='space-y-2 mb-6'>
        {tasks.map((t) => (
          <div key={t.task_id} className='card p-3 text-xs flex items-center justify-between'>
            <div>{t.task_id} | {t.platform} | {t.caption} | {t.hashtags.join(' ')} | {t.cta} | {t.utm} | {t.asset_url} | {t.scheduled_time || '-'} | {t.owner} | {t.status}</div>
            <button className='px-2 py-1 rounded bg-surface-700' onClick={async ()=>{ try { await createPublishQueueItem(t.task_id); await load(); } catch (e:any) { alert(e.message); } }}>入队</button>
          </div>
        ))}
      </div>

      <h3 className='text-sm font-semibold mb-2'>Queue Items</h3>
      <div className='space-y-2'>
        {items.map((q) => (
          <div key={q.id} className='card p-3 text-xs flex items-center justify-between'>
            <div>{q.id} | {q.task_id} | {q.platform} | {q.status} | {q.publish_url || '-'}</div>
            <button className='px-2 py-1 rounded bg-emerald-800/50' onClick={async()=>{await markPublished(q.id,{publish_url:'https://published/mock',published_at:new Date().toISOString(),publisher:'operator',platform:q.platform});await load();}}>Mark Published</button>
          </div>
        ))}
      </div>
    </div>
  );
}
