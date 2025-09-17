import React, { useMemo, useState } from 'react';
import { Dimensions, StyleSheet, TouchableOpacity, View } from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import { useTheme } from '../../contexts/ThemeContext';
import { Text } from '../atomic';

interface CandlestickData {
  open: number;
  high: number;
  low: number;
  close: number;
  date: string;
}

interface CandlestickChartProps {
  symbol: string;
  data?: CandlestickData[];
}

type TimePeriod = '5D' | '1M' | '1Y' | '5Y' | 'YTD';

const screenWidth = Dimensions.get('window').width;

export function CandlestickChart({ symbol, data }: CandlestickChartProps) {
  const { theme } = useTheme();
  const [selectedPeriod, setSelectedPeriod] = useState<TimePeriod>('5D');

  const timePeriods: TimePeriod[] = ['5D', '1M', '1Y', '5Y', 'YTD'];

  // Generate static fake data based on symbol and selected time period
  const generateStaticData = useMemo(() => {
    const getStaticDataForPeriod = (period: TimePeriod, symbolSeed: string): CandlestickData[] => {
      // Create a simple hash from symbol to ensure consistent data for same symbol
      const hash = symbolSeed.split('').reduce((a, b) => {
        a = ((a << 5) - a) + b.charCodeAt(0);
        return a & a;
      }, 0);
      
      // Use hash as seed for consistent "random" values
      const seededRandom = (seed: number) => {
        const x = Math.sin(seed) * 10000;
        return x - Math.floor(x);
      };
      
      const basePrice = 100 + Math.abs(hash % 900); // Price between 100-1000 based on symbol
      const dataPoints: CandlestickData[] = [];
      
      let numPoints = 5;
      let dateStep = 1; // days
      
      switch (period) {
        case '5D':
          numPoints = 5;
          dateStep = 1;
          break;
        case '1M':
          numPoints = 30;
          dateStep = 1;
          break;
        case '1Y':
          numPoints = 52;
          dateStep = 7; // weeks
          break;
        case '5Y':
          numPoints = 60;
          dateStep = 30; // months
          break;
        case 'YTD':
          numPoints = new Date().getMonth() + 1;
          dateStep = 30; // months
          break;
      }

      let currentPrice = basePrice;
      const today = new Date();

      for (let i = numPoints - 1; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(date.getDate() - (i * dateStep));
        
        // Generate realistic OHLC data using seeded random
        const volatility = 0.03; // 3% volatility
        const trendSeed = hash + i;
        const changeSeed = hash + i + 1000;
        const highSeed = hash + i + 2000;
        const lowSeed = hash + i + 3000;
        
        const trend = (seededRandom(trendSeed) - 0.5) * 0.01; // Small trend
        
        const open = currentPrice;
        const change = (seededRandom(changeSeed) - 0.5) * volatility * currentPrice;
        const close = open + change + (trend * currentPrice);
        
        const high = Math.max(open, close) + seededRandom(highSeed) * 0.02 * currentPrice;
        const low = Math.min(open, close) - seededRandom(lowSeed) * 0.02 * currentPrice;
        
        dataPoints.push({
          open,
          high,
          low,
          close,
          date: date.toISOString().split('T')[0]
        });
        
        currentPrice = close;
      }

      return dataPoints;
    };

    return getStaticDataForPeriod;
  }, []);

  const chartData = data || generateStaticData(selectedPeriod, symbol);
  
  // Convert candlestick data to line chart format (using close prices)
  const lineData = {
    labels: chartData.map((item, index) => {
      if (selectedPeriod === '5D') {
        return new Date(item.date).toLocaleDateString('en-US', { weekday: 'short' });
      } else if (selectedPeriod === '1M') {
        return index % 5 === 0 ? new Date(item.date).getDate().toString() : '';
      } else if (selectedPeriod === '1Y') {
        return new Date(item.date).toLocaleDateString('en-US', { month: 'short' });
      } else {
        return new Date(item.date).getFullYear().toString();
      }
    }),
    datasets: [
      {
        data: chartData.map(item => item.close),
        color: (opacity = 1) => theme.colors.primary,
        strokeWidth: 2,
      },
      // Add high/low range as additional dataset
      {
        data: chartData.map(item => item.high),
        color: (opacity = 1) => `rgba(76, 175, 80, ${opacity * 0.3})`,
        strokeWidth: 1,
        withDots: false,
      },
      {
        data: chartData.map(item => item.low),
        color: (opacity = 1) => `rgba(244, 67, 54, ${opacity * 0.3})`,
        strokeWidth: 1,
        withDots: false,
      }
    ],
  };

  const chartConfig = {
    backgroundColor: theme.colors.surface,
    backgroundGradientFrom: theme.colors.surface,
    backgroundGradientTo: theme.colors.surface,
    decimalPlaces: 2,
    color: (opacity = 1) => theme.colors.text,
    labelColor: (opacity = 1) => theme.colors.textSecondary,
    style: {
      borderRadius: 8,
    },
    propsForDots: {
      r: '3',
      strokeWidth: '1',
      stroke: theme.colors.primary,
    },
    propsForBackgroundLines: {
      strokeDasharray: '5,5',
      stroke: theme.colors.border,
      strokeOpacity: 0.3,
    },
  };

  return (
    <View style={styles.container}>
      {/* Time Period Selector */}
      <View style={styles.periodSelector}>
        {timePeriods.map((period) => (
          <TouchableOpacity
            key={period}
            style={[
              styles.periodButton,
              {
                backgroundColor: selectedPeriod === period 
                  ? theme.colors.primary 
                  : 'transparent',
                borderColor: theme.colors.border,
              }
            ]}
            onPress={() => setSelectedPeriod(period)}
          >
            <Text
              variant="caption"
              weight={selectedPeriod === period ? 'semibold' : 'regular'}
              style={{
                color: selectedPeriod === period 
                  ? theme.colors.surface 
                  : theme.colors.textSecondary
              }}
            >
              {period}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Chart */}
      <View style={styles.chartContainer}>
        <LineChart
          data={lineData}
          width={screenWidth - 80}
          height={200}
          chartConfig={chartConfig}
          bezier={false}
          style={styles.chart}
          withInnerLines={true}
          withOuterLines={false}
          withVerticalLines={false}
          withHorizontalLines={true}
          segments={4}
        />
      </View>

      {/* Chart Legend */}
      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={[styles.legendColor, { backgroundColor: theme.colors.primary }]} />
          <Text variant="caption" color="textSecondary">Close Price</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendColor, { backgroundColor: 'rgba(76, 175, 80, 0.5)' }]} />
          <Text variant="caption" color="textSecondary">High</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendColor, { backgroundColor: 'rgba(244, 67, 54, 0.5)' }]} />
          <Text variant="caption" color="textSecondary">Low</Text>
        </View>
      </View>

      {/* Price Summary */}
      <View style={styles.priceSummary}>
        <View style={styles.priceItem}>
          <Text variant="caption" color="textSecondary">Current</Text>
          <Text variant="body" weight="semibold" color="text">
            ₹{chartData[chartData.length - 1]?.close.toFixed(2)}
          </Text>
        </View>
        <View style={styles.priceItem}>
          <Text variant="caption" color="textSecondary">High</Text>
          <Text variant="body" weight="semibold" color="success">
            ₹{Math.max(...chartData.map(d => d.high)).toFixed(2)}
          </Text>
        </View>
        <View style={styles.priceItem}>
          <Text variant="caption" color="textSecondary">Low</Text>
          <Text variant="body" weight="semibold" color="error">
            ₹{Math.min(...chartData.map(d => d.low)).toFixed(2)}
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 16,
  },
  periodSelector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  periodButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    minWidth: 40,
    alignItems: 'center',
  },
  chartContainer: {
    alignItems: 'center',
    marginBottom: 12,
  },
  chart: {
    borderRadius: 8,
  },
  legend: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 12,
    gap: 16,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  legendColor: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  priceSummary: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.1)',
  },
  priceItem: {
    alignItems: 'center',
    gap: 4,
  },
});
