// Binance/Cryptocurrency Service
export interface CryptoPair {
  id: string;
  symbol: string;
  name: string;
  price: number;
  change24h: number;
  changePercent24h: number;
  volume24h: number;
  marketCap: number;
  rank: number;
  lastUpdated: number;
}

export interface CryptoIndices {
  totalMarketCap: number;
  totalVolume24h: number;
  btcDominance: number;
  ethDominance: number;
  defiMarketCap: number;
  fearGreedIndex: number;
}

class BinanceService {
  private cryptoPairs: CryptoPair[] = [
    {
      id: 'bitcoin',
      symbol: 'BTC/USDT',
      name: 'Bitcoin',
      price: 45234.56,
      change24h: 1234.56,
      changePercent24h: 2.81,
      volume24h: 28450000000,
      marketCap: 885000000000,
      rank: 1,
      lastUpdated: Date.now(),
    },
    {
      id: 'ethereum',
      symbol: 'ETH/USDT',
      name: 'Ethereum',
      price: 2834.89,
      change24h: -45.67,
      changePercent24h: -1.58,
      volume24h: 15230000000,
      marketCap: 341000000000,
      rank: 2,
      lastUpdated: Date.now(),
    },
    {
      id: 'binancecoin',
      symbol: 'BNB/USDT',
      name: 'BNB',
      price: 312.45,
      change24h: 8.92,
      changePercent24h: 2.94,
      volume24h: 1850000000,
      marketCap: 48000000000,
      rank: 3,
      lastUpdated: Date.now(),
    },
    {
      id: 'ripple',
      symbol: 'XRP/USDT',
      name: 'XRP',
      price: 0.6234,
      change24h: 0.0456,
      changePercent24h: 7.89,
      volume24h: 2340000000,
      marketCap: 33000000000,
      rank: 4,
      lastUpdated: Date.now(),
    },
    {
      id: 'cardano',
      symbol: 'ADA/USDT',
      name: 'Cardano',
      price: 0.4567,
      change24h: -0.0234,
      changePercent24h: -4.87,
      volume24h: 890000000,
      marketCap: 16000000000,
      rank: 5,
      lastUpdated: Date.now(),
    },
    {
      id: 'solana',
      symbol: 'SOL/USDT',
      name: 'Solana',
      price: 89.76,
      change24h: 4.32,
      changePercent24h: 5.06,
      volume24h: 1230000000,
      marketCap: 38000000000,
      rank: 6,
      lastUpdated: Date.now(),
    },
    {
      id: 'dogecoin',
      symbol: 'DOGE/USDT',
      name: 'Dogecoin',
      price: 0.0789,
      change24h: 0.0023,
      changePercent24h: 3.01,
      volume24h: 456000000,
      marketCap: 11000000000,
      rank: 7,
      lastUpdated: Date.now(),
    },
    {
      id: 'polygon',
      symbol: 'MATIC/USDT',
      name: 'Polygon',
      price: 0.8934,
      change24h: -0.0456,
      changePercent24h: -4.85,
      volume24h: 678000000,
      marketCap: 8500000000,
      rank: 8,
      lastUpdated: Date.now(),
    },
  ];

  private cryptoIndices: CryptoIndices = {
    totalMarketCap: 1750000000000, // $1.75T
    totalVolume24h: 85000000000,   // $85B
    btcDominance: 50.6,            // 50.6%
    ethDominance: 19.4,            // 19.4%
    defiMarketCap: 65000000000,    // $65B
    fearGreedIndex: 72,            // 72 (Greed)
  };

  private subscribers: ((pairs: CryptoPair[], indices: CryptoIndices) => void)[] = [];
  private updateInterval: ReturnType<typeof setInterval> | null = null;

  constructor() {
    // Disabled live updates for static charts until API integration
    // this.startLiveUpdates();
  }

  /**
   * Get all cryptocurrency pairs
   */
  getCryptoPairs(): CryptoPair[] {
    return [...this.cryptoPairs];
  }

  /**
   * Get crypto market indices
   */
  getCryptoIndices(): CryptoIndices {
    return { ...this.cryptoIndices };
  }

  /**
   * Subscribe to live price updates
   */
  subscribe(callback: (pairs: CryptoPair[], indices: CryptoIndices) => void): () => void {
    this.subscribers.push(callback);

    // Return unsubscribe function
    return () => {
      const index = this.subscribers.indexOf(callback);
      if (index > -1) {
        this.subscribers.splice(index, 1);
      }
    };
  }

  /**
   * Start live price simulation
   */
  private startLiveUpdates(): void {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
    }

