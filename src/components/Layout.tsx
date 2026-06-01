import { LayoutDashboard, Scissors, FileText, Link2, ShieldCheck, Menu, X, BarChart2, SendToBack, BookOpen, Share2, ClipboardPenLine, CalendarRange } from 'lucide-react';
import { useState } from 'react';

export type Page = 'dashboard' | 'm-workstation' | 's-workstation' | 'c-workstation' | 'a-workstation' | 'vera-review' | 'publish-queue' | 'distribution-export' | 'manual-metrics' | 'weekly-report' | 'rules-page';

interface NavItem {
  id: Page;
  label: string;
  sublabel: string;
  icon: React.ReactNode;
}

const NAV_ITEMS: NavItem[] = [
  { id: 'dashboard',           label: '总览',       sublabel: 'Dashboard',    icon: <LayoutDashboard size={15} /> },
  { id: 'm-workstation',       label: '小M工作台',   sublabel: '视频·素材',    icon: <Scissors size={15} /> },
  { id: 's-workstation',       label: '小S工作台',   sublabel: '内容·关键词',  icon: <FileText size={15} /> },
  { id: 'c-workstation',       label: '小C工作台',   sublabel: '技术·链接',    icon: <Link2 size={15} /> },
  { id: 'a-workstation',       label: '小A工作台',   sublabel: '广告·投放',    icon: <BarChart2 size={15} /> },
  { id: 'vera-review',         label: 'Vera审核台',  sublabel: '审核·决策',    icon: <ShieldCheck size={15} /> },
  { id: 'publish-queue',       label: '发布队列',    sublabel: 'AI·队列',      icon: <SendToBack size={15} /> },
  { id: 'distribution-export', label: '分发导出',    sublabel: 'Distribution', icon: <Share2 size={15} /> },
  { id: 'manual-metrics',      label: '手动回填',    sublabel: 'Metrics',      icon: <ClipboardPenLine size={15} /> },
  { id: 'weekly-report',       label: '周复盘',      sublabel: 'Weekly',       icon: <CalendarRange size={15} /> },
  { id: 'rules-page',          label: 'AI规则',      sublabel: '自动·审批',    icon: <BookOpen size={15} /> },
];

interface LayoutProps {
  currentPage: Page;
  onNavigate: (page: Page) => void;
  children: React.ReactNode;
}

