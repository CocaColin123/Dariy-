import { useState } from 'react';
import type { PageParams, Preset } from '../types/diary';

interface Props {
  params: PageParams;
  onChange: (p: PageParams) => void;
  presets: Preset[];
  onSavePreset: (name: string) => void;
}

const FONT_OPTIONS: { label: string; value: string; note: string }[] = [
  { label: '思源宋体', value: 'Noto Serif SC', note: '默认正文' },
  { label: '思源黑体', value: 'Noto Sans SC', note: '清爽界面' },
  { label: '霞鹜文楷', value: 'LXGW WenKai', note: '开源楷体' },
  { label: '汇文明朝', value: 'Huiwen Mincho', note: '复刻明朝' },
  { label: '司源赢宋', value: 'CorpSrcWinSong', note: '屏显宋体' },
  { label: '东方大楷', value: 'Alimama DongFangDaKai', note: '展示楷体' },
];

const TEXT_COLORS = ['#151515', '#2b2420', '#20201e', '#1a1a1a', '#f6f5f1', '#f1efe9', '#4a3a2a'];
const PAPER_COLORS = ['#fbf7f0', '#fff6e8', '#faf4e6', '#fdfaf5', '#fff9ee', '#f4e7e6', '#111214', '#1a1b1c'];
const inspectorInput = 'min-h-10 w-full rounded-sm border border-[#D1CEC7] bg-white px-3 py-2 text-sm text-[#1A1A1A] outline-none transition-colors hover:border-[#8C7E6A] focus:border-[#1A1A1A] focus:ring-2 focus:ring-[#1A1A1A]/10';

interface SectionProps {
  title: string;
  description?: string;
  children: React.ReactNode;
}

interface NumberFieldProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
  step?: string;
  unit?: string;
}

function Section({ title, description, children }: SectionProps) {
  return (
    <section className="space-y-3">
      <div className="border-b border-[#D1CEC7] pb-2">
        <h4 className="font-serif text-[15px] font-bold text-[#1A1A1A]">{title}</h4>
        {description && <p className="mt-1 text-[11px] leading-5 text-[#8C7E6A]">{description}</p>}
      </div>
      <div className="grid grid-cols-2 gap-3">{children}</div>
    </section>
  );
}

function FieldLabel({ label, unit }: { label: string; unit?: string }) {
  return (
    <span className="flex items-center justify-between font-mono text-[10px] uppercase tracking-widest text-[#8C7E6A]">
      {label}
      {unit && <span className="text-[#D1CEC7]">{unit}</span>}
    </span>
  );
}

function NumberField({ label, value, onChange, step = '1', unit }: NumberFieldProps) {
  return (
    <label className="space-y-1.5">
      <FieldLabel label={label} unit={unit} />
      <input
        type="number"
        step={step}
        value={value}
        onChange={e => {
          const next = Number(e.target.value);
          if (Number.isFinite(next)) onChange(next);
        }}
        className={inspectorInput}
      />
    </label>
  );
}

function ColorField({
  label,
  value,
  onChange,
  presets,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  presets: string[];
}) {
  return (
    <label className="col-span-2 space-y-2">
      <FieldLabel label={label} />
      <div className="flex flex-wrap gap-1.5">
        {presets.map(color => (
          <button
            key={color}
            type="button"
            onClick={() => onChange(color)}
            className="h-7 w-7 rounded-full border transition hover:scale-105 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#1A1A1A]/45"
            style={{ backgroundColor: color, borderColor: value === color ? '#1A1A1A' : '#D1CEC7' }}
            title={color}
          />
        ))}
      </div>
      <div className="flex gap-2">
        <input
          type="color"
          value={value}
          onChange={e => onChange(e.target.value)}
          className="h-10 w-11 cursor-pointer rounded-sm border border-[#D1CEC7] bg-white"
        />
        <input
          value={value}
          onChange={e => onChange(e.target.value)}
          className={`${inspectorInput} flex-1 font-mono`}
        />
      </div>
    </label>
  );
}

