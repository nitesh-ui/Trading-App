import React, { memo } from 'react';
import { StyleSheet, View } from 'react-native';
import { Toggle, ToggleOption } from '../atomic';
import { MarketType } from './types';

interface MarketTabsProps {
  marketType: MarketType;
  onMarketTypeChange: (type: MarketType) => void;
  theme: any;
  visibleSegments?: MarketType[];
}

const MarketTabs = memo<MarketTabsProps>(({ marketType, onMarketTypeChange, theme, visibleSegments = ['stocks', 'forex', 'crypto'] }) => {
  const allOptions: { value: MarketType; label: string }[] = [
    { value: 'stocks', label: 'Stocks' },
    { value: 'forex', label: 'Forex' },
    { value: 'crypto', label: 'Crypto' },
  ];

  // Filter options based on visible segments
  const toggleOptions: ToggleOption[] = allOptions.filter(opt => visibleSegments.includes(opt.value));

  return (
    <View style={styles.container}>
      <Toggle
        options={toggleOptions}
        selectedValue={marketType}
        onValueChange={(value) => onMarketTypeChange(value as MarketType)}
        style={styles.toggle}
      />
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  toggle: {
    marginBottom: 0,
  },
});

MarketTabs.displayName = 'MarketTabs';
export default MarketTabs;