    this.updateInterval = setInterval(() => {
      this.updatePrices();
      this.updateIndices();
      this.notifySubscribers();
    }, 3000); // Update every 3 seconds (less frequent for performance)
  }

  /**
   * Update cryptocurrency prices with realistic simulation
   */
  private updatePrices(): void {
    this.cryptoPairs = this.cryptoPairs.map(pair => {
      // Simulate realistic price movements (crypto is more volatile)
      const volatility = this.getVolatilityForCrypto(pair.symbol);
      const randomChange = (Math.random() - 0.5) * 2 * volatility;
      const newPrice = Math.max(0.0001, pair.price * (1 + randomChange / 100));
      
      const priceChange = newPrice - pair.price;
      const percentChange = (priceChange / pair.price) * 100;

      // Update 24h change (simulate rolling average)
      const newChange24h = pair.change24h * 0.99 + priceChange * 0.01;
      const newChangePercent24h = (newChange24h / (newPrice - newChange24h)) * 100;

      // Simulate volume changes
      const volumeChange = (Math.random() - 0.5) * 0.1; // ±5%
      const newVolume24h = Math.max(0, pair.volume24h * (1 + volumeChange));

      return {
        ...pair,
        price: parseFloat(newPrice.toFixed(pair.price > 1 ? 2 : 6)),
        change24h: parseFloat(newChange24h.toFixed(pair.price > 1 ? 2 : 6)),
        changePercent24h: parseFloat(newChangePercent24h.toFixed(2)),
        volume24h: Math.round(newVolume24h),
        lastUpdated: Date.now(),
      };
    });
  }

  /**
   * Get volatility factor based on cryptocurrency
   */
  private getVolatilityForCrypto(symbol: string): number {
    const volatilityMap: Record<string, number> = {
      'BTC/USDT': 2.5,    // Bitcoin - moderate volatility
      'ETH/USDT': 3.0,    // Ethereum - higher volatility
      'BNB/USDT': 3.5,    // BNB - higher volatility
      'XRP/USDT': 4.0,    // XRP - high volatility
      'ADA/USDT': 4.5,    // Cardano - high volatility
      'SOL/USDT': 5.0,    // Solana - very high volatility
      'DOGE/USDT': 6.0,   // Dogecoin - extremely volatile
      'MATIC/USDT': 4.5,  // Polygon - high volatility
    };
    return volatilityMap[symbol] || 3.0;
  }

  /**
   * Update crypto market indices
   */
  private updateIndices(): void {
    // Update total market cap based on individual crypto movements
    const marketCapChange = (Math.random() - 0.5) * 0.02; // ±1%
    this.cryptoIndices.totalMarketCap *= (1 + marketCapChange);

    // Update volume
    const volumeChange = (Math.random() - 0.5) * 0.1; // ±5%
    this.cryptoIndices.totalVolume24h *= (1 + volumeChange);

    // Update dominance (simulate slight changes)
    const btcDomChange = (Math.random() - 0.5) * 0.2; // ±0.1%
    this.cryptoIndices.btcDominance = Math.max(40, Math.min(60, this.cryptoIndices.btcDominance + btcDomChange));
    
    const ethDomChange = (Math.random() - 0.5) * 0.2; // ±0.1%
    this.cryptoIndices.ethDominance = Math.max(15, Math.min(25, this.cryptoIndices.ethDominance + ethDomChange));

    // Update Fear & Greed Index (0-100)
    const fearGreedChange = (Math.random() - 0.5) * 2; // ±1 point
    this.cryptoIndices.fearGreedIndex = Math.max(0, Math.min(100, this.cryptoIndices.fearGreedIndex + fearGreedChange));

    // Update DeFi market cap
    const defiChange = (Math.random() - 0.5) * 0.03; // ±1.5%
    this.cryptoIndices.defiMarketCap *= (1 + defiChange);
  }

  /**
   * Notify all subscribers of updates
   */
  private notifySubscribers(): void {
    this.subscribers.forEach(callback => {
      callback([...this.cryptoPairs], { ...this.cryptoIndices });
    });
  }

  /**
   * Stop live updates
   */
  stopLiveUpdates(): void {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }
  }

  /**
   * Get cryptocurrency by symbol
   */
  getCryptoBySymbol(symbol: string): CryptoPair | undefined {
    return this.cryptoPairs.find(pair => pair.symbol === symbol);
  }

  /**
   * Format crypto value for display
   */
  formatCryptoValue(value: number, decimals: number = 2): string {
    if (value >= 1e9) {
      return `$${(value / 1e9).toFixed(1)}B`;
    } else if (value >= 1e6) {
      return `$${(value / 1e6).toFixed(1)}M`;
    } else if (value >= 1e3) {
      return `$${(value / 1e3).toFixed(1)}K`;
    } else {
      return `$${value.toFixed(decimals)}`;
    }
  }
}

export const binanceService = new BinanceService();
