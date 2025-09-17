// Indian currency and number formatting utilities

export const formatIndianCurrency = (amount: number, showSymbol: boolean = true): string => {
  // Defensive check for invalid input
  if (typeof amount !== 'number' || isNaN(amount) || !isFinite(amount)) {
    return showSymbol ? '₹0.00' : '0.00';
  }

  const symbol = showSymbol ? '₹' : '';
  
  // For very large amounts, use crores and lakhs
  if (amount >= 10000000) { // 1 crore
    const crores = amount / 10000000;
    if (crores >= 100) {
      return `${symbol}${crores.toFixed(0)} Cr`;
    }
    return `${symbol}${crores.toFixed(1)} Cr`;
  }
  
  if (amount >= 100000) { // 1 lakh
    const lakhs = amount / 100000;
    return `${symbol}${lakhs.toFixed(1)} L`;
  }
  
  // For smaller amounts, use Indian comma formatting
  try {
    return `${symbol}${amount.toLocaleString('en-IN', {
      maximumFractionDigits: 2,
      minimumFractionDigits: 2,
    })}`;
  } catch (error) {
    // Fallback if toLocaleString fails
    return `${symbol}${amount.toFixed(2)}`;
  }
};

export const formatIndianNumber = (num: number): string => {
  return num.toLocaleString('en-IN');
};

export const formatMarketCap = (marketCap: number): string => {
  if (marketCap >= 10000000000000) { // 1 lakh crore
    return `₹${(marketCap / 10000000000000).toFixed(1)} L Cr`;
  }
  
  if (marketCap >= 10000000000) { // 1000 crore
    return `₹${(marketCap / 10000000000).toFixed(0)} K Cr`;
  }
  
  if (marketCap >= 10000000) { // 1 crore
    return `₹${(marketCap / 10000000).toFixed(0)} Cr`;
  }
  
  if (marketCap >= 100000) { // 1 lakh
    return `₹${(marketCap / 100000).toFixed(1)} L`;
  }
  
  return `₹${marketCap.toLocaleString('en-IN')}`;
};

export const formatVolume = (volume: number): string => {
  if (volume >= 10000000) { // 1 crore
    return `${(volume / 10000000).toFixed(1)} Cr`;
  }
  
  if (volume >= 100000) { // 1 lakh
    return `${(volume / 100000).toFixed(1)} L`;
  }
  
  if (volume >= 1000) { // 1 thousand
    return `${(volume / 1000).toFixed(1)}K`;
  }
  
  return volume.toString();
};

export const formatPriceChange = (change: number): string => {
  if (typeof change !== 'number' || isNaN(change) || !isFinite(change)) {
    return '₹0.00';
  }
  const sign = change >= 0 ? '+' : '';
  return `${sign}₹${Math.abs(change).toFixed(2)}`;
};

export const formatPercentage = (percent: number): string => {
  if (typeof percent !== 'number' || isNaN(percent) || !isFinite(percent)) {
    return '0.00%';
  }
  const sign = percent >= 0 ? '+' : '';
  return `${sign}${percent.toFixed(2)}%`;
};
