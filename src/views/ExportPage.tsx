import { useMemo, useState } from 'react';
import { ArrowLeft, CheckSquare, Download, Square } from 'lucide-react';
import type { DiaryEntry } from '../types/diary';

interface Props {
  entries: DiaryEntry[];
  onBack: () => void;
}

export default function ExportPage({ entries, onBack }: Props) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [busy, setBusy] = useState(false);

  const sorted = useMemo(
    () => [...entries].sort((a, b) => (a.meta.date || '').localeCompare(b.meta.date || '')),
    [entries],
  );

  const chosen = sorted.filter(entry => selected.has(entry.filePath));
  const allSelected = selected.size === sorted.length && sorted.length > 0;
  const noneSelected = selected.size === 0;
  const dateRange = chosen.length > 0
    ? `${chosen[0].meta.date} 至 ${chosen[chosen.length - 1].meta.date}`
    : '未选择';

  const toggle = (filePath: string) => {
    const next = new Set(selected);
    if (next.has(filePath)) next.delete(filePath);
    else next.add(filePath);
    setSelected(next);
  };

  const toggleAll = () => {
    if (allSelected) setSelected(new Set());
    else setSelected(new Set(sorted.map(entry => entry.filePath)));
  };

  const exportSelected = async () => {
    if (selected.size === 0) return;
    setBusy(true);
    try {
      const lines: string[] = [];
      lines.push('# 日记库导出');
      lines.push(`> ${dateRange}，${chosen.length} 篇`);
      lines.push('');
      lines.push('---');
      lines.push('');

      for (const entry of chosen) {
        const tags = (entry.meta.tags || []).join(' / ');
        const loc = entry.meta.location ? `地点：${entry.meta.location}` : '';
        const meta = [loc, tags].filter(Boolean).join('，');
        lines.push(`## ${entry.meta.date}，${entry.meta.title || '无标题日记'}`);
        if (meta) lines.push(`*${meta}*`);
        lines.push('');
        lines.push(entry.body);
        lines.push('');
        lines.push('---');
        lines.push('');
      }

      const content = lines.join('\n');
      const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `日记库_${dateRange.replace(/\s*至\s*/g, '-')}_${chosen.length}篇.md`;
      link.click();
      URL.revokeObjectURL(url);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex h-full flex-col bg-[#F9F7F2] font-serif text-[#1A1A1A]">
      <header className="border-b border-[#D1CEC7] bg-[#FAFAFA] px-6 py-5">
        <div className="flex items-center justify-between gap-5">
          <button
            type="button"
            onClick={onBack}
            className="inline-flex min-h-10 items-center gap-2 border border-[#D1CEC7] bg-transparent px-4 py-2 font-mono text-[11px] uppercase tracking-widest text-[#8C7E6A] transition-colors hover:border-[#1A1A1A] hover:text-[#1A1A1A] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1A1A1A]/25"
          >
            <ArrowLeft className="h-4 w-4" />
            返回时间线
          </button>

          <div className="min-w-0 flex-1 text-center">
            <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-[#8C7E6A]">Export Registry</p>
            <h1 className="mt-1 font-serif text-3xl font-bold text-[#1A1A1A]">导出日记</h1>
            <p className="mt-1 text-sm text-[#8C7E6A]">{selected.size} / {sorted.length} 篇，{dateRange}</p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={toggleAll}
              className="inline-flex min-h-10 items-center gap-2 border border-[#D1CEC7] bg-white px-4 py-2 font-mono text-[11px] uppercase tracking-widest text-[#8C7E6A] transition-colors hover:border-[#1A1A1A] hover:text-[#1A1A1A] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1A1A1A]/25"
            >
              {allSelected ? <CheckSquare className="h-4 w-4" /> : <Square className="h-4 w-4" />}
              {allSelected ? '取消全选' : '全选'}
            </button>
            <button
              type="button"
              onClick={exportSelected}
              disabled={noneSelected || busy}
              className="inline-flex min-h-10 items-center gap-2 border border-[#1A1A1A] bg-[#1A1A1A] px-4 py-2 font-mono text-[11px] uppercase tracking-widest text-[#F9F7F2] transition-colors hover:bg-[#242321] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1A1A1A]/30 focus-visible:ring-offset-2 focus-visible:ring-offset-[#F9F7F2] disabled:cursor-not-allowed disabled:opacity-35"
            >
              <Download className="h-3.5 w-3.5" />
              {busy ? '导出中' : '导出所选'}
            </button>
          </div>
        </div>
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto px-6 py-6">
        <div className="mx-auto grid max-w-6xl gap-6 lg:grid-cols-[280px_minmax(0,1fr)]">
          <aside className="h-fit border border-[#D1CEC7] bg-[#FAFAFA] p-5 shadow-[0_12px_40px_rgba(0,0,0,0.04)]">
            <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-[#D1CEC7]">Selection</p>
            <p className="mt-4 font-serif text-5xl font-bold text-[#1A1A1A]">{selected.size}</p>
            <p className="mt-2 text-sm leading-6 text-[#8C7E6A]">当前选择范围：{dateRange}</p>
            <p className="mt-5 border-t border-[#E8E4DB] pt-4 text-xs leading-6 text-[#8C7E6A]">
              导出会生成一个 Markdown 文件，原始日记文件不会被修改。
            </p>
          </aside>

          <div className="space-y-2">
            {sorted.map((entry, index) => {
              const active = selected.has(entry.filePath);
              return (
                <button
                  key={entry.filePath}
                  type="button"
                  onClick={() => toggle(entry.filePath)}
                  className={`grid w-full grid-cols-[24px_42px_112px_minmax(0,1fr)] items-start gap-4 border px-4 py-3 text-left transition ${
                    active
                      ? 'border-[#1A1A1A] bg-white shadow-[0_12px_40px_rgba(0,0,0,0.04)]'
                      : 'border-[#D1CEC7] bg-[#FCFBF7] hover:border-[#1A1A1A] hover:bg-white'
                  }`}
                >
                  <span className={active ? 'text-[#1A1A1A]' : 'text-[#8C7E6A]/45'}>
                    {active ? <CheckSquare className="h-4 w-4" /> : <Square className="h-4 w-4" />}
                  </span>
                  <span className="font-mono text-[11px] text-[#D1CEC7]">{String(index + 1).padStart(2, '0')}</span>
                  <span className="font-mono text-xs text-[#8C7E6A]">{entry.meta.date}</span>
                  <span className="min-w-0">
                    <span className="block truncate font-serif text-lg font-bold text-[#1A1A1A]">{entry.meta.title || '无标题日记'}</span>
                    <span className="mt-1 block truncate text-xs leading-5 text-[#8C7E6A]">{entry.body.slice(0, 96)}</span>
                  </span>
                </button>
              );
            })}
            {sorted.length === 0 && (
              <div className="border border-[#D1CEC7] bg-[#FCFBF7] p-12 text-center">
                <p className="font-serif text-2xl font-bold text-[#1A1A1A]">还没有日记可导出</p>
                <p className="mt-2 text-sm text-[#8C7E6A]">先录入日记，再回到这里整理导出。</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
