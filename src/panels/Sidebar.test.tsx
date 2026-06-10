// @vitest-environment jsdom
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import Sidebar from './Sidebar';

describe('Sidebar labels', () => {
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

  it('uses clear archive navigation copy', () => {
    act(() => {
      root.render(
        <Sidebar
          view="welcome"
          onNavigate={vi.fn()}
          onOpenPanel={vi.fn()}
        />,
      );
    });

    expect(host.textContent).toContain('Diary Vault');
    expect(host.textContent).toContain('Volume I');
    expect(host.textContent).toContain('录入日记');
    expect(host.textContent).toContain('封面');
    expect(host.textContent).toContain('时间线');
    expect(host.textContent).toContain('导出');
    expect(host.textContent).toContain('API 设置');
    expect(host.textContent).toContain('AI 助手');
  });

  it('keeps project callbacks while using the archive spine structure', () => {
    const onNavigate = vi.fn();
    const onOpenPanel = vi.fn();
    act(() => {
      root.render(
        <Sidebar
          view="timeline"
          onNavigate={onNavigate}
          onOpenPanel={onOpenPanel}
        />,
      );
    });

    expect(host.textContent).toContain('D. Vault');
    expect(host.textContent).toContain('Main');
    expect(host.textContent).toContain('System');
    expect(host.textContent).toContain('Local Sync');

    const exportButton = Array.from(host.querySelectorAll('button')).find(button =>
      button.textContent?.includes('导出'),
    );
    const apiButton = Array.from(host.querySelectorAll('button')).find(button =>
      button.textContent?.includes('API 设置'),
    );
    const chatButton = Array.from(host.querySelectorAll('button')).find(button =>
      button.textContent?.includes('AI 助手'),
    );

    act(() => {
      exportButton?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
      apiButton?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
      chatButton?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });
    expect(onNavigate).toHaveBeenCalledWith('export');
    expect(onOpenPanel).toHaveBeenCalledWith('api');
    expect(onOpenPanel).toHaveBeenCalledWith('chat');
  });
});
