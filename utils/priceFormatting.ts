import { formatIndianCurrency } from './indianFormatting';
import { MarketType } from '../components/watchlist/types';

/**
 * Format price based on market type
 * @param price - The price to format
 * @param marketType - The market type (stocks, crypto, forex)
 * @returns Formatted price string
 */
export const formatPrice = (price: number, marketType: MarketType): string => {
  if (marketType === 'stocks' || marketType === 'crypto') {
    return formatIndianCurrency(price);
  }
  return `$${price.toFixed(4)}`;
};
