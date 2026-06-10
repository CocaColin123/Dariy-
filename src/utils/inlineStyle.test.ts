import { describe, expect, it } from 'vitest';
import {
  applySelectionSpanStyle,
  applyPlainTextEditToStyledSource,
  clearSelectionInlineStyles,
  displaySelectionToSourceSelection,
  sourceSelectionToDisplaySelection,
  stripInlineStyleMarkup,
  wrapSelectionWithFontSize,
  wrapSelectionWithSpanStyle,
} from './inlineStyle';

describe('inline style helpers', () => {
  it('wraps a single-line text selection with inline font size markup', () => {
    const result = wrapSelectionWithFontSize('abcd', 1, 3, 1.2);

    expect(result?.text).toBe('a<span style="font-size: 1.20em">bc</span>d');
    expect(result?.selectionStart).toBe('a<span style="font-size: 1.20em">'.length);
    expect(result?.selectionEnd).toBe('a<span style="font-size: 1.20em">bc'.length);
  });

  it('wraps a single-line text selection with arbitrary span style markup', () => {
    const result = wrapSelectionWithSpanStyle('abcd', 1, 3, 'color: #8f4a3a');

    expect(result?.text).toBe('a<span style="color: #8f4a3a">bc</span>d');
  });

  it('replaces an existing inline color instead of nesting span tags', () => {
    const source = 'a<span style="color: #8f3d32">bc</span>d';
    const start = source.indexOf('bc');
    const result = applySelectionSpanStyle(source, start, start + 2, 'color', '#3f5760');

    expect(result?.text).toBe('a<span style="color: #3f5760">bc</span>d');
    expect(result?.text.match(/<span/g)).toHaveLength(1);
  });

  it('merges a new inline style with an existing span style', () => {
    const source = 'a<span style="font-size: 1.18em">bc</span>d';
    const start = source.indexOf('bc');
    const result = applySelectionSpanStyle(source, start, start + 2, 'color', '#3f5760');

    expect(result?.text).toBe('a<span style="font-size: 1.18em; color: #3f5760">bc</span>d');
    expect(result?.text.match(/<span/g)).toHaveLength(1);
  });

  it('builds a plain editor value without exposing inline style tags', () => {
    expect(stripInlineStyleMarkup('a<span style="font-family: x">bc</span>d')).toBe('abcd');
  });

  it('maps a plain editor selection back to the styled source text', () => {
    const source = 'a<span style="font-family: x">bc</span>d';
    const result = displaySelectionToSourceSelection(source, 1, 3);

    expect(source.slice(result.start, result.end)).toBe('bc');
  });

  it('maps a styled source selection ending at a closing tag back to plain editor offsets', () => {
    const source = '<span style="font-size: 1.20em">abc</span>d';
    const start = source.indexOf('abc');
    const result = sourceSelectionToDisplaySelection(source, start, start + 3);

    expect(result).toEqual({ start: 0, end: 3 });
  });

  it('keeps existing inline style tags outside a plain text edit', () => {
    const source = 'a<span style="font-family: x">bc</span>d';
    const result = applyPlainTextEditToStyledSource(source, 'aXbcd');

    expect(result).toBe('aX<span style="font-family: x">bc</span>d');
  });

  it('wraps multiline selections correctly', () => {
    const result = wrapSelectionWithFontSize('a\nb', 0, 3, 1.2);

    expect(result).not.toBeNull();
    expect(result!.text).toBe('<span style="font-size: 1.20em">a\nb</span>');
  });

  it('removes span style tags when the selected range includes the wrapper', () => {
    const source = 'a<span style="color: red">bc</span>d';
    const result = clearSelectionInlineStyles(source, 1, source.length - 1);

    expect(result?.text).toBe('abcd');
  });

  it('removes an enclosing span style wrapper when only inner text is selected', () => {
    const source = 'a<span style="font-size: 1.20em">bc</span>d';
    const start = source.indexOf('bc');
    const result = clearSelectionInlineStyles(source, start, start + 2);

    expect(result?.text).toBe('abcd');
    expect(result?.selectionStart).toBe(1);
    expect(result?.selectionEnd).toBe(3);
  });
});
