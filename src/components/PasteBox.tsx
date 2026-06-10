import { useRef, useEffect } from 'react';

interface Props {
  value: string;
  onChange: (text: string) => void;
  busy: boolean;
}

export default function PasteBox({ value, onChange, busy }: Props) {
  const ref = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (!value && ref.current) ref.current.focus();
  }, [value]);

  const handlePaste = (e: React.ClipboardEvent) => {
    const text = e.clipboardData.getData('text');
    if (text.trim()) {
      setTimeout(() => onChange(text), 50);
    }
  };

  return (
    <div className="mx-auto pt-8 px-4" style={{ maxWidth: '900px' }}>
      <div className="mb-6 text-center">
        <p className="text-micro mb-3 text-white/30">ENTRY</p>
        <h2 className="font-serif text-2xl text-white/80">日记录入</h2>
        <p className="mt-2 text-xs text-white/25">粘贴千问 OCR 输出的文字（Ctrl+V），自动识别日期、标题、标签</p>
      </div>

      <textarea
        ref={ref}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onPaste={handlePaste}
        placeholder="在此粘贴..."
        className={`w-full rounded-sm border bg-white/[0.02] p-6 font-serif text-base leading-[2] text-white/70 outline-none transition-all resize-y placeholder:text-white/12 ${
          busy
            ? 'border-amber-400/20 animate-pulse'
            : value
              ? 'border-emerald-400/20'
              : 'border-white/8 border-dashed hover:border-white/15'
        }`}
        style={{ minHeight: '60vh', fontFamily: 'Noto Serif SC, serif' }}
        spellCheck={false}
      />

      {busy && (
        <p className="mt-3 text-center text-xs text-amber-400/40">AI 正在分析内容...</p>
      )}
      {!busy && !value && (
        <p className="mt-3 text-center text-xs text-white/15">
          粘贴后自动识别日期、地点、标题。原始文本中的日期和地点信息会被保留在正文中。
        </p>
      )}
    </div>
  );
}
