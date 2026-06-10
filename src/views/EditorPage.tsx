import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  ImageIcon,
  Save,
  Trash2,
} from 'lucide-react';
import type { DiaryConfig, DiaryEntry, PageParams } from '../types/diary';
import { api } from '../utils/api';
import A4Paper from '../components/A4Paper';
import PresetEditor from '../components/PresetEditor';
import { computePaperFitScale, shouldHandlePreviewPageKey } from '../utils/paperPreview';
import { getPageMetrics } from '../utils/pagedMarkdown';
import {
  applyPlainTextEditToStyledSource,
  applySelectionSpanStyle,
  clearSelectionInlineStyles,
  displaySelectionToSourceSelection,
  sourceSelectionToDisplaySelection,
  stripInlineStyleMarkup,
  wrapSelectionWithFontSize,
} from '../utils/inlineStyle';

interface Props {
  entry: DiaryEntry;
  config: DiaryConfig;
  onSaved: () => void;
  onRefresh: () => Promise<void>;
  onDelete: () => void;
  onBack: () => void;
  onConfigChange: (c: DiaryConfig) => void;
}

interface ImgItem { path: string; dir: string; name: string }
type EditorMode = 'write' | 'preview' | 'layout';

const EDITOR_MODES: { key: EditorMode; label: string }[] = [
  { key: 'write', label: '写作' },
  { key: 'preview', label: '预览' },
  { key: 'layout', label: '版式' },
];

const INLINE_FONT_OPTIONS = [
  { label: '正文', value: 'Noto Serif SC' },
  { label: '楷体', value: 'KaiTi' },
  { label: '华文楷体', value: 'STKaiti' },
  { label: '霞鹜文楷', value: 'LXGW WenKai' },
  { label: '汇文明朝', value: 'Huiwen Mincho' },
  { label: '司源赢宋', value: 'CorpSrcWinSong' },
  { label: '东方大楷', value: 'Alimama DongFangDaKai' },
];

const INLINE_COLOR_OPTIONS = [
  { label: '墨色', value: '#151515' },
  { label: '褐色', value: '#4a3a2a' },
  { label: '朱砂', value: '#8f3d32' },
  { label: '青灰', value: '#3f5760' },
];

const archiveButtonBase = 'inline-flex items-center justify-center gap-2 rounded-sm border font-mono text-[11px] uppercase tracking-widest transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1A1A1A]/25 disabled:cursor-not-allowed disabled:opacity-35';
const archiveButtonSecondary = `${archiveButtonBase} border-[#D1CEC7] bg-white px-4 py-2 text-[#8C7E6A] hover:border-[#1A1A1A] hover:text-[#1A1A1A]`;
const archiveButtonPrimary = `${archiveButtonBase} border-[#1A1A1A] bg-[#1A1A1A] px-4 py-2 text-[#F9F7F2] hover:bg-[#242321] focus-visible:ring-offset-2 focus-visible:ring-offset-[#F9F7F2]`;
const archiveButtonGhost = `${archiveButtonBase} border-transparent bg-transparent px-3 py-2 text-[#8C7E6A] hover:bg-[#E8E4DB]/55 hover:text-[#1A1A1A]`;
const archiveInput = 'min-h-10 rounded-sm border border-[#D1CEC7] bg-white px-3 py-2 text-sm text-[#1A1A1A] outline-none transition-colors placeholder:text-[#8C7E6A]/45 hover:border-[#8C7E6A] focus:border-[#1A1A1A] focus:ring-2 focus:ring-[#1A1A1A]/10';

function clampPageIndex(index: number, pageCount: number) {
  return Math.max(0, Math.min(Math.max(0, pageCount - 1), index));
}

