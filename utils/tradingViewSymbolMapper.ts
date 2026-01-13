/**
 * TradingView Symbol Normalizer
 * Converts any user-entered ticker into a valid TradingView symbol
 * Prevents TradingView 404 errors by mapping invalid symbols to their correct format
 */

// Known Indian stock symbols (NSE)
const INDIAN_STOCKS = new Set([
  'RELIANCE', 'TCS', 'HDFCBANK', 'INFY', 'ICICIBANK', 'HINDUNILVR', 'ITC',
  'SBIN', 'BHARTIARTL', 'KOTAKBANK', 'LT', 'AXISBANK', 'ASIANPAINT', 'MARUTI',
  'HCLTECH', 'WIPRO', 'BAJFINANCE', 'ULTRACEMCO', 'NESTLEIND', 'TITAN',
  'POWERGRID', 'SUNPHARMA', 'ONGC', 'NTPC', 'TATAMOTORS', 'TATASTEEL',
  'TECHM', 'M&M', 'DRREDDY', 'BAJAJFINSV', 'INDUSINDBK', 'ADANIPORTS',
  'JSWSTEEL', 'COALINDIA', 'GRASIM', 'BRITANNIA', 'SHREECEM', 'DIVISLAB',
  'EICHERMOT', 'HINDALCO', 'HEROMOTOCO', 'CIPLA', 'BPCL', 'TATACONSUM',
  'APOLLOHOSP', 'SBILIFE', 'BAJAJ-AUTO', 'HDFCLIFE', 'IOC', 'ADANIENT'
]);

// Known Indian indices
const INDIAN_INDICES = new Set([
  'NIFTY', 'BANKNIFTY', 'NIFTYIT', 'NIFTYPHARMA', 'NIFTYMETAL',
  'FINNIFTY', 'MIDCPNIFTY', 'SENSEX', 'BANKEX'
]);

// Known MCX commodities
const MCX_COMMODITIES = new Set([
  'GOLD', 'SILVER', 'CRUDEOIL', 'NATURALGAS', 'COPPER', 'ZINC', 'LEAD',
  'NICKEL', 'ALUMINIUM', 'COTTON', 'MENTHAOIL'
]);

// Known US stocks (top companies)
const US_STOCKS = new Map<string, string>([
  ['AAPL', 'NASDAQ:AAPL'],
  ['MSFT', 'NASDAQ:MSFT'],
  ['GOOGL', 'NASDAQ:GOOGL'],
  ['GOOG', 'NASDAQ:GOOG'],
  ['AMZN', 'NASDAQ:AMZN'],
  ['NVDA', 'NASDAQ:NVDA'],
  ['TSLA', 'NASDAQ:TSLA'],
  ['META', 'NASDAQ:META'],
  ['FB', 'NASDAQ:META'], // Alias
  ['NFLX', 'NASDAQ:NFLX'],
  ['AMD', 'NASDAQ:AMD'],
  ['INTC', 'NASDAQ:INTC'],
  ['PYPL', 'NASDAQ:PYPL'],
  ['ADBE', 'NASDAQ:ADBE'],
  ['CSCO', 'NASDAQ:CSCO'],
  ['AVGO', 'NASDAQ:AVGO'],
  ['COST', 'NASDAQ:COST'],
  ['PEP', 'NASDAQ:PEP'],
  ['CMCSA', 'NASDAQ:CMCSA'],
  ['QCOM', 'NASDAQ:QCOM'],
  // NYSE stocks
  ['BRK.A', 'NYSE:BRK.A'],
  ['BRK.B', 'NYSE:BRK.B'],
  ['V', 'NYSE:V'],
  ['JPM', 'NYSE:JPM'],
  ['JNJ', 'NYSE:JNJ'],
  ['WMT', 'NYSE:WMT'],
  ['MA', 'NYSE:MA'],
  ['UNH', 'NYSE:UNH'],
  ['HD', 'NYSE:HD'],
  ['PG', 'NYSE:PG'],
  ['BAC', 'NYSE:BAC'],
  ['DIS', 'NYSE:DIS'],
  ['KO', 'NYSE:KO'],
  ['PFE', 'NYSE:PFE'],
  ['XOM', 'NYSE:XOM'],
  ['CVX', 'NYSE:CVX'],
  ['NKE', 'NYSE:NKE'],
  ['MRK', 'NYSE:MRK'],
  ['T', 'NYSE:T'],
  ['VZ', 'NYSE:VZ']
]);

// Known crypto symbols
const CRYPTO_SYMBOLS = new Set([
  'BTC', 'ETH', 'BNB', 'XRP', 'ADA', 'DOGE', 'SOL', 'DOT', 'MATIC',
  'LTC', 'AVAX', 'LINK', 'UNI', 'ATOM', 'ETC', 'XLM', 'ALGO', 'VET',
  'ICP', 'FIL', 'TRX', 'NEAR', 'HBAR', 'APT', 'ARB', 'OP'
]);

