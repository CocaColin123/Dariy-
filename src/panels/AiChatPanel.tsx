import { useState, useRef, useEffect } from 'react';
import { motion } from 'motion/react';
import { X, Send, Loader2 } from 'lucide-react';
import type { DiaryConfig, DiaryEntry } from '../types/diary';
import { api } from '../utils/api';

interface Message { role: 'user' | 'assistant'; content: string }

interface Props {
  config: DiaryConfig;
  entries: DiaryEntry[];
  onClose: () => void;
}

const SYSTEM_PROMPT = `你是 Colin 的私人日记库 AI 助手。你拥有 Colin 日记的完整访问权限。

## 你是谁
你是一个深度阅读理解引擎。你的任务不是简短回答问题，而是深入阅读、理解、分析 Colin 的日记内容，给出有洞察力的回应。

## 你的能力
- 你可以完整阅读所有日记的正文（在上下文中提供）
- 分析日记中的情感、主题、人物关系、写作风格
- 对比不同时期的日记，发现模式和变化
- 回答关于日记内容的任何问题
- 给出写作建议、排版建议

## 你的风格要求
- **使用中文**
- **回答要详尽**。不要只给一两句话。每个回答至少 3-5 段，包含具体引用和分析。
- **引用原文**。直接引用日记中的段落和句子来支持你的观点，不要泛泛而谈。
- **展现洞察力**。指出日记作者自己可能没注意到的模式、矛盾、成长轨迹。
- **语气像朋友**。温暖、好奇、有一点幽默感。你不是冰冷的工具。
- **诚实**。如果上下文没有某篇日记的正文，直接说"我还没读到这一篇"。

## 日记格式
每篇日记 Markdown 文件，YAML 元数据（date, title, location, tags），正文是自由格式的中文写作。`;

