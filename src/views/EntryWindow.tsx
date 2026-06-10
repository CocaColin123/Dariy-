import { useEffect, useRef, useState } from 'react';
import { ArrowLeft, Check, Fingerprint, Loader2, MessageCircle, Sparkles, X as XIcon } from 'lucide-react';
import type { DiaryConfig } from '../types/diary';
import { api } from '../utils/api';
import MetaFields, { type EntryData } from '../components/MetaFields';

interface Props {
  config: DiaryConfig;
  onDone: () => void;
  onCancel: () => void;
}

type ChatMessage = { role: string; content: string };

export default function EntryWindow({ config, onDone, onCancel }: Props) {
  const [text, setText] = useState('');
  const [entry, setEntry] = useState<EntryData>({
    date: new Date().toISOString().slice(0, 10),
    title: '',
    location: '',
    tags: [],
    body: '',
    preset: config.defaultPreset,
  });
  const [saving, setSaving] = useState(false);
  const [archiveError, setArchiveError] = useState('');
  const [selectedPreset, setSelectedPreset] = useState(config.defaultPreset);
  const [showChat, setShowChat] = useState(false);
  const [chatMsg, setChatMsg] = useState('');
  const [chatMsgs, setChatMsgs] = useState<ChatMessage[]>([]);
  const [chatBusy, setChatBusy] = useState(false);
  const textRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => { textRef.current?.focus(); }, []);

  // Sync entry when text changes — auto-fill body + title suggestion
  useEffect(() => {
    if (!text.trim()) return;
    setEntry(prev => ({
      ...prev,
      body: text.trim(),
      title: prev.title || text.trim().slice(0, 15),
    }));
  }, [text]);

  const confirmEntry = async () => {
    if (!entry.body.trim()) return;
    setSaving(true);
    const date = entry.date || new Date().toISOString().slice(0, 10);
    const slug = entry.title || date;
    const meta: Record<string, any> = { date, title: entry.title || date };
    if (entry.location) meta.location = entry.location;
    if (entry.tags.length > 0) meta.tags = entry.tags;
    if (entry.preset && entry.preset !== config.defaultPreset) meta.preset = entry.preset;
    try {
      await api.writeDiary(`${date.slice(0, 4)}/${date.slice(5, 7)}/${date}-${slug}.md`, meta, entry.body);
      setText('');
      setEntry({ date: new Date().toISOString().slice(0, 10), title: '', location: '', tags: [], body: '', preset: config.defaultPreset });
      onDone();
    } catch (err) {
      setArchiveError(`归档失败：${err instanceof Error ? err.message : 'unknown'}`);
    } finally {
      setSaving(false);
    }
  };

  const autoAnalyze = async (raw: string) => {
    if (!raw.trim() || !config.api.apiKey) return;
    setShowChat(true);
    setChatBusy(true);
    setChatMsgs([{ role: 'assistant', content: '正在分析你的日记...' }]);
    try {
      const [titleResult, tagResult] = await Promise.allSettled([
        api.deepseekCall({
          apiKey: config.api.apiKey, baseUrl: config.api.baseUrl, model: config.api.model,
          prompt: 'Generate a poetic, meaningful title for this Chinese diary entry. 8-20 chars. Return JSON: {"title":"..."}',
          text: raw.slice(0, 1500),
        }),
        api.deepseekCall({
          apiKey: config.api.apiKey, baseUrl: config.api.baseUrl, model: config.api.model,
          prompt: 'Analyze this Chinese diary. Extract location if mentioned, 2-4 keyword tags, and a 2-3 sentence summary. Return JSON: {"location":"...","tags":["..."],"summary":"..."}',
          text: raw.slice(0, 2000),
        }),
      ]);
      const msgs: ChatMessage[] = [];
      if (titleResult.status === 'fulfilled' && titleResult.value) {
        try {
          const data = JSON.parse((titleResult.value.choices?.[0]?.message?.content || '{}').replace(/```json\n?|\n?```/g, '').trim());
          const aiTitle = data.title || '';
          if (aiTitle) { msgs.push({ role: 'assistant', content: `建议标题：${aiTitle}` }); setEntry(prev => ({ ...prev, title: aiTitle })); }
        } catch { msgs.push({ role: 'assistant', content: '标题生成完成' }); }
      }
      if (tagResult.status === 'fulfilled' && tagResult.value) {
        try {
          const data = JSON.parse((tagResult.value.choices?.[0]?.message?.content || '{}').replace(/```json\n?|\n?```/g, '').trim());
          const aiTags: string[] = data.tags || [];
          const aiLocation = data.location || '';
          const aiSummary = data.summary || '';
          if (aiTags.length > 0) setEntry(prev => ({ ...prev, tags: aiTags }));
          if (aiLocation) setEntry(prev => ({ ...prev, location: aiLocation }));
          msgs.push({ role: 'assistant', content: `摘要：${aiSummary || '无法生成'}\n标签：${aiTags.join('，') || '无'}\n地点：${aiLocation || '未识别'}` });
        } catch { msgs.push({ role: 'assistant', content: '内容分析完成' }); }
      }
      setChatMsgs(msgs);
    } catch { setChatMsgs([{ role: 'assistant', content: '分析失败，请重试' }]); }
    setChatBusy(false);
  };

  const askAi = async () => {
    const q = chatMsg.trim();
    if (!q || chatBusy || !config.api.apiKey) return;
    setChatMsg('');
    setChatBusy(true);
    const updated = [...chatMsgs, { role: 'user', content: q }];
    setChatMsgs(updated);
    try {
      const result = await api.deepseekChat({
        apiKey: config.api.apiKey,
        baseUrl: config.api.baseUrl,
        model: config.api.model,
        messages: [
          { role: 'system', content: `日记录入助手。当前日记原文：\n\n${text.slice(0, 3000)}` },
          ...updated.map(message => ({ role: message.role as any, content: message.content })),
        ],
      });
      setChatMsgs([...updated, { role: 'assistant', content: result.choices?.[0]?.message?.content || '无响应' }]);
    } catch (err: any) {
      setChatMsgs([...updated, { role: 'assistant', content: '失败：' + (err?.message || err) }]);
    }
    setChatBusy(false);
  };

  return (
    <div className="h-full flex flex-col font-serif bg-[#F9F7F2] text-[#1A1A1A]">
      <header className="shrink-0 px-6 md:px-10 py-3 flex items-center justify-between border-b border-[#D1CEC7] bg-white">
        <button onClick={onCancel} className="flex items-center gap-2 text-[#8C7E6A] hover:text-[#1A1A1A] transition-colors font-mono text-[11px] uppercase tracking-widest cursor-pointer">
          <ArrowLeft className="w-4 h-4" /> 返回
        </button>
        <div className="flex flex-col items-center">
          <span className="font-mono text-[10px] text-[#8C7E6A] uppercase tracking-widest shadow-sm px-2 text-[#1A1A1A] bg-[#F9F7F2]">New Entry</span>
          <h1 className="font-bold text-lg tracking-widest">录入日记</h1>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={selectedPreset}
            onChange={e => { setSelectedPreset(e.target.value); setEntry(prev => ({ ...prev, preset: e.target.value })); }}
            className="h-9 min-h-0 border border-[#D1CEC7] bg-white py-0.5 pl-2 pr-7 font-mono text-[11px] text-[#1A1A1A] outline-none focus:border-[#1A1A1A]"
          >
            {config.presets.map(preset => <option key={preset.name} value={preset.name}>{preset.name}</option>)}
          </select>
          <button
            type="button"
            onClick={() => setShowChat(!showChat)}
            className={`flex items-center gap-1.5 px-3 py-1.5 border text-[10px] font-mono uppercase tracking-wider transition-colors cursor-pointer rounded-sm ${
              showChat
                ? 'border-[#1A1A1A] bg-white text-[#1A1A1A]'
                : 'border-[#D1CEC7] text-[#8C7E6A] hover:border-[#1A1A1A] hover:text-[#1A1A1A]'
            }`}
          >
            <MessageCircle className="w-3.5 h-3.5" />
            AI 助手
          </button>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        {/* Left: Paste Desk */}
        <div className={`flex-1 p-4 md:p-8 flex justify-center bg-[#E8E4DB]/20 relative overflow-hidden transition-all duration-500 ${showChat ? '' : ''}`}>


          <div className="w-full max-w-[720px] border border-[#D1CEC7] bg-[#F9F7F2] relative flex flex-col shadow-[12px_12px_0_0_rgba(140,126,106,0.1)] rounded-sm">
            {/* Paper header */}
            <div className="px-6 py-5 border-b border-[#E8E4DB] flex justify-between items-end relative overflow-hidden bg-white shrink-0">
              <div className="absolute inset-0 pointer-events-none opacity-[0.03]" style={{ backgroundImage: 'linear-gradient(#1A1A1A 1px, transparent 1px), linear-gradient(90deg, #1A1A1A 1px, transparent 1px)', backgroundSize: '12px 12px' }} />
              <div className="relative z-10">
                <div className="font-mono text-[10px] text-[#8C7E6A] tracking-[0.3em] uppercase mb-1 flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-[#1A1A1A] rounded-full" />
                  Paste Desk
                </div>
                <h2 className="text-2xl font-bold tracking-wider">把今天放进纸页里</h2>
              </div>
              <div className="relative z-10 hidden md:block">
                <Fingerprint className="w-8 h-8 text-[#8C7E6A] opacity-20" strokeWidth={1} />
              </div>
            </div>

            {/* Paper body: textarea + meta form */}
            <div className="flex-1 p-6 relative flex flex-col min-h-0 overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
              <div className="absolute inset-6 border border-dashed border-[#8C7E6A]/30 pointer-events-none bg-[#FAFAFA]/40" />
              <div className="absolute top-6 left-6 w-3 h-3 border-t-2 border-l-2 border-[#1A1A1A] pointer-events-none" />
              <div className="absolute top-6 right-6 w-3 h-3 border-t-2 border-r-2 border-[#1A1A1A] pointer-events-none" />
              <div className="absolute bottom-6 left-6 w-3 h-3 border-b-2 border-l-2 border-[#1A1A1A] pointer-events-none" />
              <div className="absolute bottom-6 right-6 w-3 h-3 border-b-2 border-r-2 border-[#1A1A1A] pointer-events-none" />

              <textarea
                ref={textRef}
                value={text}
                onChange={e => setText(e.target.value)}
                onPaste={() => setTimeout(() => { const val = textRef.current?.value || ''; if (val.trim()) void autoAnalyze(val); }, 100)}
                className="w-full bg-transparent resize-none outline-none p-3 text-base leading-[2.2] tracking-wide text-[#2C2C2C] z-10 relative font-serif selection:bg-[#1A1A1A] selection:text-[#F9F7F2]"
                style={{ fontFamily: '"Noto Serif SC", "Apple Color Emoji", "Segoe UI Emoji", serif', height: showChat ? '140px' : '200px' }}
                placeholder="在此粘贴或输入日记原文..."
                spellCheck={false}
                autoComplete="off"
                autoCorrect="off"
              />

              {text.trim() && (
                <div className="relative z-10 mt-4">
                  <div className="border border-[#D1CEC7] bg-[#FCFBF7] p-4 shadow-[0_12px_40px_rgba(0,0,0,0.04)]">
                    <div className="mb-3 flex items-center justify-between border-b border-[#E8E4DB] pb-2">
                      <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-[#8C7E6A]">Ready To Archive</p>
                      <span className="font-mono text-[11px] text-[#8C7E6A]">{entry.date}</span>
                    </div>
                    <MetaFields entry={entry} onChange={next => setEntry(prev => ({ ...prev, ...next }))} />
                    {archiveError && <p className="mt-3 border border-[#902A2A]/20 bg-[#902A2A]/5 px-3 py-2 text-xs text-[#902A2A]">{archiveError}</p>}
                    <div className="mt-4 flex gap-3 border-t border-[#E8E4DB] pt-3">
                      <button
                        type="button"
                        onClick={confirmEntry}
                        disabled={saving}
                        className="inline-flex min-h-9 items-center gap-2 border border-[#1A1A1A] bg-[#1A1A1A] px-4 py-2 font-mono text-[11px] uppercase tracking-widest text-[#F9F7F2] transition-colors hover:bg-[#242321] cursor-pointer disabled:opacity-50"
                      >
                        {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                        {saving ? '归档中' : '确认归档'}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right: AI Assistant */}
        {showChat && (
          <aside className="w-[320px] shrink-0 flex flex-col border-l border-[#D1CEC7] bg-[#FAFAFA]">
            <div className="flex items-center justify-between border-b border-[#D1CEC7] px-5 py-3">
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm tracking-widest">录入助手</span>
                <button
                  type="button"
                  onClick={() => text.trim() && void autoAnalyze(text)}
                  disabled={chatBusy || !text.trim()}
                  className="p-1 text-[#8C7E6A] hover:text-[#1A1A1A] cursor-pointer disabled:opacity-30 transition-colors"
                  title="分析当前日记"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                </button>
              </div>
              <button type="button" onClick={() => setShowChat(false)} className="text-[#8C7E6A] hover:text-[#1A1A1A] cursor-pointer p-1">
                <XIcon className="h-4 w-4" />
              </button>
            </div>
            <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-4 text-sm">
              {chatMsgs.length === 0 && (
                <div className="border border-[#D1CEC7] bg-[#F9F7F2] p-4 text-xs leading-6 text-[#8C7E6A]">
                  粘贴日记后自动分析，或点击上方 ✦ 手动触发。
                </div>
              )}
              {chatMsgs.map((message, index) => (
                <div key={index} className={`whitespace-pre-wrap border px-3 py-2 text-xs leading-7 ${message.role === 'user' ? 'border-[#D1CEC7] bg-white text-[#4A4A4A]' : 'border-transparent text-[#1A1A1A]'}`}>
                  {message.content}
                </div>
              ))}
              {chatBusy && <Loader2 className="h-5 w-5 animate-spin text-[#8C7E6A]" />}
            </div>
            <div className="shrink-0 border-t border-[#D1CEC7] p-3 pb-4">
              <div className="flex gap-2">
                <input
                  value={chatMsg}
                  onChange={e => setChatMsg(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') void askAi(); }}
                  placeholder="追问 AI..."
                  className="min-h-8 flex-1 border border-[#D1CEC7] bg-white px-3 py-1.5 text-xs text-[#1A1A1A] outline-none placeholder:text-[#8C7E6A]/60 focus:border-[#1A1A1A]"
                />
                <button
                  type="button"
                  onClick={() => void askAi()}
                  disabled={chatBusy}
                  className="shrink-0 inline-flex min-h-8 items-center border border-[#D1CEC7] bg-white px-2.5 font-mono text-[10px] uppercase tracking-widest text-[#8C7E6A] transition-colors hover:border-[#1A1A1A] hover:text-[#1A1A1A] cursor-pointer disabled:opacity-20"
                >
                  发送
                </button>
              </div>
            </div>
          </aside>
        )}
      </div>
    </div>
  );
}
