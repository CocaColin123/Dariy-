import { useState } from 'react';
import { motion } from 'motion/react';
import { X, Check, Loader2 } from 'lucide-react';
import type { DiaryConfig } from '../types/diary';
import { api } from '../utils/api';

interface Props {
  config: DiaryConfig;
  onUpdate: (c: DiaryConfig) => void;
  onClose: () => void;
}

export default function ApiSettingsPanel({ config, onUpdate, onClose }: Props) {
  const [a, setA] = useState({ ...config.api });
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<'idle' | 'ok' | 'fail'>('idle');
  const [testError, setTestError] = useState('');

  const save = async () => {
    const updated = { ...config, api: a };
    await api.writeConfig(updated);
    onUpdate(updated);
  };

  const testConnection = async () => {
    setTesting(true);
    setTestResult('idle');
    try {
      await api.deepseekCall({ apiKey: a.apiKey, baseUrl: a.baseUrl, model: a.model, prompt: 'Reply with {"ok":true}', text: 'ping' });
      setTestResult('ok');
    } catch (err: any) {
      setTestResult('fail');
      setTestError(err?.message || String(err));
    }
    setTesting(false);
  };

  return (
    <motion.aside initial={{ x: 300 }} animate={{ x: 0 }} exit={{ x: 300 }}
      className="w-80 shrink-0 border-l border-white/6 bg-[#0c0c14] overflow-y-auto">
      <div className="flex items-center justify-between border-b border-white/6 px-5 py-4">
        <h3 className="font-serif text-sm text-white/65">API 设置</h3>
        <button onClick={onClose} className="text-white/30 hover:text-white"><X className="h-4 w-4" /></button>
      </div>
      <div className="space-y-4 p-5">
        <div>
          <label className="mb-1 block text-[10px] text-white/30">提供商</label>
          <select value={a.provider} onChange={e => setA({ ...a, provider: e.target.value })} className="admin-input w-full text-sm">
            <option value="deepseek">DeepSeek</option>
            <option value="openai">OpenAI 兼容</option>
            <option value="custom">自定义</option>
          </select>
        </div>
        <div>
          <label className="mb-1 block text-[10px] text-white/30">Base URL</label>
          <input value={a.baseUrl} onChange={e => setA({ ...a, baseUrl: e.target.value })} className="admin-input w-full text-sm font-mono" />
        </div>
        <div>
          <label className="mb-1 block text-[10px] text-white/30">模型</label>
          <input value={a.model} onChange={e => setA({ ...a, model: e.target.value })} className="admin-input w-full text-sm font-mono" placeholder="deepseek-chat / deepseek-reasoner" />
        </div>
        <div>
          <label className="mb-1 block text-[10px] text-white/30">API Key</label>
          <input type="password" value={a.apiKey} onChange={e => setA({ ...a, apiKey: e.target.value })} className="admin-input w-full text-sm font-mono" placeholder="sk-..." />
        </div>

        <div className="border-t border-white/8 pt-4">
          <label className="mb-3 block text-[10px] tracking-[0.14em] text-white/30">模型参数</label>
          <div className="space-y-3">
            <div>
              <div className="flex justify-between mb-1">
                <label className="text-[10px] text-white/35">Max Tokens</label>
                <span className="text-[10px] text-white/25 font-mono">{a.maxTokens}</span>
              </div>
              <input type="range" min={256} max={8192} step={256} value={a.maxTokens}
                onChange={e => setA({ ...a, maxTokens: Number(e.target.value) })}
                className="w-full h-1 accent-white/60" />
            </div>
            <div>
              <div className="flex justify-between mb-1">
                <label className="text-[10px] text-white/35">Temperature</label>
                <span className="text-[10px] text-white/25 font-mono">{a.temperature.toFixed(1)}</span>
              </div>
              <input type="range" min={0} max={2} step={0.1} value={a.temperature}
                onChange={e => setA({ ...a, temperature: Number(e.target.value) })}
                className="w-full h-1 accent-white/60" />
            </div>
            <div>
              <div className="flex justify-between mb-1">
                <label className="text-[10px] text-white/35">Top P</label>
                <span className="text-[10px] text-white/25 font-mono">{a.topP.toFixed(2)}</span>
              </div>
              <input type="range" min={0} max={1} step={0.05} value={a.topP}
                onChange={e => setA({ ...a, topP: Number(e.target.value) })}
                className="w-full h-1 accent-white/60" />
            </div>
          </div>
        </div>

        <div className="flex gap-2">
          <button onClick={save} className="flex-1 rounded border border-white/15 bg-white/[0.04] py-2 text-xs text-white/65 hover:bg-white/[0.08]">保存</button>
          <button onClick={testConnection} disabled={testing} className="flex items-center gap-1.5 rounded border border-white/10 px-3 py-2 text-xs text-white/45 hover:text-white/70 disabled:opacity-40">
            {testing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />} 测试
          </button>
        </div>
        {testResult === 'ok' && <p className="text-xs text-emerald-400/70">连接成功</p>}
        {testResult === 'fail' && <p className="text-xs text-red-400/70 break-all">{testError}</p>}
      </div>
    </motion.aside>
  );
}
