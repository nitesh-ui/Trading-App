// Mock Indian Stock Market Data Service
export interface IndianStock {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  volume: number;
  marketCap: number;
  high: number;
  low: number;
  open: number;
  previousClose: number;
  sector: string;
  exchange: 'NSE' | 'BSE' | 'MCX' | 'CDSL' | 'NCDEX';
}

export interface MarketIndices {
  nifty50: {
    value: number;
    change: number;
    changePercent: number;
  };
  sensex: {
    value: number;
    change: number;
    changePercent: number;
  };
  bankNifty: {
    value: number;
    change: number;
    changePercent: number;
  };
}

// Mock Indian stocks data - major companies
const INDIAN_STOCKS: IndianStock[] = [
  {
    symbol: 'RELIANCE',
    name: 'Reliance Industries Ltd.',
    price: 2456.75,
    change: 23.45,
    changePercent: 0.96,
    volume: 4567890,
    marketCap: 16600000000000,
    high: 2489.30,
    low: 2425.80,
    open: 2435.60,
    previousClose: 2433.30,
    sector: 'Oil & Gas',
    exchange: 'NSE',
  },
  {
    symbol: 'TCS',
    name: 'Tata Consultancy Services Ltd.',
    price: 3567.80,
    change: -45.20,
    changePercent: -1.25,
    volume: 2345678,
    marketCap: 13000000000000,
    high: 3598.45,
    low: 3545.60,
    open: 3590.20,
    previousClose: 3613.00,
    sector: 'IT Services',
    exchange: 'NSE',
  },
  {
    symbol: 'HDFCBANK',
    name: 'HDFC Bank Ltd.',
    price: 1678.95,
    change: 12.35,
    changePercent: 0.74,
    volume: 3456789,
    marketCap: 12800000000000,
    high: 1689.75,
    low: 1665.20,
    open: 1669.40,
    previousClose: 1666.60,
    sector: 'Banking',
    exchange: 'NSE',
  },
  {
    symbol: 'INFY',
    name: 'Infosys Ltd.',
    price: 1534.50,
    change: 18.75,
    changePercent: 1.24,
    volume: 1876543,
    marketCap: 6400000000000,
    high: 1548.90,
    low: 1521.30,
    open: 1525.80,
    previousClose: 1515.75,
    sector: 'IT Services',
    exchange: 'NSE',
  },
  {
    symbol: 'ICICIBANK',
    name: 'ICICI Bank Ltd.',
    price: 1089.45,
    change: -8.90,
    changePercent: -0.81,
    volume: 4123456,
    marketCap: 7600000000000,
    high: 1105.60,
    low: 1085.20,
    open: 1098.30,
    previousClose: 1098.35,
    sector: 'Banking',
    exchange: 'NSE',
  },
  {
    symbol: 'HINDUNILVR',
    name: 'Hindustan Unilever Ltd.',
    price: 2234.60,
    change: 34.80,
    changePercent: 1.58,
    volume: 987654,
    marketCap: 5200000000000,
    high: 2245.90,
    low: 2210.40,
    open: 2215.70,
    previousClose: 2199.80,
    sector: 'FMCG',
    exchange: 'NSE',
  },
  {
    symbol: 'ITC',
    name: 'ITC Ltd.',
    price: 456.30,
    change: -2.45,
    changePercent: -0.53,
    volume: 5678901,
    marketCap: 5700000000000,
    high: 461.80,
    low: 454.20,
    open: 458.90,
    previousClose: 458.75,
    sector: 'FMCG',
    exchange: 'BSE',
  },
  {
    symbol: 'SBIN',
    name: 'State Bank of India',
    price: 645.80,
    change: 8.45,
    changePercent: 1.33,
    volume: 6789012,
    marketCap: 5800000000000,
    high: 652.30,
    low: 638.90,
    open: 641.20,
    previousClose: 637.35,
    sector: 'Banking',
    exchange: 'BSE',
  },
  {
    symbol: 'BHARTIARTL',
    name: 'Bharti Airtel Ltd.',
    price: 1298.75,
    change: 15.60,
    changePercent: 1.22,
    volume: 2345671,
    marketCap: 7100000000000,
    high: 1308.40,
    low: 1285.90,
    open: 1289.30,
    previousClose: 1283.15,
    sector: 'Telecom',
    exchange: 'BSE',
  },
  {
    symbol: 'ASIANPAINT',
    name: 'Asian Paints Ltd.',
    price: 2987.45,
    change: -12.35,
    changePercent: -0.41,
    volume: 876543,
    marketCap: 2900000000000,
    high: 3005.80,
    low: 2975.60,
    open: 2998.90,
    previousClose: 2999.80,
    sector: 'Paints',
    exchange: 'BSE',
  },
  // MCX Stocks (Commodity Exchange)
  {
    symbol: 'GOLDPETAL',
    name: 'Gold Petals Ltd.',
    price: 52340.50,
    change: 245.30,
    changePercent: 0.47,
    volume: 125000,
    marketCap: 850000000000,
    high: 52580.20,
    low: 52100.40,
    open: 52150.80,
    previousClose: 52095.20,
    sector: 'Commodities',
    exchange: 'MCX',
  },
  {
    symbol: 'CRUDEOIL',
    name: 'Crude Oil Futures',
    price: 6789.25,
    change: -123.45,
    changePercent: -1.79,
    volume: 875000,
    marketCap: 450000000000,
    high: 6890.75,
    low: 6745.30,
    open: 6845.60,
    previousClose: 6912.70,
    sector: 'Energy',
    exchange: 'MCX',
  },
  // CDSL Stocks (Depository)
  {
    symbol: 'CDSL',
    name: 'Central Depository Services Ltd.',
    price: 1456.80,
    change: 23.45,
    changePercent: 1.64,
    volume: 234567,
    marketCap: 150000000000,
    high: 1475.20,
    low: 1442.30,
    open: 1450.60,
    previousClose: 1433.35,
    sector: 'Financial Services',
    exchange: 'CDSL',
  },
  {
    symbol: 'NSDL',
    name: 'National Securities Depository Ltd.',
    price: 2234.50,
    change: -15.80,
    changePercent: -0.70,
    volume: 156789,
    marketCap: 180000000000,
    high: 2265.40,
    low: 2225.70,
    open: 2248.90,
    previousClose: 2250.30,
    sector: 'Financial Services',
    exchange: 'CDSL',
  },
  // NCDEX Stocks (Agricultural Commodities)
  {
    symbol: 'WHEAT',
    name: 'Wheat Futures',
    price: 2145.75,
    change: 32.50,
    changePercent: 1.54,
    volume: 567890,
    marketCap: 75000000000,
    high: 2165.20,
    low: 2128.40,
    open: 2135.80,
    previousClose: 2113.25,
    sector: 'Agriculture',
    exchange: 'NCDEX',
  },
  {
    symbol: 'SUGARCANE',
    name: 'Sugar Futures',
    price: 3456.90,
    change: -67.25,
    changePercent: -1.91,
    volume: 345678,
    marketCap: 65000000000,
    high: 3534.80,
    low: 3445.60,
    open: 3498.40,
    previousClose: 3524.15,
    sector: 'Agriculture',
    exchange: 'NCDEX',
  },
];

