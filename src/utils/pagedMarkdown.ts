import { marked } from 'marked';
import type { PageParams } from '../types/diary';
import { renderMath } from './renderMath';

const MM_TO_PX = 3.78;
const PAGE_W_MM = 210;
const CONTENT_CLASS = 'diary-page-content';
const CONTINUATION_CLASS = 'diary-paragraph-continuation';

export interface HtmlBlock {
  html: string;
  text: string;
  splittable: boolean;
}

export interface PageMetrics {
  widthPx: number;
  heightPx: number;
  contentW: number;
  contentH: number;
  padT: number;
  padB: number;
  padL: number;
  padR: number;
  fontStack: string;
}

export function getPageMetrics(params: PageParams): PageMetrics {
  const widthPx = PAGE_W_MM * MM_TO_PX;
  const padL = params.marginLeft * MM_TO_PX;
  const padR = params.marginRight * MM_TO_PX;
  const padT = params.marginTop * MM_TO_PX;
  const padB = params.marginBottom * MM_TO_PX;
  const heightPx = widthPx / params.aspectRatio;

  return {
    widthPx,
    heightPx,
    contentW: widthPx - padL - padR,
    contentH: heightPx - padT - padB,
    padT,
    padB,
    padL,
    padR,
    fontStack: `${params.fontFamily}, 'Noto Serif SC', 'Apple Color Emoji', 'Segoe UI Emoji', serif`,
  };
}

export function renderDiaryMarkdown(source: string): string {
  const paragraphs = source
    .replace(/\r\n?/g, '\n')
    .split(/\n+/)
    .map(line => line.trimEnd())
    .filter(line => line.trim().length > 0);

  const html = paragraphs
    .map(line => {
      if (/^\s{0,3}#{1,6}\s/.test(line) || /^\s{0,3}[-*+]\s/.test(line) || /^\s{0,3}>\s/.test(line)) {
        return marked.parse(line, { breaks: false, gfm: true }) as string;
      }
      return paragraphHtml(marked.parseInline(line, { gfm: true }) as string);
    })
    .join('');

  return renderMath(html);
}

export function findFittingTextBreak(
  text: string,
  fits: (candidate: string) => boolean,
): number {
  if (!text) return 0;
  if (fits(text)) return text.length;

  let low = 0;
  let high = text.length;
  while (low < high) {
    const mid = Math.ceil((low + high) / 2);
    if (fits(text.slice(0, mid))) low = mid;
    else high = mid - 1;
  }

  if (low <= 1) return low;

  const naturalBreak = text.slice(0, low + 1).search(/\s+\S*$/);
  return naturalBreak > 0 ? naturalBreak : low;
}

function pageCss(params: PageParams, metrics: PageMetrics): string {
  return `
    box-sizing: border-box;
    width: ${metrics.contentW}px;
    font-family: ${metrics.fontStack};
    font-size: ${params.fontSize}px;
    line-height: ${params.lineHeight};
    letter-spacing: ${params.letterSpacing}em;
    word-break: break-word;
    overflow-wrap: anywhere;
  `;
}

function contentStyle(params: PageParams): string {
  return `
    .${CONTENT_CLASS} { white-space: break-spaces; }
    .${CONTENT_CLASS} p { margin: 0 0 ${params.paragraphSpacing}em 0; text-indent: ${params.textIndent}em; }
    .${CONTENT_CLASS} p.${CONTINUATION_CLASS} { text-indent: 0; }
    .${CONTENT_CLASS} h1, .${CONTENT_CLASS} h2, .${CONTENT_CLASS} h3 { margin: 1.6em 0 0.75em; font-weight: 600; line-height: 1.35; }
    .${CONTENT_CLASS} h1 { font-size: 1.45em; }
    .${CONTENT_CLASS} h2 { font-size: 1.25em; }
    .${CONTENT_CLASS} h3 { font-size: 1.1em; }
    .${CONTENT_CLASS} ul, .${CONTENT_CLASS} ol { margin: 0 0 ${params.paragraphSpacing}em 1.5em; padding: 0; }
    .${CONTENT_CLASS} blockquote { margin: 0 0 ${params.paragraphSpacing}em 1em; padding-left: 1em; border-left: 1px solid currentColor; opacity: 0.8; }
    .${CONTENT_CLASS} img { display: none; }
    .${CONTENT_CLASS} .katex { font-size: 1em; }
  `;
}

