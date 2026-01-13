/**
 * Example Usage of MarketChart Component
 * 
 * This file shows how to use the MarketChart component in your app.
 */

import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import MarketChart from './components/trading/MarketChart';
import { Text } from './components/atomic';

export default function ChartExampleScreen() {
  return (
    <ScrollView style={styles.container}>
      <View style={styles.section}>
        <Text variant="title" weight="bold" style={styles.sectionTitle}>
          NIFTY 50 Chart
        </Text>
        <MarketChart 
          scriptCode="260105" 
          height={400}
          interval="minute"
          daysBack={5}
        />
      </View>

      <View style={styles.section}>
        <Text variant="title" weight="bold" style={styles.sectionTitle}>
          Another Stock
        </Text>
        <MarketChart 
          scriptCode="YOUR_SCRIPT_CODE_HERE" 
          height={350}
          interval="minute"
          daysBack={7}
        />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  section: {
    padding: 16,
    marginBottom: 24,
  },
  sectionTitle: {
    marginBottom: 12,
    color: '#ffffff',
  },
});