export default function PresetEditor({ params, onChange, presets, onSavePreset }: Props) {
  const [presetName, setPresetName] = useState('');
  const update = (patch: Partial<PageParams>) => onChange({ ...params, ...patch });
  const fontOptions = FONT_OPTIONS.some(font => font.value === params.fontFamily)
    ? FONT_OPTIONS
    : [{ label: params.fontFamily, value: params.fontFamily, note: '当前预设' }, ...FONT_OPTIONS];

  return (
    <div className="space-y-7 p-5">
      <Section title="纸张" description="控制纸页比例、阴影和页边距。">
        <NumberField label="宽高比" value={params.aspectRatio} step="0.01" onChange={aspectRatio => update({ aspectRatio })} />
        <label className="space-y-1.5">
          <FieldLabel label="页面阴影" />
          <select
            value={params.shadow}
            onChange={e => update({ shadow: e.target.value as PageParams['shadow'] })}
            className={inspectorInput}
          >
            <option value="none">无阴影</option>
            <option value="light">轻微</option>
            <option value="heavy">明显</option>
          </select>
        </label>
        <NumberField label="上边距" unit="mm" value={params.marginTop} onChange={marginTop => update({ marginTop })} />
        <NumberField label="下边距" unit="mm" value={params.marginBottom} onChange={marginBottom => update({ marginBottom })} />
        <NumberField label="左边距" unit="mm" value={params.marginLeft} onChange={marginLeft => update({ marginLeft })} />
        <NumberField label="右边距" unit="mm" value={params.marginRight} onChange={marginRight => update({ marginRight })} />
      </Section>

      <Section title="文字" description="字号保持当前默认值，先整理字体和基础排版。">
        <label className="col-span-2 space-y-1.5">
          <FieldLabel label="字体" />
          <select
            value={params.fontFamily}
            onChange={e => update({ fontFamily: e.target.value })}
            className={inspectorInput}
          >
            {fontOptions.map(font => (
              <option key={font.value} value={font.value} style={{ fontFamily: font.value }}>
                {font.label} / {font.note}
              </option>
            ))}
          </select>
        </label>
        <NumberField label="字号" unit="px" value={params.fontSize} onChange={fontSize => update({ fontSize })} />
        <NumberField label="行高" value={params.lineHeight} step="0.1" onChange={lineHeight => update({ lineHeight })} />
        <NumberField label="字间距" unit="em" value={params.letterSpacing} step="0.01" onChange={letterSpacing => update({ letterSpacing })} />
        <NumberField label="段间距" unit="em" value={params.paragraphSpacing} step="0.1" onChange={paragraphSpacing => update({ paragraphSpacing })} />
        <NumberField label="首行缩进" unit="em" value={params.textIndent} step="0.1" onChange={textIndent => update({ textIndent })} />
        <ColorField label="文字颜色" value={params.textColor} onChange={textColor => update({ textColor })} presets={TEXT_COLORS} />
      </Section>

      <Section title="背景" description="先提供克制纸色，后续再做纹理。">
        <ColorField label="纸张底色" value={params.bgColor} onChange={bgColor => update({ bgColor })} presets={PAPER_COLORS} />
      </Section>

      <Section title="图片" description="图片在 A4 纸页末尾独立展示。后续支持嵌入正文浮动环绕。">
        <label className="space-y-1.5">
          <FieldLabel label="默认模式" />
          <select
            value={params.imageMode}
            onChange={e => update({ imageMode: e.target.value as PageParams['imageMode'] })}
            className={inspectorInput}
          >
            <option value="embed">嵌入正文</option>
            <option value="float">浮动环绕</option>
          </select>
        </label>
        <NumberField label="环绕间距" unit="px" value={params.floatPadding} onChange={floatPadding => update({ floatPadding })} />
      </Section>

      <div className="space-y-3 border-t border-[#D1CEC7] pt-4">
        <div className="flex items-end gap-2">
          <label className="flex-1 space-y-1.5">
            <FieldLabel label="保存为预设" />
            <input
              value={presetName}
              onChange={e => setPresetName(e.target.value)}
              className={inspectorInput}
              placeholder="预设名称"
            />
          </label>
          <button
            type="button"
            onClick={() => {
              const name = presetName.trim();
              if (!name) return;
              onSavePreset(name);
              setPresetName('');
            }}
            className="h-10 rounded-sm border border-[#1A1A1A] bg-[#1A1A1A] px-4 font-mono text-[11px] uppercase tracking-widest text-[#F9F7F2] transition-colors hover:bg-[#242321] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1A1A1A]/25"
          >
            保存
          </button>
        </div>

        {presets.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {presets.map(preset => (
              <span key={preset.name} className="rounded-full border border-[#D1CEC7] bg-white px-2.5 py-1 font-mono text-[10px] uppercase tracking-wider text-[#8C7E6A]">
                {preset.name}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
