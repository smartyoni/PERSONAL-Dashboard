import { useEffect, useRef } from 'react';

interface SwipeConfig {
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  minSwipeDistance?: number;
  minSwipeVelocity?: number;
  maxVerticalMovement?: number;
}

export function useSwipeGesture(config: SwipeConfig) {
  const ref = useRef<HTMLElement>(null);
  const touchStartRef = useRef({ x: 0, y: 0, time: 0 });

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const handleTouchStart = (e: TouchEvent) => {
      touchStartRef.current = {
        x: e.touches[0].clientX,
        y: e.touches[0].clientY,
        time: Date.now()
      };
    };

    const handleTouchEnd = (e: TouchEvent) => {
      const { x: startX, y: startY, time: startTime } = touchStartRef.current;

      const endX = e.changedTouches[0].clientX;
      const endY = e.changedTouches[0].clientY;
      const endTime = Date.now();

      const deltaX = endX - startX;
      const deltaY = endY - startY;
      const timeDelta = endTime - startTime;

      const minSwipeDistance = config.minSwipeDistance ?? 50;
      const minSwipeVelocity = config.minSwipeVelocity ?? 0.3;
      const maxVerticalMovement = config.maxVerticalMovement ?? 80;

      // 스와이프 조건 검증
      const isHorizontalSwipe = Math.abs(deltaX) > Math.abs(deltaY);
      const isLongEnough = Math.abs(deltaX) > minSwipeDistance;
      const isVerticalMovementSmall = Math.abs(deltaY) < maxVerticalMovement;
      const velocity = Math.abs(deltaX) / timeDelta;
      const isVelocityEnough = velocity > minSwipeVelocity;

      if (isHorizontalSwipe && isLongEnough && isVerticalMovementSmall && isVelocityEnough) {
        // 왼쪽 스와이프 (deltaX < 0)
        if (deltaX < 0 && config.onSwipeLeft) {
          config.onSwipeLeft();
        }
        // 오른쪽 스와이프 (deltaX > 0)
        else if (deltaX > 0 && config.onSwipeRight) {
          config.onSwipeRight();
        }
      }
    };

    element.addEventListener('touchstart', handleTouchStart, { passive: true });
    element.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      element.removeEventListener('touchstart', handleTouchStart);
      element.removeEventListener('touchend', handleTouchEnd);
    };
  }, [config]);

  return ref;
}
