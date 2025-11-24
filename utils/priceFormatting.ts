import { formatIndianCurrency } from './indianFormatting';
import { MarketType } from '../components/watchlist/types';

/**
 * Format price based on market type
 * @param price - The price to format
 * @param marketType - The market type (stocks, crypto, forex)
 * @returns Formatted price string (no currency symbols)
 */
export const formatPrice = (price: number, marketType: MarketType): string => {
  if (marketType === 'stocks') {
    return formatIndianCurrency(price);
  } else if (marketType === 'crypto') {
    // For crypto, show up to 5 decimal places, no currency symbol
    return price.toFixed(5);
  } else if (marketType === 'forex') {
    // For forex, show up to 5 decimal places, no currency symbol
    return price.toFixed(5);
  }
  // Default: 2 decimal places, no currency symbol
  return price.toFixed(2);
};
