# Timeline 页改造实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将 TimelinePage 从当前三栏布局重写为参考设计的竖向标尺编年史风格，同时保留全部业务逻辑

**Architecture:** 创建独立的 `diaryAdapter.ts` 抽出布局分配逻辑，然后完整重写 `TimelinePage.tsx`——丢弃左侧 Archive Index 侧栏、巨型年份水印、月份数字框，代之以竖向标尺线+年份黑块+串珠圆点+5种参考卡片样式

**Tech Stack:** React + TypeScript + Tailwind CSS + motion/react (新页面不使用 motion)

---

### Task 1: 创建 diaryAdapter.ts

**Files:**
- Create: `src/utils/diaryAdapter.ts`

- [ ] **Step 1: 从参考复制并调整 import 路径**

```ts
import type { DiaryEntry } from '../types/diary';

export type TimelineLayoutType = 'lead' | 'lead_text' | 'quote' | 'wide' | 'standard';

export interface TimelineData {
  id: string;
  title: string;
  excerpt: string;
  date: string;
  wordCount: number;
  layout: TimelineLayoutType;
  tags?: string[];
  hasImage?: boolean;
  featured?: boolean;
}

export function mapDiaryEntriesToTimeline(entries: DiaryEntry[]): TimelineData[] {
  return entries.map((entry, index) => {
    const rawBody = entry.body || '';
    const wordCount = rawBody.length;
    let layout: TimelineLayoutType = 'standard';
    let excerpt = rawBody.substring(0, 150).replace(/\n/g, ' ') + (wordCount > 150 ? '...' : '');

    // quote: < 100 chars
    if (wordCount > 0 && wordCount < 100) {
      layout = 'quote';
      excerpt = rawBody;
    }
    // lead / lead_text: > 1000 chars or first entry
    else if (wordCount > 1000 || index === 0) {
      layout = entry.images?.length ? 'lead' : 'lead_text';
    }
    // wide: every 5th entry with > 300 chars
    else if (index % 5 === 0 && wordCount > 300) {
      layout = 'wide';
    }

    return {
      id: entry.filePath || `entry-${index}`,
      title: entry.meta?.title || 'Untitled',
      excerpt,
      date: entry.meta?.date || new Date().toISOString(),
      wordCount,
      layout,
      tags: entry.meta?.tags,
      hasImage: !!(entry.images && entry.images.length > 0),
      featured: layout === 'lead' || layout === 'lead_text',
    };
  });
}
```

保留当前的阈值（`index % 5`、`index === 0 → lead`），因为这些已经针对 111 篇日记调优。

- [ ] **Step 2: TypeScript 编译检查**

```bash
npx tsc --noEmit
```

- [ ] **Step 3: 提交**

```bash
git add src/utils/diaryAdapter.ts
git commit -m "feat: 添加 diaryAdapter——Timeline 布局分配独立工具函数"
```

---

### Task 2: 重写 TimelinePage — 外层结构+顶部栏+背景

**Files:**
- Modify: `src/views/TimelinePage.tsx`（整体重写）

- [ ] **Step 1: 替换 import 和类型定义**

```tsx
import { useMemo, useState } from 'react';
import { Search } from 'lucide-react';
import type { DiaryEntry } from '../types/diary';
import { mapDiaryEntriesToTimeline } from '../utils/diaryAdapter';
import type { TimelineData, TimelineLayoutType } from '../utils/diaryAdapter';

type LayoutType = TimelineLayoutType;

interface ProcessedEntry extends TimelineData {
  year: number;
  month: number;
  day: number;
  dayStr: string;
  sourceEntry: DiaryEntry;
}

interface MonthGroup { month: number; entries: ProcessedEntry[]; }
interface YearGroup { year: number; months: MonthGroup[]; }
```

- [ ] **Step 2: 写数据管道（保留现有逻辑，改用 adapter）**