function FittedPaperPreview({
  params,
  body,
  images,
  imageSize,
  imagePos,
  pageIndex,
  pageCount,
  onPageIndexChange,
  onPageCountChange,
}: {
  params: PageParams;
  body: string;
  images: string[];
  imageSize?: 'sm' | 'md' | 'lg' | 'full';
  imagePos?: 'top' | 'bottom';
  pageIndex: number;
  pageCount: number;
  onPageIndexChange: (nextIndex: number) => void;
  onPageCountChange: (pageCount: number) => void;
}) {
  const frameRef = useRef<HTMLDivElement>(null);
  const [frameSize, setFrameSize] = useState({ width: 0, height: 0 });
  const metrics = useMemo(() => getPageMetrics(params), [params]);

  useEffect(() => {
    const node = frameRef.current;
    if (!node) return;

    const update = () => {
      const rect = node.getBoundingClientRect();
      setFrameSize({ width: rect.width, height: rect.height });
    };

    update();
    if (typeof ResizeObserver === 'undefined') return;

    const observer = new ResizeObserver(update);
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  const scale = frameSize.width > 0 && frameSize.height > 0
    ? computePaperFitScale({
      viewportWidth: frameSize.width,
      viewportHeight: frameSize.height,
      pageWidth: metrics.widthPx,
      pageHeight: metrics.heightPx,
      paddingX: 64,
      paddingY: 48,
    })
    : 0.72;

  const goToPage = (nextIndex: number) => {
    onPageIndexChange(clampPageIndex(nextIndex, pageCount));
  };

  return (
    <section className="flex min-h-0 min-w-0 flex-1 flex-col bg-[#E8E4DB]">
      <div
        ref={frameRef}
        className="relative min-h-0 flex-1 overflow-hidden bg-[radial-gradient(circle_at_50%_12%,rgba(255,255,255,0.72),transparent_36%),linear-gradient(180deg,#F9F7F2,#E8E4DB)]"
      >
        <div className="pointer-events-none absolute inset-x-8 top-5 flex items-center justify-between font-mono text-[10px] uppercase tracking-[0.24em] text-[#8C7E6A]/60">
          <span>Paper Preview</span>
          <span>Fit {Math.round(scale * 100)}%</span>
        </div>
        <div className="absolute inset-0 flex items-center justify-center p-6">
          <div
            className="[&>div]:my-0"
            style={{
              width: metrics.widthPx,
              height: metrics.heightPx,
              transform: `scale(${scale})`,
              transformOrigin: 'center center',
            }}
          >
            <A4Paper
              params={params}
              body={body}
              images={images}
              imageSize={imageSize}
              imagePos={imagePos}
              pageIndex={pageIndex}
              onPageIndexChange={onPageIndexChange}
              onPageCountChange={onPageCountChange}
              showPageNum
              showInternalControls={false}
            />
          </div>
        </div>
      </div>

      <footer className="flex h-14 shrink-0 items-center justify-between border-t border-[#D1CEC7] bg-[#FAFAFA] px-4">
        <button
          type="button"
          onClick={() => goToPage(pageIndex - 1)}
          disabled={pageIndex <= 0}
          className={`${archiveButtonSecondary} min-h-9 px-3 py-1.5`}
        >
          <ChevronLeft className="h-4 w-4" />
          上一页
        </button>
        <div className="flex items-center gap-3 font-mono text-[11px] uppercase tracking-widest text-[#8C7E6A]">
          <span className="tabular-nums text-[#1A1A1A]">{pageIndex + 1} / {Math.max(pageCount, 1)}</span>
          <span className="text-[#D1CEC7]">Page</span>
        </div>
        <button
          type="button"
          onClick={() => goToPage(pageIndex + 1)}
          disabled={pageIndex >= pageCount - 1}
          className={`${archiveButtonSecondary} min-h-9 px-3 py-1.5`}
        >
          下一页
          <ChevronRight className="h-4 w-4" />
        </button>
      </footer>
    </section>
  );
}

export default function EditorPage({ entry, config, onSaved, onRefresh, onDelete, onBack, onConfigChange }: Props) {
  const presetName = entry.meta.preset || config.defaultPreset;
  const preset = config.presets.find(p => p.name === presetName) || config.presets[0];
  const [mode, setMode] = useState<EditorMode>('write');
  const [params, setParams] = useState({ ...preset.params });
  const [body, setBody] = useState(entry.body);
  const [title, setTitle] = useState(entry.meta.title || '');
  const [saving, setSaving] = useState(false);
  const [pageIndex, setPageIndex] = useState(0);
  const [pageCount, setPageCount] = useState(1);
  const [imageSize, setImageSize] = useState<'sm' | 'md' | 'lg' | 'full'>('md');
  const [imagePos, setImagePos] = useState<'top' | 'bottom'>(() => {
    return (localStorage.getItem(`img-pos-${entry.filePath}`) as 'top' | 'bottom') || 'bottom';
  });
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selection, setSelection] = useState({ start: 0, end: 0 });
  const [inlineError, setInlineError] = useState('');
  const [inlineFont, setInlineFont] = useState(INLINE_FONT_OPTIONS[1].value);
  const [inlineColor, setInlineColor] = useState(INLINE_COLOR_OPTIONS[2].value);
  const textRef = useRef<HTMLTextAreaElement>(null);
  const displayBody = stripInlineStyleMarkup(body);
  const hasSelection = selection.end > selection.start;
  const paramsDirty = useMemo(() => JSON.stringify(params) !== JSON.stringify(preset.params), [params, preset.params]);
  const dirty = title !== (entry.meta.title || '') || body !== entry.body || paramsDirty;
  const saveState = saving ? '保存中' : dirty ? '未保存' : '已保存';
  const [globalFontDialog, setGlobalFontDialog] = useState<{ fontLabel: string; fontValue: string } | null>(null);

  const handleFontChange = (fontValue: string, fontLabel: string) => {
    setInlineFont(fontValue);
    // 先尝试应用到当前选中
    if (hasSelection) {
      applySelectionStyle(`font-family: '${fontValue}'`);
    }
    // 弹出全局应用确认
    setGlobalFontDialog({ fontLabel, fontValue });
  };

  const confirmGlobalFont = () => {
    if (!globalFontDialog) return;
    // 通过排版预设参数全局换字体——CSS 级别全页生效，不依赖 inline span
    setParams(prev => ({ ...prev, fontFamily: globalFontDialog.fontValue }));
    setGlobalFontDialog(null);
    setInlineError('');
  };

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const activeTagName = (document.activeElement as HTMLElement | null)?.tagName;
      if (!shouldHandlePreviewPageKey(event.key, activeTagName)) return;
      event.preventDefault();
      setPageIndex(current => clampPageIndex(current + (event.key === 'ArrowRight' ? 1 : -1), pageCount));
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [pageCount]);

  const handlePageCountChange = (nextPageCount: number) => {
    setPageCount(nextPageCount);
    setPageIndex(current => clampPageIndex(current, nextPageCount));
  };

  const handlePickImages = () => { fileInputRef.current?.click(); };

  const handleFilesSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setUploading(true);
    setUploadError('');
    const parts = entry.filePath.replace(/\\/g, '/').replace(/\.md$/, '').split('/');
    const basename = parts[parts.length - 1];
    const month = parts[parts.length - 2];
    const year = parts[parts.length - 3];
    let failed = 0;
    for (const file of Array.from(files)) {
      const dest = `data/${year}/${month}/images/${basename}/${file.name}`;
      try {
        await api.uploadImage(file, dest);
      } catch (err) {
        failed++;
        console.error('upload failed', err);
      }
    }
    if (failed > 0) setUploadError(`${failed}/${files.length} 张上传失败`);
    await onRefresh();
    setUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const updateSelection = () => {
    const el = textRef.current;
    if (!el) return;
    setSelection({ start: el.selectionStart, end: el.selectionEnd });
    setInlineError('');
  };

  const applySelectionFontSize = (scale: number) => {
    const el = textRef.current;
    if (!el) return;
    const mapped = displaySelectionToSourceSelection(body, el.selectionStart, el.selectionEnd);
    const result = wrapSelectionWithFontSize(body, mapped.start, mapped.end, scale);
    if (!result) {
      setInlineError('请先选中要调整的文字');
      return;
    }
    setBody(result.text);
    const nextSelection = sourceSelectionToDisplaySelection(result.text, result.selectionStart, result.selectionEnd);
    setSelection(nextSelection);
    setInlineError('');
    requestAnimationFrame(() => {
      textRef.current?.focus();
      textRef.current?.setSelectionRange(nextSelection.start, nextSelection.end);
    });
  };

  const commitInlineResult = (result: ReturnType<typeof applySelectionSpanStyle> | null) => {
    if (!result) {
      setInlineError('请先选中要调整的文字');
      return;
    }
    setBody(result.text);
    const nextSelection = sourceSelectionToDisplaySelection(result.text, result.selectionStart, result.selectionEnd);
    setSelection(nextSelection);
    setInlineError('');
    requestAnimationFrame(() => {
      textRef.current?.focus();
      textRef.current?.setSelectionRange(nextSelection.start, nextSelection.end);
    });
  };

  const applySelectionStyle = (style: string) => {
    const el = textRef.current;
    if (!el) return;
    const [property, ...valueParts] = style.split(':');
    const value = valueParts.join(':').trim();
    if (!property || !value) return;
    const mapped = displaySelectionToSourceSelection(body, el.selectionStart, el.selectionEnd);
    commitInlineResult(applySelectionSpanStyle(body, mapped.start, mapped.end, property.trim(), value));
  };

  const clearSelectionStyle = () => {
    const el = textRef.current;
    if (!el) return;
    const mapped = displaySelectionToSourceSelection(body, el.selectionStart, el.selectionEnd);
    const result = clearSelectionInlineStyles(body, mapped.start, mapped.end);
    if (!result) {
      setInlineError('请选中带样式的文字或样式标签');
      return;
    }
    setBody(result.text);
    const nextSelection = sourceSelectionToDisplaySelection(result.text, result.selectionStart, result.selectionEnd);
    setSelection(nextSelection);
    setInlineError('');
    requestAnimationFrame(() => {
      textRef.current?.focus();
      textRef.current?.setSelectionRange(nextSelection.start, nextSelection.end);
    });
  };

  const savePreset = async (name: string) => {
    const updated = {
      ...config,
      presets: config.presets.some(p => p.name === name)
        ? config.presets.map(p => p.name === name ? { name, params } : p)
        : [...config.presets, { name, params }],
    };
    await api.writeConfig(updated);
    onConfigChange(updated);
  };

  const saveDiary = async () => {
    setSaving(true);
    const meta = { ...entry.meta, title };
    if (presetName !== config.defaultPreset) meta.preset = presetName;
    const updatedConfig = {
      ...config,
      presets: config.presets.map(p => p.name === presetName ? { ...p, params } : p),
    };
    await api.writeConfig(updatedConfig);
    onConfigChange(updatedConfig);
    await api.writeDiary(entry.filePath, meta, body);
    setSaving(false);
    onSaved();
  };

  const workspaceClass = mode === 'write'
    ? 'grid grid-cols-[minmax(360px,0.9fr)_minmax(420px,1.1fr)]'
    : mode === 'layout'
      ? 'grid grid-cols-[minmax(0,1fr)_320px]'
      : 'grid grid-cols-1';

  const preview = (
    <FittedPaperPreview
      params={params}
      body={body}
      images={entry.images}
      imageSize={imageSize}
      imagePos={imagePos}
      pageIndex={pageIndex}
      pageCount={pageCount}
      onPageIndexChange={nextIndex => setPageIndex(clampPageIndex(nextIndex, pageCount))}
      onPageCountChange={handlePageCountChange}
    />
  );

  return (
    <div className="h-full bg-[#F9F7F2] font-serif text-[#1A1A1A]">
      <div className="fixed inset-0 z-[180] flex items-center justify-center bg-[#F9F7F2] px-6 text-center lg:hidden">
        <div className="max-w-sm border border-[#D1CEC7] bg-[#FAFAFA] p-6 shadow-[0_12px_40px_rgba(0,0,0,0.06)]">
          <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-[#8C7E6A]">Archive Editor</p>
          <h2 className="mt-3 font-serif text-2xl font-bold text-[#1A1A1A]">请在桌面宽度编辑纸页</h2>
          <p className="mt-3 text-sm leading-6 text-[#8C7E6A]">
            这一版编辑器需要完整显示正文、纸页和版式控制。请放大窗口后继续编辑。
          </p>
          <button type="button" onClick={onBack} className={`${archiveButtonSecondary} mt-5`}>
            <ArrowLeft className="h-4 w-4" />
            返回阅读
          </button>
        </div>
      </div>

      <div className="hidden h-full flex-col lg:flex">
        <header className="flex h-20 shrink-0 items-center justify-between gap-4 border-b border-[#D1CEC7] bg-[#FAFAFA] px-5">
          <div className="flex items-center gap-3">
            <button type="button" onClick={onBack} className={`${archiveButtonSecondary} min-h-10`}>
              <ArrowLeft className="h-4 w-4" />
              返回
            </button>
            <div className="flex rounded-sm border border-[#D1CEC7] bg-[#F9F7F2] p-1">
              {EDITOR_MODES.map(item => (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => setMode(item.key)}
                  className={`min-h-9 rounded-sm px-3 font-mono text-[11px] uppercase tracking-widest transition-colors ${
                    mode === item.key
                      ? 'border border-[#D1CEC7] bg-white font-bold text-[#1A1A1A] shadow-sm'
                      : 'text-[#8C7E6A] hover:bg-[#E8E4DB]/45 hover:text-[#1A1A1A]'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          <label className="min-w-[260px] max-w-[420px] flex-1">
            <span className="sr-only">日记标题</span>
            <input
              value={title}
              onChange={e => setTitle(e.target.value)}
              className="w-full border-b border-transparent bg-transparent px-3 py-2 text-center font-serif text-lg font-bold text-[#1A1A1A] outline-none transition focus:border-[#1A1A1A]"
              placeholder="无标题日记"
            />
            <span className="mt-0.5 block text-center font-mono text-[10px] uppercase tracking-[0.3em] text-[#8C7E6A]">Archive Editor</span>
          </label>

          <div className="flex items-center gap-3">
            <span className={`rounded-full border px-2.5 py-1 text-[11px] ${
              saving
                ? 'border-[#8C7E6A]/40 text-[#8C7E6A]'
                : dirty
                  ? 'border-[#D1CEC7] text-[#8C7E6A]'
                  : 'border-[#D1CEC7] text-[#4A4A4A]'
            }`}>
              {saveState}
            </span>
            <button
              type="button"
              onClick={saveDiary}
              disabled={saving}
              className={`${archiveButtonPrimary} min-h-10`}
            >
              <Save className="h-3.5 w-3.5" />
              保存
            </button>
            <button
              type="button"
              onClick={() => { if (confirm(`删除「${entry.meta.title || '无标题日记'}」？`)) onDelete(); }}
              className={`${archiveButtonSecondary} min-h-10 text-[#902A2A] hover:border-[#902A2A] hover:text-[#902A2A]`}
            >
              <Trash2 className="h-3.5 w-3.5" />
              删除
            </button>
          </div>
        </header>

        <main className={`${workspaceClass} min-h-0 flex-1 overflow-hidden`}>
          {mode === 'write' && (
            <section className="relative flex min-h-0 min-w-0 flex-col border-r border-[#D1CEC7] bg-[#FCFBF7]">
              <div className="flex h-16 shrink-0 items-center justify-between border-b border-[#D1CEC7] bg-[#FAFAFA] px-5">
                <div>
                  <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-[#8C7E6A]">Source Text</p>
                  <h2 className="mt-1 font-serif text-lg font-bold text-[#1A1A1A]">正文</h2>
                </div>
              </div>

              {hasSelection && (
                <div className="absolute right-4 top-20 z-20 flex max-w-[calc(100%-2rem)] flex-wrap items-center gap-2 rounded-sm border border-[#D1CEC7] bg-white p-2 shadow-[0_18px_60px_rgba(44,42,40,0.14)]">
                  <button type="button" onMouseDown={event => event.preventDefault()} onClick={() => applySelectionFontSize(0.88)} className={`${archiveButtonSecondary} min-h-8 px-2 py-1`}>A-</button>
                  <button type="button" onMouseDown={event => event.preventDefault()} onClick={() => applySelectionFontSize(1.18)} className={`${archiveButtonSecondary} min-h-8 px-2 py-1`}>A+</button>
                  <select
                    value={inlineFont}
                    onChange={e => handleFontChange(e.target.value, e.target.selectedOptions[0]?.text || e.target.value)}
                    className={`${archiveInput} h-8 min-h-0 w-32 py-1 pl-2 pr-7 text-xs`}
                    title={inlineError || '设置选中文字字体'}
                  >
                    {INLINE_FONT_OPTIONS.map(font => (
                      <option key={font.value} value={font.value}>{font.label}</option>
                    ))}
                  </select>
                  <div className="flex items-center gap-1">
                    {INLINE_COLOR_OPTIONS.map(color => (
                      <button
                        key={color.value}
                        type="button"
                        onMouseDown={event => event.preventDefault()}
                        onClick={() => {
                          setInlineColor(color.value);
                          applySelectionStyle(`color: ${color.value}`);
                        }}
                        className="h-6 w-6 rounded-full border border-[#D1CEC7] transition hover:scale-105 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#1A1A1A]/45"
                        style={{
                          backgroundColor: color.value,
                          outline: inlineColor === color.value ? '1px solid #1A1A1A' : 'none',
                        }}
                        aria-label={color.label}
                      />
                    ))}
                  </div>
                  <button type="button" onMouseDown={event => event.preventDefault()} onClick={clearSelectionStyle} className={`${archiveButtonSecondary} min-h-8 px-2 py-1`}>
                    清除
                  </button>
                  {inlineError && <span className="w-full text-[11px] text-[#902A2A]">{inlineError}</span>}
                </div>
              )}

              <textarea
                ref={textRef}
                value={displayBody}
                onChange={e => {
                  setBody(applyPlainTextEditToStyledSource(body, e.target.value));
                  updateSelection();
                }}
                onSelect={updateSelection}
                onKeyUp={updateSelection}
                onMouseUp={updateSelection}
                className="min-h-0 flex-1 resize-none bg-transparent p-6 font-serif text-base leading-[2] text-[#1A1A1A] outline-none whitespace-pre-wrap selection:bg-[#E8E4DB]"
                style={{ fontFamily: "'Noto Serif SC', 'Apple Color Emoji', 'Segoe UI Emoji', serif" }}
                spellCheck={false}
              />
            </section>
          )}

          {(mode === 'write' || mode === 'preview' || mode === 'layout') && preview}

          {mode === 'layout' && (
            <aside className="min-h-0 overflow-y-auto border-l border-[#D1CEC7] bg-[#F9F7F2]">
              <div className="sticky top-0 z-10 border-b border-[#D1CEC7] bg-[#FAFAFA] px-5 py-4">
                <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-[#8C7E6A]">Layout Inspector</p>
                <h3 className="mt-1 font-serif text-lg font-bold text-[#1A1A1A]">排版参数 · {presetName}</h3>
              </div>
              <PresetEditor params={params} onChange={setParams} presets={config.presets} onSavePreset={savePreset} />
              <div className="border-t border-[#D1CEC7] p-5">
                <div className="mb-3 flex items-center justify-between">
                  <div>
                    <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-[#D1CEC7]">Images</p>
                    <h4 className="mt-0.5 font-serif text-lg font-bold text-[#1A1A1A]">图片</h4>
                  </div>
                  <input ref={fileInputRef} type="file" multiple accept="image/*" className="hidden" onChange={handleFilesSelected} />
                  <button type="button" onClick={handlePickImages} disabled={uploading}
                    className="inline-flex min-h-8 items-center gap-1.5 border border-[#1A1A1A] bg-[#1A1A1A] px-3 py-1 font-mono text-[10px] uppercase tracking-widest text-[#F9F7F2] transition-colors hover:bg-[#242321] cursor-pointer disabled:opacity-50">
                    <ImageIcon className="h-3.5 w-3.5" />
                    {uploading ? '上传中' : '添加'}
                  </button>
                </div>
                {uploadError && <p className="mb-2 text-xs text-[#902A2A]">{uploadError}</p>}
                {entry.images.length > 0 && (
                  <div className="mb-3 space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[9px] text-[#8C7E6A] uppercase tracking-wider w-8">尺寸</span>
                      <select value={imageSize} onChange={e => setImageSize(e.target.value as any)}
                        className="flex-1 h-7 min-h-0 border border-[#D1CEC7] bg-white py-0.5 pl-1.5 pr-5 font-mono text-[10px] text-[#1A1A1A] outline-none focus:border-[#1A1A1A]">
                        <option value="sm">小</option>
                        <option value="md">中</option>
                        <option value="lg">大</option>
                        <option value="full">全幅</option>
                      </select>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[9px] text-[#8C7E6A] uppercase tracking-wider w-8">位置</span>
                      <select value={imagePos} onChange={e => { const v = e.target.value as 'top' | 'bottom'; setImagePos(v); localStorage.setItem(`img-pos-${entry.filePath}`, v); }}
                        className="flex-1 h-7 min-h-0 border border-[#D1CEC7] bg-white py-0.5 pl-1.5 pr-5 font-mono text-[10px] text-[#1A1A1A] outline-none focus:border-[#1A1A1A]">
                        <option value="top">上方</option>
                        <option value="bottom">下方</option>
                      </select>
                    </div>
                  </div>
                )}
                {entry.images.length === 0 && !uploadError ? (
                  <p className="text-xs text-[#8C7E6A] leading-relaxed">暂无图片。点击"添加"从本地选择图片，上传后在 A4 纸页末尾展示。</p>
                ) : (
                  <div className="space-y-2 max-h-[240px] overflow-y-auto">
                    {entry.images.map((img, i) => (
                      <div key={i} className="flex items-center gap-2 border border-[#D1CEC7] bg-white px-2.5 py-1.5 text-[11px] font-mono text-[#4A4A4A]">
                        <ImageIcon className="h-3 w-3 shrink-0 text-[#8C7E6A]" />
                        <span className="flex-1 truncate">{img.replace(/\\/g, '/').split('/').pop()}</span>
                        <button type="button" onClick={async (e) => { e.stopPropagation(); const p = img.replace(/\\/g, '/'); await api.deleteImage(p); await onRefresh(); }}
                          className="text-[#902A2A]/60 hover:text-[#902A2A] text-[9px] cursor-pointer">✕</button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </aside>
          )}
        </main>
      </div>

      {globalFontDialog && (
        <div className="fixed inset-0 z-[210] flex items-center justify-center bg-[#1A1A1A]/45 backdrop-blur-sm" onClick={() => setGlobalFontDialog(null)}>
          <div className="w-full max-w-sm rounded-sm border border-[#D1CEC7] bg-[#F9F7F2] p-6 shadow-[0_28px_90px_rgba(44,42,40,0.22)]" onClick={e => e.stopPropagation()}>
            <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-[#8C7E6A]">Font Scope</p>
            <p className="mt-2 font-serif text-lg font-bold text-[#1A1A1A]">应用「{globalFontDialog.fontLabel}」</p>
            <p className="mt-2 text-sm leading-6 text-[#8C7E6A]">
              是否将字体应用到全文？选择“取消”将仅对当前选中的文字生效。
            </p>
            <div className="mt-5 flex justify-end gap-3">
              <button type="button" onClick={() => setGlobalFontDialog(null)} className={archiveButtonSecondary}>取消</button>
              <button type="button" onClick={confirmGlobalFont} className={archiveButtonPrimary}>确定</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
