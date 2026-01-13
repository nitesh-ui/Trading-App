/**
 * Test cases for TradingView Symbol Normalizer
 * Run these tests to verify all conversions work correctly
 */

import { getTradingViewSymbol, getTradingViewSymbolEncoded } from '../tradingViewSymbolMapper';

describe('TradingView Symbol Normalizer', () => {
  
  // Indian Stocks
  test('Indian stocks should map to NSE', () => {
    expect(getTradingViewSymbol('POWERGRID')).toBe('NSE:POWERGRID');
    expect(getTradingViewSymbol('TCS')).toBe('NSE:TCS');
    expect(getTradingViewSymbol('RELIANCE')).toBe('NSE:RELIANCE');
    expect(getTradingViewSymbol('INFY')).toBe('NSE:INFY');
    expect(getTradingViewSymbol('HDFCBANK')).toBe('NSE:HDFCBANK');
  });

  // Indian Indices
  test('Indian indices should map to NSE', () => {
    expect(getTradingViewSymbol('NIFTY')).toBe('NSE:NIFTY');
    expect(getTradingViewSymbol('BANKNIFTY')).toBe('NSE:BANKNIFTY');
    expect(getTradingViewSymbol('FINNIFTY')).toBe('NSE:FINNIFTY');
    expect(getTradingViewSymbol('SENSEX')).toBe('NSE:SENSEX');
  });

  // Indian Futures
  test('Indian futures should map to continuous futures', () => {
    expect(getTradingViewSymbol('BANKNIFTY26JANFUT')).toBe('NSE:BANKNIFTY1!');
    expect(getTradingViewSymbol('NIFTY27FEBFUT')).toBe('NSE:NIFTY1!');
    expect(getTradingViewSymbol('BANKNIFTY26FEB')).toBe('NSE:BANKNIFTY1!');
    expect(getTradingViewSymbol('NIFTYFUT')).toBe('NSE:NIFTY1!');
    expect(getTradingViewSymbol('FINNIFTY26JANFUT')).toBe('NSE:FINNIFTY1!');
  });

  // MCX Commodities
  test('MCX commodities should map to MCX with continuous futures', () => {
    expect(getTradingViewSymbol('CRUDEOIL')).toBe('MCX:CRUDEOIL1!');
    expect(getTradingViewSymbol('GOLD')).toBe('MCX:GOLD1!');
    expect(getTradingViewSymbol('SILVER')).toBe('MCX:SILVER1!');
    expect(getTradingViewSymbol('NATURALGAS')).toBe('MCX:NATURALGAS1!');
    expect(getTradingViewSymbol('COPPER')).toBe('MCX:COPPER1!');
  });

  // Crypto
  test('Crypto should map to BINANCE', () => {
    expect(getTradingViewSymbol('BTC', 'crypto')).toBe('BINANCE:BTCUSDT');
    expect(getTradingViewSymbol('BTCUSDT', 'crypto')).toBe('BINANCE:BTCUSDT');
    expect(getTradingViewSymbol('ETH', 'crypto')).toBe('BINANCE:ETHUSDT');
    expect(getTradingViewSymbol('ETHUSDT', 'crypto')).toBe('BINANCE:ETHUSDT');
    expect(getTradingViewSymbol('SOL', 'crypto')).toBe('BINANCE:SOLUSDT');
    expect(getTradingViewSymbol('DOGE', 'crypto')).toBe('BINANCE:DOGEUSDT');
  });

  test('Crypto aliases should work', () => {
    expect(getTradingViewSymbol('BITCOIN', 'crypto')).toBe('BINANCE:BTCUSDT');
    expect(getTradingViewSymbol('ETHEREUM', 'crypto')).toBe('BINANCE:ETHUSDT');
    expect(getTradingViewSymbol('SOLANA', 'crypto')).toBe('BINANCE:SOLUSDT');
  });

  // Forex
  test('Forex pairs should map to FX_IDC or OANDA', () => {
    expect(getTradingViewSymbol('USDINR', 'forex')).toBe('FX_IDC:USDINR');
    expect(getTradingViewSymbol('EURINR', 'forex')).toBe('FX_IDC:EURINR');
    expect(getTradingViewSymbol('GBPINR', 'forex')).toBe('FX_IDC:GBPINR');
    expect(getTradingViewSymbol('EURUSD', 'forex')).toBe('FX_IDC:EURUSD');
    expect(getTradingViewSymbol('GBPUSD', 'forex')).toBe('FX_IDC:GBPUSD');
  });

  // US Stocks
  test('US stocks should map to NASDAQ or NYSE', () => {
    expect(getTradingViewSymbol('AAPL')).toBe('NASDAQ:AAPL');
    expect(getTradingViewSymbol('TSLA')).toBe('NASDAQ:TSLA');
    expect(getTradingViewSymbol('MSFT')).toBe('NASDAQ:MSFT');
    expect(getTradingViewSymbol('GOOGL')).toBe('NASDAQ:GOOGL');
    expect(getTradingViewSymbol('JPM')).toBe('NYSE:JPM');
    expect(getTradingViewSymbol('V')).toBe('NYSE:V');
  });

  // Case insensitivity
  test('Should handle lowercase and mixed case', () => {
    expect(getTradingViewSymbol('powergrid')).toBe('NSE:POWERGRID');
    expect(getTradingViewSymbol('BaNkNiFtY26JaNfUt')).toBe('NSE:BANKNIFTY1!');
    expect(getTradingViewSymbol('btc', 'crypto')).toBe('BINANCE:BTCUSDT');
  });

  // Already formatted symbols
  test('Should trust already formatted symbols', () => {
    expect(getTradingViewSymbol('NSE:RELIANCE')).toBe('NSE:RELIANCE');
    expect(getTradingViewSymbol('BINANCE:BTCUSDT')).toBe('BINANCE:BTCUSDT');
    expect(getTradingViewSymbol('NASDAQ:AAPL')).toBe('NASDAQ:AAPL');
  });

  // URL Encoding
  test('Should properly encode symbols for URLs', () => {
    expect(getTradingViewSymbolEncoded('BANKNIFTY26JANFUT')).toBe('NSE%3ABANKNIFTY1!');
    expect(getTradingViewSymbolEncoded('POWERGRID')).toBe('NSE%3APOWERGRID');
    expect(getTradingViewSymbolEncoded('BTC', 'crypto')).toBe('BINANCE%3ABTCUSDT');
  });

  // Edge cases
  test('Should handle empty and invalid inputs', () => {
    expect(getTradingViewSymbol('')).toBe('NSE:NIFTY'); // Default fallback
    expect(getTradingViewSymbol('   ')).toBe('NSE:NIFTY'); // Whitespace
  });

  test('Should handle separators', () => {
    expect(getTradingViewSymbol('BTC/USDT', 'crypto')).toBe('BINANCE:BTCUSDT');
    expect(getTradingViewSymbol('BTC-USDT', 'crypto')).toBe('BINANCE:BTCUSDT');
    expect(getTradingViewSymbol('BTC_USDT', 'crypto')).toBe('BINANCE:BTCUSDT');
  });

  // Unknown symbols fallback
  test('Should fallback unknown symbols appropriately', () => {
    // Unknown short ticker defaults to NASDAQ
    expect(getTradingViewSymbol('XYZ')).toBe('NASDAQ:XYZ');
    
    // Unknown Indian-looking ticker defaults to NSE
    expect(getTradingViewSymbol('RANDOMSTOCK')).toBe('NSE:RANDOMSTOCK');
  });
});

