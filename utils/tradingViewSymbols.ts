/**
 * TradingView Symbol Mapping Utility - Simplified Version
 * 
 * Simple approach:
 * 1. Always allow opening chart
 * 2. For futures/options with expiry - suggest continuous futures
 * 3. Map symbols to correct TradingView format
 */

// ============================================================================
// Types
// ============================================================================

export interface TradingViewResult {
  /** The TradingView symbol to use */
  symbol: string;
  /** Whether it's a derivative that needs special handling */
  isDerivative: boolean;
  /** Continuous futures symbol if this is a derivative */
  continuousSymbol?: string;
  /** Message to show user for derivatives */
  derivativeMessage?: string;
  /** The base/underlying symbol extracted */
  baseSymbol: string;
  /** Exchange prefix */
  exchange: string;
}

// ============================================================================
// MCX Commodities - Map to continuous futures
// ============================================================================

const MCX_COMMODITIES: Record<string, string> = {
  'GOLD': 'MCX:GOLD1!',
  'GOLDM': 'MCX:GOLDM1!',
  'GOLDPETAL': 'MCX:GOLDPETAL1!',
  'SILVER': 'MCX:SILVER1!',
  'SILVERM': 'MCX:SILVERM1!',
  'SILVERMIC': 'MCX:SILVERMIC1!',
  'CRUDEOIL': 'MCX:CRUDEOIL1!',
  'CRUDEOILM': 'MCX:CRUDEOILM1!',
  'NATURALGAS': 'MCX:NATURALGAS1!',
  'NATGAS': 'MCX:NATURALGAS1!',
  'NG': 'MCX:NATURALGAS1!',
  'COPPER': 'MCX:COPPER1!',
  'ZINC': 'MCX:ZINC1!',
  'LEAD': 'MCX:LEAD1!',
  'ALUMINIUM': 'MCX:ALUMINIUM1!',
  'NICKEL': 'MCX:NICKEL1!',
  'MENTHAOIL': 'MCX:MENTHAOIL1!',
  'COTTON': 'MCX:COTTON1!',
};

// ============================================================================
// Index Aliases - Common names used in apps
// ============================================================================

const INDEX_ALIASES: Record<string, string> = {
  // NIFTY 50
  'NIFTY50': 'NIFTY',
  'NIFTY 50': 'NIFTY',
  'NIFTY-50': 'NIFTY',
  'NIFTY_50': 'NIFTY',
  'NIFTYINDEX': 'NIFTY',
  
  // BANK NIFTY
  'BANKNIFTY': 'BANKNIFTY',
  'BANK NIFTY': 'BANKNIFTY',
  'NIFTYBANK': 'BANKNIFTY',
  'NIFTY BANK': 'BANKNIFTY',
  
  // FIN NIFTY
  'FINNIFTY': 'FINNIFTY',
  'FIN NIFTY': 'FINNIFTY',
  'NIFTYFIN': 'FINNIFTY',
  
  // MIDCAP
  'MIDCPNIFTY': 'NIFTYMIDCAP50',
  'MIDCAP NIFTY': 'NIFTYMIDCAP50',
  'NIFTY MIDCAP': 'NIFTYMIDCAP50',
  'NIFTY MIDCAP 50': 'NIFTYMIDCAP50',
  'NIFTY MIDCAP 100': 'NIFTYMIDCAP100',
  'NIFTYMIDCAP100': 'NIFTYMIDCAP100',
  'NIFTYMIDCAP50': 'NIFTYMIDCAP50',
  
  // IT
  'NIFTYIT': 'NIFTYIT',
  'NIFTY IT': 'NIFTYIT',
  
  // SENSEX
  'SENSEX': 'SENSEX',
  'BSE SENSEX': 'SENSEX',
  'SENSEX30': 'SENSEX',
};

// ============================================================================
// Known US Stocks
// ============================================================================

const US_STOCKS: Record<string, string> = {
  'AAPL': 'NASDAQ:AAPL',
  'MSFT': 'NASDAQ:MSFT',
  'GOOGL': 'NASDAQ:GOOGL',
  'GOOG': 'NASDAQ:GOOG',
  'AMZN': 'NASDAQ:AMZN',
  'NVDA': 'NASDAQ:NVDA',
  'TSLA': 'NASDAQ:TSLA',
  'META': 'NASDAQ:META',
  'NFLX': 'NASDAQ:NFLX',
  'AMD': 'NASDAQ:AMD',
  'INTC': 'NASDAQ:INTC',
  'PYPL': 'NASDAQ:PYPL',
  'ADBE': 'NASDAQ:ADBE',
  'CSCO': 'NASDAQ:CSCO',
  'COIN': 'NASDAQ:COIN',
  'PLTR': 'NASDAQ:PLTR',
  'JPM': 'NYSE:JPM',
  'V': 'NYSE:V',
  'JNJ': 'NYSE:JNJ',
  'WMT': 'NYSE:WMT',
  'MA': 'NYSE:MA',
  'BAC': 'NYSE:BAC',
  'DIS': 'NYSE:DIS',
  'KO': 'NYSE:KO',
  'PFE': 'NYSE:PFE',
  'XOM': 'NYSE:XOM',
  'NKE': 'NYSE:NKE',
  'GS': 'NYSE:GS',
  'UBER': 'NYSE:UBER',
};

