import React from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import { Card } from '../atomic';

interface SkeletonLoaderProps {
  type: 'indices' | 'assetList' | 'assetCard';
  count?: number;
  theme: any;
  fast?: boolean; // New prop for faster animations on subsequent loads
}

const SkeletonLoader: React.FC<SkeletonLoaderProps> = ({ type, count = 3, theme, fast = false }) => {
  const shimmerAnim = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    const shimmer = () => {
      shimmerAnim.setValue(0);
      Animated.timing(shimmerAnim, {
        toValue: 1,
        duration: fast ? 800 : 1500, // Faster animation for cached loads
        useNativeDriver: true,
      }).start(() => shimmer());
    };
    shimmer();
  }, [shimmerAnim, fast]);

  const shimmerStyle = {
    opacity: shimmerAnim.interpolate({
      inputRange: [0, 0.5, 1],
      outputRange: [0.3, 0.7, 0.3],
    }),
  };

  if (type === 'indices') {
    return (
      <View style={styles.indicesContainer}>
        <View style={[styles.titleSkeleton, { backgroundColor: theme.colors.surface }]}>
          <Animated.View
            style={[
              styles.titleShimmer,
              shimmerStyle,
              { backgroundColor: theme.colors.border }
            ]}
          />
        </View>
        <View style={styles.indicesRow}>
          {Array.from({ length: count }).map((_, index) => (
            <Card key={index} padding="medium" style={styles.indexCardSkeleton}>
              <Animated.View
                style={[
                  styles.indexLabelSkeleton,
                  shimmerStyle,
                  { backgroundColor: theme.colors.border }
                ]}
              />
              <View style={styles.indexValueContainer}>
                <Animated.View
                  style={[
                    styles.indexPriceSkeleton,
                    shimmerStyle,
                    { backgroundColor: theme.colors.border }
                  ]}
                />
                <Animated.View
                  style={[
                    styles.indexChangeSkeleton,
                    shimmerStyle,
                    { backgroundColor: theme.colors.border }
                  ]}
                />
              </View>
            </Card>
          ))}
        </View>
      </View>
    );
  }

  if (type === 'assetList') {
    return (
      <View style={styles.assetListContainer}>
        <View style={[styles.assetHeaderSkeleton, { backgroundColor: theme.colors.surface }]}>
          <Animated.View
            style={[
              styles.assetHeaderTitleSkeleton,
              shimmerStyle,
              { backgroundColor: theme.colors.border }
            ]}
          />
          <Animated.View
            style={[
              styles.assetHeaderCountSkeleton,
              shimmerStyle,
              { backgroundColor: theme.colors.border }
            ]}
          />
        </View>
        {Array.from({ length: count }).map((_, index) => (
          <Card key={index} style={styles.assetCardSkeleton}>
            <View style={styles.assetCardContent}>
              <View style={styles.assetLeft}>
                <Animated.View
                  style={[
                    styles.assetSymbolSkeleton,
                    shimmerStyle,
                    { backgroundColor: theme.colors.border }
                  ]}
                />
                <Animated.View
                  style={[
                    styles.assetNameSkeleton,
                    shimmerStyle,
                    { backgroundColor: theme.colors.border }
                  ]}
                />
              </View>
              <View style={styles.assetRight}>
                <Animated.View
                  style={[
                    styles.assetPriceSkeleton,
                    shimmerStyle,
                    { backgroundColor: theme.colors.border }
                  ]}
                />
                <Animated.View
                  style={[
                    styles.assetChangeSkeleton,
                    shimmerStyle,
                    { backgroundColor: theme.colors.border }
                  ]}
                />
              </View>
            </View>
          </Card>
        ))}
      </View>
    );
  }

  return null;
};

const styles = StyleSheet.create({
  // Indices skeleton styles
  indicesContainer: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  titleSkeleton: {
    height: 20,
    width: 120,
    borderRadius: 4,
    marginBottom: 12,
    overflow: 'hidden',
  },
  titleShimmer: {
    height: '100%',
    width: '100%',
  },
  indicesRow: {
    flexDirection: 'row',
    gap: 12,
  },
  indexCardSkeleton: {
    width: 140,
    minHeight: 80,
    alignItems: 'center',
    justifyContent: 'center',
  },
  indexLabelSkeleton: {
    height: 14,
    width: 60,
    borderRadius: 3,
    marginBottom: 8,
  },
  indexValueContainer: {
    alignItems: 'center',
  },
  indexPriceSkeleton: {
    height: 16,
    width: 80,
    borderRadius: 3,
    marginBottom: 4,
  },
  indexChangeSkeleton: {
    height: 12,
    width: 60,
    borderRadius: 3,
  },
  
  // Asset list skeleton styles
  assetListContainer: {
    paddingHorizontal: 20,
  },
  assetHeaderSkeleton: {
    paddingVertical: 12,
    marginBottom: 12,
    borderRadius: 8,
    paddingHorizontal: 12,
  },
  assetHeaderTitleSkeleton: {
    height: 18,
    width: 100,
    borderRadius: 4,
    marginBottom: 4,
  },
  assetHeaderCountSkeleton: {
    height: 14,
    width: 60,
    borderRadius: 3,
  },
  assetCardSkeleton: {
    marginBottom: 12,
    padding: 16,
  },
  assetCardContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  assetLeft: {
    flex: 1,
  },
  assetSymbolSkeleton: {
    height: 18,
    width: 80,
    borderRadius: 4,
    marginBottom: 6,
  },
  assetNameSkeleton: {
    height: 14,
    width: 120,
    borderRadius: 3,
  },
  assetRight: {
    alignItems: 'flex-end',
  },
  assetPriceSkeleton: {
    height: 18,
    width: 70,
    borderRadius: 4,
    marginBottom: 4,
  },
  assetChangeSkeleton: {
    height: 14,
    width: 50,
    borderRadius: 3,
  },
});

export default SkeletonLoader;
