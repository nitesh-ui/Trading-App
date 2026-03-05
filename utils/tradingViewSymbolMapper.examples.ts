/**
 * TradingView Symbol Normalizer - Usage Examples
 * This file demonstrates how to use the symbol normalizer
 */

import { 
  getTradingViewSymbol, 
  getTradingViewSymbolEncoded,
  getDisplayName 
} from './tradingViewSymbolMapper';

// ============================================
// EXAMPLE USAGE
// ============================================

console.log('=== TradingView Symbol Normalizer Examples ===\n');

// 1. Indian Stocks
console.log('--- Indian Stocks ---');
console.log('POWERGRID →', getTradingViewSymbol('POWERGRID')); // NSE:POWERGRID
console.log('TCS →', getTradingViewSymbol('TCS')); // NSE:TCS
console.log('RELIANCE →', getTradingViewSymbol('RELIANCE')); // NSE:RELIANCE
console.log('');

// 2. Indian Indices
console.log('--- Indian Indices ---');
console.log('NIFTY →', getTradingViewSymbol('NIFTY')); // NSE:NIFTY
console.log('BANKNIFTY →', getTradingViewSymbol('BANKNIFTY')); // NSE:BANKNIFTY
console.log('');

// 3. Indian Futures (CRITICAL - prevents 404 errors)
console.log('--- Indian Futures (Invalid → Valid) ---');
console.log('BANKNIFTY26JANFUT →', getTradingViewSymbol('BANKNIFTY26JANFUT')); // NSE:BANKNIFTY1!
console.log('NIFTY27FEBFUT →', getTradingViewSymbol('NIFTY27FEBFUT')); // NSE:NIFTY1!
console.log('FINNIFTY26JANFUT →', getTradingViewSymbol('FINNIFTY26JANFUT')); // NSE:FINNIFTY1!
console.log('');

// 4. MCX Commodities
console.log('--- MCX Commodities ---');
console.log('CRUDEOIL →', getTradingViewSymbol('CRUDEOIL')); // MCX:CRUDEOIL1!
console.log('GOLD →', getTradingViewSymbol('GOLD')); // MCX:GOLD1!
console.log('SILVER →', getTradingViewSymbol('SILVER')); // MCX:SILVER1!
console.log('');

// 5. Crypto
console.log('--- Crypto ---');
console.log('BTC →', getTradingViewSymbol('BTC', 'crypto')); // BINANCE:BTCUSDT
console.log('BTCUSDT →', getTradingViewSymbol('BTCUSDT', 'crypto')); // BINANCE:BTCUSDT
console.log('ETH →', getTradingViewSymbol('ETH', 'crypto')); // BINANCE:ETHUSDT
console.log('BITCOIN →', getTradingViewSymbol('BITCOIN', 'crypto')); // BINANCE:BTCUSDT
console.log('');

// 6. Forex
console.log('--- Forex ---');
console.log('USDINR →', getTradingViewSymbol('USDINR', 'forex')); // FX_IDC:USDINR
console.log('EURUSD →', getTradingViewSymbol('EURUSD', 'forex')); // FX_IDC:EURUSD
console.log('GBPUSD →', getTradingViewSymbol('GBPUSD', 'forex')); // FX_IDC:GBPUSD
console.log('');

// 7. US Stocks
console.log('--- US Stocks ---');
console.log('AAPL →', getTradingViewSymbol('AAPL')); // NASDAQ:AAPL
console.log('TSLA →', getTradingViewSymbol('TSLA')); // NASDAQ:TSLA
console.log('JPM →', getTradingViewSymbol('JPM')); // NYSE:JPM
console.log('');

// 8. URL Encoded (for TradingView widget URLs)
console.log('--- URL Encoded ---');
console.log('BANKNIFTY26JANFUT →', getTradingViewSymbolEncoded('BANKNIFTY26JANFUT')); // NSE%3ABANKNIFTY1!
console.log('POWERGRID →', getTradingViewSymbolEncoded('POWERGRID')); // NSE%3APOWERGRID
console.log('');

// 9. Display Names
console.log('--- Display Names ---');
console.log('NSE:BANKNIFTY1! →', getDisplayName('NSE:BANKNIFTY1!')); // BANKNIFTY Futures
console.log('NSE:POWERGRID →', getDisplayName('NSE:POWERGRID')); // POWERGRID
console.log('');

// ============================================
// INTEGRATION EXAMPLE
// ============================================

/**
 * Example: How to use in your TradingView chart component
 */
export function useTradingViewChart(userSymbol: string, marketType?: 'stocks' | 'forex' | 'crypto') {
  // Convert user input to valid TradingView symbol
  const tvSymbol = getTradingViewSymbol(userSymbol, marketType);
  
  // Use in TradingView widget URL
  const widgetUrl = `https://s.tradingview.com/widgetembed/?symbol=${encodeURIComponent(tvSymbol)}`;
  
  console.log(`Chart URL for "${userSymbol}": ${widgetUrl}`);
  
  return {
    symbol: tvSymbol,
    displayName: getDisplayName(tvSymbol),
    widgetUrl
  };
}

// Test the integration
console.log('--- Integration Test ---');
useTradingViewChart('BANKNIFTY26JANFUT');
useTradingViewChart('BTC', 'crypto');
useTradingViewChart('POWERGRID');
console.log('');

// ============================================
// EDGE CASES
// ============================================

console.log('--- Edge Cases ---');
console.log('lowercase "powergrid" →', getTradingViewSymbol('powergrid')); // NSE:POWERGRID
console.log('BTC/USDT →', getTradingViewSymbol('BTC/USDT', 'crypto')); // BINANCE:BTCUSDT
console.log('Already formatted NSE:RELIANCE →', getTradingViewSymbol('NSE:RELIANCE')); // NSE:RELIANCE
console.log('Empty string →', getTradingViewSymbol('')); // NSE:NIFTY (fallback)
console.log('');

console.log('=== All examples completed ===');