// ============================================================================
// Crypto base currencies
// ============================================================================

const CRYPTO_BASES = new Set([
  'BTC', 'ETH', 'BNB', 'XRP', 'ADA', 'DOGE', 'SOL', 'DOT', 'MATIC',
  'LTC', 'AVAX', 'LINK', 'UNI', 'ATOM', 'SHIB', 'TRX', 'NEAR', 'APT',
  'ARB', 'OP', 'SUI', 'PEPE', 'WIF', 'BONK', 'INJ', 'FET', 'RENDER'
]);

// ============================================================================
// Patterns to detect derivatives with expiry
// ============================================================================

// Options: NIFTY2610526100CE, BANKNIFTY26JAN45000PE
const OPTIONS_PATTERN = /^([A-Z]+)(\d{5,}|\d{2}[A-Z]{3}\d*)[CP]E$/i;

// Futures with expiry: GOLD26APRFUT, NIFTY26JANFUT, CRUDEOILM28JANFUT  
const FUTURES_EXPIRY_PATTERN = /^([A-Z]+)M?(\d{2}[A-Z]{3})(?:FUT)?$/i;

// Specific Futures Pattern: SYMBOL + YY + MMM + FUT (e.g., SILVER26MARFUT)
// Group 1: Symbol (e.g. SILVER)
// Group 2: Year (e.g. 26)
// Group 3: Month (e.g. MAR)
const SPECIFIC_FUTURES_PATTERN = /^([A-Z0-9]+)(\d{2})([A-Z]{3})FUT$/i;

// Weekly/monthly contracts: NIFTY26JAN, BANKNIFTY26FEB (only if followed by more chars)
const WEEKLY_PATTERN = /^([A-Z]+)(\d{2}[A-Z]{3}\d*)$/i;

// ============================================================================
// TradingView Futures Month Codes
// ============================================================================

const TV_MONTH_CODES: Record<string, string> = {
  'JAN': 'F', 'FEB': 'G', 'MAR': 'H', 'APR': 'J', 'MAY': 'K', 'JUN': 'M',
  'JUL': 'N', 'AUG': 'Q', 'SEP': 'U', 'OCT': 'V', 'NOV': 'X', 'DEC': 'Z'
};

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Extract base commodity/index name from derivative symbol
 */
function extractBaseSymbol(symbol: string): string {
  // Remove trailing M (for mini contracts)
  let base = symbol;
  
  // Try options pattern
  let match = symbol.match(OPTIONS_PATTERN);
  if (match) return match[1];
  
  // Try futures pattern
  match = symbol.match(FUTURES_EXPIRY_PATTERN);
  if (match) return match[1].replace(/M$/, '');
  
  // Try weekly pattern
  match = symbol.match(WEEKLY_PATTERN);
  if (match) return match[1];
  
  return base;
}

/**
 * Check if symbol is a derivative with expiry date
 */
function isDerivativeWithExpiry(symbol: string): boolean {
  if (OPTIONS_PATTERN.test(symbol)) return true;
  if (FUTURES_EXPIRY_PATTERN.test(symbol)) return true;
  // Weekly pattern only if symbol is long enough (has date component)
  if (WEEKLY_PATTERN.test(symbol) && symbol.length > 10) return true;
  // Check for FUT suffix
  if (symbol.endsWith('FUT') && /\d{2}[A-Z]{3}/.test(symbol)) return true;
  return false;
}

/**
 * Check if it's an options contract
 */
function isOptionsContract(symbol: string): boolean {
  return OPTIONS_PATTERN.test(symbol);
}

/**
 * Get continuous futures symbol for MCX commodity
 */
function getMCXContinuousSymbol(baseSymbol: string): string | null {
  const upper = baseSymbol.toUpperCase();
  // Also check without trailing M
  return MCX_COMMODITIES[upper] || MCX_COMMODITIES[upper.replace(/M$/, '')] || null;
}

/**
 * Try to generate a specific TradingView Futures symbol
 * e.g. SILVER26MARFUT -> MCX:SILVERH2026
 */
