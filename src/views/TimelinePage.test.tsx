// @vitest-environment jsdom
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { DiaryEntry } from '../types/diary';
import TimelinePage from './TimelinePage';

const entries: DiaryEntry[] = [
  {
    filePath: '2026/06/2026-06-01.md',
    meta: { date: '2026-06-01', title: '雨天札记', tags: ['雨声'] },
    body: '窗边的雨声和灯光。',
    images: [],
  },
  {
    filePath: '2026/05/2026-05-20.md',
    meta: { date: '2026-05-20', title: '深夜散步' },
    body: '路灯把影子拉得很长。',
    images: [],
  },
];

describe('TimelinePage', () => {
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

  it('renders the chronological header with entry count', () => {
    act(() => {
      root.render(<TimelinePage entries={entries} onSelect={vi.fn()} />);
    });

    expect(host.textContent).toContain('CHRONOLOGICAL ARCHIVE');
    expect(host.textContent).toContain('ENTRIES: 2');
  });

  it('renders month headers in the new format', () => {
    act(() => {
      root.render(<TimelinePage entries={entries} onSelect={vi.fn()} />);
    });

    expect(host.textContent).toContain('Month / Volume');
  });

  it('selects the original diary entry on card click', () => {
    const onSelect = vi.fn();

    act(() => {
      root.render(<TimelinePage entries={entries} onSelect={onSelect} />);
    });

    // 短篇(<100字)会渲染为 quote 卡片，正文在卡片中可见；标题不单独显示
    const entryButton = Array.from(host.querySelectorAll('button')).find((button) =>
      button.textContent?.includes('路灯把影子拉得很长') || button.textContent?.includes('深夜散步'),
    );

    expect(entryButton).toBeTruthy();

    act(() => {
      entryButton?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });

    expect(onSelect).toHaveBeenCalledWith(entries[1]);
  });
});
