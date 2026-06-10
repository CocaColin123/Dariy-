export interface InlineStyleResult {
  text: string;
  selectionStart: number;
  selectionEnd: number;
}

export interface SelectionRange {
  start: number;
  end: number;
}

function spanTagLengthAt(source: string, index: number): number {
  const rest = source.slice(index);
  const match = rest.match(/^<\/?span(?:\s+style="[^"]*")?>/);
  return match ? match[0].length : 0;
}

function displayIndexToSourceIndex(source: string, target: number, bias: 'before-tags' | 'after-tags'): number {
  let displayIndex = 0;

  for (let i = 0; i < source.length;) {
    if (displayIndex === target) {
      if (bias === 'after-tags') {
        let next = i;
        let tagLength = spanTagLengthAt(source, next);
        while (tagLength > 0 && !source.startsWith('</span>', next)) {
          next += tagLength;
          tagLength = spanTagLengthAt(source, next);
        }
        return next;
      }
      return i;
    }

    const tagLength = spanTagLengthAt(source, i);
    if (tagLength > 0) {
      i += tagLength;
      continue;
    }

    i += 1;
    displayIndex += 1;
  }

  return source.length;
}

export function stripInlineStyleMarkup(source: string): string {
  return source.replace(/<\/?span(?:\s+style="[^"]*")?>/g, '');
}

export function displaySelectionToSourceSelection(source: string, start: number, end: number): SelectionRange {
  return {
    start: displayIndexToSourceIndex(source, start, 'after-tags'),
    end: displayIndexToSourceIndex(source, end, 'before-tags'),
  };
}

export function sourceSelectionToDisplaySelection(source: string, start: number, end: number): SelectionRange {
  let displayIndex = 0;
  let displayStart = 0;
  let displayEnd = 0;

  for (let i = 0; i < source.length;) {
    if (i === start) displayStart = displayIndex;
    if (i === end) displayEnd = displayIndex;

    const tagLength = spanTagLengthAt(source, i);
    if (tagLength > 0) {
      i += tagLength;
      continue;
    }

    i += 1;
    displayIndex += 1;
  }

  if (start >= source.length) displayStart = displayIndex;
  if (end >= source.length) displayEnd = displayIndex;

  return { start: displayStart, end: displayEnd };
}

export function applyPlainTextEditToStyledSource(source: string, nextDisplay: string): string {
  const currentDisplay = stripInlineStyleMarkup(source);
  if (currentDisplay === nextDisplay) return source;

  let prefix = 0;
  while (
    prefix < currentDisplay.length &&
    prefix < nextDisplay.length &&
    currentDisplay[prefix] === nextDisplay[prefix]
  ) {
    prefix += 1;
  }

  let suffix = 0;
  while (
    suffix < currentDisplay.length - prefix &&
    suffix < nextDisplay.length - prefix &&
    currentDisplay[currentDisplay.length - 1 - suffix] === nextDisplay[nextDisplay.length - 1 - suffix]
  ) {
    suffix += 1;
  }

  const sourceStart = displayIndexToSourceIndex(source, prefix, 'before-tags');
  const sourceEnd = displayIndexToSourceIndex(source, currentDisplay.length - suffix, 'before-tags');
  const inserted = nextDisplay.slice(prefix, nextDisplay.length - suffix);

  return `${source.slice(0, sourceStart)}${inserted}${source.slice(sourceEnd)}`;
}

function selectedText(source: string, start: number, end: number): string | null {
  if (end <= start) return null;
  const selected = source.slice(start, end);
  if (!selected.trim()) return null;
  return selected;
}

export function wrapSelectionWithSpanStyle(
  source: string,
  start: number,
  end: number,
  style: string,
): InlineStyleResult | null {
  const selected = selectedText(source, start, end);
  if (!selected) return null;

  const tag = `<span style="${style}">`;
  const close = '</span>';
  const replacement = `${tag}${selected}${close}`;

  return {
    text: `${source.slice(0, start)}${replacement}${source.slice(end)}`,
    selectionStart: start + tag.length,
    selectionEnd: start + tag.length + selected.length,
  };
}

function mergeStyle(style: string, property: string, value: string): string {
  const next = new Map<string, string>();
  for (const part of style.split(';')) {
    const [rawKey, ...rawValue] = part.split(':');
    const key = rawKey?.trim().toLowerCase();
    const partValue = rawValue.join(':').trim();
    if (key && partValue) next.set(key, partValue);
  }
  next.set(property.toLowerCase(), value);
  return [...next.entries()].map(([key, partValue]) => `${key}: ${partValue}`).join('; ');
}

export function applySelectionSpanStyle(
  source: string,
  start: number,
  end: number,
  property: string,
  value: string,
): InlineStyleResult | null {
  const selected = selectedText(source, start, end);
  if (!selected) return null;

  const before = source.slice(0, start);
  const after = source.slice(end);
  const openStart = before.lastIndexOf('<span style="');
  const lastCloseBefore = before.lastIndexOf('</span>');
  const closeOffset = after.indexOf('</span>');

  if (openStart > lastCloseBefore && closeOffset >= 0) {
    const openEnd = source.indexOf('">', openStart);
    if (openEnd >= 0 && openEnd + 2 <= start) {
      const currentStyle = source.slice(openStart + '<span style="'.length, openEnd);
      const mergedStyle = mergeStyle(currentStyle, property, value);
      const nextOpenTag = `<span style="${mergedStyle}">`;
      const text = `${source.slice(0, openStart)}${nextOpenTag}${source.slice(openEnd + 2)}`;
      const delta = nextOpenTag.length - (openEnd + 2 - openStart);
      return {
        text,
        selectionStart: start + delta,
        selectionEnd: end + delta,
      };
    }
  }

  return wrapSelectionWithSpanStyle(source, start, end, `${property}: ${value}`);
}

export function wrapSelectionWithFontSize(
  source: string,
  start: number,
  end: number,
  scale: number,
): InlineStyleResult | null {
  const safeScale = Math.max(0.6, Math.min(2.4, scale));
  return applySelectionSpanStyle(source, start, end, 'font-size', `${safeScale.toFixed(2)}em`);
}

export function clearSelectionInlineStyles(source: string, start: number, end: number): InlineStyleResult | null {
  if (end <= start) return null;

  const selected = source.slice(start, end);
  if (selected.includes('<span')) {
    const replacement = selected.replace(/<\/?span(?:\s+style="[^"]*")?>/g, '');
    return {
      text: `${source.slice(0, start)}${replacement}${source.slice(end)}`,
      selectionStart: start,
      selectionEnd: start + replacement.length,
    };
  }

  const before = source.slice(0, start);
  const after = source.slice(end);
  const openMatch = before.match(/<span\s+style="[^"]*">[^<]*$/);
  const closeIndex = after.indexOf('</span>');
  if (!openMatch || closeIndex < 0) return null;

  const openStart = openMatch.index ?? 0;
  const openText = openMatch[0];
  const openTagEnd = openStart + openText.indexOf('>') + 1;
  const closeStart = end + closeIndex;
  const inner = source.slice(openTagEnd, closeStart);

  return {
    text: `${source.slice(0, openStart)}${inner}${source.slice(closeStart + '</span>'.length)}`,
    selectionStart: start - (openTagEnd - openStart),
    selectionEnd: end - (openTagEnd - openStart),
  };
}