```tsx
function parseDate(raw: string): { year: number; month: number; day: number; sortKey: number } {
  const m = raw?.match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})/);
  if (m) {
    const y = +m[1], mo = +m[2], d = +m[3];
    return { year: y, month: mo, day: d, sortKey: y * 10000 + mo * 100 + d };
  }
  const d = new Date(raw);
  if (!isNaN(d.getTime())) return { year: d.getFullYear(), month: d.getMonth() + 1, day: d.getDate(), sortKey: d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate() };
  return { year: 0, month: 0, day: 0, sortKey: 0 };
}
```

- [ ] **Step 3: 写组件框架**

完整的 TimelinePage 组件用以下结构替换当前的全部 JSX：

```tsx
export default function TimelinePage({ entries, onSelect }: { entries: DiaryEntry[]; onSelect: (entry: DiaryEntry) => void }) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Data pipeline
  const timelineData = useMemo(() => {
    const visual = mapDiaryEntriesToTimeline(entries);
    const searchLower = searchQuery.toLowerCase().trim();
    
    const processed = visual
      .map((v, i) => {
        const src = entries[i];
        const date = parseDate(src.meta.date);
        return { ...v, year: date.year, month: date.month, day: date.day, dayStr: String(date.day || '--').padStart(2, '0'), sourceEntry: src };
      })
      .filter(e => {
        if (!searchLower) return true;
        const haystack = `${e.title} ${e.excerpt} ${e.sourceEntry.body} ${(e.tags || []).join(' ')}`.toLowerCase();
        return haystack.includes(searchLower);
      })
      .sort((a, b) => {
        const da = parseDate(a.date).sortKey;
        const db = parseDate(b.date).sortKey;
        return db - da;
      });

    // Group into years/months
    const yearMap = new Map<number, Map<number, ProcessedEntry[]>>();
    for (const e of processed) {
      if (!yearMap.has(e.year)) yearMap.set(e.year, new Map());
      const monthMap = yearMap.get(e.year)!;
      if (!monthMap.has(e.month)) monthMap.set(e.month, []);
      monthMap.get(e.month)!.push(e);
    }

    const years: YearGroup[] = [];
    for (const [year, monthMap] of [...yearMap.entries()].sort((a, b) => b[0] - a[0])) {
      const months: MonthGroup[] = [];
      for (const [month, entries] of [...monthMap.entries()].sort((a, b) => b[0] - a[0])) {
        months.push({ month, entries });
      }
      years.push({ year, months });
    }
    return years;
  }, [entries, searchQuery]);

  const visibleCount = timelineData.reduce((t, y) => t + y.months.reduce((mt, m) => mt + m.entries.length, 0), 0);

  const handleSelect = (entry: ProcessedEntry) => {
    setActiveId(entry.id);
    onSelect(entry.sourceEntry);
  };

  return (
    <div className="relative h-full w-full flex flex-col font-serif bg-[#F9F7F2] text-[#1A1A1A] overflow-hidden">
      {/* Background grid */}
      <div className="absolute inset-0 pointer-events-none opacity-[0.15] z-0" style={{ backgroundImage: 'linear-gradient(#D1CEC7 1px, transparent 1px), linear-gradient(90deg, #D1CEC7 1px, transparent 1px)', backgroundSize: '100px 100px' }} />

      {/* Sticky header */}
      <header className="flex-none px-8 lg:px-12 py-6 flex flex-col md:flex-row items-start md:items-center justify-between border-b border-[#D1CEC7] z-30 relative bg-[#F9F7F2]/95 backdrop-blur-sm shadow-sm gap-4">
        <div className="flex items-center gap-6">
          <div>
            <div className="font-mono text-[10px] tracking-[0.2em] text-[#8C7E6A] uppercase leading-relaxed">CHRONOLOGICAL ARCHIVE</div>
            <div className="text-[#1A1A1A] font-bold text-sm">ENTRIES: {visibleCount}</div>
          </div>
        </div>
        <div className="relative group w-full md:w-64">
          <Search className="w-4 h-4 text-[#8C7E6A] absolute left-0 top-1 group-hover:text-[#1A1A1A] transition-colors" />
          <input type="text" placeholder="检索档案..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
            className="w-full bg-transparent border-b border-[#D1CEC7] pb-1.5 pl-7 pr-2 text-sm font-serif outline-none placeholder:text-[#8C7E6A]/50 group-hover:border-[#1A1A1A] focus:border-[#1A1A1A] transition-colors" />
        </div>
      </header>

      {/* Timeline scroll area */}
      <div className="flex-1 overflow-y-auto z-10 relative scroll-smooth p-6 pb-0 lg:p-12 lg:pb-0 [&::-webkit-scrollbar]:w-[6px] [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-[#8C7E6A]/20 [&::-webkit-scrollbar-thumb]:rounded-[10px] hover:[&::-webkit-scrollbar-thumb]:bg-[#8C7E6A]/40">
        <div className="max-w-[1240px] mx-auto pb-48">
          {/* ... (cards will go here in Task 3) ... */}
        </div>
      </div>
    </div>
  );
}
```

