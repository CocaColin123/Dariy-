import { useEffect, useMemo, useRef, useState } from 'react';
import { Lock, Search } from 'lucide-react';
import type { DiaryEntry } from '../types/diary';
import { mapDiaryEntriesToTimeline } from '../utils/diaryAdapter';
import type { TimelineData } from '../utils/diaryAdapter';
import { decryptBody, isEncryptedBody } from '../utils/crypto';

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

interface ProcessedEntry extends TimelineData {
  year: number;
  month: number;
  day: number;
  dayStr: string;
  sourceEntry: DiaryEntry;
}

interface MonthGroup { month: number; entries: ProcessedEntry[]; }
interface YearGroup { year: number; months: MonthGroup[]; }

interface Props {
  entries: DiaryEntry[];
  onSelect: (entry: DiaryEntry) => void;
}

export default function TimelinePage({ entries, onSelect }: Props) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [lockPrompt, setLockPrompt] = useState<ProcessedEntry | null>(null);
  const [lockInput, setLockInput] = useState('');
  const [lockError, setLockError] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);
  const SCROLL_KEY = 'timeline-scroll';

  // Save scroll on every scroll event, restore on mount
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const saved = sessionStorage.getItem(SCROLL_KEY);
    if (saved) {
      requestAnimationFrame(() => { el.scrollTop = parseInt(saved, 10); });
    }
    const onScroll = () => { sessionStorage.setItem(SCROLL_KEY, String(el.scrollTop)); };
    el.addEventListener('scroll', onScroll, { passive: true });
    return () => el.removeEventListener('scroll', onScroll);
  }, []);

  const timelineData = useMemo(() => {
    const visual = mapDiaryEntriesToTimeline(entries);
    const searchLower = searchQuery.toLowerCase().trim();

    const processed: ProcessedEntry[] = visual
      .map((v, i) => {
        const src = entries[i];
        const date = parseDate(src.meta.date);
        return { ...v, year: date.year, month: date.month, day: date.day, dayStr: String(date.day || '--').padStart(2, '0'), sourceEntry: src };
      })
      .filter(e => {
        if (!searchLower) return true;
        const bodyText = isEncryptedBody(e.sourceEntry.body) ? '' : e.sourceEntry.body;
        const haystack = `${e.title} ${e.excerpt} ${bodyText} ${(e.tags || []).join(' ')}`.toLowerCase();
        return haystack.includes(searchLower);
      })
      .sort((a, b) => {
        const da = parseDate(a.date).sortKey;
        const db = parseDate(b.date).sortKey;
        return db - da;
      });

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
      for (const [month, mEntries] of [...monthMap.entries()].sort((a, b) => b[0] - a[0])) {
        months.push({ month, entries: mEntries });
      }
      years.push({ year, months });
    }
    return years;
  }, [entries, searchQuery]);

  const visibleCount = timelineData.reduce((t, y) => t + y.months.reduce((mt, m) => mt + m.entries.length, 0), 0);

  const handleSelect = (item: ProcessedEntry) => {
    setActiveId(item.id);
    if (item.sourceEntry.meta.locked || isEncryptedBody(item.sourceEntry.body)) {
      setLockPrompt(item);
      setLockInput('');
      setLockError('');
      return;
    }
    onSelect(item.sourceEntry);
  };

  const tryUnlock = async () => {
    if (!lockPrompt) return;
    const plain = await decryptBody(lockPrompt.sourceEntry.body, lockInput);
    if (plain) {
      setLockPrompt(null);
      onSelect({ ...lockPrompt.sourceEntry, body: plain });
    } else {
      setLockError('密码错误');
    }
  };

  const renderCard = (item: ProcessedEntry, monthNum: number) => {
    const isActive = activeId === item.id;
    const isLocked = item.sourceEntry.meta.locked || item.sourceEntry.body.startsWith('[LOCKED:');
    const textContent = isLocked ? '[LOCKED]' : item.excerpt;

    // --- lead ---
    if (item.layout === 'lead') {
      return (
        <button key={item.id} onClick={() => handleSelect(item)}
          className={`md:col-span-2 my-10 p-6 lg:p-10 relative group cursor-pointer transition-all duration-[400ms] z-0 hover:z-10 flex flex-col text-left focus:outline-none ${
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

    // --- lead_text ---
    if (item.layout === 'lead_text') {
      return (
        <button key={item.id} onClick={() => handleSelect(item)}
          className={`md:col-span-2 my-8 p-6 lg:p-8 lg:py-12 border-y-2 cursor-pointer text-left focus:outline-none transition-all duration-[400ms] group flex flex-col md:flex-row md:items-start gap-6 ${
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

    // --- wide ---
    if (item.layout === 'wide') {
      return (
        <button key={item.id} onClick={() => handleSelect(item)}
          className={`md:col-span-2 py-4 md:py-6 border-b border-[#D1CEC7] cursor-pointer text-left focus:outline-none transition-all flex flex-col md:flex-row md:items-baseline gap-2 md:gap-4 group ${
            isActive ? 'bg-[#1A1A1A] text-[#F9F7F2] px-4 -mx-4 shadow-[8px_8px_0_0_#1A1A1A] scale-[1.01] z-20 rounded-sm' : 'hover:bg-[#E8E4DB]/50 px-2 -mx-2 hover:px-4 hover:-mx-4 hover:shadow-[6px_6px_0_0_#1A1A1A]'
          }`}>
          <span className={`font-mono text-[15px] pt-1 md:pt-0 ${isActive ? 'text-[#8C7E6A]' : 'text-[#8C7E6A] group-hover:text-[#1A1A1A]'} w-6 shrink-0 font-bold transition-colors`}>{item.dayStr}</span>
          <span className={`font-bold text-[18px] whitespace-nowrap transition-all ${isActive ? 'italic' : 'group-hover:tracking-wide'}`}>{item.title}</span>
          <div className={`hidden md:block flex-1 border-b-[1.5px] border-dashed mb-1.5 opacity-40 transition-colors ${isActive ? 'border-[#8C7E6A]' : 'border-[#D1CEC7] group-hover:border-[#1A1A1A]'}`}></div>
          <span className={`text-[14px] truncate max-w-full md:max-w-sm lg:max-w-md xl:max-w-xl transition-colors ${isActive ? 'text-[#D1CEC7] italic' : 'text-[#8C7E6A] group-hover:text-[#1A1A1A]'}`}>{textContent}</span>
        </button>
      );
    }

    // --- quote ---
    if (item.layout === 'quote') {
      const quoteText = textContent || item.title;
      return (
        <button key={item.id} onClick={() => handleSelect(item)}
          className={`md:col-span-2 my-8 px-10 py-10 border-l-[4px] cursor-pointer text-left focus:outline-none transition-all duration-[400ms] group ${
            isActive ? 'bg-[#1A1A1A] border-[#8C7E6A] shadow-[8px_8px_0_0_#1A1A1A] text-[#F9F7F2] scale-[1.01] z-20' : 'bg-[#E8E4DB]/20 border-[#D1CEC7] text-[#1A1A1A] hover:border-[#1A1A1A] hover:bg-[#E8E4DB]/50 hover:shadow-[6px_6px_0_0_#1A1A1A] hover:-translate-y-1'
          }`}>
          <div className={`font-serif text-[24px] md:text-[28px] italic leading-snug transition-all ${isActive ? '' : 'group-hover:tracking-wide'}`}>"{quoteText}"</div>
          <div className="flex w-full items-center gap-4 mt-6">
            <div className={`w-8 h-[2px] transition-colors ${isActive ? 'bg-[#8C7E6A]' : 'bg-[#D1CEC7] group-hover:bg-[#1A1A1A]'}`}></div>
            <span className={`font-mono text-[10px] uppercase tracking-[0.2em] transition-colors ${isActive ? 'text-[#8C7E6A]' : 'text-[#8C7E6A] group-hover:text-[#1A1A1A]'}`}>Day {item.dayStr}</span>
          </div>
        </button>
      );
    }

    // --- photo_stack ---
    if (item.layout === 'photo_stack') {
      const stackImages = (item.images && item.images.length >= 2) ? item.images.slice(0, 4) : null;
      return (
        <button key={item.id} onClick={() => handleSelect(item)}
          className={`md:col-span-2 my-10 relative group cursor-pointer transition-all duration-[400ms] ease-out focus:outline-none ${isActive ? 'z-20' : 'z-0 hover:z-10'}`}>
          <div className="mb-4 flex items-baseline gap-2">
            <span className="font-mono text-[15px] font-bold text-[#8C7E6A]">{item.dayStr}</span>
            <h4 className="font-bold text-[18px] group-hover:italic">{item.title}</h4>
          </div>
          <div className="relative h-[280px] w-full mt-10">
            {stackImages ? (
              stackImages.map((img, i) => (
                <div key={i} className="absolute inset-x-4 top-0 bottom-8 bg-[#F9F7F2] shadow-sm transition-all duration-500 ease-out origin-bottom"
                  style={{
                    zIndex: i,
                    transform: `rotate(${i === 0 ? '-6deg' : i === 1 ? '4deg' : '-2deg'})`,
                    backgroundImage: `url(http://localhost:5678/data/${img})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                  }} />
              ))
            ) : (
              Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="absolute inset-x-4 top-0 bottom-8 bg-[#F9F7F2] p-2 pb-6 shadow-sm transition-all duration-500 ease-out origin-bottom flex items-center justify-center"
                  style={{
                    zIndex: i,
                    transform: `rotate(${i === 0 ? '-6deg' : i === 1 ? '4deg' : '-2deg'})`,
                  }}>
                  <span className="font-mono text-[9px] text-[#8C7E6A]/50">IMG {i + 1}</span>
                </div>
              ))
            )}
          </div>
          {isActive && <div className="absolute inset-0 shadow-[8px_8px_0_0_#1A1A1A] pointer-events-none" />}
        </button>
      );
    }

    // --- poster / poster_square / poster_circle ---
    if (item.layout === 'poster' || item.layout === 'poster_square' || item.layout === 'poster_circle') {
      const isCircle = item.layout === 'poster_circle';
      const isSquare = item.layout === 'poster_square';
      const aspectClass = isSquare ? 'aspect-[1/1]' : 'aspect-[3/4]';
      const sizeClass = isCircle ? 'w-[200px] mx-auto' : isSquare ? 'max-w-[280px]' : '';
      const label = isCircle ? 'Circle' : isSquare ? 'Square' : 'Portrait';

      return (
        <button key={item.id} onClick={() => handleSelect(item)}
          className={`col-span-1 my-6 relative group cursor-pointer transition-all duration-[400ms] ease-out focus:outline-none flex flex-col items-center ${sizeClass} ${
            isCircle
              ? (isActive ? 'z-20' : 'z-0 hover:z-10')
              : (isActive ? 'shadow-[8px_8px_0_0_#1A1A1A] scale-[1.01] z-20' : 'hover:shadow-[6px_6px_0_0_#1A1A1A] hover:-translate-y-1')
          }`}>
          <div className={`relative w-full overflow-hidden ${isCircle ? 'aspect-[1/1] rounded-full' : aspectClass} border transition-colors ${
            isCircle
              ? (isActive ? 'border-[#1A1A1A] ring-2 ring-[#1A1A1A]/10' : 'border-[#D1CEC7] group-hover:border-[#1A1A1A]')
              : 'border-[#D1CEC7] bg-white group-hover:border-[#1A1A1A]'
          }`}>
            {item.coverImage ? (
              isCircle ? (
                <img src={`http://localhost:5678/data/${item.coverImage}`} alt="" className="absolute inset-0 w-full h-full object-cover sepia-[0.15] group-hover:sepia-0 group-hover:scale-105 transition-all duration-700" />
              ) : (
                <>
                  <img src={`http://localhost:5678/data/${item.coverImage}`} alt="" className="absolute inset-0 w-full h-full object-cover sepia-[0.15] group-hover:sepia-0 group-hover:scale-105 transition-all duration-700" />
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-[#1A1A1A]/70 to-transparent p-5 pt-10">
                    <h4 className="font-bold text-[18px] text-white leading-snug">{item.title}</h4>
                    <span className="font-mono text-[10px] text-[#D1CEC7] uppercase tracking-widest mt-1 block">{label} · Day {item.dayStr}</span>
                  </div>
                </>
              )
            ) : (
              <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center bg-white">
                <span className="font-mono text-[9px] uppercase tracking-[0.3em] text-[#8C7E6A] mb-3">{label}</span>
                <h4 className="font-bold text-[18px] leading-snug text-[#1A1A1A] group-hover:italic">{item.title}</h4>
                <div className="flex items-center gap-2 mt-4">
                  <div className="w-6 h-[1px] bg-[#D1CEC7] group-hover:bg-[#1A1A1A] transition-colors" />
                  <span className="font-mono text-[10px] text-[#8C7E6A] uppercase tracking-widest">Day {item.dayStr}</span>
                  <div className="w-6 h-[1px] bg-[#D1CEC7] group-hover:bg-[#1A1A1A] transition-colors" />
                </div>
              </div>
            )}
          </div>
        </button>
      );
    }

    // --- editorial (new) ---
    if (item.layout === 'editorial') {
      return (
        <button key={item.id} onClick={() => handleSelect(item)}
          className={`md:col-span-2 my-10 flex flex-col md:flex-row gap-0 cursor-pointer text-left focus:outline-none transition-all duration-[400ms] ease-out group ${
            isActive ? 'shadow-[8px_8px_0_0_#1A1A1A] scale-[1.01] z-20' : 'hover:shadow-[6px_6px_0_0_#1A1A1A] hover:-translate-y-1'
          }`}>
          <div className={`flex-1 p-10 lg:p-14 flex flex-col justify-center border border-[#D1CEC7] group-hover:border-[#1A1A1A] transition-colors ${
            isActive ? 'bg-[#1A1A1A] text-[#F9F7F2] border-[#1A1A1A]' : 'bg-white'
          }`}>
            <span className={`font-mono text-[10px] uppercase tracking-widest mb-4 ${isActive ? 'text-[#8C7E6A]' : 'text-[#8C7E6A]'}`}>Editorial / Day {item.dayStr}</span>
            <h4 className="font-bold text-[28px] lg:text-[36px] leading-snug group-hover:italic mb-6">{item.title}</h4>
            {item.excerpt && (
              <p className={`text-[15px] leading-[2] line-clamp-4 ${isActive ? 'text-[#D1CEC7]' : 'text-[#4A4A4A]'}`}>{item.excerpt}</p>
            )}
          </div>
          <div className="w-full md:w-[45%] aspect-[4/3] md:aspect-auto relative overflow-hidden border border-l-0 border-[#D1CEC7] group-hover:border-[#1A1A1A] transition-colors bg-[#E8E4DB]">
            {item.coverImage ? (
              <img src={`http://localhost:5678/data/${item.coverImage}`} className="w-full h-full object-cover sepia-[0.15] group-hover:sepia-0 group-hover:scale-105 transition-all duration-700" />
            ) : (
              <div className="flex items-center justify-center h-full text-[#8C7E6A] font-mono text-[10px] uppercase tracking-widest">Figure</div>
            )}
          </div>
        </button>
      );
    }

    // --- standard (default) ---
    return (
      <button key={item.id} onClick={() => handleSelect(item)}
        className={`py-5 border-b border-[#D1CEC7] cursor-pointer text-left focus:outline-none transition-all duration-300 group shrink-0 relative ${
          isActive ? 'bg-[#1A1A1A] text-[#F9F7F2] px-5 -mx-5 shadow-[8px_8px_0_0_#1A1A1A] scale-[1.03] z-30 rounded-sm ring-1 ring-[#1A1A1A]/10' : 'hover:bg-[#E8E4DB]/40 px-3 -mx-3 md:px-4 md:-mx-4 z-0 hover:z-10 hover:shadow-[6px_6px_0_0_#1A1A1A]'
        }`}>
        <div className={`absolute left-0 top-0 bottom-0 w-1 bg-[#8C7E6A] transition-transform origin-left duration-300 ${isActive ? 'scale-x-100' : 'scale-x-0'}`}></div>
        <div className="flex gap-4 md:gap-5 relative z-10 pl-1">
          <div className={`font-mono text-[15px] leading-none pt-[5px] w-6 shrink-0 transition-all ${isActive ? 'text-[#8C7E6A] font-bold' : 'text-[#8C7E6A] group-hover:text-[#1A1A1A] group-hover:font-bold'}`}>{item.dayStr}</div>
          <div className="flex-1 min-w-0 pr-2">
            <h4 className={`font-bold text-[18px] leading-snug mb-2 transition-all flex items-center gap-2 ${isActive ? 'tracking-wide italic text-[#F9F7F2]' : 'group-hover:tracking-wide text-[#1A1A1A]'}`}>{item.sourceEntry.meta.locked && <Lock className={`h-3.5 w-3.5 shrink-0 ${isActive ? 'text-[#D1CEC7]' : 'text-[#8C7E6A]/60'}`} />}{item.title}</h4>
            {textContent && (
              <p className={`text-[14px] leading-[1.8] line-clamp-3 transition-colors ${isActive ? 'text-[#D1CEC7] italic' : 'text-[#4A4A4A]'}`}>{textContent}</p>
            )}
          </div>
        </div>
      </button>
    );
  };

  return (
    <div className="relative h-full w-full flex flex-col font-serif bg-[#F9F7F2] text-[#1A1A1A] overflow-hidden">
      <div className="absolute inset-0 pointer-events-none opacity-[0.15] z-0" style={{ backgroundImage: 'linear-gradient(#D1CEC7 1px, transparent 1px), linear-gradient(90deg, #D1CEC7 1px, transparent 1px)', backgroundSize: '100px 100px' }} />

      <header className="flex-none px-8 lg:px-12 py-6 flex flex-col md:flex-row items-start md:items-center justify-between border-b border-[#D1CEC7] z-30 relative bg-[#F9F7F2]/95 backdrop-blur-sm shadow-sm gap-4">
        <div>
          <div className="font-mono text-[10px] tracking-[0.2em] text-[#8C7E6A] uppercase leading-relaxed">CHRONOLOGICAL ARCHIVE</div>
          <div className="text-[#1A1A1A] font-bold text-sm">ENTRIES: {visibleCount}</div>
        </div>
        <div className="relative group w-full md:w-64">
          <Search className="w-4 h-4 text-[#8C7E6A] absolute left-0 top-1 group-hover:text-[#1A1A1A] transition-colors" />
          <input type="text" placeholder="检索档案..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
            className="w-full bg-transparent border-b border-[#D1CEC7] pb-1.5 pl-7 pr-2 text-sm font-serif outline-none placeholder:text-[#8C7E6A]/50 group-hover:border-[#1A1A1A] focus:border-[#1A1A1A] transition-colors" />
        </div>
      </header>

      <div ref={scrollRef} className="flex-1 overflow-y-auto z-10 relative scroll-smooth p-6 pb-0 lg:p-12 lg:pb-0 [&::-webkit-scrollbar]:w-[6px] [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-[#8C7E6A]/20 [&::-webkit-scrollbar-thumb]:rounded-[10px] hover:[&::-webkit-scrollbar-thumb]:bg-[#8C7E6A]/40">
        <div className="max-w-[1240px] mx-auto pb-48">
          {timelineData.length === 0 ? (
            <div className="flex min-h-[40vh] flex-col items-center justify-center border border-dashed border-[#1A1A1A]/30 text-center">
              <h2 className="text-2xl font-bold mb-2">没有匹配的档案</h2>
            </div>
          ) : (
            <div className="border-l-[2px] border-[#1A1A1A] ml-6 md:ml-16 pl-8 md:pl-20 relative">
              {timelineData.map((year, yearIdx) => (
                <div key={year.year} className={`${yearIdx > 0 ? 'mt-48' : ''}`}>
                  <div className="absolute -left-[54px] md:-left-[78px] bg-[#1A1A1A] text-[#F9F7F2] py-6 px-1 md:px-2 font-serif text-2xl md:text-[28px] font-bold tracking-widest z-10 hidden md:flex flex-col items-center gap-1.5 shadow-[6px_6px_0_0_#D1CEC7] border border-[#1A1A1A]">
                    {String(year.year).split('').map((d, i) => <span key={i} className="leading-none">{d}</span>)}
                  </div>
                  <div className="md:hidden font-bold text-[40px] mb-12 -ml-[45px] flex items-center gap-5 leading-none">
                    <span className="w-3.5 h-3.5 border-2 border-[#1A1A1A] bg-[#F9F7F2] shrink-0 block relative top-0.5" />
                    {year.year}
                  </div>

                  <div className="space-y-36">
                    {year.months.map(month => (
                      <div key={`${year.year}-${month.month}`} className="relative">
                        <div className="absolute -left-[40px] md:-left-[89px] w-3.5 h-3.5 md:w-[18px] md:h-[18px] bg-[#F9F7F2] border-[2.5px] border-[#1A1A1A] rounded-full mt-3 md:mt-4 z-10" />
                        <h3 className="text-[44px] md:text-[56px] font-bold mb-10 flex items-baseline leading-none text-[#1A1A1A]">
                          {String(month.month).padStart(2, '0')}
                          <span className="text-[10px] md:text-xs font-mono tracking-[0.2em] text-[#8C7E6A] ml-5 md:ml-6 font-normal uppercase relative -top-1 md:-top-2">Month / Volume</span>
                        </h3>
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
        </div>
      </div>

      {lockPrompt && (
        <div className="fixed inset-0 z-[210] flex items-center justify-center bg-[#1A1A1A]/50 backdrop-blur-sm" onClick={() => setLockPrompt(null)}>
          <div className="w-full max-w-sm rounded-sm border border-[#D1CEC7] bg-[#F9F7F2] p-6 shadow-[0_28px_90px_rgba(44,42,40,0.22)]" onClick={e => e.stopPropagation()}>
            <div className="flex items-center gap-2 mb-4">
              <Lock className="w-4 h-4 text-[#1A1A1A]" />
              <h2 className="font-serif text-lg font-bold text-[#1A1A1A]">{lockPrompt.title}</h2>
            </div>
            <p className="text-sm text-[#8C7E6A] mb-4">此日记已上锁，请输入密码。</p>
            <input type="password" value={lockInput} onChange={e => { setLockInput(e.target.value); setLockError(''); }}
              onKeyDown={e => { if (e.key === 'Enter') tryUnlock(); }}
              autoFocus autoComplete="off"
              className="w-full h-10 border border-[#D1CEC7] bg-white px-3 py-2 font-mono text-sm text-[#1A1A1A] outline-none focus:border-[#1A1A1A] mb-3"
              placeholder="输入密码" />
            {lockError && <p className="text-xs text-[#902A2A] mb-3">{lockError}</p>}
            <div className="flex justify-end gap-2">
              <button onClick={() => setLockPrompt(null)} className="px-4 py-1.5 border border-[#D1CEC7] font-mono text-[10px] uppercase tracking-widest text-[#8C7E6A] hover:border-[#1A1A1A] hover:text-[#1A1A1A] cursor-pointer">取消</button>
              <button onClick={tryUnlock} className="px-4 py-1.5 border border-[#1A1A1A] bg-[#1A1A1A] font-mono text-[10px] uppercase tracking-widest text-[#F9F7F2] hover:bg-[#242321] cursor-pointer">确定</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
