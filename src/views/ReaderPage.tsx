import { useState } from 'react';
import { ArrowLeft, Clock, Edit3, Grid3X3, Lock, MapPin } from 'lucide-react';
import type { DiaryConfig, DiaryEntry } from '../types/diary';
import A4Paper from '../components/A4Paper';
import { formatDate } from '../utils/formatDate';
import { api } from '../utils/api';

const LAYOUT_OPTIONS = [
  { value: '', label: '自动推算' },
  { value: 'standard', label: '标准卡片' },
  { value: 'poster', label: '竖版画报 (3:4)' },
  { value: 'poster_square', label: '正方形画报 (1:1)' },
  { value: 'poster_circle', label: '圆形画报' },
  { value: 'editorial', label: '非对称编辑' },
  { value: 'lead', label: '头版头条' },
  { value: 'lead_text', label: '头版纯文' },
  { value: 'wide', label: '横向目录' },
  { value: 'quote', label: '引言碎片' },
  { value: 'photo_stack', label: '照片堆叠' },
];

interface Props {
  entry: DiaryEntry;
  config: DiaryConfig;
  onEdit: (e: DiaryEntry) => void;
  onDelete: (e: DiaryEntry) => void;
  onBack: () => void;
  onRefresh: () => Promise<void>;
  onToggleLock: (e: DiaryEntry) => void;
}