export default function AiChatPanel({ config, entries, onClose }: Props) {
  const [msgs, setMsgs] = useState<Message[]>(config.chatHistory?.slice(-20) || []);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [msgs]);

  // Extract keywords from user query for smarter search
  function extractKeywords(text: string): string[] {
    // Remove common question words, keep meaningful terms
    const cleaned = text.replace(/[？。，！、：；""''（）\s]+/g, ' ')
      .replace(/我有多少|有多少|告诉我|帮我|查找|搜索|最近|什么|哪些|怎么|如何|请|一下/g, ' ')
      .trim();
    const words = cleaned.split(' ').filter(w => w.length >= 1);
    return [...new Set(words)];
  }

  // Search entries by keywords
  function searchEntries(keywords: string[]): string {
    const matches: string[] = [];
    for (const e of entries) {
      const searchText = `${e.meta.title} ${e.meta.location || ''} ${(e.meta.tags || []).join(' ')} ${e.body.slice(0, 300)}`.toLowerCase();
      const matched = keywords.some(kw => searchText.includes(kw.toLowerCase()));
      if (matched) {
        matches.push(`📅 ${e.meta.date} · ${e.meta.title}${e.meta.location ? ' · ' + e.meta.location : ''}${(e.meta.tags || []).length ? '\n标签: ' + (e.meta.tags || []).join(', ') : ''}\n正文:\n${e.body.slice(0, 1500)}${e.body.length > 1500 ? '...(截断)' : ''}`);
      }
      if (matches.length >= 5) break;
    }
    return matches.length > 0 ? matches.join('\n\n---\n\n') : '';
  }

  const send = async () => {
    const text = input.trim();
    if (!text || busy) return;
    setInput('');
    const updated: Message[] = [...msgs, { role: 'user', content: text }];
    setMsgs(updated);
    setBusy(true);

    // Always include ALL diary content when vault is small (<=10 entries)
    const vaultSmall = entries.length <= 10;
    const years = [...new Set(entries.map(e => (e.meta.date || '').slice(0, 4)))].sort();
    const tags = [...new Set(entries.flatMap(e => e.meta.tags || []))];
    const dateRange = entries.length > 0
      ? `${entries[entries.length - 1].meta.date} 至 ${entries[0].meta.date}`
      : '空';

    let ctx = `【你的日记库】共 ${entries.length} 篇，${years.length} 个年份（${years.join(', ')}），时间跨度 ${dateRange}。标签：${tags.join(', ') || '无'}。\n\n`;

    if (vaultSmall) {
      // Small vault: include full body of ALL entries
      ctx += `以下是日记库中全部 ${entries.length} 篇日记的完整正文，请你仔细阅读：\n\n`;
      ctx += entries.map(e =>
        `--- ${e.meta.date} · ${e.meta.title}${e.meta.location ? ' · ' + e.meta.location : ''} ---\n${e.body}`
      ).join('\n\n');
      ctx += `\n\n--- 日记正文结束 ---\n请基于以上全部日记内容回答用户的问题。引用具体段落来支持你的观点。`;
    } else {
      // Large vault: include titles + dates + search results
      ctx += `最近日记：${entries.slice(0, 10).map(e => `${e.meta.date}「${e.meta.title}」`).join('、')}\n`;
      const keywords = extractKeywords(text);
      if (keywords.length > 0) {
        const results = searchEntries(keywords);
        if (results) ctx += `\n\n关键词匹配的日记内容：\n${results}`;
      }
    }

    try {
      const fullMsgs = [
        { role: 'system' as const, content: SYSTEM_PROMPT + '\n\n' + ctx },
        ...updated.map(m => ({ role: m.role, content: m.content })),
      ];
      const result = await api.deepseekChat({
        apiKey: config.api.apiKey,
        baseUrl: config.api.baseUrl,
        model: config.api.model,
        messages: fullMsgs,
      });
      const reply = result.choices?.[0]?.message?.content || '(无响应)';
      const final = [...updated, { role: 'assistant' as const, content: reply }];
      setMsgs(final);
      await api.writeConfig({ ...config, chatHistory: final.slice(-50) });
    } catch (err: any) {
      setMsgs([...updated, { role: 'assistant', content: '请求失败: ' + (err?.message || err) }]);
    }
    setBusy(false);
  };

  return (
    <motion.aside initial={{ x: 300 }} animate={{ x: 0 }} exit={{ x: 300 }} className="flex w-80 shrink-0 flex-col border-l border-white/6 bg-[#0c0c14]">
      <div className="flex items-center justify-between border-b border-white/6 px-5 py-4">
        <h3 className="font-serif text-sm text-white/65">AI 助手</h3>
        <button onClick={onClose} className="text-white/30 hover:text-white"><X className="h-4 w-4" /></button>
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {msgs.length === 0 && (
          <p className="text-xs text-white/25 text-center py-8">
            问问我关于日记库的问题。<br/><br/>
            「我现在有多少篇日记？」<br/>
            「提到海边的日记有哪些？」<br/>
            「最近在写什么主题？」<br/>
            「分析一下我的写作风格」
          </p>
        )}
        {msgs.map((m, i) => (
          <div key={i} className={`text-xs leading-relaxed ${m.role === 'user' ? 'text-white/50' : 'text-white/75'}`}>
            <span className="text-[10px] text-white/20">{m.role === 'user' ? '你' : 'Colin 的助手'}</span>
            <p className="mt-1 whitespace-pre-wrap">{m.content}</p>
          </div>
        ))}
        {busy && <Loader2 className="h-4 w-4 animate-spin text-white/20" />}
        <div ref={bottomRef} />
      </div>
      <div className="border-t border-white/6 p-4">
        <div className="flex gap-2">
          <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') send(); }}
            placeholder="问点什么..." className="admin-input flex-1 text-sm" />
          <button onClick={send} disabled={busy || !input.trim()} className="rounded border border-white/10 px-3 py-1.5 text-white/40 hover:text-white/70 disabled:opacity-30">
            <Send className="h-4 w-4" />
          </button>
        </div>
      </div>
    </motion.aside>
  );
}