// Crypto aliases and common inputs
const CRYPTO_ALIASES = new Map<string, string>([
  ['BITCOIN', 'BTC'],
  ['ETHEREUM', 'ETH'],
  ['BINANCE', 'BNB'],
  ['RIPPLE', 'XRP'],
  ['CARDANO', 'ADA'],
  ['DOGECOIN', 'DOGE'],
  ['SOLANA', 'SOL'],
  ['POLKADOT', 'DOT'],
  ['POLYGON', 'MATIC'],
  ['LITECOIN', 'LTC'],
  ['AVALANCHE', 'AVAX'],
  ['CHAINLINK', 'LINK'],
  ['UNISWAP', 'UNI']
]);

// Forex pairs
const FOREX_PAIRS = new Set([
  'USDINR', 'EURUSD', 'GBPUSD', 'USDJPY', 'AUDUSD', 'USDCAD', 'USDCHF',
  'NZDUSD', 'EURJPY', 'GBPJPY', 'EURGBP', 'EURINR', 'GBPINR', 'JPYINR'
]);

/**
 * Main function to convert user input to valid TradingView symbol
 */
export function getTradingViewSymbol(userInput: string, marketType?: 'stocks' | 'forex' | 'crypto'): string {
  if (!userInput || typeof userInput !== 'string') {
    return 'NSE:NIFTY'; // Default fallback
  }

  // Clean and normalize input
  let input = userInput.trim().toUpperCase();
  
  // Remove common separators and normalize
  input = input.replace(/[\/\-_\s]/g, '');
  
  // If already has exchange prefix, extract the symbol part for processing
  let originalInput = input;
  if (input.includes(':')) {
    input = input.split(':')[1]; // Extract symbol after exchange prefix
  }

  // 1. Handle Options (NIFTY2610626100CE, BANKNIFTY2610645000PE, etc.)
  // Options pattern: SYMBOL + YYMMDD + STRIKE + CE/PE
  if (input.match(/^(NIFTY|BANKNIFTY|FINNIFTY|MIDCPNIFTY)\d{6}\d+[CP]E$/i)) {
    // Indian options are not well supported on TradingView, return the underlying index
    const underlying = input.match(/^(NIFTY|BANKNIFTY|FINNIFTY|MIDCPNIFTY)/i)?.[1] || 'NIFTY';
    console.warn(`⚠️ Options contracts (${input}) are not supported on TradingView. Showing underlying: ${underlying}`);
    return `NSE:${underlying.toUpperCase()}`;
  }

  // 2. Handle Futures Detection (BANKNIFTY26JANFUT, NIFTY27FEBFUT, GOLD26APRFUT, etc.)
  // Check for specific futures patterns BEFORE checking commodity names
  if (input.match(/BANKNIFTY.*FUT/i) || input.match(/BANKNIFTY\d{2}[A-Z]{3}/)) {
    return 'NSE:BANKNIFTY1!';
  }
  if (input.match(/^NIFTY.*FUT/i) || input.match(/^NIFTY\d{2}[A-Z]{3}/)) {
    // Only match if it starts with NIFTY to avoid conflicts
    return 'NSE:NIFTY1!';
  }
  if (input.match(/FINNIFTY.*FUT/i) || input.match(/FINNIFTY\d{2}[A-Z]{3}/)) {
    return 'NSE:FINNIFTY1!';
  }
  if (input.match(/MIDCPNIFTY.*FUT/i) || input.match(/MIDCPNIFTY\d{2}[A-Z]{3}/)) {
    return 'NSE:MIDCPNIFTY1!';
  }

  // 3. Handle MCX Commodity Futures (GOLD26APRFUT, CRUDEOIL27JANFUT, etc.)
  // Check if input contains commodity name AND has FUT or date pattern
  for (const commodity of MCX_COMMODITIES) {
    if (input.includes(commodity) && (input.includes('FUT') || input.match(/\d{2}[A-Z]{3}/))) {
      return `MCX:${commodity}1!`;
    }
  }

  // 4. Handle MCX Commodities (CRUDEOIL, GOLD, etc.) - WITHOUT FUT suffix
  for (const commodity of MCX_COMMODITIES) {
    if (input === commodity) {
      return `MCX:${commodity}1!`;
    }
  }

  // 5. Handle Crypto
  if (marketType === 'crypto' || isCryptoSymbol(input)) {
    return getCryptoSymbol(input);
  }

  // 6. Handle Forex
  if (marketType === 'forex' || isForexPair(input)) {
    return getForexSymbol(input);
  }

  // 7. Handle Indian Indices (NIFTY, BANKNIFTY, etc.)
  if (INDIAN_INDICES.has(input)) {
    return `NSE:${input}`;
  }

  // 8. Handle Indian Stocks
  if (INDIAN_STOCKS.has(input)) {
    return `NSE:${input}`;
  }

  // 9. Handle US Stocks
  if (US_STOCKS.has(input)) {
    return US_STOCKS.get(input)!;
  }

  // 10. Try to detect by pattern
  // If it's all uppercase letters (1-5 chars), likely a US stock
  if (/^[A-Z]{1,5}$/.test(input)) {
    // Default to NASDAQ for short tickers
    return `NASDAQ:${input}`;
  }

  // 11. If nothing matched, fallback to NSE stock
  // (Assume Indian stocks by default if no other match)
  return `NSE:${input}`;
}