function getSpecificFutureSymbol(ticker: string): TradingViewResult | null {
  const match = ticker.match(SPECIFIC_FUTURES_PATTERN);
  if (!match) return null;

  const [_, root, year, monthStr] = match;
  const monthCode = TV_MONTH_CODES[monthStr.toUpperCase()];
  
  if (!monthCode) return null;

  const fullYear = `20${year}`; // Assume 20xx
  let exchange = 'NSE';
  let tvRoot = root;

  // Check if it's an MCX commodity
  // Check exact root first (e.g. SILVERM)
  if (MCX_COMMODITIES[root] || MCX_COMMODITIES[root.replace(/M$/, '')] || getMCXContinuousSymbol(root)) {
    exchange = 'MCX';
    // Use the root as is (SILVER, SILVERM, GOLD)
    tvRoot = root;
  } else {
    // Check NSE Indices
    const nseIndices = ['NIFTY', 'BANKNIFTY', 'FINNIFTY', 'MIDCPNIFTY'];
    const indexMatch = nseIndices.find(idx => root.startsWith(idx) || root === idx);
    
    if (indexMatch) {
       exchange = 'NSE';
       // Map internal index names to TV names if needed
       // NIFTY -> NIFTY
       // BANKNIFTY -> BANKNIFTY
       // FINNIFTY -> FINNIFTY
       // MIDCPNIFTY -> NIFTYMIDCAP50 ?? TV uses NIFTYMIDCAP50 
       // But often Futures on TV use specific codes.
       // NIFTY Future -> NIFTY
       // NIFTYMIDCAP50 Future -> MIDCPNIFTY ??
       // Let's stick to standard names used for Continuous
       
       if (root === 'MIDCPNIFTY') tvRoot = 'NIFTYMIDCAP50';
    } else {
       // Stock Futures
       exchange = 'NSE';
    }
  }

  // Construct symbol: EXCHANGE:ROOT + MONTH_CODE + YEAR
  // Example: MCX:SILVERH2026
  const symbol = `${exchange}:${tvRoot}${monthCode}${fullYear}`;

  return {
    symbol,
    isDerivative: false, // We consider this a valid chart, no warning needed!
    baseSymbol: root,
    exchange
  };
}

/**
 * Normalize ticker - clean up and standardize
 */
export function normalizeTicker(input: string): string {
  if (!input || typeof input !== 'string') return '';
  
  let ticker = input.trim().toUpperCase();
  
  // Check index aliases first (before removing spaces)
  if (INDEX_ALIASES[ticker]) {
    return INDEX_ALIASES[ticker];
  }
  
  // Remove spaces and special chars for further processing
  const cleaned = ticker.replace(/[\s\-_]/g, '');
  
  // Check aliases again after normalization
  if (INDEX_ALIASES[cleaned]) {
    return INDEX_ALIASES[cleaned];
  }
  
  return cleaned;
}

// ============================================================================
// Main Function
// ============================================================================

/**
 * Get TradingView symbol for any ticker
 * Always returns a symbol - never blocks chart opening
 */
