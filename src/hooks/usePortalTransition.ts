import { useState, useCallback, useRef } from 'react';

export type PortalState = 'idle' | 'closing' | 'black' | 'opening';

export function usePortalTransition() {
  const [state, setState] = useState<PortalState>('idle');
  const blackTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const enter = useCallback((onBlack?: () => void) => {
    setState('closing');
    // 正放约 1.5s 后触发黑屏
    blackTimer.current = setTimeout(() => {
      setState('black');
      onBlack?.();
      // 黑屏 0.5s 后倒放
      blackTimer.current = setTimeout(() => {
        setState('opening');
        // 倒放 1.5s 后结束
        blackTimer.current = setTimeout(() => {
          setState('idle');
        }, 1500);
      }, 500);
    }, 1500);
  }, []);

  const exit = useCallback((onBlack?: () => void) => {
    // 退出和进入使用相同的转场逻辑（正放→黑→倒放）
    enter(onBlack);
  }, [enter]);

  const reset = useCallback(() => {
    if (blackTimer.current) clearTimeout(blackTimer.current);
    setState('idle');
  }, []);

  return { state, enter, exit, reset };
}
