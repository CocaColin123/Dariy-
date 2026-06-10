import { marked } from 'marked';
import { renderMath } from './renderMath';
import type { PageParams } from '../types/diary';

const MM_TO_PX = 3.78;
const PAGE_W_MM = 210;

interface PaginateInput {
  body: string;
  params: PageParams;
}

export function paginateBody({ body, params }: PaginateInput): string[][] {
  const widthPx = PAGE_W_MM * MM_TO_PX;
  const padL = params.marginLeft * MM_TO_PX;
  const padR = params.marginRight * MM_TO_PX;
  const padT = params.marginTop * MM_TO_PX;
  const padB = params.marginBottom * MM_TO_PX;
  const contentW = widthPx - padL - padR;
  const pageH = widthPx / params.aspectRatio;
  const contentH = pageH - padT - padB;
  const fontStack = `${params.fontFamily}, 'Noto Serif SC', 'Apple Color Emoji', 'Segoe UI Emoji', serif`;
  const ps = `${params.paragraphSpacing}em`;

  if (!body?.trim()) return [['']];

  const html = marked.parse(body) as string;
  const mathHtml = renderMath(html);

  // Parse into element strings
  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = mathHtml;
  const elements = Array.from(tempDiv.children).map(el => el.outerHTML);

  if (elements.length === 0) return [['']];

  const result: string[][] = [];
  let currentPage: string[] = [];

  function measurePage(els: string[]): number {
    const testDiv = document.createElement('div');
    testDiv.style.cssText = `
      position: absolute; left: -9999px; top: 0;
      width: ${contentW}px;
      font-family: ${fontStack};
      font-size: ${params.fontSize}px;
      line-height: ${params.lineHeight};
      letter-spacing: ${params.letterSpacing}em;
      text-indent: ${params.textIndent}em;
      word-break: break-word;
      overflow-wrap: break-word;
    `;
    testDiv.innerHTML = `<style>
      p { margin-bottom: ${ps}; margin-top: 0; }
      h2 { margin-top: 2em; margin-bottom: 0.75em; font-size: 1.25em; font-weight: 600; }
      .katex { font-size: 1em; }
    </style>${els.join('')}`;
    document.body.appendChild(testDiv);
    const h = testDiv.scrollHeight;
    document.body.removeChild(testDiv);
    return h;
  }

  for (const el of elements) {
    const withThis = [...currentPage, el];
    const h = measurePage(withThis);

    if (h > contentH) {
      if (currentPage.length > 0) {
        result.push(currentPage);
        currentPage = [el];
      } else {
        // Single element overflows — must take it
        result.push([el]);
        currentPage = [];
      }
    } else {
      currentPage = withThis;
    }
  }

  if (currentPage.length > 0) result.push(currentPage);
  if (result.length === 0) result.push(['']);

  return result;
}
