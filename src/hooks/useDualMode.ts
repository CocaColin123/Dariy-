import { useState, useCallback, useEffect } from 'react';

export type ViewMode = 'cockpit' | 'window';

export function useDualMode() {
  const [mode, setMode] = useState<ViewMode>('cockpit');

  const toggle = useCallback(() => {
    setMode(prev => prev === 'cockpit' ? 'window' : 'cockpit');
  }, []);

  const setCockpit = useCallback(() => setMode('cockpit'), []);
  const setWindow = useCallback(() => setMode('window'), []);

  // Shift 键监听
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Shift' && !e.repeat) {
        toggle();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [toggle]);

  return { mode, toggle, setCockpit, setWindow };
}