// Sidebar nav item — used for both desktop and mobile drawer
function NavButton({ item, active, onClick, mobile }: { item: NavItem; active: boolean; onClick: () => void; mobile?: boolean }) {
  return (
    <button
      onClick={onClick}
      style={active ? { backgroundColor: 'rgba(184, 154, 94, 0.11)' } : undefined}
      className={[
        'w-full flex items-center gap-2.5 rounded-lg mb-0.5 text-left transition-all duration-150 group relative',
        mobile ? 'px-3 py-3' : 'px-3 py-2',
        active
          ? 'border border-[rgba(184,154,94,0.20)]'
          : 'border border-transparent hover:border-transparent',
      ].join(' ')}
      onMouseEnter={(e) => {
        if (!active) (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'rgba(255,255,255,0.04)';
      }}
      onMouseLeave={(e) => {
        if (!active) (e.currentTarget as HTMLButtonElement).style.backgroundColor = '';
      }}
    >
      {/* Active indicator bar */}
      {active && (
        <span
          className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 rounded-r-full"
          style={{ backgroundColor: '#B89A5E' }}
        />
      )}

      <span style={{ color: active ? '#D6C08B' : '#7D766C' }} className="flex-shrink-0 transition-colors duration-150 group-hover:text-[#D8D1C3]">
        {item.icon}
      </span>
      <div className="min-w-0">
        <p
          className="text-xs font-medium leading-none transition-colors duration-150"
          style={{ color: active ? '#F4EFE4' : '#A8A094' }}
        >
          {item.label}
        </p>
        <p className="text-[9px] mt-0.5 leading-none" style={{ color: '#5F5A52' }}>
          {item.sublabel}
        </p>
      </div>
    </button>
  );
}

export function Layout({ currentPage, onNavigate, children }: LayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const current = NAV_ITEMS.find((n) => n.id === currentPage)!;

  return (
    <div className="flex h-screen overflow-hidden" style={{ backgroundColor: '#141414' }}>

      {/* ── Desktop Sidebar ───────────────────────────────────────────── */}
      <aside
        className="hidden md:flex flex-col w-52 flex-shrink-0"
        style={{
          backgroundColor: '#181715',
          borderRight: '1px solid rgba(214, 192, 139, 0.08)',
        }}
      >
        {/* Logo */}
        <div className="px-4 py-4" style={{ borderBottom: '1px solid rgba(214, 192, 139, 0.08)' }}>
          <div className="flex items-center gap-2.5">
            <div
              className="w-7 h-7 rounded flex items-center justify-center flex-shrink-0"
              style={{ backgroundColor: '#B89A5E' }}
            >
              <span className="font-black text-xs" style={{ color: '#141414' }}>T</span>
            </div>
            <div>
              <p className="text-xs font-bold leading-none" style={{ color: '#F4EFE4' }}>Tiger</p>
              <p className="text-[9px] leading-tight mt-0.5" style={{ color: '#5F5A52' }}>Content Workflow</p>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 py-2 px-2 overflow-y-auto">
          {NAV_ITEMS.map((item) => (
            <NavButton
              key={item.id}
              item={item}
              active={currentPage === item.id}
              onClick={() => onNavigate(item.id)}
            />
          ))}
        </nav>

        {/* Footer */}
        <div className="px-4 py-3" style={{ borderTop: '1px solid rgba(214, 192, 139, 0.06)' }}>
          <p className="text-[9px]" style={{ color: '#5F5A52' }}>v1.0 · Mock Data</p>
        </div>
      </aside>

      {/* ── Mobile Sidebar Overlay ─────────────────────────────────────── */}
      {sidebarOpen && (
        <div className="md:hidden fixed inset-0 z-40">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setSidebarOpen(false)} />
          <aside
            className="absolute left-0 top-0 bottom-0 w-64 flex flex-col z-50"
            style={{ backgroundColor: '#181715', borderRight: '1px solid rgba(214, 192, 139, 0.08)' }}
          >
            <div
              className="px-5 py-4 flex items-center justify-between"
              style={{ borderBottom: '1px solid rgba(214, 192, 139, 0.08)' }}
            >
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded flex items-center justify-center" style={{ backgroundColor: '#B89A5E' }}>
                  <span className="font-black text-xs" style={{ color: '#141414' }}>T</span>
                </div>
                <div>
                  <p className="text-xs font-bold" style={{ color: '#F4EFE4' }}>Tiger</p>
                  <p className="text-[9px]" style={{ color: '#5F5A52' }}>Content Workflow</p>
                </div>
              </div>
              <button onClick={() => setSidebarOpen(false)} style={{ color: '#7D766C' }}>
                <X size={18} />
              </button>
            </div>
            <nav className="flex-1 py-2 px-2 overflow-y-auto">
              {NAV_ITEMS.map((item) => (
                <NavButton
                  key={item.id}
                  item={item}
                  active={currentPage === item.id}
                  onClick={() => { onNavigate(item.id); setSidebarOpen(false); }}
                  mobile
                />
              ))}
            </nav>
          </aside>
        </div>
      )}

      {/* ── Main content area ──────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col overflow-hidden" style={{ backgroundColor: '#191817' }}>

        {/* Mobile header */}
        <header
          className="md:hidden flex items-center justify-between px-4 py-3 flex-shrink-0"
          style={{ backgroundColor: '#181715', borderBottom: '1px solid rgba(214, 192, 139, 0.08)' }}
        >
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded flex items-center justify-center" style={{ backgroundColor: '#B89A5E' }}>
              <span className="font-black text-[10px]" style={{ color: '#141414' }}>T</span>
            </div>
            <span className="text-sm font-semibold" style={{ color: '#F4EFE4' }}>{current.label}</span>
          </div>
          <button onClick={() => setSidebarOpen(true)} style={{ color: '#7D766C' }}>
            <Menu size={20} />
          </button>
        </header>

        {/* Desktop page title bar */}
        <div
          className="hidden md:flex items-center px-6 py-3.5 flex-shrink-0"
          style={{
            backgroundColor: '#181715',
            borderBottom: '1px solid rgba(214, 192, 139, 0.08)',
          }}
        >
          <span style={{ color: '#7D766C' }} className="mr-2 flex items-center">{current.icon}</span>
          <h1 className="text-sm font-semibold" style={{ color: '#F4EFE4' }}>{current.label}</h1>
          <span className="mx-2" style={{ color: '#3A3730' }}>/</span>
          <span className="text-xs" style={{ color: '#7D766C' }}>{current.sublabel}</span>
        </div>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>

        {/* Mobile bottom nav */}
        <nav
          className="md:hidden flex flex-shrink-0 overflow-x-auto"
          style={{ backgroundColor: '#181715', borderTop: '1px solid rgba(214, 192, 139, 0.08)' }}
        >
          {NAV_ITEMS.map((item) => (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className="flex-shrink-0 flex flex-col items-center py-2 px-2.5 gap-0.5 transition-colors"
              style={{ color: currentPage === item.id ? '#B89A5E' : '#5F5A52' }}
            >
              {item.icon}
              <span className="text-[8px] font-medium leading-none whitespace-nowrap">
                {item.label.replace('工作台', '').replace('审核台', '')}
              </span>
            </button>
          ))}
        </nav>
      </div>
    </div>
  );
}
