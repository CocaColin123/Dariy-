import { useCallback, useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Loader2, Server } from 'lucide-react';
import type { DiaryConfig, DiaryEntry } from './types/diary';
import { api } from './utils/api';
import { encryptBody, isEncryptedBody } from './utils/crypto';
// isEncryptedBody used in toggleDiaryLock
import Sidebar from './panels/Sidebar';
import ApiSettingsPanel from './panels/ApiSettingsPanel';
import AiChatPanel from './panels/AiChatPanel';
import WelcomePage from './views/WelcomePage';
import TimelinePage from './views/TimelinePage';
import ReaderPage from './views/ReaderPage';
import EditorPage from './views/EditorPage';
import EntryWindow from './views/EntryWindow';
import ExportPage from './views/ExportPage';
import TestPage from './views/TestPage';

type View = 'welcome' | 'timeline' | 'reader' | 'editor' | 'entry' | 'export' | 'test';
type Panel = 'none' | 'api' | 'chat';

export default function App() {
  const [view, setView] = useState<View>('welcome');
  const [panel, setPanel] = useState<Panel>('none');
  const [config, setConfig] = useState<DiaryConfig | null>(null);
  const [entries, setEntries] = useState<DiaryEntry[]>([]);
  const [selected, setSelected] = useState<DiaryEntry | null>(null);
  const [ready, setReady] = useState(false);
  const [initError, setInitError] = useState('');

  const init = useCallback(async () => {
    try {
      setInitError('');
      const cfg = await api.readConfig();
      setConfig(cfg);
      const ents = await api.scanDiaries();
      setEntries(ents);
      if (window.location.search.includes('test')) { setReady(true); setView('test'); return; }
      setReady(true);
    } catch (error) {
      console.error('Init failed:', error);
      setInitError(error instanceof Error ? error.message : '无法连接本地服务');
      setTimeout(() => init(), 2000);
    }
  }, []);

  useEffect(() => { init(); }, [init]);

  const navigate = (nextView: View, entry?: DiaryEntry) => {
    if (entry) setSelected(entry);
    setView(nextView);
  };

  const refresh = async () => {
    const ents = await api.scanDiaries();
    setEntries(ents);
  };

  const toggleDiaryLock = async (entry: DiaryEntry) => {
    const alreadyLocked = entry.meta.locked || isEncryptedBody(entry.body);
    if (alreadyLocked) {
      const meta = { ...entry.meta, locked: false };
      await api.writeDiary(entry.filePath.replace(/\\/g, '/').replace(/^.*\/data\//, ''), meta, entry.body);
      await refresh();
    } else {
      const encrypted = await encryptBody(entry.body);
      const meta = { ...entry.meta, locked: true };
      const relPath = entry.filePath.replace(/\\/g, '/').replace(/^.*\/data\//, '');
      await api.writeDiary(relPath, meta, encrypted);
      await refresh();
    }
  };

  if (!ready) {
    return (
      <div className="app-surface flex h-screen items-center justify-center px-6">
        <div className="surface-panel-strong w-full max-w-md p-7 text-center">
          <div className="mx-auto mb-5 flex h-12 w-12 items-center justify-center rounded bg-[var(--dv-accent-soft)] text-[var(--dv-accent)]">
            {initError ? <Server className="h-5 w-5" /> : <Loader2 className="h-5 w-5 animate-spin" />}
          </div>
          <h1 className="font-serif text-2xl text-white/86">日记库</h1>
          <p className="mt-3 text-sm leading-6 text-white/46">
            {initError ? '正在重新连接本地归档服务。' : '正在连接本地归档服务。'}
          </p>
          {initError && <p className="mt-3 break-all rounded bg-white/[0.035] px-3 py-2 text-xs text-white/34">{initError}</p>}
        </div>
      </div>
    );
  }

  return (
    <div className="app-surface flex h-screen overflow-hidden border-t-0 md:border-t-[12px] border-[#8C7E6A]">
      {view !== 'entry' && (
        <Sidebar
          view={view}
          onNavigate={nextView => { setSelected(null); setView(nextView); }}
          onOpenPanel={nextPanel => setPanel(panel === nextPanel ? 'none' : nextPanel)}
        />
      )}

      <main className="min-w-0 flex-1 overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.div
            key={view}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
            className="h-full"
          >
            {view === 'welcome' && (
              <WelcomePage entries={entries} onNavigate={navigate} onEntry={() => setView('entry')} />
            )}
            {view === 'timeline' && (
              <TimelinePage entries={entries} onSelect={entry => navigate('reader', entry)} />
            )}
            {view === 'reader' && selected && (
              <ReaderPage
                entry={selected}
                config={config!}
                onEdit={entry => navigate('editor', entry)}
                onRefresh={async () => {
                  const ents = await api.scanDiaries();
                  setEntries(ents);
                  const updated = ents.find(e => e.filePath === selected.filePath);
                  if (updated) setSelected(updated);
                }}
                onToggleLock={async (entry) => { await toggleDiaryLock(entry); await refresh(); }}
                onDelete={async entry => {
                  await api.deleteDiary(entry.filePath);
                  await refresh();
                  setView('timeline');
                }}
                onBack={() => setView('timeline')}
              />
            )}
            {view === 'editor' && selected && (
              <EditorPage
                entry={selected}
                config={config!}
                onConfigChange={nextConfig => setConfig(nextConfig)}
                onSaved={async () => {
                  const [nextConfig, ents] = await Promise.all([api.readConfig(), api.scanDiaries()]);
                  setConfig(nextConfig);
                  setEntries(ents);
                  const updated = ents.find(entry => entry.filePath === selected.filePath);
                  if (updated) setSelected(updated);
                  setView('reader');
                }}
                onRefresh={async () => {
                  const [nextConfig, ents] = await Promise.all([api.readConfig(), api.scanDiaries()]);
                  setConfig(nextConfig);
                  setEntries(ents);
                  const updated = ents.find(entry => entry.filePath === selected.filePath);
                  if (updated) setSelected(updated);
                }}
                onDelete={async () => {
                  await api.deleteDiary(selected.filePath);
                  await refresh();
                  setView('timeline');
                }}
                onBack={() => setView('reader')}
              />
            )}
            {view === 'entry' && (
              <EntryWindow config={config!} onDone={() => { refresh(); setView('welcome'); }} onCancel={() => setView('welcome')} />
            )}
            {view === 'export' && <ExportPage entries={entries} onBack={() => setView('timeline')} />}
            {view === 'test' && <TestPage />}
          </motion.div>
        </AnimatePresence>
      </main>

      {panel === 'api' && config && (
        <ApiSettingsPanel config={config} onUpdate={setConfig} onClose={() => setPanel('none')} />
      )}
      {panel === 'chat' && config && (
        <AiChatPanel config={config} entries={entries} onClose={() => setPanel('none')} />
      )}
    </div>
  );
}
