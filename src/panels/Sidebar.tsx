import { useState } from 'react';
import type { LucideIcon } from 'lucide-react';
import { Book, Clock, Download, Menu, MessageCircle, Settings, X } from 'lucide-react';

type View = 'welcome' | 'timeline' | 'reader' | 'editor' | 'entry' | 'export' | 'test';
type Panel = 'api' | 'chat';

interface Props {
  view: string;
  onNavigate: (v: View) => void;
  onOpenPanel: (p: Panel) => void;
}

interface NavItem {
  id: View;
  label: string;
  eng: string;
  icon: LucideIcon;
}

interface PanelItem {
  id: Panel;
  label: string;
  eng: string;
  icon: LucideIcon;
}

const MAIN_NAV: NavItem[] = [
  { id: 'welcome', label: '扉页', icon: Book, eng: 'COVER' },
  { id: 'timeline', label: '时光', icon: Clock, eng: 'ARCHIVE' },
  { id: 'export', label: '导出册', icon: Download, eng: 'EXPORT' },
];

const SYSTEM_NAV: PanelItem[] = [
  { id: 'api', label: 'API 设置', icon: Settings, eng: 'SYSTEM' },
  { id: 'chat', label: 'AI 助手', icon: MessageCircle, eng: 'AGENT' },
];

export default function Sidebar({ view, onNavigate, onOpenPanel }: Props) {
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const activeView = view === 'reader' || view === 'editor' ? 'timeline' : view;

  const closeMobile = () => setIsMobileOpen(false);

  const renderViewButton = (item: NavItem) => {
    const Icon = item.icon;
    const isActive = activeView === item.id;

    return (
      <button
        key={item.id}
        type="button"
        onClick={() => {
          onNavigate(item.id);
          closeMobile();
        }}
        className={`group flex w-full items-center justify-center lg:justify-between px-2 lg:px-6 py-3.5 text-left border-l-[3px] transition-colors focus:outline-none focus-visible:bg-[#1A1A1A]/5 ${
          isActive
            ? 'border-[#1A1A1A] bg-white font-bold text-[#1A1A1A] shadow-[0_2px_10px_rgba(0,0,0,0.02)]'
            : 'border-transparent text-[#8C7E6A] hover:bg-black/5 hover:text-[#1A1A1A]'
        }`}
      >
        <div className="flex min-w-0 items-center gap-3">
          <Icon className={`h-4 w-4 shrink-0 ${isActive ? 'opacity-100' : 'opacity-50 transition-opacity group-hover:opacity-80'}`} />
          <span className="truncate text-sm tracking-[0.2em] hidden lg:block">{item.label}</span>
        </div>
        <span
          className={`origin-right font-mono text-[9px] uppercase tracking-widest transition-all ${
            isActive
              ? 'scale-100 text-[#1A1A1A] opacity-100'
              : 'scale-95 text-[#D1CEC7] opacity-0 group-hover:scale-100 group-hover:opacity-100'
          }`}
        >
          {item.eng}
        </span>
      </button>
    );
  };

  const renderPanelButton = (item: PanelItem) => {
    const Icon = item.icon;

    return (
      <button
        key={item.id}
        type="button"
        onClick={() => {
          onOpenPanel(item.id);
          closeMobile();
        }}
        className="group flex w-full items-center justify-center lg:justify-between px-2 lg:px-6 py-3.5 text-left border-l-[3px] border-transparent text-[#8C7E6A] transition-colors hover:bg-black/5 hover:text-[#1A1A1A] focus:outline-none focus-visible:bg-[#1A1A1A]/5"
      >
        <div className="flex min-w-0 items-center gap-3">
          <Icon className="h-4 w-4 shrink-0 opacity-50 transition-opacity group-hover:opacity-80" />
          <span className="truncate text-sm tracking-[0.2em] hidden lg:block">{item.label}</span>
        </div>
        <span className="origin-right scale-95 font-mono text-[9px] uppercase tracking-widest text-[#D1CEC7] opacity-0 transition-all group-hover:scale-100 group-hover:opacity-100">
          {item.eng}
        </span>
      </button>
    );
  };

  return (
    <>
      <div className="fixed top-0 z-50 flex w-full items-center justify-between border-b border-[#D1CEC7] bg-[#F9F7F2] px-4 py-3 md:hidden">
        <span className="font-serif text-sm font-bold tracking-widest text-[#1A1A1A]">Diary Vault</span>
        <button
          type="button"
          onClick={() => setIsMobileOpen(true)}
          className="p-1 text-[#1A1A1A] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1A1A1A]/20"
          aria-label="打开导航"
        >
          <Menu className="h-5 w-5" />
        </button>
      </div>

      {isMobileOpen && (
        <button
          type="button"
          aria-label="关闭导航遮罩"
          className="fixed inset-0 z-40 bg-[#1A1A1A]/20 backdrop-blur-sm md:hidden"
          onClick={closeMobile}
        />
      )}

      <aside
        className={`fixed left-0 top-0 z-50 flex h-full w-[80px] shrink-0 flex-col border-r border-[#E8E4DB] bg-[#FAFAFA] transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] md:relative lg:w-[240px] ${
          isMobileOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full md:translate-x-0'
        }`}
      >
        <div className="px-8 pb-6 pt-10">
          <div className="flex items-start justify-between">
            <div className="font-serif text-xl tracking-widest text-[#1A1A1A] flex items-center justify-center lg:justify-start gap-3">
              <span className="flex h-8 w-8 items-center justify-center bg-[#1A1A1A] text-xs font-mono text-[#F9F7F2]">D</span>
              <span className="font-medium tracking-[0.15em] hidden lg:block">D. Vault</span>
            </div>
            <button
              type="button"
              onClick={closeMobile}
              className="p-1 text-[#8C7E6A] hover:text-[#1A1A1A] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1A1A1A]/20 md:hidden"
              aria-label="关闭导航"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="mt-4 h-px w-6 bg-[#D1CEC7]" />
        </div>

        <nav className="mt-6 flex flex-1 flex-col gap-1 overflow-y-auto [-ms-overflow-style:'none'] [scrollbar-width:'none'] [&::-webkit-scrollbar]:hidden">
          <div className="mb-2 px-6 font-mono text-[9px] uppercase tracking-widest text-[#D1CEC7] hidden lg:block">Main</div>
          {MAIN_NAV.map(renderViewButton)}

          <div className="mb-2 mt-8 px-6 font-mono text-[9px] uppercase tracking-widest text-[#D1CEC7] hidden lg:block">System</div>
          {SYSTEM_NAV.map(renderPanelButton)}
        </nav>

        <div className="mt-auto border-t border-[#D1CEC7]/50 bg-[#F9F7F2] px-8 py-8">
          <div className="mb-2 flex items-center gap-2">
            <div className="h-1.5 w-1.5 rounded-full bg-green-700 opacity-60" />
            <span className="font-mono text-[9px] uppercase tracking-widest text-[#1A1A1A]">Local Sync</span>
          </div>
          <div className="font-mono text-[9px] uppercase tracking-widest text-[#8C7E6A] opacity-60">Version 2.0.1</div>
        </div>
      </aside>
    </>
  );
}
