/**
 * MarketChart Component - TradingView Lightweight Charts
 * 
 * Integrates:
 * - Historical OHLC data from backend API
 * - Real-time updates via SignalR WebSocket
 * - TradingView Lightweight Charts via WebView
 */

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { View, StyleSheet, ActivityIndicator, Text as RNText, Platform } from 'react-native';
import WebView from 'react-native-webview';
import { HubConnectionBuilder, HubConnection, LogLevel } from '@microsoft/signalr';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '../../contexts/ThemeContext';

// ============================================================================
// Types
// ============================================================================

interface OHLCData {
  time: number; // epoch seconds
  open: number;
  high: number;
  low: number;
  close: number;
}

interface HistoricalAPIResponse {
  message: string;
  data: {
    isError: boolean;
    errorMessage: string;
    historicalData: Array<{
      timeStamp: string; // ISO format with timezone
      open: number;
      high: number;
      low: number;
      close: number;
      volume: number;
    }>;
  };
}

interface WebSocketMarketUpdate {
  type: number;
  target: string;
  arguments: Array<{
    timestamp: string;
    data: string; // JSON string containing Table array
  }>;
}

interface MarketDataRow {
  InstrumentToken: string;
  Lastprice: number;
  Open: number;
  Close: number;
  High: number;
  Low: number;
}

interface MarketChartProps {
  scriptCode: string;
  height?: number;
  interval?: 'minute' | 'day' | 'week' | 'month';
  daysBack?: number;
  segment?: 'stocks' | 'forex' | 'crypto' | 'mcx'; // Add segment to know market hours
}

// ============================================================================
// Constants
// ============================================================================

const API_BASE_URL = 'https://prod-tradingapi.sanaitatechnologies.com';
const WS_BASE_URL = 'wss://prod-tradingapi.sanaitatechnologies.com/hub/market';

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Check if market is currently open based on segment
 */
const isMarketOpen = (segment?: string): boolean => {
  const now = new Date();
  const istOffset = 5.5 * 60; // IST is UTC+5:30
  const utcTime = now.getTime() + (now.getTimezoneOffset() * 60000);
  const istTime = new Date(utcTime + (istOffset * 60000));
  
  const hours = istTime.getHours();
  const minutes = istTime.getMinutes();
  const currentTime = hours * 60 + minutes; // Convert to minutes since midnight
  const day = istTime.getDay(); // 0 = Sunday, 6 = Saturday
  
  // Weekend check for most markets
  if (day === 0 || day === 6) {
    if (segment === 'crypto') return true; // Crypto is 24/7
    return false; // Stocks, Forex, MCX closed on weekends
  }
  
  switch (segment) {
    case 'stocks':
      // NSE: 9:15 AM to 3:30 PM IST
      return currentTime >= 555 && currentTime <= 930; // 9:15 to 15:30
    case 'forex':
      // Forex: Generally 9:00 AM to 5:00 PM IST
      return currentTime >= 540 && currentTime <= 1020; // 9:00 to 17:00
    case 'mcx':
      // MCX: Generally 9:00 AM to 11:30 PM IST (with breaks)
      return currentTime >= 540 && currentTime <= 1410; // 9:00 to 23:30
    case 'crypto':
      // Crypto: 24/7
      return true;
    default:
      // Unknown segment, assume market hours
      return currentTime >= 540 && currentTime <= 930;
  }
};

const getMarketClosedMessage = (segment?: string): string => {
  switch (segment) {
    case 'stocks':
      return 'NSE market closed\n(Open: 9:15 AM - 3:30 PM IST)';
    case 'forex':
      return 'Forex market closed\n(Open: 9:00 AM - 5:00 PM IST)';
    case 'mcx':
      return 'MCX market closed\n(Open: 9:00 AM - 11:30 PM IST)';
    case 'crypto':
      return 'Waiting for data...\n(Crypto markets are 24/7)';
    default:
      return 'Market closed\nWaiting for market to open';
  }
};