export default function ReaderPage({ entry, config, onEdit, onDelete, onBack, onRefresh, onToggleLock }: Props) {
  const preset = config.presets.find(p => p.name === (entry.meta.preset || config.defaultPreset)) || config.presets[0];
  const [layoutVal, setLayoutVal] = useState(entry.meta.layoutOverride || '');
  const [savingLayout, setSavingLayout] = useState(false);
  const [pageIndex, setPageIndex] = useState(0);
  const [pageCount, setPageCount] = useState(1);

  const handleLayoutChange = async (val: string) => {
    setLayoutVal(val);
    setSavingLayout(true);
    const updatedMeta = { ...entry.meta, layoutOverride: val || undefined };
    const date = entry.meta.date;
    const slug = entry.meta.title || date;
    await api.writeDiary(`${date.slice(0, 4)}/${date.slice(5, 7)}/${date}-${slug}.md`, updatedMeta, entry.body);
    await onRefresh();
    setSavingLayout(false);
  };

  const clampPage = (next: number) => Math.max(0, Math.min(pageCount - 1, next));

  if (!preset) return null;

  return (
    <div className="flex h-full flex-col bg-[#F9F7F2] font-serif text-[#1A1A1A]">
      <header className="shrink-0 border-b border-[#D1CEC7] bg-white px-6 md:px-10 py-3 flex items-center justify-between z-10">
        <button onClick={onBack} className="flex items-center gap-2 text-[#8C7E6A] hover:text-[#1A1A1A] transition-colors font-mono text-[11px] uppercase tracking-widest cursor-pointer">
          <ArrowLeft className="w-4 h-4" /> 返回时间线
        </button>
        <div className="min-w-0 text-center">
          <h1 className="font-bold text-sm tracking-widest truncate">{entry.meta.title || '无标题日记'}</h1>
        </div>
        <div className="flex items-center gap-2">
          <button type="button" onClick={() => onToggleLock(entry)}
            className={`inline-flex min-h-9 items-center gap-2 border px-3 py-1.5 font-mono text-[11px] uppercase tracking-widest transition-colors cursor-pointer rounded-sm ${
              entry.meta.locked ? 'border-[#902A2A]/30 bg-[#902A2A]/5 text-[#902A2A] hover:bg-[#902A2A]/10' : 'border-[#D1CEC7] text-[#8C7E6A] hover:border-[#1A1A1A] hover:text-[#1A1A1A]'
            }`}>
            <Lock className="h-3.5 w-3.5" />
          </button>
          <button type="button" onClick={() => onEdit(entry)}
            className="inline-flex min-h-9 items-center gap-2 border border-[#1A1A1A] bg-[#1A1A1A] px-4 py-1.5 font-mono text-[11px] uppercase tracking-widest text-[#F9F7F2] transition-colors hover:bg-[#242321] cursor-pointer rounded-sm">
            <Edit3 className="h-3.5 w-3.5" />编辑
          </button>
          <button type="button"
            onClick={() => { if (confirm(`删除「${entry.meta.title || '无标题日记'}」？此操作不可撤销。`)) onDelete(entry); }}
            className="inline-flex min-h-9 items-center gap-2 border border-[#D1CEC7] bg-transparent px-4 py-1.5 font-mono text-[11px] uppercase tracking-widest text-[#902A2A]/70 transition-colors hover:border-[#902A2A]/35 hover:bg-[#902A2A]/5 hover:text-[#902A2A] cursor-pointer">
            <span>删除</span>
          </button>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        {/* Left info card */}
        <aside className="w-[260px] lg:w-[300px] shrink-0 border-r border-[#E8E4DB] flex flex-col overflow-y-auto bg-white [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          <div className="p-8 lg:p-10 pb-4">
            <p className="font-mono text-[10px] text-[#8C7E6A] tracking-[0.2em] uppercase mb-10 flex items-center gap-2">
              <Grid3X3 className="w-3 h-3" /> View Metrics
            </p>

            <h2 className="text-2xl font-bold leading-tight mb-8 tracking-wider">{entry.meta.title || '无标题日记'}</h2>

            <div className="grid grid-cols-2 gap-y-8 gap-x-6 border-y border-[#D1CEC7] py-8 mb-10">
              <div>
                <p className="font-mono text-[9px] text-[#8C7E6A] uppercase tracking-widest mb-2 flex items-center gap-1.5">
                  <Clock className="w-3 h-3" /> Date
                </p>
                <p className="text-[13px] font-medium tracking-wide">{formatDate(entry.meta.date || '')}</p>
              </div>
              <div>
                <p className="font-mono text-[9px] text-[#8C7E6A] uppercase tracking-widest mb-2 flex items-center gap-1.5">
                  <MapPin className="w-3 h-3" /> Location
                </p>
                <p className="text-[13px] font-medium tracking-wide italic">{entry.meta.location || '——'}</p>
              </div>
              <div>
                <p className="font-mono text-[9px] text-[#8C7E6A] uppercase tracking-widest mb-2">Words</p>
                <p className="text-[13px] font-mono tracking-wide">
                  {entry.body.length.toLocaleString()} <span className="text-[#8C7E6A] text-[10px]">chr</span>
                </p>
              </div>
              <div>
                <p className="font-mono text-[9px] text-[#8C7E6A] uppercase tracking-widest mb-2">Preset</p>
                <p className="text-[13px] font-mono tracking-wide">{preset.name}</p>
              </div>
            </div>

            {/* Layout selector */}
            <div>
              <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#D1CEC7] mb-3">时间线展示</p>
              <select value={layoutVal} onChange={e => handleLayoutChange(e.target.value)} disabled={savingLayout}
                className="w-full h-9 min-h-0 border border-[#D1CEC7] bg-white py-1 pl-2 pr-7 font-mono text-[11px] text-[#1A1A1A] outline-none focus:border-[#1A1A1A] disabled:opacity-50">
                {LAYOUT_OPTIONS.map(opt => (<option key={opt.value} value={opt.value}>{opt.label}</option>))}
              </select>
              {savingLayout && <p className="mt-1.5 font-mono text-[9px] text-[#8C7E6A]">保存中...</p>}
            </div>
          </div>
        </aside>

        {/* A4 paper area */}
        <div className="flex-1 bg-[#E8E4DB]/20 flex flex-col justify-between items-center overflow-hidden">
          <div className="flex-1 w-full overflow-y-auto flex px-6 py-8 md:py-12">
            <div className="w-full max-w-[820px] min-h-[60vh] bg-white shadow-[0_2px_20px_rgba(0,0,0,0.06)] border border-[#E8E4DB] relative flex flex-col mx-auto my-auto">
              <div className="absolute left-10 top-0 bottom-0 w-px bg-red-900/10 pointer-events-none" />
              <div className="flex-1 overflow-y-auto overflow-x-hidden">
                <A4Paper params={preset.params} body={entry.body} images={entry.images} imagePos="bottom" showPageNum={false} pageIndex={pageIndex} onPageCountChange={setPageCount} />
              </div>
            </div>
          </div>

          {/* Pagination bar */}
          {pageCount > 1 && (
            <div className="h-12 border-t border-[#D1CEC7] bg-[#F9F7F2] flex items-center justify-between px-6 shrink-0 text-[#8C7E6A] font-mono text-[11px] tracking-widest w-full">
              <button onClick={() => setPageIndex(p => clampPage(p - 1))} disabled={pageIndex === 0}
                className="px-3 py-1.5 border border-transparent hover:border-[#D1CEC7] hover:text-[#1A1A1A] transition-colors disabled:opacity-30 cursor-pointer flex items-center gap-1">
                &lt; 上一页
              </button>
              <span className="text-[#1A1A1A]">{pageIndex + 1} <span className="opacity-50">/ {pageCount}</span></span>
              <button onClick={() => setPageIndex(p => clampPage(p + 1))} disabled={pageIndex >= pageCount - 1}
                className="px-3 py-1.5 border border-transparent hover:border-[#D1CEC7] hover:text-[#1A1A1A] transition-colors disabled:opacity-30 cursor-pointer flex items-center gap-1">
                下一页 &gt;
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
