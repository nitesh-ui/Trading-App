import React, { memo } from 'react';
import { StyleSheet, View } from 'react-native';
import { Toggle, ToggleOption } from '../atomic';
import { MarketType } from './types';

interface MarketTabsProps {
  marketType: MarketType;
  onMarketTypeChange: (type: MarketType) => void;
  theme: any;
}

const MarketTabs = memo<MarketTabsProps>(({ marketType, onMarketTypeChange, theme }) => {
  const toggleOptions: ToggleOption[] = [
    { value: 'stocks', label: 'Stocks' },
    { value: 'forex', label: 'Forex' },
    { value: 'crypto', label: 'Crypto' },
  ];

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
