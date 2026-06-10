import { useEffect, useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { PageParams } from '../types/diary';
import {
  getPagedContentClassName,
  getPageMetrics,
  getPagedContentStyle,
  paginateDiaryHtml,
} from '../utils/pagedMarkdown';
import ImageStack from './ImageStack';

interface Props {
  params: PageParams;
  body: string;
  images: string[];
  imageSize?: 'sm' | 'md' | 'lg' | 'full';
  imagePos?: 'top' | 'bottom';
  showPageNum?: boolean;
  pageIndex?: number;
  onPageIndexChange?: (nextIndex: number) => void;
  onPageCountChange?: (pageCount: number) => void;
  showInternalControls?: boolean;
}

export default function A4Paper({
  params,
  body,
  images,
  imageSize,
  imagePos = 'top',
  showPageNum,
  pageIndex,
  onPageIndexChange,
  onPageCountChange,
  showInternalControls = true,
}: Props) {
  const [internalPageIdx, setInternalPageIdx] = useState(0);

  const metrics = useMemo(() => getPageMetrics(params), [params]);
  const pages = useMemo(() => paginateDiaryHtml(body, params), [body, params]);
  const contentCss = useMemo(() => getPagedContentStyle(params), [params]);
  const contentClassName = getPagedContentClassName();
  const isControlled = pageIndex !== undefined;
  const activePageIdx = isControlled ? pageIndex : internalPageIdx;

  useEffect(() => {
    onPageCountChange?.(pages.length);
  }, [onPageCountChange, pages.length]);

  useEffect(() => {
    const maxIdx = Math.max(0, pages.length - 1);
    const nextIdx = Math.min(activePageIdx, maxIdx);
    if (nextIdx === activePageIdx) return;
    if (isControlled) onPageIndexChange?.(nextIdx);
    else setInternalPageIdx(nextIdx);
  }, [activePageIdx, isControlled, onPageIndexChange, pages.length]);

  const setPageIdx = (nextIndex: number | ((current: number) => number)) => {
    const maxIdx = Math.max(0, pages.length - 1);
    const rawNext = typeof nextIndex === 'function' ? nextIndex(activePageIdx) : nextIndex;
    const nextIdx = Math.max(0, Math.min(maxIdx, rawNext));
    if (!isControlled) setInternalPageIdx(nextIdx);
    onPageIndexChange?.(nextIdx);
  };

  const safeIdx = Math.max(0, Math.min(activePageIdx, pages.length - 1));
  const pageHtml = pages[safeIdx] || '';

  const paperStyle: React.CSSProperties = {
    width: metrics.widthPx,
    ...(images.length > 0 ? { minHeight: metrics.heightPx } : { height: metrics.heightPx }),
    paddingTop: metrics.padT,
    paddingBottom: metrics.padB,
    paddingLeft: metrics.padL,
    paddingRight: metrics.padR,
    fontFamily: metrics.fontStack,
    fontSize: params.fontSize,
    lineHeight: params.lineHeight,
    letterSpacing: `${params.letterSpacing}em`,
    color: params.textColor,
    backgroundColor: params.bgColor,
    boxShadow: params.shadow === 'none' ? 'none'
      : params.shadow === 'light' ? '0 2px 20px rgba(0,0,0,0.12)'
      : '0 4px 40px rgba(0,0,0,0.2)',
    ...(images.length > 0 ? {} : { overflow: 'hidden' }),
    wordBreak: 'break-word',
    overflowWrap: 'anywhere',
  };

  if (!body?.trim()) {
    return (
      <div className="flex flex-col items-center my-4">
        <div className="mx-auto" style={paperStyle} />
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center my-4">
      <div className="mx-auto" style={paperStyle}>
        <style>{contentCss}</style>
        {safeIdx === (pages.length > 1 ? pages.length - 1 : 0) && imagePos === 'top' && images.length > 0 && (
          <div className="mb-4">
            <ImageStack images={images} size={imageSize} />
          </div>
        )}
        <div
          className={`${contentClassName} [&_em]:italic [&_strong]:font-semibold`}
          dangerouslySetInnerHTML={{ __html: pageHtml }}
        />
        {safeIdx === (pages.length > 1 ? pages.length - 1 : 0) && imagePos === 'bottom' && images.length > 0 && (
          <div className="mt-4">
            <ImageStack images={images} size={imageSize} />
          </div>
        )}
      </div>

      {showPageNum && showInternalControls && pages.length > 1 && (
        <div className="flex items-center gap-4 mt-5 select-none">
          <button
            onClick={() => setPageIdx(i => Math.max(0, i - 1))}
            disabled={safeIdx === 0}
            className="flex items-center gap-1 rounded border border-white/12 px-3 py-1.5 text-xs text-white/45 hover:border-white/25 hover:text-white disabled:opacity-15 transition-colors"
          >
            <ChevronLeft className="h-4 w-4" /> 上一页
          </button>
          <span className="text-xs text-white/30 tabular-nums">
            {safeIdx + 1} / {pages.length}
          </span>
          <button
            onClick={() => setPageIdx(i => Math.min(pages.length - 1, i + 1))}
            disabled={safeIdx >= pages.length - 1}
            className="flex items-center gap-1 rounded border border-white/12 px-3 py-1.5 text-xs text-white/45 hover:border-white/25 hover:text-white disabled:opacity-15 transition-colors"
          >
            下一页 <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      )}

    </div>
  );
}

export function splitPages(body: string): string[] {
  const parts = body.split(/\n*---\s*page\s*---\n*/);
  return parts.length === 0 ? [''] : parts;
}