// Manual test examples (for console testing)
export const testExamples = () => {
  console.log('=== TradingView Symbol Normalizer Test Examples ===\n');

  const examples = [
    // Indian Stocks
    { input: 'POWERGRID', market: undefined, expected: 'NSE:POWERGRID' },
    { input: 'TCS', market: undefined, expected: 'NSE:TCS' },
    { input: 'RELIANCE', market: undefined, expected: 'NSE:RELIANCE' },
    
    // Indian Indices
    { input: 'NIFTY', market: undefined, expected: 'NSE:NIFTY' },
    { input: 'BANKNIFTY', market: undefined, expected: 'NSE:BANKNIFTY' },
    
    // Indian Futures
    { input: 'BANKNIFTY26JANFUT', market: undefined, expected: 'NSE:BANKNIFTY1!' },
    { input: 'NIFTY27FEBFUT', market: undefined, expected: 'NSE:NIFTY1!' },
    
    // MCX Commodities
    { input: 'CRUDEOIL', market: undefined, expected: 'MCX:CRUDEOIL1!' },
    { input: 'GOLD', market: undefined, expected: 'MCX:GOLD1!' },
    
    // Crypto
    { input: 'BTC', market: 'crypto', expected: 'BINANCE:BTCUSDT' },
    { input: 'BTCUSDT', market: 'crypto', expected: 'BINANCE:BTCUSDT' },
    { input: 'ETH', market: 'crypto', expected: 'BINANCE:ETHUSDT' },
    
    // Forex
    { input: 'USDINR', market: 'forex', expected: 'FX_IDC:USDINR' },
    { input: 'EURUSD', market: 'forex', expected: 'FX_IDC:EURUSD' },
    
    // US Stocks
    { input: 'AAPL', market: undefined, expected: 'NASDAQ:AAPL' },
    { input: 'TSLA', market: undefined, expected: 'NASDAQ:TSLA' },
    { input: 'JPM', market: undefined, expected: 'NYSE:JPM' },
  ];

  examples.forEach(({ input, market, expected }) => {
    const result = getTradingViewSymbol(input, market as any);
    const status = result === expected ? '✅' : '❌';
    console.log(`${status} Input: "${input}" (${market || 'auto'}) → "${result}" (Expected: "${expected}")`);
  });

  console.log('\n=== URL Encoded Examples ===\n');
  
  const urlExamples = [
    'BANKNIFTY26JANFUT',
    'POWERGRID',
    'BTC'
  ];

  urlExamples.forEach(input => {
    const encoded = getTradingViewSymbolEncoded(input);
    console.log(`"${input}" → "${encoded}"`);
  });
};