const MARKET_INDICES: MarketIndices = {
  nifty50: {
    value: 19674.25,
    change: 123.45,
    changePercent: 0.63,
  },
  sensex: {
    value: 65953.48,
    change: 245.67,
    changePercent: 0.37,
  },
  bankNifty: {
    value: 45234.80,
    change: -89.25,
    changePercent: -0.20,
  },
};

class IndianStockService {
  private static instance: IndianStockService;
  private stocks: IndianStock[] = [...INDIAN_STOCKS];
  private indices: MarketIndices = { ...MARKET_INDICES };
  private subscribers: Array<(stocks: IndianStock[], indices: MarketIndices) => void> = [];
  private updateInterval: number | null = null;

  static getInstance(): IndianStockService {
    if (!IndianStockService.instance) {
      IndianStockService.instance = new IndianStockService();
    }
    return IndianStockService.instance;
  }

  // Subscribe to live price updates
  subscribe(callback: (stocks: IndianStock[], indices: MarketIndices) => void): () => void {
    this.subscribers.push(callback);
    
    // Start live updates if this is the first subscriber
    // Disabled for static data during development
    // if (this.subscribers.length === 1) {
    //   this.startLiveUpdates();
    // }

    // Return unsubscribe function
    return () => {
      this.subscribers = this.subscribers.filter(sub => sub !== callback);
      
      // Stop updates if no more subscribers
      // Disabled for static data during development
      // if (this.subscribers.length === 0) {
      //   this.stopLiveUpdates();
      // }
    };
  }

  // Get current stock data
  getStocks(): IndianStock[] {
    return [...this.stocks];
  }

  // Get current market indices
  getIndices(): MarketIndices {
    return { ...this.indices };
  }

  // Get specific stock by symbol
  getStock(symbol: string): IndianStock | undefined {
    return this.stocks.find(stock => stock.symbol === symbol);
  }

  private startLiveUpdates(): void {
    this.updateInterval = setInterval(() => {
      this.updatePrices();
      this.notifySubscribers();
    }, 3000); // Update every 3 seconds
  }

  private stopLiveUpdates(): void {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }
  }

  private updatePrices(): void {
    // Simulate realistic price movements
    this.stocks = this.stocks.map(stock => {
      const volatility = 0.002; // 0.2% max change per update
      const randomFactor = (Math.random() - 0.5) * 2 * volatility;
      const newPrice = stock.price * (1 + randomFactor);
      
      const change = newPrice - stock.previousClose;
      const changePercent = (change / stock.previousClose) * 100;

      return {
        ...stock,
        price: Math.round(newPrice * 100) / 100,
        change: Math.round(change * 100) / 100,
        changePercent: Math.round(changePercent * 100) / 100,
        high: Math.max(stock.high, newPrice),
        low: Math.min(stock.low, newPrice),
      };
    });

    // Update indices
    this.indices = {
      nifty50: this.updateIndex(this.indices.nifty50),
      sensex: this.updateIndex(this.indices.sensex),
      bankNifty: this.updateIndex(this.indices.bankNifty),
    };
  }

  private updateIndex(index: { value: number; change: number; changePercent: number }) {
    const volatility = 0.001; // 0.1% max change per update
    const randomFactor = (Math.random() - 0.5) * 2 * volatility;
    const baseValue = index.value - index.change; // Get original value
    const newValue = index.value * (1 + randomFactor);
    const change = newValue - baseValue;
    const changePercent = (change / baseValue) * 100;

    return {
      value: Math.round(newValue * 100) / 100,
      change: Math.round(change * 100) / 100,
      changePercent: Math.round(changePercent * 100) / 100,
    };
  }

  private notifySubscribers(): void {
    this.subscribers.forEach(callback => {
      callback([...this.stocks], { ...this.indices });
    });
  }
}

export const indianStockService = IndianStockService.getInstance();
