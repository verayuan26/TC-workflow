import { LayoutDashboard, Scissors, FileText, Link2, ShieldCheck, Menu, X, BarChart2, SendToBack, BookOpen, Crown } from 'lucide-react';
import { useState } from 'react';

export type Page = 'dashboard' | 'pm-brief-inbox' | 'task-drafts' | 'panghu-pm' | 'm-workstation' | 's-workstation' | 'c-workstation' | 'a-workstation' | 'vera-review' | 'publish-queue' | 'rules-page';

interface NavItem {
  id: Page;
  label: string;
  sublabel: string;
  icon: React.ReactNode;
}

const NAV_ITEMS: NavItem[] = [
  { id: 'dashboard',      label: '总览',      sublabel: 'Dashboard',   icon: <LayoutDashboard size={16} /> },
  { id: 'pm-brief-inbox', label: '胖虎任务入口', sublabel: 'PM Brief Inbox', icon: <Crown size={16} /> },
  { id: 'task-drafts',    label: '任务草稿池',   sublabel: 'Task Drafts', icon: <Crown size={16} /> },
  { id: 'panghu-pm',      label: '胖虎总控',    sublabel: 'Tiger Growth PM', icon: <Crown size={16} /> },
  { id: 'm-workstation',  label: '小M工作台',  sublabel: '视频·素材',   icon: <Scissors size={16} /> },
  { id: 's-workstation',  label: '小S工作台',  sublabel: '内容·关键词', icon: <FileText size={16} /> },
  { id: 'c-workstation',  label: '小C工作台',  sublabel: '技术·链接',   icon: <Link2 size={16} /> },
  { id: 'a-workstation',  label: '小A工作台',  sublabel: '广告·投放',   icon: <BarChart2 size={16} /> },
  { id: 'vera-review',    label: 'Vera审核台', sublabel: '审核·决策',   icon: <ShieldCheck size={16} /> },
  { id: 'publish-queue',  label: '发布队列',   sublabel: 'AI·队列',     icon: <SendToBack size={16} /> },
  { id: 'rules-page',     label: 'AI规则',     sublabel: '自动·审批',   icon: <BookOpen size={16} /> },
];

interface LayoutProps {
  currentPage: Page;
  onNavigate: (page: Page) => void;
  children: React.ReactNode;
}

export function Layout({ currentPage, onNavigate, children }: LayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const current = NAV_ITEMS.find((n) => n.id === currentPage)!;

  return (
    <div className="flex h-screen overflow-hidden bg-surface-950">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-52 bg-surface-900 border-r border-surface-800 flex-shrink-0">
        {/* Logo */}
        <div className="px-5 py-5 border-b border-surface-800">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 bg-gold-400 rounded flex items-center justify-center flex-shrink-0">
              <span className="text-surface-950 font-black text-xs">T</span>
            </div>
            <div>
              <p className="text-xs font-bold text-surface-100 leading-none">Tiger</p>
              <p className="text-[9px] text-surface-500 leading-tight mt-0.5">Content Workflow</p>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 py-3 px-2">
          {NAV_ITEMS.map((item) => (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg mb-0.5 text-left transition-all duration-150 group ${
                currentPage === item.id
                  ? 'bg-gold-400/10 text-gold-400 border border-gold-500/20'
                  : 'text-surface-400 hover:text-surface-200 hover:bg-surface-800'
              }`}
            >
              <span className={currentPage === item.id ? 'text-gold-400' : 'text-surface-500 group-hover:text-surface-300'}>
                {item.icon}
              </span>
              <div>
                <p className="text-xs font-medium leading-none">{item.label}</p>
                <p className="text-[9px] opacity-60 mt-0.5">{item.sublabel}</p>
              </div>
              {currentPage === item.id && (
                <span className="ml-auto w-1 h-4 bg-gold-400 rounded-full" />
              )}
            </button>
          ))}
        </nav>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-surface-800">
          <p className="text-[9px] text-surface-600">v1.0 · Mock Data</p>
        </div>
      </aside>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div className="md:hidden fixed inset-0 z-40">
          <div className="absolute inset-0 bg-black/60" onClick={() => setSidebarOpen(false)} />
          <aside className="absolute left-0 top-0 bottom-0 w-64 bg-surface-900 border-r border-surface-800 flex flex-col z-50">
            <div className="px-5 py-5 border-b border-surface-800 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 bg-gold-400 rounded flex items-center justify-center">
                  <span className="text-surface-950 font-black text-xs">T</span>
                </div>
                <div>
                  <p className="text-xs font-bold text-surface-100">Tiger</p>
                  <p className="text-[9px] text-surface-500">Content Workflow</p>
                </div>
              </div>
              <button onClick={() => setSidebarOpen(false)} className="text-surface-400">
                <X size={18} />
              </button>
            </div>
            <nav className="flex-1 py-3 px-2">
              {NAV_ITEMS.map((item) => (
                <button
                  key={item.id}
                  onClick={() => { onNavigate(item.id); setSidebarOpen(false); }}
                  className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg mb-0.5 text-left transition-all ${
                    currentPage === item.id
                      ? 'bg-gold-400/10 text-gold-400 border border-gold-500/20'
                      : 'text-surface-400 hover:text-surface-200 hover:bg-surface-800'
                  }`}
                >
                  {item.icon}
                  <div>
                    <p className="text-sm font-medium">{item.label}</p>
                    <p className="text-[10px] opacity-60">{item.sublabel}</p>
                  </div>
                </button>
              ))}
            </nav>
          </aside>
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Mobile header */}
        <header className="md:hidden flex items-center justify-between px-4 py-3 bg-surface-900 border-b border-surface-800 flex-shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-gold-400 rounded flex items-center justify-center">
              <span className="text-surface-950 font-black text-[10px]">T</span>
            </div>
            <span className="text-sm font-semibold text-surface-100">{current.label}</span>
          </div>
          <button onClick={() => setSidebarOpen(true)} className="text-surface-400 hover:text-surface-200">
            <Menu size={20} />
          </button>
        </header>

        {/* Desktop page title */}
        <div className="hidden md:flex items-center px-6 py-4 border-b border-surface-800 bg-surface-900 flex-shrink-0">
          <div className="flex items-center gap-2 text-surface-500 mr-2">{current.icon}</div>
          <h1 className="text-sm font-semibold text-surface-100">{current.label}</h1>
          <span className="mx-2 text-surface-700">/</span>
          <span className="text-xs text-surface-500">{current.sublabel}</span>
        </div>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>

        {/* Mobile bottom nav */}
        <nav className="md:hidden flex border-t border-surface-800 bg-surface-900 flex-shrink-0">
          {NAV_ITEMS.map((item) => (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`flex-1 flex flex-col items-center py-2 gap-0.5 transition-colors ${
                currentPage === item.id ? 'text-gold-400' : 'text-surface-500'
              }`}
            >
              {item.icon}
              <span className="text-[9px] font-medium leading-none">{item.label.replace('工作台', '').replace('审核台', '')}</span>
            </button>
          ))}
        </nav>
      </div>
    </div>
  );
}
