import React from 'react';
import { Dimensions, StyleSheet, View } from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';
import { Card, Text } from '../atomic';

interface ChartDataPoint {
  time: string;
  price: number;
}

interface SimpleChartProps {
  data: ChartDataPoint[];
  title?: string;
  height?: number;
}

export const SimpleChart: React.FC<SimpleChartProps> = ({
  data,
  title,
  height = 200,
}) => {
  const { theme } = useTheme();
  const screenWidth = Dimensions.get('window').width - 64; // Accounting for padding

  if (!data || data.length === 0) {
    return (
      <Card padding="medium">
        {title && (
          <Text variant="subtitle" weight="semibold" color="text" style={styles.title}>
            {title}
          </Text>
        )}
        <View style={[styles.emptyChart, { height }]}>
          <Text variant="body" color="textSecondary">
            No chart data available
          </Text>
        </View>
      </Card>
    );
  }

  const prices = data.map(point => point.price);
  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);
  const priceRange = maxPrice - minPrice;

  const getYPosition = (price: number): number => {
    if (priceRange === 0) return height / 2;
    return height - ((price - minPrice) / priceRange) * (height - 20) - 10;
  };

  const getXPosition = (index: number): number => {
    return (index / (data.length - 1)) * (screenWidth - 40);
  };

  // Create SVG path for the line
  let pathData = '';
  data.forEach((point, index) => {
    const x = getXPosition(index);
    const y = getYPosition(point.price);
    if (index === 0) {
      pathData += `M ${x} ${y}`;
    } else {
      pathData += ` L ${x} ${y}`;
    }
  });

  const isPositiveTrend = data[data.length - 1].price > data[0].price;

  return (
    <Card padding="medium">
      {title && (
        <Text variant="subtitle" weight="semibold" color="text" style={styles.title}>
          {title}
        </Text>
      )}
      
      <View style={[styles.chartContainer, { height }]}>
        {/* Simplified line chart using View components */}
        <View style={styles.chartArea}>
          {data.map((point, index) => {
            if (index === 0) return null;
            
            const prevPoint = data[index - 1];
            const x1 = getXPosition(index - 1);
            const y1 = getYPosition(prevPoint.price);
            const x2 = getXPosition(index);
            const y2 = getYPosition(point.price);
            
            // Calculate line angle and length
            const deltaX = x2 - x1;
            const deltaY = y2 - y1;
            const lineLength = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
            const angle = Math.atan2(deltaY, deltaX) * (180 / Math.PI);
            
            return (
              <View
                key={index}
                style={[
                  styles.chartLine,
                  {
                    left: x1,
                    top: y1,
                    width: lineLength,
                    backgroundColor: isPositiveTrend ? theme.colors.profit : theme.colors.loss,
                    transform: [{ rotate: `${angle}deg` }],
                  },
                ]}
              />
            );
          })}
          
          {/* Data points */}
          {data.map((point, index) => (
            <View
              key={`point-${index}`}
              style={[
                styles.dataPoint,
                {
                  left: getXPosition(index) - 3,
                  top: getYPosition(point.price) - 3,
                  backgroundColor: isPositiveTrend ? theme.colors.profit : theme.colors.loss,
                },
              ]}
            />
          ))}
        </View>
        
        {/* Price labels */}
        <View style={styles.priceLabels}>
          <Text variant="caption" color="textSecondary">
            ₹{maxPrice.toFixed(2)}
          </Text>
          <Text variant="caption" color="textSecondary">
            ₹{minPrice.toFixed(2)}
          </Text>
        </View>
      </View>
      
      {/* Time labels */}
      <View style={styles.timeLabels}>
        <Text variant="caption" color="textSecondary">
          {data[0]?.time}
        </Text>
        <Text variant="caption" color="textSecondary">
          {data[data.length - 1]?.time}
        </Text>
      </View>
    </Card>
  );
};

const styles = StyleSheet.create({
  title: {
    marginBottom: 16,
  },
  chartContainer: {
    position: 'relative',
    marginBottom: 8,
  },
  emptyChart: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  chartArea: {
    flex: 1,
    position: 'relative',
    marginRight: 40,
  },
  chartLine: {
    position: 'absolute',
    height: 2,
    borderRadius: 1,
  },
  dataPoint: {
    position: 'absolute',
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  priceLabels: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    justifyContent: 'space-between',
    paddingVertical: 10,
  },
  timeLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
});
