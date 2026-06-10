import { Plus, X } from 'lucide-react';
import { useState } from 'react';

export interface EntryData {
  date: string;
  title: string;
  location: string;
  tags: string[];
  preset: string;
  body: string;
  ocrIssues?: string[];
}

interface Props {
  entry: EntryData;
  onChange: (e: EntryData) => void;
}

export default function MetaFields({ entry, onChange }: Props) {
  const [tagInput, setTagInput] = useState('');
  const labelClass = 'mb-1 block font-mono text-[10px] uppercase tracking-[0.18em] text-[#8C7E6A]';
  const inputClass = 'min-h-10 w-full border border-[#D1CEC7] bg-white px-3 py-2 text-sm text-[#1A1A1A] outline-none placeholder:text-[#8C7E6A]/55 focus:border-[#1A1A1A]';

  const addTag = () => {
    const tag = tagInput.trim();
    if (tag && !entry.tags.includes(tag)) {
      onChange({ ...entry, tags: [...entry.tags, tag] });
      setTagInput('');
    }
  };

  const removeTag = (tag: string) => {
    onChange({ ...entry, tags: entry.tags.filter(item => item !== tag) });
  };

  return (
    <div className="space-y-3">
      <div className="grid gap-3 md:grid-cols-2">
        <div>
          <label className={labelClass}>日期</label>
          <input
            type="date"
            value={entry.date}
            onChange={e => onChange({ ...entry, date: e.target.value })}
            className={inputClass}
          />
        </div>
        <div>
          <label className={labelClass}>地点</label>
          <input
            value={entry.location}
            onChange={e => onChange({ ...entry, location: e.target.value })}
            className={inputClass}
            placeholder="可选"
          />
        </div>
      </div>

      <div>
        <label className={labelClass}>标题</label>
        <input
          value={entry.title}
          onChange={e => onChange({ ...entry, title: e.target.value })}
          className={`${inputClass} font-serif text-base`}
          placeholder="日记标题"
        />
      </div>

      <div>
        <label className={labelClass}>标签</label>
        <div className="mb-2 flex flex-wrap gap-1.5">
          {entry.tags.map(tag => (
            <span
              key={tag}
              className="inline-flex items-center gap-1 border border-[#D1CEC7] bg-[#F9F7F2] px-2.5 py-0.5 text-xs text-[#8C7E6A]"
            >
              {tag}
              <button type="button" onClick={() => removeTag(tag)} className="text-[#8C7E6A]/60 hover:text-[#1A1A1A]">
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>
        <div className="flex gap-2">
          <input
            value={tagInput}
            onChange={e => setTagInput(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter') {
                e.preventDefault();
                addTag();
              }
            }}
            className={`${inputClass} flex-1`}
            placeholder="添加标签..."
          />
          <button type="button" onClick={addTag} className="min-h-10 border border-[#D1CEC7] bg-white px-3 text-[#8C7E6A] transition-colors hover:border-[#1A1A1A] hover:text-[#1A1A1A]">
            <Plus className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