// ============================================================================
// Main Component
// ============================================================================

export const MarketChart: React.FC<MarketChartProps> = ({
  scriptCode,
  height = 400,
  interval = 'minute',
  daysBack = 5,
  segment = 'stocks',
}) => {
  const { theme } = useTheme();
  const webViewRef = useRef<WebView>(null);
  const wsConnectionRef = useRef<HubConnection | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [wsConnected, setWsConnected] = useState(false);
  const [marketOpen, setMarketOpen] = useState(isMarketOpen(segment));

  const isDark = theme.colors.background === '#000000' || theme.colors.background === '#121212';

  // Check market hours periodically
  useEffect(() => {
    const checkMarket = () => {
      const open = isMarketOpen(segment);
      setMarketOpen(open);
    };
    
    // Check every minute
    const interval = setInterval(checkMarket, 60000);
    
    return () => clearInterval(interval);
  }, [segment]);

  // ============================================================================
  // API: Fetch Historical Data
  // ============================================================================

  const fetchHistoricalData = useCallback(async (): Promise<OHLCData[]> => {
    try {
      const toDate = new Date();
      const fromDate = new Date();
      fromDate.setDate(toDate.getDate() - daysBack);

      const fromStr = fromDate.toISOString().split('T')[0]; // YYYY-MM-DD
      const toStr = toDate.toISOString().split('T')[0];

      const url = `${API_BASE_URL}/WatchListApi/historical-data?scriptCode=${scriptCode}&fromDate=${fromStr}&toDate=${toStr}&interval=${interval}`;

      console.log('📊 [CHART DEBUG] Fetching historical data:', {
        scriptCode,
        url,
        fromDate: fromStr,
        toDate: toStr,
        interval,
        segment
      });

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      console.log('📊 [CHART DEBUG] Response status:', response.status, response.statusText);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ [CHART DEBUG] API Error Response:', errorText);
        // Return empty array to show empty chart
        return [];
      }

      const json: HistoricalAPIResponse = await response.json();
      
      console.log('📊 [CHART DEBUG] Full API Response:', JSON.stringify(json, null, 2));
      console.log('📊 [CHART DEBUG] Data check:', {
        hasData: !!json.data,
        isError: json.data?.isError,
        dataCount: json.data?.historicalData?.length || 0,
        errorMessage: json.data?.errorMessage,
        firstItem: json.data?.historicalData?.[0],
        lastItem: json.data?.historicalData?.[json.data?.historicalData?.length - 1]
      });

      if (json.data.isError) {
        console.warn('⚠️ [CHART DEBUG] API returned error:', json.data.errorMessage);
        return [];
      }

      if (!json.data.historicalData || json.data.historicalData.length === 0) {
        console.warn('⚠️ [CHART DEBUG] No historical data returned - API gave empty array');
        return [];
      }

      // Transform API format to Lightweight Charts format
      const chartData: OHLCData[] = json.data.historicalData.map((item, index) => {
        const timeValue = Math.floor(new Date(item.timeStamp).getTime() / 1000);
        if (index < 3) {
          console.log(`📊 [CHART DEBUG] Sample data point ${index}:`, {
            original: item,
            transformed: {
              time: timeValue,
              timeDate: new Date(timeValue * 1000).toISOString(),
              open: item.open,
              high: item.high,
              low: item.low,
              close: item.close
            }
          });
        }
        return {
          time: timeValue,
          open: item.open,
          high: item.high,
          low: item.low,
          close: item.close,
        };
      });

      // Sort by time ascending (required by Lightweight Charts)
      chartData.sort((a, b) => a.time - b.time);

      console.log(`✅ [CHART DEBUG] Loaded ${chartData.length} historical candles`);
      console.log('📊 [CHART DEBUG] Time range:', {
        first: new Date(chartData[0].time * 1000).toISOString(),
        last: new Date(chartData[chartData.length - 1].time * 1000).toISOString()
      });
      
      return chartData;
    } catch (err) {
      console.error('❌ [CHART DEBUG] Error fetching historical data:', err);
      // Return empty array instead of throwing
      return [];
    }
  }, [scriptCode, interval, daysBack, segment]);

  // ============================================================================
  // WebSocket: Connect & Subscribe
  // ============================================================================

  const connectWebSocket = useCallback(async () => {
    try {
      // Get credentials from storage
      const sessionToken = await AsyncStorage.getItem('sessionToken');
      const userId = await AsyncStorage.getItem('userId');

      if (!sessionToken || !userId) {
        console.warn('⚠️ No auth credentials for WebSocket');
        setWsConnected(false);
        return;
      }

      const wsUrl = `${WS_BASE_URL}?id=${userId}&access_token=${encodeURIComponent(sessionToken)}`;
      
      console.log('🔌 Connecting to WebSocket for real-time updates...');

      const connection = new HubConnectionBuilder()
        .withUrl(wsUrl)
        .withAutomaticReconnect({
          nextRetryDelayInMilliseconds: (retryContext) => {
            // Exponential backoff: 2s, 4s, 8s, 16s, max 30s
            return Math.min(2000 * Math.pow(2, retryContext.previousRetryCount), 30000);
          },
        })
        .configureLogging(LogLevel.Warning)
        .build();

      // Connection events
      connection.onreconnecting(() => {
        console.log('🔄 WebSocket reconnecting...');
        setWsConnected(false);
      });

      connection.onreconnected(async () => {
        console.log('✅ WebSocket reconnected, re-subscribing to', scriptCode);
        setWsConnected(true);
        // Re-subscribe after reconnection
        try {
          await connection.invoke('SubscribeToMarketData', scriptCode);
          console.log('✅ Re-subscribed to market data');
        } catch (err) {
          console.error('❌ Failed to re-subscribe:', err);
        }
      });

      connection.onclose((error) => {
        console.log('❌ WebSocket closed', error);
        setWsConnected(false);
      });

      // Listen for market updates
      connection.on('ReceiveMarketUpdate', (message: any) => {
        handleMarketUpdate(message);
      });

      await connection.start();
      console.log('✅ WebSocket connected, subscribing to', scriptCode);
      setWsConnected(true);

      // Subscribe to specific instrument
      try {
        await connection.invoke('SubscribeToMarketData', scriptCode);
        console.log('✅ Subscribed to market data for', scriptCode);
      } catch (err) {
        console.error('❌ Failed to subscribe to market data:', err);
      }

      wsConnectionRef.current = connection;
    } catch (err) {
      console.error('❌ WebSocket connection error:', err);
      setWsConnected(false);
    }
  }, [scriptCode]);

  // ============================================================================
  // WebSocket: Handle Market Updates
  // ============================================================================

  const handleMarketUpdate = useCallback((message: any) => {
    try {
      // The message structure from SignalR
      if (!message || !message.data) {
        console.log('⚠️ Received empty market update');
        return;
      }

      // Parse the JSON string in data field
      const parsedData = JSON.parse(message.data);
      
      if (!parsedData.Table || !Array.isArray(parsedData.Table)) {
        console.log('⚠️ Invalid market update structure');
        return;
      }

      // Find row matching our scriptCode
      const row: MarketDataRow | undefined = parsedData.Table.find(
        (r: MarketDataRow) => r.InstrumentToken === scriptCode
      );

      if (!row) {
        // Not for this instrument - this is normal
        return;
      }

      console.log('📊 Market update for', scriptCode, ':', {
        price: row.Lastprice,
        open: row.Open,
        high: row.High,
        low: row.Low
      });

      // Build tick for Lightweight Charts
      const tick: OHLCData = {
        time: Math.floor(Date.now() / 1000),
        open: row.Open || row.Lastprice,
        high: row.High || row.Lastprice,
        low: row.Low || row.Lastprice,
        close: row.Lastprice,
      };

      // Send update to WebView
      if (webViewRef.current) {
        webViewRef.current.postMessage(
          JSON.stringify({
            type: 'update',
            data: tick,
          })
        );
        console.log('✅ Sent price update to chart');
      }
    } catch (err) {
      console.error('❌ Error handling market update:', err);
    }
  }, [scriptCode]);

  // ============================================================================
  // Lifecycle: Load Data & Connect WS
  // ============================================================================

  useEffect(() => {
    let mounted = true;

    const initialize = async () => {
      try {
        setLoading(true);
        setError(null);

        // 1. Fetch historical data
        const historicalData = await fetchHistoricalData();

        if (!mounted) return;

        // Show chart even if no historical data (market might be closed)
        if (historicalData.length === 0) {
          console.warn('⚠️ [CHART DEBUG] No historical data available - showing empty chart');
          // Still initialize the chart with empty data
          setTimeout(() => {
            if (webViewRef.current && mounted) {
              console.log('📊 [CHART DEBUG] Sending empty initial data to WebView');
              webViewRef.current.postMessage(
                JSON.stringify({
                  type: 'initial',
                  data: [],
                })
              );
              setLoading(false);
            }
          }, 500);
        } else {
          console.log(`✅ [CHART DEBUG] Got ${historicalData.length} candles, sending to WebView`);
          // 2. Send data to WebView (wait a bit for WebView to be ready)
          setTimeout(() => {
            if (webViewRef.current && mounted) {
              console.log('📊 [CHART DEBUG] Posting message to WebView with data:', {
                type: 'initial',
                dataLength: historicalData.length,
                firstCandle: historicalData[0],
                lastCandle: historicalData[historicalData.length - 1]
              });
              webViewRef.current.postMessage(
                JSON.stringify({
                  type: 'initial',
                  data: historicalData,
                })
              );
              setLoading(false);
            }
          }, 500);
        }

        // 3. Connect WebSocket for real-time updates (always try to connect)
        await connectWebSocket();
      } catch (err) {
        if (!mounted) return;
        console.error('❌ Initialization error:', err);
        // Don't show error, just log it and show empty chart
        console.warn('⚠️ Failed to initialize, showing empty chart');
        setLoading(false);
        
        // Try to show empty chart anyway
        setTimeout(() => {
          if (webViewRef.current && mounted) {
            webViewRef.current.postMessage(
              JSON.stringify({
                type: 'initial',
                data: [],
              })
            );
          }
        }, 500);
      }
    };

    initialize();

    // Cleanup
    return () => {
      mounted = false;
      if (wsConnectionRef.current) {
        console.log('🧹 Cleaning up WebSocket connection');
        wsConnectionRef.current.stop().catch(console.error);
        wsConnectionRef.current = null;
        setWsConnected(false);
      }
    };
  }, [scriptCode, fetchHistoricalData, connectWebSocket]);

  // ============================================================================
  // Chart HTML Template
  // ============================================================================

  const chartHTML = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
      <script src="https://unpkg.com/lightweight-charts@4.2.0/dist/lightweight-charts.standalone.production.js"></script>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
          background-color: ${isDark ? '#000000' : '#ffffff'}; 
          overflow: hidden;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        }
        #container { 
          width: 100%; 
          height: 100vh; 
          position: absolute;
        }
        #status {
          position: absolute;
          top: 10px;
          right: 10px;
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 10px;
          background: ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'};
          color: ${isDark ? '#ffffff' : '#000000'};
          z-index: 1000;
          display: none;
        }
        #emptyMessage {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          text-align: center;
          color: ${isDark ? '#9CA3AF' : '#6B7280'};
          font-size: 14px;
          padding: 20px;
        }
      </style>
    </head>
    <body>
      <div id="status">Loading...</div>
      <div id="emptyMessage" style="display: none;">
        ${marketOpen ? 'Waiting for market data...' : getMarketClosedMessage(segment)}<br/>
        <span style="font-size: 12px; opacity: 0.7;">${marketOpen ? 'Connecting to live feed' : 'Chart will update when market opens'}</span>
      </div>
      <div id="container"></div>
      
      <script>
        let chart = null;
        let candleSeries = null;
        let isInitialized = false;

        // Send log messages to React Native
        function logToRN(message, data) {
          try {
            if (window.ReactNativeWebView) {
              window.ReactNativeWebView.postMessage(JSON.stringify({
                type: 'log',
                message: message,
                data: data
              }));
            }
            console.log('[WebView]', message, data);
          } catch (e) {
            console.log('[WebView]', message, data);
          }
        }

        // Initialize chart
        function initChart() {
          logToRN('Initializing chart...');
          const container = document.getElementById('container');
          
          chart = LightweightCharts.createChart(container, {
            width: container.clientWidth,
            height: container.clientHeight,
            layout: {
              background: { color: '${isDark ? '#000000' : '#ffffff'}' },
              textColor: '${isDark ? '#d1d4dc' : '#191919'}',
            },
            grid: {
              vertLines: { 
                color: '${isDark ? 'rgba(42, 46, 57, 0.5)' : 'rgba(197, 203, 206, 0.5)'}',
                style: 1,
              },
              horzLines: { 
                color: '${isDark ? 'rgba(42, 46, 57, 0.5)' : 'rgba(197, 203, 206, 0.5)'}',
                style: 1,
              },
            },
            crosshair: {
              mode: LightweightCharts.CrosshairMode.Normal,
              vertLine: {
                width: 1,
                color: '${isDark ? '#758696' : '#9598a1'}',
                style: 3,
              },
              horzLine: {
                width: 1,
                color: '${isDark ? '#758696' : '#9598a1'}',
                style: 3,
              },
            },
            rightPriceScale: {
              borderColor: '${isDark ? 'rgba(197, 203, 206, 0.1)' : 'rgba(197, 203, 206, 0.8)'}',
            },
            timeScale: {
              borderColor: '${isDark ? 'rgba(197, 203, 206, 0.1)' : 'rgba(197, 203, 206, 0.8)'}',
              timeVisible: true,
              secondsVisible: false,
            },
          });

          candleSeries = chart.addCandlestickSeries({
            upColor: '#26a69a',
            downColor: '#ef5350',
            borderVisible: false,
            wickUpColor: '#26a69a',
            wickDownColor: '#ef5350',
            priceFormat: {
              type: 'price',
              precision: 2,
              minMove: 0.01,
            },
          });

          // Handle resize
          window.addEventListener('resize', () => {
            if (chart) {
              chart.applyOptions({ 
                width: container.clientWidth, 
                height: container.clientHeight 
              });
            }
          });

          logToRN('Chart initialized successfully');
          updateStatus('Ready');
        }

        function updateStatus(text) {
          const status = document.getElementById('status');
          if (status) status.textContent = text;
        }

        // Handle messages from React Native
        window.addEventListener('message', (event) => {
          try {
            const message = JSON.parse(event.data);
            logToRN('Received message from RN', { type: message.type, dataLength: message.data?.length });
            
            if (message.type === 'initial') {
              // Initial data load
              logToRN('Processing initial data', { 
                isInitialized, 
                hasData: !!message.data,
                dataLength: message.data?.length 
              });
              
              if (!isInitialized) {
                initChart();
                isInitialized = true;
              }
              
              const emptyMsg = document.getElementById('emptyMessage');
              
              if (candleSeries && message.data && message.data.length > 0) {
                logToRN('Setting chart data', { 
                  candleCount: message.data.length,
                  firstCandle: message.data[0],
                  lastCandle: message.data[message.data.length - 1]
                });
                
                try {
                  candleSeries.setData(message.data);
                  chart.timeScale().fitContent();
                  updateStatus(\`\${message.data.length} candles\`);
                  if (emptyMsg) emptyMsg.style.display = 'none';
                  logToRN('Chart data set successfully');
                } catch (e) {
                  logToRN('Error setting chart data', { error: e.toString(), data: message.data.slice(0, 3) });
                }
              } else {
                // No data, show empty message
                logToRN('No historical data, showing empty message');
                if (emptyMsg) emptyMsg.style.display = 'block';
                updateStatus('Waiting for data...');
              }
            } else if (message.type === 'update') {
              // Real-time update
              logToRN('Received real-time update', message.data);
              
              // Hide empty message when we get real-time data
              const emptyMsg = document.getElementById('emptyMessage');
              if (emptyMsg) emptyMsg.style.display = 'none';
              
              if (!isInitialized) {
                // Initialize chart if not already done
                logToRN('Initializing chart for real-time update');
                initChart();
                isInitialized = true;
              }
              
              if (candleSeries && message.data) {
                candleSeries.update(message.data);
                updateStatus('Live Update');
                logToRN('Chart updated with real-time data');
              }
            }
          } catch (err) {
            logToRN('Error processing message', { error: err.toString() });
            updateStatus('Error');
          }
        });

        // Handle Android messages
        if (window.ReactNativeWebView) {
          document.addEventListener('message', (event) => {
            window.dispatchEvent(new MessageEvent('message', { data: event.data }));
          });
        }

        logToRN('WebView script loaded and ready');
        updateStatus('Initializing...');
      </script>
    </body>
    </html>
  `;

  // ============================================================================
  // Render
  // ============================================================================

  return (
    <View style={[styles.container, { height }]}>
      {loading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <RNText style={[styles.loadingText, { color: theme.colors.text }]}>
            Loading chart data...
          </RNText>
        </View>
      )}
      
      {error && (
        <View style={styles.errorContainer}>
          <RNText style={[styles.errorText, { color: theme.colors.error }]}>
            {error}
          </RNText>
        </View>
      )}

      {!error && (
        <WebView
          ref={webViewRef}
          originWhitelist={['*']}
          source={{ html: chartHTML }}
          style={[styles.webview, { backgroundColor: isDark ? '#000000' : '#ffffff' }]}
          scrollEnabled={false}
          bounces={false}
          javaScriptEnabled={true}
          domStorageEnabled={true}
          onError={(syntheticEvent) => {
            const { nativeEvent } = syntheticEvent;
            console.error('❌ WebView error:', nativeEvent);
            setError('Chart failed to load');
          }}
          onMessage={(event) => {
            // Handle any messages from WebView if needed
            const data = event.nativeEvent.data;
            console.log('📨 [CHART DEBUG] Message from WebView:', data);
            try {
              const parsed = JSON.parse(data);
              console.log('📨 [CHART DEBUG] Parsed message:', parsed);
            } catch (e) {
              // Not JSON, just a regular message
            }
          }}
        />
      )}

      {/* WebSocket Status Indicator - Only show when connected */}
      {!loading && !error && wsConnected && (
        <View style={[styles.wsIndicator, { backgroundColor: '#26a69a' }]}>
          <RNText style={styles.wsIndicatorText}>
            ● Live
          </RNText>
        </View>
      )}
    </View>
  );
};

// ============================================================================
// Styles
// ============================================================================

const styles = StyleSheet.create({
  container: {
    width: '100%',
    position: 'relative',
    overflow: 'hidden',
  },
  webview: {
    flex: 1,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    zIndex: 1000,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 14,
    textAlign: 'center',
  },
  wsIndicator: {
    position: 'absolute',
    top: 8,
    right: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    zIndex: 100,
  },
  wsIndicatorText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '600',
  },
});

export default MarketChart;
