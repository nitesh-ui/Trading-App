import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type SegmentType = 'stocks' | 'forex' | 'crypto' | 'fo';

interface SegmentContextType {
  selectedSegment: SegmentType;
  setSelectedSegment: (segment: SegmentType) => void;
  isLoading: boolean;
}

const SegmentContext = createContext<SegmentContextType | undefined>(undefined);

const SEGMENT_STORAGE_KEY = 'user_selected_segment';

export const SegmentProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [selectedSegment, setSelectedSegmentState] = useState<SegmentType>('stocks');
  const [isLoading, setIsLoading] = useState(true);

  // Load segment from AsyncStorage on mount
  useEffect(() => {
    const loadSegment = async () => {
      try {
        const saved = await AsyncStorage.getItem(SEGMENT_STORAGE_KEY);
        if (saved) {
          setSelectedSegmentState(saved as SegmentType);
        }
      } catch (error) {
        console.error('Error loading segment preference:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadSegment();
  }, []);

  const setSelectedSegment = useCallback(async (segment: SegmentType) => {
    try {
      await AsyncStorage.setItem(SEGMENT_STORAGE_KEY, segment);
      setSelectedSegmentState(segment);
    } catch (error) {
      console.error('Error saving segment preference:', error);
    }
  }, []);

  return (
    <SegmentContext.Provider value={{ selectedSegment, setSelectedSegment, isLoading }}>
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