function makeMeasureBox(params: PageParams, metrics: PageMetrics): HTMLDivElement {
  const box = document.createElement('div');
  box.style.cssText = `
    position: absolute;
    left: -10000px;
    top: 0;
    visibility: hidden;
    pointer-events: none;
    ${pageCss(params, metrics)}
  `;
  document.body.appendChild(box);
  return box;
}

function measureHtml(box: HTMLDivElement, params: PageParams, html: string[]): number {
  box.innerHTML = `<style>${contentStyle(params)}</style><div class="${CONTENT_CLASS}">${html.join('')}</div>`;
  return box.scrollHeight;
}

function plainTextFrom(node: Node): string {
  if (node.nodeType === Node.TEXT_NODE) return node.textContent || '';
  if (node instanceof HTMLBRElement) return '\n';
  return Array.from(node.childNodes).map(plainTextFrom).join('');
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function paragraphHtml(text: string): string {
  return `<p>${text.replace(/\n/g, '<br>')}</p>`;
}

function plainParagraphHtml(text: string, continuation = false): string {
  const className = continuation ? ` class="${CONTINUATION_CLASS}"` : '';
  return `<p${className}>${escapeHtml(text).replace(/\n/g, '<br>')}</p>`;
}

function canSplitBlock(el: Element): boolean {
  return el.tagName.toLowerCase() === 'p';
}

export function paginateHtmlBlocks(
  blocks: HtmlBlock[],
  contentH: number,
  measure: (html: string[]) => number,
): string[] {
  const pages: string[] = [];
  let current: string[] = [];

  const pushPage = () => {
    if (current.length > 0) pages.push(current.join(''));
    current = [];
  };

  for (const block of blocks) {
    if (measure([...current, block.html]) <= contentH) {
      current.push(block.html);
      continue;
    }

    if (!block.splittable) {
      pushPage();
      current.push(block.html);
      continue;
    }

    let remaining = block.text;
    let emittedChunk = false;
    while (remaining.length > 0) {
      const fitIdx = findFittingTextBreak(remaining, (candidate) =>
        measure([...current, plainParagraphHtml(candidate, emittedChunk)]) <= contentH,
      );

      if (fitIdx <= 0) {
        if (current.length > 0) {
          pushPage();
          continue;
        }
        current.push(plainParagraphHtml(remaining.slice(0, 1), emittedChunk));
        remaining = remaining.slice(1);
        emittedChunk = true;
        pushPage();
        continue;
      }

      current.push(plainParagraphHtml(remaining.slice(0, fitIdx), emittedChunk));
      emittedChunk = true;
      remaining = remaining.slice(fitIdx).replace(/^[ \t]+/, '');
      if (remaining.length > 0) pushPage();
    }
  }

  pushPage();
  return pages.length > 0 ? pages : [''];
}

export function paginateDiaryHtml(body: string, params: PageParams): string[] {
  const raw = body ?? '';
  if (!raw.trim()) return [''];
  if (typeof document === 'undefined') return [renderDiaryMarkdown(raw)];

  const metrics = getPageMetrics(params);
  const source = document.createElement('div');
  source.innerHTML = renderDiaryMarkdown(raw);
  const blocks = Array.from(source.children).map((el): HtmlBlock => ({
    html: el.outerHTML,
    text: plainTextFrom(el),
    splittable: canSplitBlock(el),
  }));
  if (blocks.length === 0) return [''];

  const measureBox = makeMeasureBox(params, metrics);
  try {
    return paginateHtmlBlocks(
      blocks,
      metrics.contentH,
      (html) => measureHtml(measureBox, params, html),
    );
  } finally {
    document.body.removeChild(measureBox);
  }
}

export function getPagedContentStyle(params: PageParams): string {
  return contentStyle(params);
}

export function getPagedContentClassName(): string {
  return CONTENT_CLASS;
}
