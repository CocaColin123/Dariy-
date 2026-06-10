import { motion } from 'motion/react';

import type { DiaryEntry } from '../types/diary';

type View = 'welcome' | 'timeline' | 'reader' | 'editor' | 'entry' | 'export';

interface WelcomePageProps {
  entries: DiaryEntry[];
  onNavigate: (view: View, entry?: DiaryEntry) => void;
  onEntry: () => void;
}

export default function WelcomePage({ onNavigate, onEntry }: WelcomePageProps) {
  const currentYear = new Date().getFullYear();
  const indexDate = new Date().toLocaleDateString().replace(/\//g, '.');

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#F9F7F2] font-serif text-[#1A1A1A] selection:bg-[#1A1A1A] selection:text-white">
      <div className="pointer-events-none absolute inset-0 z-50 opacity-[0.07] mix-blend-multiply" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")` }} />

      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: 'easeOut' }}
        className="relative z-10 mx-auto flex max-w-[1400px] items-center justify-between px-8 pt-8 pb-5 border-b border-[#D1CEC7] mb-14"
      >
        <div className="flex items-center gap-4">
          <div className="flex h-10 w-10 items-center justify-center border border-[#1A1A1A] text-xs font-bold">
            DV
          </div>
          <div className="text-[10px] font-bold uppercase leading-tight tracking-[0.3em]">
            Diary
            <br />
            Vault
          </div>
        </div>
        <div className="flex-1 text-center">
          <span className="font-serif text-sm tracking-[0.3em] text-[#8C7E6A]">克林的日记本</span>
        </div>
        <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-neutral-500">
          Private Archive / Vol.{currentYear}
        </div>
      </motion.header>

      <main className="relative z-10 mx-auto grid max-w-[1400px] grid-cols-1 items-center gap-12 px-8 pb-16 lg:grid-cols-12 lg:items-start lg:pt-12">
        <section className="relative z-20 lg:col-span-7">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.8 }}
            className="mb-6 flex items-center gap-4"
          >
            <span className="h-px w-12 bg-[#1A1A1A]" />
            <span className="font-mono text-xs uppercase tracking-[0.4em]">Record No. {indexDate}</span>
          </motion.div>

          <div className="relative">
            <motion.h1
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 1, ease: [0.16, 1, 0.3, 1] }}
              className="relative z-10 text-[clamp(5rem,15vw,13rem)] font-bold leading-[0.8] tracking-[-0.06em]"
            >
              落笔
              <span className="block text-transparent [-webkit-text-stroke:1.5px_#1A1A1A]">
                之处
              </span>
            </motion.h1>
            <motion.div
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ delay: 0.8, duration: 1.2, ease: 'circOut' }}
              className="absolute bottom-[15%] left-0 z-0 h-24 w-full origin-left bg-[#E8DED0]"
            />
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.8 }}
            className="mt-10 max-w-xl border-l border-[#1A1A1A] pl-8"
          >
            <p className="mb-8 text-xl leading-relaxed text-neutral-700 md:text-2xl">
              为漫长岁月留下折痕。这里不追踪效率，只收纳那些值得被重新翻阅的日常切片。
            </p>

            <div className="flex flex-col gap-6 pt-12 border-t border-[#E8E4DB] max-w-md">
              <span className="text-[11px] font-mono tracking-widest text-[#8C7E6A]">ARCHIVE_INDEX</span>
              <button
                type="button"
                onClick={() => onNavigate('timeline')}
                className="group flex items-center text-[#1A1A1A] transition-all duration-300 cursor-pointer"
              >
                <span className="w-8 h-[1px] bg-[#D1CEC7] group-hover:bg-[#1A1A1A] group-hover:w-12 transition-all mr-4" />
                <span className="font-serif text-lg group-hover:tracking-wider transition-all">进入时间线</span>
              </button>
            </div>
          </motion.div>
        </section>

        <section className="relative hidden h-[580px] lg:col-span-5 lg:block group" style={{ perspective: '1200px' }}>
          {/* 底层 — 最远，深色，hover 外扩 */}
          <motion.div
            initial={{ opacity: 0, rotate: 8, x: 60 }}
            animate={{ opacity: 1, rotate: 5, x: 12 }}
            transition={{ delay: 0.4, duration: 1, ease: 'easeOut' }}
            className="absolute right-4 top-4 w-[360px] lg:w-[420px] aspect-[4/5] border border-[#1A1A1A]/10 bg-[#E8E0D4] shadow-xl transition-all duration-700 ease-out group-hover:rotate-[8deg] group-hover:translate-x-6 group-hover:shadow-2xl pointer-events-none"
          />

          {/* 中层 — 草稿纸，hover 反向微转 */}
          <motion.div
            initial={{ opacity: 0, rotate: -5, x: 30 }}
            animate={{ opacity: 1, rotate: -2, x: 4 }}
            transition={{ delay: 0.5, duration: 1, ease: 'easeOut' }}
            className="absolute right-2 top-2 w-[360px] lg:w-[420px] aspect-[4/5] border border-[#1A1A1A]/10 bg-[#F2EDE5] shadow-lg transition-all duration-700 ease-out group-hover:-rotate-[4deg] group-hover:-translate-x-2 group-hover:shadow-xl pointer-events-none"
          >
            <div className="absolute inset-8 border border-[#D1CEC7]/60" />
            <div className="absolute left-8 top-8 font-mono text-[10px] uppercase tracking-widest text-[#8C7E6A]/70">
              Draft / Memory
            </div>
          </motion.div>

          {/* 顶层 — 主纸，点击进入录入 */}
          <motion.button
            type="button"
            onClick={onEntry}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7, duration: 0.8 }}
            className="group absolute right-0 top-0 w-[360px] lg:w-[420px] aspect-[4/5] -rotate-1 bg-white border border-[#1A1A1A] p-10 text-left shadow-[16px_24px_64px_rgba(44,42,40,0.1)] transition-all duration-700 ease-out hover:scale-[1.02] hover:-translate-y-2 hover:shadow-[24px_36px_80px_rgba(44,42,40,0.16)] hover:rotate-0 cursor-pointer"
            style={{ transformStyle: 'preserve-3d' }}
          >
            <div className="flex h-full flex-col justify-between">
              <div>
                <div className="mb-12 flex justify-between border-b border-[#1A1A1A]/20 pb-4 font-mono text-[10px] uppercase tracking-widest text-[#8C7E6A]">
                  <span>Blank Page</span>
                  <span>01</span>
                </div>
                <h2 className="text-4xl lg:text-5xl font-bold leading-tight text-[#1A1A1A]">
                  今日
                  <br />
                  尚未
                  <br />
                  存档
                </h2>
              </div>
              <div className="space-y-4">
                <div className="h-2 w-24 bg-[#E8E4DB] transition-all duration-500 group-hover:w-36" />
                <div className="h-2 w-40 bg-[#E8E4DB] transition-all duration-500 delay-75 group-hover:w-52" />
                <div className="h-2 w-32 bg-[#E8E4DB] transition-all duration-500 delay-150 group-hover:w-44" />
              </div>
            </div>
          </motion.button>
        </section>
      </main>

      <div className="absolute bottom-8 left-8 font-mono text-[9px] uppercase tracking-[0.3em] text-neutral-400">
        Press to preserve the present tense
      </div>
    </div>
  );
}
