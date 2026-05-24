import { useState, useEffect } from 'react';
import { Layout, type Page } from './components/Layout';
import { Dashboard } from './pages/Dashboard';
import { PanghuPM } from './pages/PanghuPM';
import { PMBriefInbox } from './pages/PMBriefInbox';
import { TaskDrafts } from './pages/TaskDrafts';
import { MWorkstation } from './pages/MWorkstation';
import { SWorkstation } from './pages/SWorkstation';
import { CWorkstation } from './pages/CWorkstation';
import { AWorkstation } from './pages/AWorkstation';
import { VeraReview } from './pages/VeraReview';
import { PublishQueue } from './pages/PublishQueue';
import { RulesPage } from './pages/RulesPage';
import { getTasks } from './services/taskService';
import type { Task } from './types';

export default function App() {
  const [page, setPage] = useState<Page>('dashboard');
  const [tasks, setTasks] = useState<Task[]>([]);

  useEffect(() => {
    getTasks().then(setTasks);
  }, []);

  return (
    <Layout currentPage={page} onNavigate={setPage}>
      {page === 'dashboard'      && <Dashboard      tasks={tasks} />}
      {page === 'pm-brief-inbox'&& <PMBriefInbox />}
      {page === 'task-drafts'   && <TaskDrafts />}
      {page === 'panghu-pm'     && <PanghuPM        tasks={tasks} />}
      {page === 'm-workstation' && <MWorkstation    tasks={tasks} />}
      {page === 's-workstation' && <SWorkstation    tasks={tasks} />}
      {page === 'c-workstation' && <CWorkstation    tasks={tasks} />}
      {page === 'a-workstation' && <AWorkstation    tasks={tasks} />}
      {page === 'vera-review'   && <VeraReview      tasks={tasks} />}
      {page === 'publish-queue' && <PublishQueue    tasks={tasks} />}
      {page === 'rules-page'    && <RulesPage />}
    </Layout>
  );
}
