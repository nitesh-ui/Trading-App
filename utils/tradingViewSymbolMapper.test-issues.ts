/**
 * Quick Test for Symbol Normalizer Issues
 */

import { getTradingViewSymbol } from './tradingViewSymbolMapper';

console.log('=== Testing Issue Fixes ===\n');

// Issue 1: NIFTY Options (should show underlying index, not supported on TradingView)
console.log('--- Issue 1: NIFTY Options ---');
const optionTest1 = getTradingViewSymbol('NIFTY2610626100CE');
console.log(`NIFTY2610626100CE → ${optionTest1}`);
console.log(`Expected: NSE:NIFTY (underlying index)`);
console.log(`Actual: ${optionTest1}`);
console.log(`✅ Fixed: ${optionTest1 === 'NSE:NIFTY' ? 'YES' : 'NO'}\n`);

// Issue 1b: NIFTY Options with NSE prefix (from user screenshot)
console.log('--- Issue 1b: NIFTY Options with NSE Prefix ---');
const optionTest2 = getTradingViewSymbol('NSE:NIFTY2610626100CE');
console.log(`NSE:NIFTY2610626100CE → ${optionTest2}`);
console.log(`Expected: NSE:NIFTY (underlying index)`);
console.log(`Actual: ${optionTest2}`);
console.log(`✅ Fixed: ${optionTest2 === 'NSE:NIFTY' ? 'YES' : 'NO'}\n`);

// Issue 2: GOLD Futures (should map to MCX:GOLD1!, not NASDAQ:GOLD)
console.log('--- Issue 2: GOLD Futures ---');
const goldTest1 = getTradingViewSymbol('GOLD26APRFUT');
console.log(`GOLD26APRFUT → ${goldTest1}`);
console.log(`Expected: MCX:GOLD1!`);
console.log(`Actual: ${goldTest1}`);
console.log(`✅ Fixed: ${goldTest1 === 'MCX:GOLD1!' ? 'YES' : 'NO'}\n`);

const goldTest2 = getTradingViewSymbol('GOLD');
console.log(`GOLD → ${goldTest2}`);
console.log(`Expected: MCX:GOLD1!`);
console.log(`Actual: ${goldTest2}`);
console.log(`✅ Fixed: ${goldTest2 === 'MCX:GOLD1!' ? 'YES' : 'NO'}\n`);

// Additional MCX Futures Tests
console.log('--- Additional MCX Futures Tests ---');
const silverTest = getTradingViewSymbol('SILVER26JANFUT');
console.log(`SILVER26JANFUT → ${silverTest} (Expected: MCX:SILVER1!)`);

const crudeoilTest = getTradingViewSymbol('CRUDEOIL27JANFUT');
console.log(`CRUDEOIL27JANFUT → ${crudeoilTest} (Expected: MCX:CRUDEOIL1!)`);

const goldTest3 = getTradingViewSymbol('GOLD26JAN');
console.log(`GOLD26JAN → ${goldTest3} (Expected: MCX:GOLD1!)`);
console.log('');

// Additional Options Tests
console.log('--- Additional Options Tests ---');
const bankNiftyOption = getTradingViewSymbol('BANKNIFTY2610645000PE');
console.log(`BANKNIFTY2610645000PE → ${bankNiftyOption} (Expected: NSE:BANKNIFTY)`);

const finNiftyOption = getTradingViewSymbol('FINNIFTY2610626100CE');
console.log(`FINNIFTY2610626100CE → ${finNiftyOption} (Expected: NSE:FINNIFTY)`);
console.log('');

// Make sure regular futures still work
console.log('--- Regular Futures (Should Still Work) ---');
const bankNiftyFut = getTradingViewSymbol('BANKNIFTY26JANFUT');
console.log(`BANKNIFTY26JANFUT → ${bankNiftyFut} (Expected: NSE:BANKNIFTY1!)`);

const niftyFut = getTradingViewSymbol('NIFTY27FEBFUT');
console.log(`NIFTY27FEBFUT → ${niftyFut} (Expected: NSE:NIFTY1!)`);
console.log('');

// Make sure stocks still work
console.log('--- Regular Stocks (Should Still Work) ---');
const powergrid = getTradingViewSymbol('POWERGRID');
console.log(`POWERGRID → ${powergrid} (Expected: NSE:POWERGRID)`);

const aapl = getTradingViewSymbol('AAPL');
console.log(`AAPL → ${aapl} (Expected: NASDAQ:AAPL)`);
console.log('');

console.log('=== Test Complete ===');

// Summary
console.log('\n=== Summary ===');
const allFixed = 
  optionTest1 === 'NSE:NIFTY' &&
  optionTest2 === 'NSE:NIFTY' &&  // Added test for NSE prefix
  goldTest1 === 'MCX:GOLD1!' &&
  goldTest2 === 'MCX:GOLD1!' &&
  silverTest === 'MCX:SILVER1!' &&
  crudeoilTest === 'MCX:CRUDEOIL1!' &&
  bankNiftyOption === 'NSE:BANKNIFTY' &&
  bankNiftyFut === 'NSE:BANKNIFTY1!' &&
  niftyFut === 'NSE:NIFTY1!' &&
  powergrid === 'NSE:POWERGRID';

if (allFixed) {
  console.log('✅ All issues fixed!');
} else {
  console.log('❌ Some issues remain. Check the output above.');
}
