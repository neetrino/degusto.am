'use client';

import { useState, useEffect, useRef, type MouseEvent, type TouchEvent } from 'react';

interface UseCarouselProps {
  itemCount: number;
  visibleItems: number;
  /** Advance by N items per navigation (e.g. 2 for mobile 2-up pages). Defaults to 1. */
  scrollStep?: number;
  autoRotateInterval?: number;
}

/** Minimum movement before locking swipe to horizontal vs vertical axis. */
const TOUCH_AXIS_LOCK_PX = 10;

const DRAG_ACTIVATION_PX = 5;

type TouchAxis = 'none' | 'horizontal' | 'vertical';

function snapToScrollStep(index: number, maxIndex: number, step: number): number {  if (step <= 1) {
    return Math.max(0, Math.min(maxIndex, index));
  }
  const snapped = Math.round(index / step) * step;
  return Math.max(0, Math.min(maxIndex, snapped));
}

/**
 * Hook for managing carousel state and interactions
 */
export function useCarousel({
  itemCount,
  visibleItems,
  scrollStep = 1,
  autoRotateInterval = 5000,
}: UseCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);
  const [hasMoved, setHasMoved] = useState(false);
  const carouselRef = useRef<HTMLDivElement>(null);
  const touchAxisRef = useRef<TouchAxis>('none');
  const touchStartPageXRef = useRef(0);
  const touchStartPageYRef = useRef(0);
  const horizontalGestureRef = useRef(false);

  const step = Math.max(1, scrollStep);  const maxIndex = Math.max(0, itemCount - visibleItems);

  // Auto-rotate carousel
  useEffect(() => {
    if (itemCount <= visibleItems || isDragging) return;
    
    const interval = setInterval(() => {
      setCurrentIndex((prevIndex) => {
        if (prevIndex >= maxIndex) {
          return 0;
        }
        return snapToScrollStep(prevIndex + step, maxIndex, step);
      });
    }, autoRotateInterval);

    return () => clearInterval(interval);
  }, [itemCount, visibleItems, isDragging, maxIndex, autoRotateInterval, step]);

  // Adjust currentIndex when visibleItems changes
  useEffect(() => {
    if (currentIndex > maxIndex) {
      setCurrentIndex(maxIndex);
    }
  }, [visibleItems, itemCount, maxIndex, currentIndex]);

  const goToPrevious = () => {
    setCurrentIndex((prevIndex) => {
      if (prevIndex === 0) {
        return snapToScrollStep(maxIndex, maxIndex, step);
      }
      return snapToScrollStep(prevIndex - step, maxIndex, step);
    });
  };

  const goToNext = () => {
    setCurrentIndex((prevIndex) => {
      if (prevIndex >= maxIndex) {
        return 0;
      }
      return snapToScrollStep(prevIndex + step, maxIndex, step);
    });
  };

  const goToIndex = (index: number) => {
    setCurrentIndex(snapToScrollStep(index, maxIndex, step));
  };

  const handleMouseDown = (e: MouseEvent<HTMLDivElement>) => {
    if (!carouselRef.current) return;
    setHasMoved(false);
    setIsDragging(true);
    setStartX(e.pageX - carouselRef.current.offsetLeft);
    setScrollLeft(currentIndex);
  };

  const handleMouseMove = (e: MouseEvent<HTMLDivElement>) => {
    if (!isDragging || !carouselRef.current) return;
    const x = e.pageX - carouselRef.current.offsetLeft;
    const deltaX = Math.abs(x - startX);
    
    // Only consider it dragging if mouse moved more than 5px
    if (deltaX > 5) {
      setHasMoved(true);
      e.preventDefault();
      const walk = (x - startX) * 2; // Scroll speed multiplier
      const cardWidth = 100 / visibleItems;
      const newIndex = Math.round((scrollLeft - walk / (carouselRef.current.offsetWidth / 100)) / cardWidth);
      const clampedIndex = Math.max(0, Math.min(maxIndex, newIndex));
      setCurrentIndex(clampedIndex);
    }
  };

  const handleMouseUp = () => {
    const wasDragging = isDragging;
    const didMove = hasMoved;
    setIsDragging(false);
    if (wasDragging && didMove) {
      setCurrentIndex((prev) => snapToScrollStep(prev, maxIndex, step));
    }
    // Reset hasMoved after a short delay to allow click events to process
    if (wasDragging && didMove) {
      setTimeout(() => setHasMoved(false), 150);
    } else {
      setHasMoved(false);
    }
  };

  const handleTouchStart = (e: TouchEvent<HTMLDivElement>) => {
    if (!carouselRef.current) return;
    const touch = e.touches[0];
    touchAxisRef.current = 'none';
    horizontalGestureRef.current = false;
    touchStartPageXRef.current = touch.pageX;
    touchStartPageYRef.current = touch.pageY;
    setHasMoved(false);
    setIsDragging(false);
    setStartX(touch.pageX - carouselRef.current.offsetLeft);
    setScrollLeft(currentIndex);
  };

  const handleTouchMove = (e: TouchEvent<HTMLDivElement>) => {
    if (!carouselRef.current) return;
    const touch = e.touches[0];
    const pageDeltaX = Math.abs(touch.pageX - touchStartPageXRef.current);
    const pageDeltaY = Math.abs(touch.pageY - touchStartPageYRef.current);

    if (touchAxisRef.current === 'none') {
      if (pageDeltaX < TOUCH_AXIS_LOCK_PX && pageDeltaY < TOUCH_AXIS_LOCK_PX) {
        return;
      }
      touchAxisRef.current = pageDeltaY > pageDeltaX ? 'vertical' : 'horizontal';
    }

    if (touchAxisRef.current === 'vertical') {
      return;
    }

    const x = touch.pageX - carouselRef.current.offsetLeft;
    const deltaX = Math.abs(x - startX);

    if (deltaX > DRAG_ACTIVATION_PX) {
      horizontalGestureRef.current = true;
      setIsDragging(true);
      setHasMoved(true);
      const walk = (x - startX) * 2;
      const cardWidth = 100 / visibleItems;
      const newIndex = Math.round(
        (scrollLeft - walk / (carouselRef.current.offsetWidth / 100)) / cardWidth,
      );
      const clampedIndex = Math.max(0, Math.min(maxIndex, newIndex));
      setCurrentIndex(clampedIndex);
    }
  };

  const handleTouchEnd = () => {
    const wasHorizontal = touchAxisRef.current === 'horizontal';
    const didMoveHorizontally = horizontalGestureRef.current;
    touchAxisRef.current = 'none';
    horizontalGestureRef.current = false;
    setIsDragging(false);
    if (wasHorizontal && didMoveHorizontally) {
      setCurrentIndex((prev) => snapToScrollStep(prev, maxIndex, step));
    }
    if (wasHorizontal && didMoveHorizontally) {
      setTimeout(() => setHasMoved(false), 150);
    } else {
      setHasMoved(false);
    }
  };

  /** Only advance on horizontal wheel/trackpad swipe; let vertical delta scroll the page. */
  const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    const absX = Math.abs(e.deltaX);
    const absY = Math.abs(e.deltaY);
    if (absX <= absY || absX === 0) {
      return;
    }
    if (e.nativeEvent.cancelable) {
      e.preventDefault();
    }
    const delta = e.deltaX > 0 ? step : -step;
    setCurrentIndex((prevIndex) => snapToScrollStep(prevIndex + delta, maxIndex, step));
  };
  return {
    currentIndex,
    isDragging,
    hasMoved,
    carouselRef,
    goToPrevious,
    goToNext,
    goToIndex,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
    handleWheel,
  };
}




