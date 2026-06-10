// @vitest-environment jsdom
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { DiaryConfig, DiaryEntry } from '../types/diary';
import EntryWindow from './EntryWindow';
import ExportPage from './ExportPage';
import ReaderPage from './ReaderPage';

const entry: DiaryEntry = {
  filePath: '2026/05/2026-05-27.md',
  meta: { date: '2026.5.27 周三', title: '听海', location: '上海', tags: ['生活'] },
  body: '今天去听海。',
  images: [],
};

const config: DiaryConfig = {
  vaultPath: '',
  defaultPreset: 'default',
  presets: [
    {
      name: 'default',
      params: {
        aspectRatio: 1.414,
        marginTop: 80,
        marginBottom: 80,
        marginLeft: 72,
        marginRight: 72,
        shadow: 'light',
        fontFamily: 'serif',
        fontSize: 16,
        lineHeight: 1.8,
        letterSpacing: 0,
        paragraphSpacing: 1,
        textColor: '#1A1A1A',
        textIndent: 2,
        bgColor: '#F9F7F2',
        bgTexture: null,
        bgTextureOpacity: 0,
        imageMode: 'embed',
        floatPadding: 16,
      },
    },
  ],
  api: {
    provider: 'DeepSeek',
    baseUrl: '',
    apiKey: '',
    model: '',
    maxTokens: 1000,
    temperature: 0.2,
    topP: 0.8,
  },
  chatHistory: [],
};

describe('archive utility pages visual shell', () => {
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

  it('keeps Reader callbacks while using the archive reader shell', () => {
    const onBack = vi.fn();
    const onEdit = vi.fn();

    act(() => {
      root.render(
        <ReaderPage
          entry={entry}
          config={config}
          onBack={onBack}
          onEdit={onEdit}
          onRefresh={vi.fn()}
          onToggleLock={vi.fn()}
          onDelete={vi.fn()}
        />,
      );
    });

    expect(host.textContent).toContain('Archive Reader');

    const backButton = Array.from(host.querySelectorAll('button')).find((button) =>
      button.textContent?.includes('返回时间线'),
    );
    const editButton = Array.from(host.querySelectorAll('button')).find((button) =>
      button.textContent?.includes('编辑'),
    );

    act(() => {
      backButton?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
      editButton?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });

    expect(onBack).toHaveBeenCalledTimes(1);
    expect(onEdit).toHaveBeenCalledWith(entry);
  });

  it('keeps Entry cancel flow while using the archive desk shell', () => {
    const onCancel = vi.fn();

    act(() => {
      root.render(<EntryWindow config={config} onDone={vi.fn()} onCancel={onCancel} />);
    });

    expect(host.textContent).toContain('Archive Desk');

    const textarea = host.querySelector('textarea');
    expect(textarea?.getAttribute('placeholder')).toContain('日记原文');

    const backButton = Array.from(host.querySelectorAll('button')).find((button) =>
      button.textContent?.includes('返回'),
    );

    act(() => {
      backButton?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });

    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it('keeps Export selection flow while using the export registry shell', () => {
    act(() => {
      root.render(<ExportPage entries={[entry]} onBack={vi.fn()} />);
    });

    expect(host.textContent).toContain('Export Registry');

    const exportButton = Array.from(host.querySelectorAll('button')).find((button) =>
      button.textContent?.includes('导出所选'),
    ) as HTMLButtonElement | undefined;
    expect(exportButton?.disabled).toBe(true);

    const entryButton = Array.from(host.querySelectorAll('button')).find((button) =>
      button.textContent?.includes('听海'),
    );

    act(() => {
      entryButton?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });

    expect(exportButton?.disabled).toBe(false);
  });
});
