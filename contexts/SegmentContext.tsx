import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppState, AppStateStatus } from 'react-native';

export type SegmentType = 'stocks' | 'forex' | 'crypto' | 'fo';

interface SegmentContextType {
  selectedSegments: SegmentType[];
  setSelectedSegments: (segments: SegmentType[]) => void;
  toggleSegment: (segment: SegmentType) => void;
  isLoading: boolean;
  reloadSegments: () => Promise<void>;
}

const SegmentContext = createContext<SegmentContextType | undefined>(undefined);

const SEGMENT_STORAGE_KEY = 'user_selected_segments';
const DEFAULT_SEGMENTS: SegmentType[] = ['stocks'];

export const SegmentProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [selectedSegments, setSelectedSegmentsState] = useState<SegmentType[]>(DEFAULT_SEGMENTS);
  const [isLoading, setIsLoading] = useState(true);
  const appState = useRef(AppState.currentState);

  // Load segments from AsyncStorage on mount
  useEffect(() => {
    const loadSegments = async () => {
      try {
        const saved = await AsyncStorage.getItem(SEGMENT_STORAGE_KEY);
        if (saved) {
          const parsed = JSON.parse(saved);
          setSelectedSegmentsState(Array.isArray(parsed) && parsed.length > 0 ? parsed : DEFAULT_SEGMENTS);
        }
      } catch (error) {
        console.error('Error loading segments preference:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadSegments();
  }, []);

  const reloadSegments = useCallback(async () => {
    try {
      const saved = await AsyncStorage.getItem(SEGMENT_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        setSelectedSegmentsState(Array.isArray(parsed) && parsed.length > 0 ? parsed : DEFAULT_SEGMENTS);
      }
    } catch (error) {
      console.error('Error reloading segments preference:', error);
    }
  }, []);

  const handleAppStateChange = (nextAppState: AppStateStatus) => {
    if (appState.current.match(/inactive|background/) && nextAppState === 'active') {
      // App has come to foreground - reload segments from storage
      reloadSegments();
    }

    appState.current = nextAppState;
  };

  // Listen for app state changes to reload segments when app comes to foreground
  useEffect(() => {
    const subscription = AppState.addEventListener('change', handleAppStateChange);

    return () => {
      subscription.remove();
    };
  }, [handleAppStateChange]);

  const setSelectedSegments = useCallback(async (segments: SegmentType[]) => {
    try {
      const validSegments = segments.length > 0 ? segments : DEFAULT_SEGMENTS;
      await AsyncStorage.setItem(SEGMENT_STORAGE_KEY, JSON.stringify(validSegments));
      setSelectedSegmentsState(validSegments);
    } catch (error) {
      console.error('Error saving segments preference:', error);
    }
  }, []);

  const toggleSegment = useCallback(async (segment: SegmentType) => {
    setSelectedSegmentsState(prevSegments => {
      const isSelected = prevSegments.includes(segment);
      let newSegments: SegmentType[];
      
      if (isSelected) {
        // Don't allow removing all segments - keep at least one
        newSegments = prevSegments.filter((s: SegmentType) => s !== segment);
        if (newSegments.length === 0) {
          return prevSegments;
        }
      } else {
        newSegments = [...prevSegments, segment];
      }
      
      // Persist to AsyncStorage
      AsyncStorage.setItem(SEGMENT_STORAGE_KEY, JSON.stringify(newSegments))
        .catch(error => console.error('Error saving segments preference:', error));
      
      return newSegments;
    });
  }, []);

  return (
    <SegmentContext.Provider value={{ selectedSegments, setSelectedSegments, toggleSegment, isLoading, reloadSegments }}>
      {children}
    </SegmentContext.Provider>
  );
};

export const useSegment = () => {
  const context = useContext(SegmentContext);
  if (!context) {
    throw new Error('useSegment must be used within SegmentProvider');
  }
  return context;
};
