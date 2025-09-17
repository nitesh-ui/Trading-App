/**
 * Performance Monitoring Hooks
 * Production-ready performance tracking and optimization
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { InteractionManager } from 'react-native';

/**
 * Hook for measuring component render performance
 */
export const useRenderPerformance = (componentName: string) => {
  const renderStartTime = useRef<number>(0);
  const mountTime = useRef<number>(0);

  useEffect(() => {
    renderStartTime.current = performance.now();
    
    // Measure time to interactive (after all interactions complete)
    const interactionPromise = InteractionManager.runAfterInteractions(() => {
      const renderTime = performance.now() - renderStartTime.current;
      
      if (__DEV__) {
        console.log(`📊 ${componentName} render time: ${renderTime.toFixed(2)}ms`);
        
        // Warn about slow renders (>16ms = 60fps threshold)
        if (renderTime > 16) {
          console.warn(`⚠️ Slow render detected in ${componentName}: ${renderTime.toFixed(2)}ms`);
        }
      }
    });

    return () => {
      interactionPromise.cancel();
    };
  });

  useEffect(() => {
    mountTime.current = performance.now();
    
    return () => {
      const totalTime = performance.now() - mountTime.current;
      if (__DEV__) {
        console.log(`📊 ${componentName} total mount time: ${totalTime.toFixed(2)}ms`);
      }
    };
  }, [componentName]);
};

/**
 * Hook for debouncing expensive operations
 */
export const useDebounce = <T>(value: T, delay: number): T => {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};

/**
 * Hook for throttling frequent operations
 */
export const useThrottle = <T extends (...args: any[]) => any>(
  callback: T,
  delay: number
): T => {
  const lastCall = useRef<number>(0);
  const timeoutRef = useRef<number | null>(null);

  const throttledCallback = useCallback(
    (...args: Parameters<T>) => {
      const now = Date.now();
      
      if (now - lastCall.current >= delay) {
        lastCall.current = now;
        callback(...args);
      } else {
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }
        timeoutRef.current = setTimeout(() => {
          lastCall.current = Date.now();
          callback(...args);
        }, delay - (now - lastCall.current));
      }
    },
    [callback, delay]
  ) as T;

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return throttledCallback;
};

/**
 * Hook for monitoring memory usage
 */
export const useMemoryMonitor = (componentName: string) => {
  const checkMemory = useCallback(() => {
    if (__DEV__ && (performance as any).memory) {
      const memory = (performance as any).memory;
      const usedMB = (memory.usedJSHeapSize / 1024 / 1024).toFixed(2);
      const totalMB = (memory.totalJSHeapSize / 1024 / 1024).toFixed(2);
      const limitMB = (memory.jsHeapSizeLimit / 1024 / 1024).toFixed(2);
      
      console.log(`🧠 ${componentName} Memory: ${usedMB}MB / ${totalMB}MB (limit: ${limitMB}MB)`);
      
      // Warn about high memory usage (>80% of limit)
      if (memory.usedJSHeapSize / memory.jsHeapSizeLimit > 0.8) {
        console.warn(`⚠️ High memory usage in ${componentName}: ${usedMB}MB`);
      }
    }
  }, [componentName]);

  useEffect(() => {
    checkMemory();
    
    // Check memory periodically
    const interval = setInterval(checkMemory, 10000); // Every 10 seconds
    
    return () => clearInterval(interval);
  }, [checkMemory]);
};

/**
 * Hook for measuring API call performance
 */
export const useApiPerformance = () => {
  const measureApiCall = useCallback(
    async <T>(
      apiCall: () => Promise<T>,
      operationName: string
    ): Promise<T> => {
      const startTime = performance.now();
      
      try {
        const result = await apiCall();
        const duration = performance.now() - startTime;
        
        if (__DEV__) {
          console.log(`🌐 API ${operationName} completed in ${duration.toFixed(2)}ms`);
          
          // Warn about slow API calls (>2 seconds)
          if (duration > 2000) {
            console.warn(`⚠️ Slow API call: ${operationName} took ${duration.toFixed(2)}ms`);
          }
        }
        
        return result;
      } catch (error) {
        const duration = performance.now() - startTime;
        console.error(`❌ API ${operationName} failed after ${duration.toFixed(2)}ms:`, error);
        throw error;
      }
    },
    []
  );

  return { measureApiCall };
};

