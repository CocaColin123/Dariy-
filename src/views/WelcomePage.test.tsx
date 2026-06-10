// @vitest-environment jsdom
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { DiaryEntry } from '../types/diary';
import WelcomePage from './WelcomePage';

const entries: DiaryEntry[] = [
  {
    filePath: '2026/05/2026-05-27.md',
    meta: { date: '2026-05-27', title: '听海' },
    body: 'THIS_BODY_SNIPPET_SHOULD_NOT_RENDER',
    images: [],
  },
  {
    filePath: '2025/12/2025-12-10.md',
    meta: { date: '2025-12-10', title: '冬日' },
    body: 'another entry',
    images: [],
  },
];

describe('WelcomePage magazine cover', () => {
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

  it('keeps diary body excerpts off the welcome cover', () => {
    act(() => {
      root.render(<WelcomePage entries={entries} onNavigate={vi.fn()} onEntry={vi.fn()} />);
    });

    expect(host.textContent).toContain('落笔');
    expect(host.textContent).not.toContain('THIS_BODY_SNIPPET_SHOULD_NOT_RENDER');
  });

  it('keeps start writing as the primary action', () => {
    const onEntry = vi.fn();

    act(() => {
      root.render(<WelcomePage entries={entries} onNavigate={vi.fn()} onEntry={onEntry} />);
    });

    const startButton = Array.from(host.querySelectorAll('button')).find((button) =>
      button.textContent?.includes('开始录入'),
    );

    expect(startButton).toBeTruthy();

    act(() => {
      startButton?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });

    expect(onEntry).toHaveBeenCalledTimes(1);
  });

  it('keeps timeline navigation wired to the project router', () => {
    const onNavigate = vi.fn();

    act(() => {
      root.render(<WelcomePage entries={entries} onNavigate={onNavigate} onEntry={vi.fn()} />);
    });

    const timelineButton = Array.from(host.querySelectorAll('button')).find((button) =>
      button.textContent?.includes('进入时间线'),
    );

    expect(timelineButton).toBeTruthy();

    act(() => {
      timelineButton?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });

    expect(onNavigate).toHaveBeenCalledWith('timeline');
  });
});
