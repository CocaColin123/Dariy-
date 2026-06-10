// @vitest-environment jsdom
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { DiaryConfig, DiaryEntry } from '../types/diary';
import { api } from '../utils/api';
import EditorPage from './EditorPage';

vi.mock('../utils/api', () => ({
  api: {
    writeConfig: vi.fn().mockResolvedValue({}),
    writeDiary: vi.fn().mockResolvedValue({}),
    listImages: vi.fn().mockResolvedValue({ dirs: [], files: [] }),
  },
}));

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
        fontFamily: 'Noto Serif SC',
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

describe('EditorPage archive visual shell', () => {
  let host: HTMLDivElement;
  let root: Root;

  beforeEach(() => {
    host = document.createElement('div');
    document.body.appendChild(host);
    root = createRoot(host);
    vi.clearAllMocks();
  });

  afterEach(() => {
    act(() => root.unmount());
    host.remove();
  });

  it('keeps editor flow while exposing the archive editor visual language', async () => {
    const onBack = vi.fn();
    const onSaved = vi.fn();
    const onConfigChange = vi.fn();

    await act(async () => {
      root.render(
        <EditorPage
          entry={entry}
          config={config}
          onSaved={onSaved}
          onRefresh={vi.fn()}
          onDelete={vi.fn()}
          onBack={onBack}
          onConfigChange={onConfigChange}
        />,
      );
    });

    expect(host.textContent).toContain('Archive Editor');
    expect(host.textContent).toContain('写作');
    expect(host.textContent).toContain('预览');
    expect(host.textContent).toContain('版式');

    const backButton = Array.from(host.querySelectorAll('button')).find((button) =>
      button.textContent?.includes('返回'),
    );
    const saveButton = Array.from(host.querySelectorAll('button')).find((button) =>
      button.textContent?.includes('保存'),
    );

    await act(async () => {
      backButton?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
      saveButton?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });

    expect(onBack).toHaveBeenCalledTimes(1);
    expect(api.writeConfig).toHaveBeenCalledTimes(1);
    expect(api.writeDiary).toHaveBeenCalledWith(entry.filePath, entry.meta, entry.body);
    expect(onConfigChange).toHaveBeenCalledTimes(1);
    expect(onSaved).toHaveBeenCalledTimes(1);
  });
});