/**
 * Hook for scroll performance monitoring
 */
export const useScrollPerformance = (listName: string) => {
  const scrollStartTime = useRef<number>(0);
  const frameCount = useRef<number>(0);
  const lastFrameTime = useRef<number>(0);

  const onScrollBeginDrag = useCallback(() => {
    scrollStartTime.current = performance.now();
    frameCount.current = 0;
    lastFrameTime.current = performance.now();
  }, []);

  const onScrollEndDrag = useCallback(() => {
    const scrollDuration = performance.now() - scrollStartTime.current;
    const averageFPS = frameCount.current / (scrollDuration / 1000);
    
    if (__DEV__) {
      console.log(`📜 ${listName} scroll performance: ${averageFPS.toFixed(1)} FPS over ${scrollDuration.toFixed(2)}ms`);
      
      // Warn about poor scroll performance (<30 FPS)
      if (averageFPS < 30) {
        console.warn(`⚠️ Poor scroll performance in ${listName}: ${averageFPS.toFixed(1)} FPS`);
      }
    }
  }, [listName]);

  const onScroll = useCallback(() => {
    const now = performance.now();
    const frameDuration = now - lastFrameTime.current;
    
    if (frameDuration > 0) {
      frameCount.current++;
      lastFrameTime.current = now;
    }
  }, []);

  return {
    onScrollBeginDrag,
    onScrollEndDrag,
    onScroll,
  };
};

/**
 * Hook for lazy loading components
 */
export const useLazyComponent = <T>(
  importFunction: () => Promise<{ default: T }>,
  fallback?: React.ComponentType
) => {
  const [Component, setComponent] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let isMounted = true;

    const loadComponent = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        const { default: LoadedComponent } = await importFunction();
        
        if (isMounted) {
          setComponent(LoadedComponent);
          setIsLoading(false);
        }
      } catch (err) {
        if (isMounted) {
          setError(err as Error);
          setIsLoading(false);
        }
      }
    };

    loadComponent();

    return () => {
      isMounted = false;
    };
  }, [importFunction]);

  return { Component, isLoading, error };
};

/**
 * Hook for batching state updates
 */
export const useBatchedUpdates = () => {
  const pendingUpdates = useRef<(() => void)[]>([]);
  const isUpdateScheduled = useRef(false);

  const batchUpdate = useCallback((updateFunction: () => void) => {
    pendingUpdates.current.push(updateFunction);

    if (!isUpdateScheduled.current) {
      isUpdateScheduled.current = true;
      
      // Use requestAnimationFrame to batch updates to next frame
      requestAnimationFrame(() => {
        const updates = pendingUpdates.current.splice(0);
        isUpdateScheduled.current = false;
        
        // Execute all batched updates
        updates.forEach(update => update());
      });
    }
  }, []);

  return { batchUpdate };
};

/**
 * Hook for image loading optimization
 */
export const useImageOptimization = () => {
  const [imageCache] = useState(new Map<string, boolean>());

  const preloadImage = useCallback(async (uri: string): Promise<boolean> => {
    if (imageCache.has(uri)) {
      return true;
    }

    return new Promise((resolve) => {
      const image = new Image();
      
      image.onload = () => {
        imageCache.set(uri, true);
        resolve(true);
      };
      
      image.onerror = () => {
        resolve(false);
      };
      
      image.src = uri;
    });
  }, [imageCache]);

  const preloadImages = useCallback(async (uris: string[]): Promise<boolean[]> => {
    return Promise.all(uris.map(preloadImage));
  }, [preloadImage]);

  const isImageCached = useCallback((uri: string): boolean => {
    return imageCache.has(uri);
  }, [imageCache]);

  return {
    preloadImage,
    preloadImages,
    isImageCached,
  };
};

export default {
  useRenderPerformance,
  useDebounce,
  useThrottle,
  useMemoryMonitor,
  useApiPerformance,
  useScrollPerformance,
  useLazyComponent,
  useBatchedUpdates,
  useImageOptimization,
};