/**
 * Check if input is a crypto symbol
 */
function isCryptoSymbol(input: string): boolean {
  // Check direct match
  for (const crypto of CRYPTO_SYMBOLS) {
    if (input.includes(crypto)) {
      return true;
    }
  }

  // Check aliases
  for (const [alias, _] of CRYPTO_ALIASES) {
    if (input.includes(alias)) {
      return true;
    }
  }

  // Check for USDT/BUSD/USDC pairs
  if (input.includes('USDT') || input.includes('BUSD') || input.includes('USDC') || input.includes('USD')) {
    return true;
  }

  return false;
}

/**
 * Get crypto symbol for TradingView
 */
function getCryptoSymbol(input: string): string {
  // Handle aliases first
  for (const [alias, symbol] of CRYPTO_ALIASES) {
    if (input.includes(alias)) {
      return `BINANCE:${symbol}USDT`;
    }
  }

  // Extract base crypto symbol
  let baseSymbol = '';
  for (const crypto of CRYPTO_SYMBOLS) {
    if (input.includes(crypto)) {
      baseSymbol = crypto;
      break;
    }
  }

  if (!baseSymbol) {
    // Try to extract from common patterns
    const match = input.match(/^([A-Z]{2,5})/);
    if (match) {
      baseSymbol = match[1];
    } else {
      return 'BINANCE:BTCUSDT'; // Default fallback
    }
  }

  // Determine quote currency (USDT, BUSD, USD, etc.)
  let quoteCurrency = 'USDT'; // Default
  if (input.includes('BUSD')) {
    quoteCurrency = 'BUSD';
  } else if (input.includes('USDC')) {
    quoteCurrency = 'USDC';
  } else if (input.includes('BTC') && baseSymbol !== 'BTC') {
    quoteCurrency = 'BTC';
  } else if (input.includes('ETH') && baseSymbol !== 'ETH') {
    quoteCurrency = 'ETH';
  }

  return `BINANCE:${baseSymbol}${quoteCurrency}`;
}

/**
 * Check if input is a forex pair
 */
function isForexPair(input: string): boolean {
  // Check direct match
  if (FOREX_PAIRS.has(input)) {
    return true;
  }

  // Check for currency code patterns (6 letters)
  if (/^[A-Z]{6}$/.test(input)) {
    return true;
  }

  return false;
}

/**
 * Get forex symbol for TradingView
 */
function getForexSymbol(input: string): string {
  // If it's a known pair, use FX_IDC
  if (FOREX_PAIRS.has(input)) {
    return `FX_IDC:${input}`;
  }

  // Try to construct from pattern
  if (/^[A-Z]{6}$/.test(input)) {
    // Check if it includes INR (Indian pairs)
    if (input.includes('INR')) {
      return `FX_IDC:${input}`;
    }
    // Otherwise use OANDA
    return `OANDA:${input}`;
  }

  // Default fallback
  return 'FX_IDC:USDINR';
}

/**
 * URL encode the symbol for TradingView widget
 */
export function encodeTradingViewSymbol(symbol: string): string {
  // Encode colon and other special characters
  return encodeURIComponent(symbol);
}

/**
 * Get TradingView symbol with URL encoding
 */
export function getTradingViewSymbolEncoded(userInput: string, marketType?: 'stocks' | 'forex' | 'crypto'): string {
  const symbol = getTradingViewSymbol(userInput, marketType);
  return encodeTradingViewSymbol(symbol);
}

/**
 * Batch convert multiple symbols
 */
export function batchGetTradingViewSymbols(
  inputs: string[], 
  marketType?: 'stocks' | 'forex' | 'crypto'
): string[] {
  return inputs.map(input => getTradingViewSymbol(input, marketType));
}

/**
 * Validate if a symbol is valid for TradingView
 */
export function isValidTradingViewSymbol(symbol: string): boolean {
  if (!symbol || typeof symbol !== 'string') {
    return false;
  }

  // Must have exchange prefix
  if (!symbol.includes(':')) {
    return false;
  }

  // Must not have invalid patterns
  if (symbol.includes('FUT') || symbol.match(/\d{2}[A-Z]{3}/)) {
    return false;
  }

  return true;
}

/**
 * Get display name from TradingView symbol
 */
export function getDisplayName(tvSymbol: string): string {
  const parts = tvSymbol.split(':');
  if (parts.length === 2) {
    return parts[1].replace('1!', ' Futures');
  }
  return tvSymbol;
}

// Export default
export default {
  getTradingViewSymbol,
  encodeTradingViewSymbol,
  getTradingViewSymbolEncoded,
  batchGetTradingViewSymbols,
  isValidTradingViewSymbol,
  getDisplayName
};
