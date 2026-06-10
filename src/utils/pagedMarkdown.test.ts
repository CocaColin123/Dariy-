import { describe, expect, it } from 'vitest';
import {
  findFittingTextBreak,
  getPagedContentStyle,
  paginateHtmlBlocks,
  renderDiaryMarkdown,
} from './pagedMarkdown';
import type { PageParams } from '../types/diary';

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
  textColor: '#2a2a2a',
  textIndent: 2,
  bgColor: '#fdfaf5',
  bgTexture: null,
  bgTextureOpacity: 0,
  imageMode: 'embed',
  floatPadding: 12,
};

describe('renderDiaryMarkdown', () => {
  it('treats a single pasted newline as a new diary paragraph', () => {
    const html = renderDiaryMarkdown('line one\nline two');

    expect(html).not.toContain('<br>');
    expect(html).toContain('<p>line one</p>');
    expect(html).toContain('<p>line two</p>');
    expect(html).toContain('line one');
    expect(html).toContain('line two');
  });

  it('preserves inline font-size markup for selected text styling', () => {
    const html = renderDiaryMarkdown('今天<span style="font-size: 1.18em">很开心</span>');

    expect(html).toContain('<span style="font-size: 1.18em">很开心</span>');
  });
});

describe('findFittingTextBreak', () => {
  it('splits long unspaced text at the largest fitting character count', () => {
    const idx = findFittingTextBreak('abcdef', (text) => text.length <= 4);

    expect(idx).toBe(4);
  });

  it('prefers a natural whitespace break when one is available', () => {
    const idx = findFittingTextBreak('alpha beta gamma', (text) => text.length <= 11);

    expect(idx).toBe(10);
  });
});

describe('getPagedContentStyle', () => {
  it('keeps paragraph indentation and typed spaces visible', () => {
    const css = getPagedContentStyle(params);

    expect(css).toContain('text-indent: 2em');
    expect(css).toContain('white-space: break-spaces');
  });

  it('does not indent paragraph continuations split across pages', () => {
    const css = getPagedContentStyle(params);

    expect(css).toContain('.diary-paragraph-continuation');
    expect(css).toContain('text-indent: 0');
  });
});

describe('paginateHtmlBlocks', () => {
  it('splits a paragraph into the remaining space before starting a new page', () => {
    const pages = paginateHtmlBlocks(
      [
        { html: '<p>aaaaaa</p>', text: 'aaaaaa', splittable: true },
        { html: '<p>bbbbbb</p>', text: 'bbbbbb', splittable: true },
      ],
      10,
      (html) => html.join('').replace(/<[^>]+>/g, '').length,
    );

    expect(pages).toEqual([
      '<p>aaaaaa</p><p>bbbb</p>',
      '<p class="diary-paragraph-continuation">bb</p>',
    ]);
  });
});
