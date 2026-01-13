/**
 * Test Suite for TradingView Symbol Mapping
 * 
 * Run this file to verify all symbol mappings work correctly:
 * npx ts-node utils/tradingViewSymbols.test.ts
 */

import {
  normalizeTicker,
  isTradingViewSupportedSymbol,
  mapToTradingViewSymbol,
  getTradingViewResult,
} from './tradingViewSymbols';

// Test cases
interface TestCase {
  input: string;
  expectedSupported: boolean;
  expectedSymbol: string | null;
  description: string;
}

const testCases: TestCase[] = [
  // ===== VALID SYMBOLS =====
  
  // NSE Stocks
  { input: 'RELIANCE', expectedSupported: true, expectedSymbol: 'NSE:RELIANCE', description: 'NSE Stock - Reliance' },
  { input: 'TCS', expectedSupported: true, expectedSymbol: 'NSE:TCS', description: 'NSE Stock - TCS' },
  { input: 'HDFCBANK', expectedSupported: true, expectedSymbol: 'NSE:HDFCBANK', description: 'NSE Stock - HDFC Bank' },
  { input: 'reliance', expectedSupported: true, expectedSymbol: 'NSE:RELIANCE', description: 'NSE Stock - lowercase' },
  { input: ' INFY ', expectedSupported: true, expectedSymbol: 'NSE:INFY', description: 'NSE Stock - with spaces' },
  
  // NSE Indices - Standard names
  { input: 'NIFTY', expectedSupported: true, expectedSymbol: 'NSE:NIFTY', description: 'NSE Index - NIFTY' },
  { input: 'BANKNIFTY', expectedSupported: true, expectedSymbol: 'NSE:BANKNIFTY', description: 'NSE Index - BANKNIFTY' },
  { input: 'FINNIFTY', expectedSupported: true, expectedSymbol: 'NSE:FINNIFTY', description: 'NSE Index - FINNIFTY' },
  { input: 'MIDCPNIFTY', expectedSupported: true, expectedSymbol: 'NSE:MIDCPNIFTY', description: 'NSE Index - MIDCPNIFTY' },
  
  // NSE Indices - Common aliases (the main issue!)
  { input: 'NIFTY 50', expectedSupported: true, expectedSymbol: 'NSE:NIFTY', description: 'NSE Index - NIFTY 50 (alias)' },
  { input: 'NIFTY50', expectedSupported: true, expectedSymbol: 'NSE:NIFTY', description: 'NSE Index - NIFTY50 (alias)' },
  { input: 'BANK NIFTY', expectedSupported: true, expectedSymbol: 'NSE:BANKNIFTY', description: 'NSE Index - BANK NIFTY (alias)' },
  { input: 'FIN NIFTY', expectedSupported: true, expectedSymbol: 'NSE:FINNIFTY', description: 'NSE Index - FIN NIFTY (alias)' },
  { input: 'NIFTY MIDCAP 100', expectedSupported: true, expectedSymbol: 'NSE:MIDCPNIFTY', description: 'NSE Index - NIFTY MIDCAP 100 (alias)' },
  { input: 'NIFTY MIDCAP 50', expectedSupported: true, expectedSymbol: 'NSE:MIDCPNIFTY', description: 'NSE Index - NIFTY MIDCAP 50 (alias)' },
  { input: 'MIDCAP NIFTY', expectedSupported: true, expectedSymbol: 'NSE:MIDCPNIFTY', description: 'NSE Index - MIDCAP NIFTY (alias)' },
  { input: 'NIFTY IT', expectedSupported: true, expectedSymbol: 'NSE:NIFTYIT', description: 'NSE Index - NIFTY IT (alias)' },
  { input: 'SENSEX', expectedSupported: true, expectedSymbol: 'NSE:SENSEX', description: 'BSE Index - SENSEX' },
  { input: 'BSE SENSEX', expectedSupported: true, expectedSymbol: 'NSE:SENSEX', description: 'BSE Index - BSE SENSEX (alias)' },
  
  // MCX Commodities (should map to continuous futures)
  { input: 'GOLD', expectedSupported: true, expectedSymbol: 'MCX:GOLD1!', description: 'MCX - Gold continuous' },
  { input: 'SILVER', expectedSupported: true, expectedSymbol: 'MCX:SILVER1!', description: 'MCX - Silver continuous' },
  { input: 'CRUDEOIL', expectedSupported: true, expectedSymbol: 'MCX:CRUDEOIL1!', description: 'MCX - Crude Oil continuous' },
  { input: 'NATURALGAS', expectedSupported: true, expectedSymbol: 'MCX:NATURALGAS1!', description: 'MCX - Natural Gas continuous' },
  { input: 'NATGAS', expectedSupported: true, expectedSymbol: 'MCX:NATURALGAS1!', description: 'MCX - Natural Gas alias' },
  { input: 'COPPER', expectedSupported: true, expectedSymbol: 'MCX:COPPER1!', description: 'MCX - Copper continuous' },
  { input: 'ZINC', expectedSupported: true, expectedSymbol: 'MCX:ZINC1!', description: 'MCX - Zinc continuous' },
  
  // Crypto
  { input: 'BTCUSDT', expectedSupported: true, expectedSymbol: 'BINANCE:BTCUSDT', description: 'Crypto - BTC/USDT' },
  { input: 'ETHUSDT', expectedSupported: true, expectedSymbol: 'BINANCE:ETHUSDT', description: 'Crypto - ETH/USDT' },
  { input: 'BTC', expectedSupported: true, expectedSymbol: 'BINANCE:BTCUSDT', description: 'Crypto - BTC (auto add USDT)' },
  { input: 'ETH', expectedSupported: true, expectedSymbol: 'BINANCE:ETHUSDT', description: 'Crypto - ETH (auto add USDT)' },
  { input: 'SOLUSDT', expectedSupported: true, expectedSymbol: 'BINANCE:SOLUSDT', description: 'Crypto - SOL/USDT' },
  
  // Forex
  { input: 'EURUSD', expectedSupported: true, expectedSymbol: 'FX_IDC:EURUSD', description: 'Forex - EUR/USD' },
  { input: 'GBPUSD', expectedSupported: true, expectedSymbol: 'FX_IDC:GBPUSD', description: 'Forex - GBP/USD' },
  { input: 'USDINR', expectedSupported: true, expectedSymbol: 'FX_IDC:USDINR', description: 'Forex - USD/INR' },
  { input: 'USDJPY', expectedSupported: true, expectedSymbol: 'FX_IDC:USDJPY', description: 'Forex - USD/JPY' },
  
  // US Stocks
  { input: 'AAPL', expectedSupported: true, expectedSymbol: 'NASDAQ:AAPL', description: 'US Stock - Apple' },
  { input: 'MSFT', expectedSupported: true, expectedSymbol: 'NASDAQ:MSFT', description: 'US Stock - Microsoft' },
  { input: 'TSLA', expectedSupported: true, expectedSymbol: 'NASDAQ:TSLA', description: 'US Stock - Tesla' },
  { input: 'JPM', expectedSupported: true, expectedSymbol: 'NYSE:JPM', description: 'US Stock - JPMorgan' },
  
  // ===== INVALID SYMBOLS (should return null) =====
  
  // Options (CE/PE)
  { input: 'NIFTY2610526100CE', expectedSupported: false, expectedSymbol: null, description: 'Invalid - NIFTY Option CE' },
  { input: 'NIFTY2610526100PE', expectedSupported: false, expectedSymbol: null, description: 'Invalid - NIFTY Option PE' },
  { input: 'BANKNIFTY26JAN45000PE', expectedSupported: false, expectedSymbol: null, description: 'Invalid - BANKNIFTY Option' },
  { input: 'RELIANCE2610526100CE', expectedSupported: false, expectedSymbol: null, description: 'Invalid - Stock Option' },
  
  // Futures with expiry
  { input: 'GOLD25FEBFUT', expectedSupported: false, expectedSymbol: null, description: 'Invalid - Gold futures with expiry' },
  { input: 'GOLD26APRFUT', expectedSupported: false, expectedSymbol: null, description: 'Invalid - Gold futures Apr' },
  { input: 'CRUDEOILM28JANFUT', expectedSupported: false, expectedSymbol: null, description: 'Invalid - Crude Oil mini futures' },
  { input: 'SILVER26JANFUT', expectedSupported: false, expectedSymbol: null, description: 'Invalid - Silver futures' },
  { input: 'NATURALGAS26MARFUT', expectedSupported: false, expectedSymbol: null, description: 'Invalid - Natural Gas futures' },
  
  // Index futures
  { input: 'NIFTY26JANFUT', expectedSupported: false, expectedSymbol: null, description: 'Invalid - NIFTY futures' },
  { input: 'BANKNIFTY26JANFUT', expectedSupported: false, expectedSymbol: null, description: 'Invalid - BANKNIFTY futures' },
  { input: 'INFY26JANFUT', expectedSupported: false, expectedSymbol: null, description: 'Invalid - Stock futures' },
  
  // Weekly expiry
  { input: 'NIFTY26JAN', expectedSupported: false, expectedSymbol: null, description: 'Invalid - Weekly expiry' },
  { input: 'BANKNIFTY26FEB', expectedSupported: false, expectedSymbol: null, description: 'Invalid - Weekly expiry' },
  
  // MCX with date patterns
  { input: 'GOLD26JAN', expectedSupported: false, expectedSymbol: null, description: 'Invalid - Gold with date' },
  { input: 'SILVER26FEB', expectedSupported: false, expectedSymbol: null, description: 'Invalid - Silver with date' },
  
  // Empty/Invalid
  { input: '', expectedSupported: false, expectedSymbol: null, description: 'Invalid - Empty string' },
  { input: '   ', expectedSupported: false, expectedSymbol: null, description: 'Invalid - Whitespace' },
  { input: 'XYZABC123', expectedSupported: false, expectedSymbol: null, description: 'Invalid - Unknown symbol' },
];

