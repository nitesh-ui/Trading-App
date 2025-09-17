// Mock Forex Data Service
export interface ForexPair {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  volume: number;
  high: number;
  low: number;
  open: number;
  previousClose: number;
  spread: number;
  pipValue: number;
}

export interface ForexIndices {
  dxy: {
    value: number;
    change: number;
    changePercent: number;
  };
  eur: {
    value: number;
    change: number;
    changePercent: number;
  };
  gbp: {
    value: number;
    change: number;
    changePercent: number;
  };
}

// Mock Forex pairs data - major currency pairs
const FOREX_PAIRS: ForexPair[] = [
  {
    symbol: 'USDINR',
    name: 'US Dollar / Indian Rupee',
    price: 83.2450,
    change: 0.1250,
    changePercent: 0.15,
    volume: 2567890,
    high: 83.3200,
    low: 83.1800,
    open: 83.2100,
    previousClose: 83.1200,
    spread: 0.0050,
    pipValue: 0.0001,
  },
  {
    symbol: 'EURUSD',
    name: 'Euro / US Dollar',
    price: 1.0850,
    change: -0.0025,
    changePercent: -0.23,
    volume: 4567890,
    high: 1.0875,
    low: 1.0835,
    open: 1.0865,
    previousClose: 1.0875,
    spread: 0.0002,
    pipValue: 0.0001,
  },
  {
    symbol: 'GBPUSD',
    name: 'British Pound / US Dollar',
    price: 1.2650,
    change: 0.0035,
    changePercent: 0.28,
    volume: 3456789,
    high: 1.2675,
    low: 1.2620,
    open: 1.2635,
    previousClose: 1.2615,
    spread: 0.0003,
    pipValue: 0.0001,
  },
  {
    symbol: 'USDJPY',
    name: 'US Dollar / Japanese Yen',
    price: 149.850,
    change: -0.320,
    changePercent: -0.21,
    volume: 2876543,
    high: 150.200,
    low: 149.650,
    open: 150.050,
    previousClose: 150.170,
    spread: 0.050,
    pipValue: 0.01,
  },
  {
    symbol: 'AUDUSD',
    name: 'Australian Dollar / US Dollar',
    price: 0.6580,
    change: 0.0015,
    changePercent: 0.23,
    volume: 1876543,
    high: 0.6595,
    low: 0.6565,
    open: 0.6575,
    previousClose: 0.6565,
    spread: 0.0002,
    pipValue: 0.0001,
  },
  {
    symbol: 'USDCAD',
    name: 'US Dollar / Canadian Dollar',
    price: 1.3620,
    change: -0.0045,
    changePercent: -0.33,
    volume: 1567890,
    high: 1.3655,
    low: 1.3610,
    open: 1.3640,
    previousClose: 1.3665,
    spread: 0.0003,
    pipValue: 0.0001,
  },
  {
    symbol: 'NZDUSD',
    name: 'New Zealand Dollar / US Dollar',
    price: 0.6120,
    change: 0.0025,
    changePercent: 0.41,
    volume: 987654,
    high: 0.6135,
    low: 0.6095,
    open: 0.6105,
    previousClose: 0.6095,
    spread: 0.0003,
    pipValue: 0.0001,
  },
  {
    symbol: 'USDCHF',
    name: 'US Dollar / Swiss Franc',
    price: 0.8750,
    change: -0.0015,
    changePercent: -0.17,
    volume: 1234567,
    high: 0.8775,
    low: 0.8740,
    open: 0.8760,
    previousClose: 0.8765,
    spread: 0.0002,
    pipValue: 0.0001,
  },
];

// Mock forex indices
let FOREX_INDICES: ForexIndices = {
  dxy: {
    value: 103.85,
    change: -0.15,
    changePercent: -0.14,
  },
  eur: {
    value: 1.0850,
    change: -0.0025,
    changePercent: -0.23,
  },
  gbp: {
    value: 1.2650,
    change: 0.0035,
    changePercent: 0.28,
  },
};

