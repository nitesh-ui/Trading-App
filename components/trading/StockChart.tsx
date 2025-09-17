import React, { useEffect, useState } from 'react';
import { Dimensions, StyleSheet, View } from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import { useTheme } from '../../contexts/ThemeContext';

const { width: screenWidth } = Dimensions.get('window');

export interface ChartData {
  labels: string[];
  datasets: Array<{
    data: number[];
    color?: (opacity: number) => string;
    strokeWidth?: number;
  }>;
}

interface StockChartProps {
  symbol: string;
  data?: ChartData;
  height?: number;
  showDetails?: boolean;
}

export const StockChart: React.FC<StockChartProps> = ({
  symbol,
  data,
  height = 200,
  showDetails = true,
}) => {
  const { theme } = useTheme();
  const [chartData, setChartData] = useState<ChartData | null>(null);

  // Generate mock historical data for the chart
  useEffect(() => {
    if (data) {
      setChartData(data);
      return;
    }

    // Generate mock data if not provided
    const generateMockData = () => {
      const now = new Date();
      const labels: string[] = [];
      const dataPoints: number[] = [];
      
      // Generate 7 days of data
      for (let i = 6; i >= 0; i--) {
        const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
        labels.push(date.toLocaleDateString('en-US', { weekday: 'short' }));
        
        // Generate somewhat realistic stock price movement
        const basePrice = 100;
        const volatility = 0.1;
        const trend = Math.sin(i * 0.5) * 0.05;
        const randomFactor = (Math.random() - 0.5) * volatility;
        const price = basePrice * (1 + trend + randomFactor);
        
        dataPoints.push(Math.round(price * 100) / 100);
      }

      return {
        labels,
        datasets: [
          {
            data: dataPoints,
            color: (opacity = 1) => theme.colors.primary,
            strokeWidth: 2,
          },
        ],
      };
    };

    setChartData(generateMockData());
  }, [symbol, data, theme.colors.primary]);

  if (!chartData) {
    return null;
  }

  const chartConfig = {
    backgroundColor: theme.colors.surface,
    backgroundGradientFrom: theme.colors.surface,
    backgroundGradientTo: theme.colors.surface,
    decimalPlaces: 2,
    color: (opacity = 1) => theme.colors.primary,
    labelColor: (opacity = 1) => theme.colors.textSecondary,
    style: {
      borderRadius: 16,
    },
    propsForDots: {
      r: '4',
      strokeWidth: '2',
      stroke: theme.colors.primary,
    },
    propsForBackgroundLines: {
      strokeDasharray: '',
      stroke: theme.colors.border,
      strokeWidth: 1,
    },
  };

  return (
    <View style={styles.container}>
      <LineChart
        data={chartData}
        width={screenWidth - 64} // Adjust for padding
        height={height}
        chartConfig={chartConfig}
        bezier
        style={styles.chart}
        withDots={showDetails}
        withShadow={false}
        withVerticalLabels={showDetails}
        withHorizontalLabels={showDetails}
        hidePointsAtIndex={showDetails ? [] : [0, 1, 2, 3, 4, 5, 6]}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16,
  },
});
