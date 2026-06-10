import { useRef, useCallback } from 'react';
import * as THREE from 'three';

export interface FlightConfig {
  targetPosition: THREE.Vector3;
  targetLookAt: THREE.Vector3;
  duration?: number; // ms, default 1500
}

export function useCameraFlight(camera: THREE.PerspectiveCamera | null) {
  const animating = useRef(false);
  const onArriveCallback = useRef<(() => void) | null>(null);

  const flyTo = useCallback((config: FlightConfig) => {
    if (!camera || animating.current) return;

    animating.current = true;
    const duration = config.duration ?? 1500;
    const startPos = camera.position.clone();
    const startTarget = new THREE.Vector3(); // 后续接入 OrbitControls.target

    const startTime = performance.now();

    function animate(now: number) {
      const elapsed = now - startTime;
      const t = Math.min(elapsed / duration, 1.0);
      // ease-in-out
      const eased = t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;

      camera!.position.lerpVectors(startPos, config.targetPosition, eased);
      // 简化：lookAt 直接设为 target
      camera!.lookAt(config.targetLookAt);

      if (t < 1.0) {
        requestAnimationFrame(animate);
      } else {
        animating.current = false;
        onArriveCallback.current?.();
      }
    }

    requestAnimationFrame(animate);
  }, [camera]);

  const onArrive = useCallback((cb: () => void) => {
    onArriveCallback.current = cb;
  }, []);

  return { flyTo, onArrive, isFlying: animating.current };
}