// Store for forex pairs
let forexPairs = [...FOREX_PAIRS];
let forexIndices = { ...FOREX_INDICES };

// Subscribers for live updates
type ForexSubscriber = (pairs: ForexPair[], indices: ForexIndices) => void;
const forexSubscribers: ForexSubscriber[] = [];

// Simulate live price updates
const simulateForexUpdates = () => {
  forexPairs = forexPairs.map(pair => {
    const changePercent = (Math.random() - 0.5) * 2; // -1% to +1%
    const change = pair.price * (changePercent / 100);
    const newPrice = Math.max(0.0001, pair.price + change);
    
    return {
      ...pair,
      price: Number(newPrice.toFixed(4)),
      change: Number(change.toFixed(4)),
      changePercent: Number(changePercent.toFixed(2)),
      high: Math.max(pair.high, newPrice),
      low: Math.min(pair.low, newPrice),
    };
  });

  // Update indices
  forexIndices = {
    dxy: {
      ...forexIndices.dxy,
      value: Number((forexIndices.dxy.value + (Math.random() - 0.5) * 0.2).toFixed(2)),
      change: Number(((Math.random() - 0.5) * 0.3).toFixed(2)),
      changePercent: Number(((Math.random() - 0.5) * 0.5).toFixed(2)),
    },
    eur: {
      ...forexIndices.eur,
      value: Number((forexIndices.eur.value + (Math.random() - 0.5) * 0.002).toFixed(4)),
      change: Number(((Math.random() - 0.5) * 0.005).toFixed(4)),
      changePercent: Number(((Math.random() - 0.5) * 0.5).toFixed(2)),
    },
    gbp: {
      ...forexIndices.gbp,
      value: Number((forexIndices.gbp.value + (Math.random() - 0.5) * 0.002).toFixed(4)),
      change: Number(((Math.random() - 0.5) * 0.005).toFixed(4)),
      changePercent: Number(((Math.random() - 0.5) * 0.5).toFixed(2)),
    },
  };

  // Notify all subscribers
  forexSubscribers.forEach(callback => callback([...forexPairs], { ...forexIndices }));
};

// Start simulation (update every 2 seconds)
let forexUpdateInterval: any;

const startForexSimulation = () => {
  if (forexUpdateInterval) {
    clearInterval(forexUpdateInterval);
  }
  // Reduced frequency: update every 3 seconds instead of 2 for better performance
  forexUpdateInterval = setInterval(simulateForexUpdates, 3000);
};

const stopForexSimulation = () => {
  if (forexUpdateInterval) {
    clearInterval(forexUpdateInterval);
  }
};

// Service API
export const forexService = {
  getPairs: (): ForexPair[] => [...forexPairs],
  
  getIndices: (): ForexIndices => ({ ...forexIndices }),
  
  getPairBySymbol: (symbol: string): ForexPair | undefined => {
    return forexPairs.find(pair => pair.symbol === symbol);
  },
  
  subscribe: (callback: ForexSubscriber): (() => void) => {
    forexSubscribers.push(callback);
    
    // Start simulation when first subscriber joins
    // Disabled for static data during development
    // if (forexSubscribers.length === 1) {
    //   startForexSimulation();
    // }
    
    // Return unsubscribe function
    return () => {
      const index = forexSubscribers.indexOf(callback);
      if (index > -1) {
        forexSubscribers.splice(index, 1);
      }
      
      // Stop simulation when no subscribers left
      // Disabled for static data during development
      // if (forexSubscribers.length === 0) {
      //   stopForexSimulation();
      // }
    };
  },
  
  // Utility functions
  formatSpread: (spread: number): string => {
    return spread.toFixed(4);
  },
  
  formatPips: (value: number, pipValue: number): string => {
    const pips = Math.abs(value / pipValue);
    return `${pips.toFixed(1)} pips`;
  },
};

// Auto-start simulation for demo purposes
startForexSimulation();