关键点：
- header 有 `z-30` + `bg-[#F9F7F2]/95` + `backdrop-blur-sm` + `shadow-sm` ——确保滚动时顶部严丝合缝不"漏风"
- 滚动条用自定义的 `::-webkit-scrollbar` 样式，宽 6px，thumb 泥褐色

- [ ] **Step 4: TypeScript 编译检查**

```bash
npx tsc --noEmit
```

- [ ] **Step 5: 提交**

```bash
git add src/views/TimelinePage.tsx
git commit -m "feat: TimelinePage 重写骨架——去侧栏+新顶栏+背景网格+自定滚动条"
```

---

### Task 3: 竖向标尺 + 月份标题 + 卡片渲染

**Files:**
- Modify: `src/views/TimelinePage.tsx`

将 Task 2 的 `{/* Timeline scroll area */}` 内部替换为完整内容。在 `<div className="max-w-[1240px] mx-auto pb-48">` 内：

- [ ] **Step 1: 竖向标尺结构（替换占位）**

```tsx
{timelineData.length === 0 ? (
  <div className="flex min-h-[40vh] flex-col items-center justify-center border border-dashed border-[#1A1A1A]/30 text-center">
    <h2 className="text-2xl font-bold mb-2">没有匹配的档案</h2>
  </div>
) : (
  <div className="border-l-[2px] border-[#1A1A1A] ml-6 md:ml-16 pl-8 md:pl-20 relative">
    {timelineData.map((year, yearIdx) => (
      <div key={year.year} className={`${yearIdx > 0 ? 'mt-48' : ''}`}>
        {/* Year spine block — desktop */}
        <div className="absolute -left-[54px] md:-left-[78px] bg-[#1A1A1A] text-[#F9F7F2] py-6 px-1 md:px-2 font-serif text-2xl md:text-[28px] font-bold tracking-widest z-10 hidden md:flex flex-col items-center gap-1.5 shadow-[6px_6px_0_0_#D1CEC7] border border-[#1A1A1A]">
          {String(year.year).split('').map((d, i) => <span key={i} className="leading-none">{d}</span>)}
        </div>
        {/* Mobile year fallback */}
        <div className="md:hidden font-bold text-[40px] mb-12 -ml-[45px] flex items-center gap-5 leading-none">
          <span className="w-3.5 h-3.5 border-2 border-[#1A1A1A] bg-[#F9F7F2] shrink-0 block relative top-0.5" />
          {year.year}
        </div>

        <div className="space-y-36">
          {year.months.map(month => (
            <div key={`${year.year}-${month.month}`} className="relative">
              {/* Month dot marker on the spine */}
              <div className="absolute -left-[40px] md:-left-[89px] w-3.5 h-3.5 md:w-[18px] md:h-[18px] bg-[#F9F7F2] border-[2.5px] border-[#1A1A1A] rounded-full mt-3 md:mt-4 z-10" />

              {/* Month header */}
              <h3 className="text-[44px] md:text-[56px] font-bold mb-10 flex items-baseline leading-none text-[#1A1A1A]">
                {String(month.month).padStart(2, '0')}
                <span className="text-[10px] md:text-xs font-mono tracking-[0.2em] text-[#8C7E6A] ml-5 md:ml-6 font-normal uppercase relative -top-1 md:-top-2">Month / Volume</span>
              </h3>

              {/* Card grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-0 border-t-[3px] border-[#1A1A1A] pt-8 lg:pt-10" style={{ gridAutoFlow: 'row dense' }}>
                {month.entries.map(item => renderCard(item, month.month))}
              </div>
            </div>
          ))}
        </div>
      </div>
    ))}
  </div>
)}
```