// Run tests
console.log('═══════════════════════════════════════════════════════════');
console.log('   TradingView Symbol Mapping Test Suite');
console.log('═══════════════════════════════════════════════════════════\n');

let passed = 0;
let failed = 0;

testCases.forEach((test, index) => {
  const normalized = normalizeTicker(test.input);
  const supported = isTradingViewSupportedSymbol(test.input);
  const symbol = mapToTradingViewSymbol(test.input);
  
  const supportedMatch = supported === test.expectedSupported;
  const symbolMatch = symbol === test.expectedSymbol;
  const isPass = supportedMatch && symbolMatch;
  
  if (isPass) {
    passed++;
    console.log(`✅ PASS [${index + 1}/${testCases.length}] ${test.description}`);
    console.log(`   Input: "${test.input}" → Symbol: "${symbol}"`);
  } else {
    failed++;
    console.log(`❌ FAIL [${index + 1}/${testCases.length}] ${test.description}`);
    console.log(`   Input: "${test.input}"`);
    console.log(`   Expected: supported=${test.expectedSupported}, symbol="${test.expectedSymbol}"`);
    console.log(`   Got:      supported=${supported}, symbol="${symbol}"`);
  }
  console.log('');
});

// Summary
console.log('═══════════════════════════════════════════════════════════');
if (failed === 0) {
  console.log(`✅ ALL TESTS PASSED! (${passed}/${testCases.length})`);
} else {
  console.log(`❌ TESTS FAILED: ${failed} failed, ${passed} passed out of ${testCases.length}`);
}
console.log('═══════════════════════════════════════════════════════════\n');

// Additional detailed test
console.log('\n📋 Detailed Result Examples:\n');

const detailedExamples = ['RELIANCE', 'GOLD', 'NIFTY2610526100CE', 'GOLD26APRFUT', 'BTCUSDT', 'EURUSD'];
detailedExamples.forEach(ticker => {
  const result = getTradingViewResult(ticker);
  console.log(`"${ticker}":`);
  console.log(`  Supported: ${result.supported}`);
  console.log(`  Symbol: ${result.symbol}`);
  console.log(`  Category: ${result.category}`);
  if (result.reason) {
    console.log(`  Reason: ${result.reason}`);
  }
  console.log('');
});

// Exit code
process.exit(failed > 0 ? 1 : 0);
