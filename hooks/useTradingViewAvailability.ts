/**
 * useTradingViewAvailability Hook - Simplified Version
 * 
 * Always allows opening chart, but provides info for derivatives
 */

import { useMemo } from 'react';
import { getTradingViewSymbol } from '../utils/tradingViewSymbols';

export interface TradingViewAvailability {
  /** Always true - we always allow opening chart */
  canOpenChart: boolean;
  /** The TradingView symbol to use */
  symbol: string;
  /** Whether this is a derivative showing alternate chart */
  isDerivative: boolean;
  /** Message to show for derivatives (optional) */
  message?: string;
  /** Base/underlying symbol */
  baseSymbol: string;
  /** Exchange */
  exchange: string;
}

/**
 * Hook to get TradingView symbol info
 * Always allows chart opening - just provides context for derivatives
 */
export function useTradingViewAvailability(
  ticker: string | undefined | null,
  exchange?: string
): TradingViewAvailability {
  return useMemo(() => {
    if (!ticker || typeof ticker !== 'string' || ticker.trim() === '') {
      return {
        canOpenChart: true,
        symbol: 'NSE:NIFTY',
        isDerivative: false,
        baseSymbol: 'NIFTY',
        exchange: 'NSE'
      };
    }

    const result = getTradingViewSymbol(ticker, exchange);
    
    return {
      canOpenChart: true, // Always allow
      symbol: result.symbol,
      isDerivative: result.isDerivative,
      message: result.derivativeMessage,
      baseSymbol: result.baseSymbol,
      exchange: result.exchange
    };
  }, [ticker, exchange]);
}

/**
 * Simple hook that just returns the symbol
 */
export function useTradingViewSymbol(
  ticker: string | undefined | null,
  exchange?: string
): string {
  return useMemo(() => {
    if (!ticker) return 'NSE:NIFTY';
    return getTradingViewSymbol(ticker, exchange).symbol;
  }, [ticker, exchange]);
}

export default useTradingViewAvailability;