export function getTradingViewSymbol(userInput: string, exchange?: string): TradingViewResult {
  const ticker = normalizeTicker(userInput);
  
  if (!ticker) {
    return {
      symbol: 'NSE:NIFTY',
      isDerivative: false,
      baseSymbol: 'NIFTY',
      exchange: 'NSE'
    };
  }
  
  // 1. Try to get specific Futures chart (e.g. SILVER26MARFUT)
  // This allows us to show the EXACT contract chart like Zerodha
  const specificFuture = getSpecificFutureSymbol(ticker);
  if (specificFuture) {
    return specificFuture;
  }

  // Check if it's a derivative with expiry
  if (isDerivativeWithExpiry(ticker)) {
    const baseSymbol = extractBaseSymbol(ticker);
    const isOption = isOptionsContract(ticker);
    
    // Check if base is MCX commodity
    const mcxSymbol = getMCXContinuousSymbol(baseSymbol);
    if (mcxSymbol) {
      return {
        symbol: mcxSymbol,
        isDerivative: true,
        continuousSymbol: mcxSymbol,
        derivativeMessage: isOption 
          ? `Options contracts are not available on TradingView. Showing ${baseSymbol} continuous futures instead.`
          : `Futures with expiry dates are not available. Showing ${baseSymbol} continuous futures (1!) instead.`,
        baseSymbol: baseSymbol,
        exchange: 'MCX'
      };
    }
    
    // Check if base is NSE index (NIFTY, BANKNIFTY, etc.)
    const nseIndices = ['NIFTY', 'BANKNIFTY', 'FINNIFTY', 'MIDCPNIFTY'];
    const matchedIndex = nseIndices.find(idx => baseSymbol.startsWith(idx) || baseSymbol === idx);
    if (matchedIndex) {
      const indexSymbol = baseSymbol.startsWith('BANKNIFTY') ? 'BANKNIFTY' :
                          baseSymbol.startsWith('FINNIFTY') ? 'FINNIFTY' :
                          baseSymbol.startsWith('MIDCPNIFTY') ? 'NIFTYMIDCAP50' : 'NIFTY';
      return {
        symbol: `NSE:${indexSymbol}`,
        isDerivative: true,
        continuousSymbol: `NSE:${indexSymbol}`,
        derivativeMessage: isOption
          ? `Options contracts are not available on TradingView. Showing ${indexSymbol} index instead.`
          : `Index futures/weekly contracts are not available. Showing ${indexSymbol} index instead.`,
        baseSymbol: indexSymbol,
        exchange: 'NSE'
      };
    }
    
    // For stock F&O, show the underlying stock
    return {
      symbol: `NSE:${baseSymbol}`,
      isDerivative: true,
      continuousSymbol: `NSE:${baseSymbol}`,
      derivativeMessage: isOption
        ? `Stock options are not available on TradingView. Showing ${baseSymbol} stock instead.`
        : `Stock futures are not available. Showing ${baseSymbol} stock instead.`,
      baseSymbol: baseSymbol,
      exchange: 'NSE'
    };
  }
  
  // Check MCX commodities (plain names like GOLD, SILVER)
  const mcxSymbol = getMCXContinuousSymbol(ticker);
  if (mcxSymbol) {
    return {
      symbol: mcxSymbol,
      isDerivative: false,
      baseSymbol: ticker,
      exchange: 'MCX'
    };
  }
  
  // Check if it's crypto
  if (ticker.endsWith('USDT') || ticker.endsWith('BUSD') || ticker.endsWith('USDC')) {
    return {
      symbol: `BINANCE:${ticker}`,
      isDerivative: false,
      baseSymbol: ticker.replace(/USDT|BUSD|USDC$/, ''),
      exchange: 'BINANCE'
    };
  }
  if (CRYPTO_BASES.has(ticker)) {
    return {
      symbol: `BINANCE:${ticker}USDT`,
      isDerivative: false,
      baseSymbol: ticker,
      exchange: 'BINANCE'
    };
  }
  
  // Check forex (6 letter pairs)
  if (ticker.length === 6 && /^[A-Z]{6}$/.test(ticker)) {
    const base = ticker.substring(0, 3);
    const quote = ticker.substring(3, 6);
    const currencies = ['USD', 'EUR', 'GBP', 'JPY', 'AUD', 'CAD', 'CHF', 'NZD', 'INR', 'CNY'];
    if (currencies.includes(base) && currencies.includes(quote)) {
      return {
        symbol: `FX_IDC:${ticker}`,
        isDerivative: false,
        baseSymbol: ticker,
        exchange: 'FX_IDC'
      };
    }
  }
  
  // Check US stocks
  if (US_STOCKS[ticker]) {
    return {
      symbol: US_STOCKS[ticker],
      isDerivative: false,
      baseSymbol: ticker,
      exchange: US_STOCKS[ticker].split(':')[0]
    };
  }
  
  // Check NSE indices
  const knownIndices = ['NIFTY', 'BANKNIFTY', 'FINNIFTY', 'NIFTYMIDCAP50', 'NIFTYMIDCAP100', 'NIFTYIT', 'SENSEX'];
  if (knownIndices.includes(ticker)) {
    const exchangePrefix = ticker === 'SENSEX' ? 'BSE' : 'NSE';
    return {
      symbol: `${exchangePrefix}:${ticker}`,
      isDerivative: false,
      baseSymbol: ticker,
      exchange: exchangePrefix
    };
  }
  
  // Default: Assume NSE stock or use provided exchange
  const finalExchange = exchange?.toUpperCase() || 'NSE';
  return {
    symbol: `${finalExchange}:${ticker}`,
    isDerivative: false,
    baseSymbol: ticker,
    exchange: finalExchange
  };
}

/**
 * Simple function to just get the symbol string
 */
export function mapToTradingViewSymbol(ticker: string, exchange?: string): string {
  return getTradingViewSymbol(ticker, exchange).symbol;
}

/**
 * Check if symbol is a derivative that will show alternate chart
 */
export function isDerivativeSymbol(ticker: string): boolean {
  const normalized = normalizeTicker(ticker);
  return isDerivativeWithExpiry(normalized);
}

/**
 * Get message for derivative symbols
 */
export function getDerivativeMessage(ticker: string): string | null {
  const result = getTradingViewSymbol(ticker);
  return result.derivativeMessage || null;
}

// Default export
export default {
  getTradingViewSymbol,
  mapToTradingViewSymbol,
  normalizeTicker,
  isDerivativeSymbol,
  getDerivativeMessage
};