- [ ] **Step 2: 实现 renderCard 函数**

`renderCard` 接收 `ProcessedEntry` + `monthNumber`，根据 `item.layout` 返回对应 JSX。五种类型按照参考的精确 classNames：

**lead:**
```tsx
if (item.layout === 'lead') {
  const isActive = activeId === item.id;
  const textContent = item.excerpt;
  return (
    <button key={item.id} onClick={() => handleSelect(item)}
      className={`md:col-span-2 my-10 p-6 lg:p-10 relative group cursor-pointer transition-all duration-400 z-0 hover:z-10 flex flex-col text-left focus:outline-none ${
        isActive ? 'bg-white border-2 border-[#1A1A1A] shadow-[10px_10px_0px_0px_#1A1A1A] -translate-y-1' : 'bg-[#F9F7F2] border border-[#D1CEC7] hover:border-[#1A1A1A] hover:bg-white hover:shadow-[10px_10px_0px_0px_#1A1A1A] hover:-translate-y-1.5'
      }`}>
      <div className={`absolute top-[-2px] left-[-2px] right-[-2px] h-[4px] bg-[#1A1A1A] scale-x-0 transition-transform origin-left duration-500 ease-[cubic-bezier(0.19,1,0.22,1)] z-20 ${isActive ? 'scale-x-100' : 'group-hover:scale-x-100'}`} />
      <div className="flex w-full justify-between items-baseline mb-6 border-b border-[#E8E4DB] pb-3.5">
        <div className="flex items-baseline gap-2">
          <span className="font-mono text-[22px] leading-none font-bold text-[#8C7E6A] group-hover:text-[#1A1A1A] transition-colors">{item.dayStr}</span>
          <span className="font-mono text-[10px] text-[#8C7E6A] tracking-[0.15em] uppercase opacity-50 relative -top-px">/{item.year}</span>
        </div>
        <span className={`text-[9px] uppercase font-mono tracking-widest px-2 py-1 rounded-sm transition-colors ${isActive ? 'bg-[#1A1A1A] text-[#F9F7F2]' : 'bg-[#E8E4DB]/40 text-[#8C7E6A]/80 group-hover:text-[#1A1A1A]'}`}>Featured_Record</span>
      </div>
      <div className="flex-1">
        <h4 className="font-bold text-[26px] lg:text-[32px] group-hover:italic leading-snug mb-4">{item.title}</h4>
        {textContent && <p className="text-[#4A4A4A] group-hover:text-[#1A1A1A] transition-colors text-[15px] italic leading-[2.2] opacity-90 line-clamp-4">{textContent}</p>}
      </div>
    </button>
  );
}
```

**lead_text:**
```tsx
if (item.layout === 'lead_text') {
  const isActive = activeId === item.id;
  const textContent = item.excerpt;
  return (
    <button key={item.id} onClick={() => handleSelect(item)}
      className={`md:col-span-2 my-8 p-6 lg:p-8 lg:py-12 border-y-2 cursor-pointer text-left focus:outline-none transition-all duration-400 group flex flex-col md:flex-row md:items-start gap-6 ${
        isActive ? 'bg-[#1A1A1A] border-[#1A1A1A] text-[#F9F7F2] shadow-2xl scale-[1.01] z-20' : 'bg-[#E8E4DB]/30 border-[#1A1A1A] text-[#1A1A1A] hover:bg-[#1A1A1A] hover:text-[#F9F7F2]'
      }`}>
      <div className="w-16 shrink-0 flex flex-col pt-1">
        <span className={`font-mono text-4xl lg:text-5xl font-bold leading-none ${isActive ? 'text-[#F9F7F2]' : 'text-[#1A1A1A] group-hover:text-[#F9F7F2]'}`}>{item.dayStr}</span>
        <span className={`font-mono text-[10px] uppercase tracking-widest mt-3 ${isActive ? 'text-[#8C7E6A]' : 'text-[#8C7E6A] group-hover:text-[#D1CEC7]'}`}>Day</span>
      </div>
      <div className="flex-1 md:border-l md:pl-8 border-current border-opacity-20 flex flex-col lg:flex-row gap-6 lg:gap-12 w-full lg:items-center">
        <h4 className="font-bold text-[26px] lg:text-[36px] lg:w-5/12 leading-snug group-hover:italic">{item.title}</h4>
        {textContent && <p className={`flex-1 text-[16px] leading-[2] italic line-clamp-3 ${isActive ? 'text-[#D1CEC7]' : 'text-[#4A4A4A] group-hover:text-[#D1CEC7]'}`}>{textContent}</p>}
      </div>
    </button>
  );
}
```

**wide:**
```tsx
if (item.layout === 'wide') {
  const isActive = activeId === item.id;
  const textContent = item.excerpt;
  return (
    <button key={item.id} onClick={() => handleSelect(item)}
      className={`md:col-span-2 py-4 md:py-6 border-b border-[#D1CEC7] cursor-pointer text-left focus:outline-none transition-all flex flex-col md:flex-row md:items-baseline gap-2 md:gap-4 group ${
        isActive ? 'bg-[#1A1A1A] text-[#F9F7F2] px-4 -mx-4 shadow-lg scale-[1.01] z-20 rounded-sm' : 'hover:bg-[#E8E4DB]/50 px-2 -mx-2 hover:px-4 hover:-mx-4'
      }`}>
      <span className={`font-mono text-[15px] pt-1 md:pt-0 ${isActive ? 'text-[#8C7E6A]' : 'text-[#8C7E6A] group-hover:text-[#1A1A1A]'} w-6 shrink-0 font-bold transition-colors`}>{item.dayStr}</span>
      <span className={`font-bold text-[18px] whitespace-nowrap transition-all ${isActive ? 'italic' : 'group-hover:tracking-wide'}`}>{item.title}</span>
      <div className={`hidden md:block flex-1 border-b-[1.5px] border-dashed mb-1.5 opacity-40 transition-colors ${isActive ? 'border-[#8C7E6A]' : 'border-[#D1CEC7] group-hover:border-[#1A1A1A]'}`}></div>
      <span className={`text-[14px] truncate max-w-full md:max-w-sm lg:max-w-md xl:max-w-xl transition-colors ${isActive ? 'text-[#D1CEC7] italic' : 'text-[#8C7E6A] group-hover:text-[#1A1A1A]'}`}>{textContent}</span>
    </button>
  );
}
```

**quote:**
```tsx
if (item.layout === 'quote') {
  const isActive = activeId === item.id;
  const textContent = item.excerpt || item.title;
  return (
    <button key={item.id} onClick={() => handleSelect(item)}
      className={`md:col-span-2 my-8 px-10 py-10 border-l-[4px] cursor-pointer text-left focus:outline-none transition-all duration-400 group ${
        isActive ? 'bg-[#1A1A1A] border-[#8C7E6A] shadow-xl text-[#F9F7F2] scale-[1.01] z-20' : 'bg-[#E8E4DB]/20 border-[#D1CEC7] text-[#1A1A1A] hover:border-[#1A1A1A] hover:bg-[#E8E4DB]/50 hover:-translate-y-1'
      }`}>
      <div className={`font-serif text-[24px] md:text-[28px] italic leading-snug transition-all ${isActive ? '' : 'group-hover:tracking-wide'}`}>"{textContent}"</div>
      <div className="flex w-full items-center gap-4 mt-6">
        <div className={`w-8 h-[2px] transition-colors ${isActive ? 'bg-[#8C7E6A]' : 'bg-[#D1CEC7] group-hover:bg-[#1A1A1A]'}`}></div>
        <span className={`font-mono text-[10px] uppercase tracking-[0.2em] transition-colors ${isActive ? 'text-[#8C7E6A]' : 'text-[#8C7E6A] group-hover:text-[#1A1A1A]'}`}>Day {item.dayStr}</span>
      </div>
    </button>
  );
}
```

**standard (default):**
```tsx
const isActive = activeId === item.id;
const textContent = item.excerpt;
return (
  <button key={item.id} onClick={() => handleSelect(item)}
    className={`py-5 border-b border-[#D1CEC7] cursor-pointer text-left focus:outline-none transition-all duration-300 group shrink-0 relative ${
      isActive ? 'bg-[#1A1A1A] text-[#F9F7F2] px-5 -mx-5 shadow-2xl scale-[1.03] z-30 rounded-sm ring-1 ring-[#1A1A1A]/10' : 'hover:bg-[#E8E4DB]/40 px-3 -mx-3 md:px-4 md:-mx-4 z-0 hover:z-10'
    }`}>
    <div className={`absolute left-0 top-0 bottom-0 w-1 bg-[#8C7E6A] transition-transform origin-left duration-300 ${isActive ? 'scale-x-100' : 'scale-x-0'}`}></div>
    <div className="flex gap-4 md:gap-5 relative z-10 pl-1">
      <div className={`font-mono text-[15px] leading-none pt-[5px] w-6 shrink-0 transition-all ${isActive ? 'text-[#8C7E6A] font-bold' : 'text-[#8C7E6A] group-hover:text-[#1A1A1A] group-hover:font-bold'}`}>{item.dayStr}</div>
      <div className="flex-1 min-w-0 pr-2">
        <h4 className={`font-bold text-[18px] leading-snug mb-2 transition-all ${isActive ? 'tracking-wide italic text-[#F9F7F2]' : 'group-hover:tracking-wide text-[#1A1A1A]'}`}>{item.title}</h4>
        {textContent && (
          <p className={`text-[14px] leading-[1.8] line-clamp-3 transition-colors ${isActive ? 'text-[#D1CEC7] italic' : 'text-[#4A4A4A]'}`}>{textContent}</p>
        )}
      </div>
    </div>
  </button>
);
```

- [ ] **Step 5: 删除所有旧的辅助函数和子组件**

删除以下旧代码：
- `CardMetaFooter` 函数
- `formatShortDate` 函数
- `TimelineCard` 子组件
- `monthNames` 映射
- `LayoutType`、`ProcessedEntry`、`MonthGroup`、`YearGroup` 旧类型定义
- `parseEntryDate`、`getSearchText`、`createProcessedEntry`、`getLayoutType` 旧函数

- [ ] **Step 6: TypeScript 编译检查**

```bash
npx tsc --noEmit
```

- [ ] **Step 7: 构建验证**

```bash
npm run build
```

- [ ] **Step 8: 截图对比**

```bash
npx playwright screenshot "http://localhost:5678/" "screenshots/timeline-new.png" --viewport-size=1440,900
```

- [ ] **Step 9: 提交**

```bash
git add src/views/TimelinePage.tsx
git commit -m "feat: Timeline视觉重构——竖向标尺+年份黑块+串珠圆点+5种参考卡片+顶栏密封"
```

---

## 验证清单

- [ ] `npx tsc --noEmit` 零错误
- [ ] `npm run build` 构建成功
- [ ] Timeline 页面：竖向标尺线 + 年份黑块可见
- [ ] 滚动时顶栏不"漏风"（严丝合缝）
- [ ] 搜索过滤正常
- [ ] 点击卡片导航到 Reader
- [ ] activeId 选中态卡片高亮
- [ ] 五种卡片类型在 111 篇日记中各有出现
- [ ] 滚动条为泥褐色 6px 自定义样式
