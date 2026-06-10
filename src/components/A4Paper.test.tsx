// @vitest-environment jsdom
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import A4Paper from './A4Paper';
import type { PageParams } from '../types/diary';

vi.mock('../utils/pagedMarkdown', () => ({
  getPageMetrics: () => ({
    widthPx: 420,
    heightPx: 594,
    contentW: 320,
    contentH: 480,
    padT: 40,
    padB: 40,
    padL: 50,
    padR: 50,
    fontStack: 'serif',
  }),
  getPagedContentClassName: () => 'diary-page-content',
  getPagedContentStyle: () => '',
  paginateDiaryHtml: () => ['<p>Page one</p>', '<p>Page two</p>'],
}));

const params: PageParams = {
  aspectRatio: 0.707,
  marginTop: 20,
  marginBottom: 20,
  marginLeft: 22,
  marginRight: 22,
  shadow: 'light',
  fontFamily: 'Noto Serif SC',
  fontSize: 24,
  lineHeight: 1.9,
  letterSpacing: 0.02,
  paragraphSpacing: 0.8,
  textColor: '#151515',
  textIndent: 2,
  bgColor: '#fbf7f0',
  bgTexture: null,
  bgTextureOpacity: 0,
  imageMode: 'embed',
  floatPadding: 12,
};

describe('A4Paper controlled pagination', () => {
  let host: HTMLDivElement;
  let root: Root;

  beforeEach(() => {
    host = document.createElement('div');
    document.body.appendChild(host);
    root = createRoot(host);
  });

  afterEach(() => {
    act(() => root.unmount());
    host.remove();
  });

  it('renders the controlled page and reports page count', () => {
    const onPageCountChange = vi.fn();

    act(() => {
      root.render(
        <A4Paper
          params={params}
          body="body"
          images={[]}
          pageIndex={1}
          onPageCountChange={onPageCountChange}
          showPageNum
          showInternalControls={false}
        />,
      );
    });

    expect(host.textContent).toContain('Page two');
    expect(onPageCountChange).toHaveBeenCalledWith(2);
  });

  it('can hide internal page controls for an external preview controller', () => {
    act(() => {
      root.render(
        <A4Paper
          params={params}
          body="body"
          images={[]}
          pageIndex={0}
          showPageNum
          showInternalControls={false}
        />,
      );
    });

    expect(host.textContent).toContain('Page one');
    expect(host.textContent).not.toContain('1 / 2');
  });

  it('keeps the existing uncontrolled internal controls by default', () => {
    const onPageIndexChange = vi.fn();

    act(() => {
      root.render(
        <A4Paper
          params={params}
          body="body"
          images={[]}
          onPageIndexChange={onPageIndexChange}
          showPageNum
        />,
      );
    });

    expect(host.textContent).toContain('1 / 2');

    const nextButton = Array.from(host.querySelectorAll('button')).find(button =>
      button.textContent?.includes('下一页'),
    );
    expect(nextButton).toBeTruthy();

    act(() => {
      nextButton?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });

    expect(host.textContent).toContain('Page two');
    expect(onPageIndexChange).toHaveBeenCalledWith(1);
  });
});
