import { formatIndianCurrency } from './indianFormatting';
import { MarketType } from '../components/watchlist/types';

/**
 * Format price based on market type
 * @param price - The price to format
 * @param marketType - The market type (stocks, crypto, forex)
 * @returns Formatted price string
 */
export const formatPrice = (price: number, marketType: MarketType): string => {
  if (marketType === 'stocks') {
    return formatIndianCurrency(price);
  } else if (marketType === 'crypto') {
    // For crypto, no currency symbol - just the number
    return price.toFixed(2);
  }
  return `$${price.toFixed(4)}`;
};
