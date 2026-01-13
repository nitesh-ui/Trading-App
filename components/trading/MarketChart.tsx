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
}

// ============================================================================
// Constants
// ============================================================================

const API_BASE_URL = 'https://prod-tradingapi.sanaitatechnologies.com';
const WS_BASE_URL = 'wss://prod-tradingapi.sanaitatechnologies.com/hub/market';

// ============================================================================
// Main Component
// ============================================================================

export const MarketChart: React.FC<MarketChartProps> = ({
  scriptCode,
  height = 400,
  interval = 'minute',
  daysBack = 5,
}) => {
  const { theme } = useTheme();
  const webViewRef = useRef<WebView>(null);
  const wsConnectionRef = useRef<HubConnection | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [wsConnected, setWsConnected] = useState(false);

  const isDark = theme.colors.background === '#000000' || theme.colors.background === '#121212';

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

      console.log('📊 Fetching historical data:', {
        scriptCode,
        url,
        fromDate: fromStr,
        toDate: toStr,
        interval
      });

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ API Error Response:', errorText);
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const json: HistoricalAPIResponse = await response.json();
      
      console.log('📊 API Response:', {
        isError: json.data?.isError,
        dataCount: json.data?.historicalData?.length || 0,
        errorMessage: json.data?.errorMessage
      });

      if (json.data.isError) {
        throw new Error(json.data.errorMessage || 'API returned error');
      }

      if (!json.data.historicalData || json.data.historicalData.length === 0) {
        console.warn('⚠️ No historical data returned');
        return [];
      }

      // Transform API format to Lightweight Charts format
      const chartData: OHLCData[] = json.data.historicalData.map((item) => ({
        time: Math.floor(new Date(item.timeStamp).getTime() / 1000),
        open: item.open,
        high: item.high,
        low: item.low,
        close: item.close,
      }));

      // Sort by time ascending (required by Lightweight Charts)
      chartData.sort((a, b) => a.time - b.time);

      console.log(`✅ Loaded ${chartData.length} historical candles`);
      return chartData;
    } catch (err) {
      console.error('❌ Error fetching historical data:', err);
      throw err;
    }
  }, [scriptCode, interval, daysBack]);

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
        return;
      }

      const wsUrl = `${WS_BASE_URL}?id=${userId}&access_token=${encodeURIComponent(sessionToken)}`;
      
      console.log('🔌 Connecting to WebSocket...');

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

      connection.onreconnected(() => {
        console.log('✅ WebSocket reconnected');
        setWsConnected(true);
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
      console.log('✅ WebSocket connected');
      setWsConnected(true);

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
        return;
      }

      // Parse the JSON string in data field
      const parsedData = JSON.parse(message.data);
      
      if (!parsedData.Table || !Array.isArray(parsedData.Table)) {
        return;
      }

      // Find row matching our scriptCode
      const row: MarketDataRow | undefined = parsedData.Table.find(
        (r: MarketDataRow) => r.InstrumentToken === scriptCode
      );

      if (!row) {
        return; // Not for this instrument
      }

      // Build tick for Lightweight Charts
      const tick: OHLCData = {
        time: Math.floor(Date.now() / 1000),
        open: row.Open,
        high: row.High,
        low: row.Low,
        close: row.Lastprice, // Use Lastprice as close
      };

      // Send update to WebView
      if (webViewRef.current) {
        webViewRef.current.postMessage(
          JSON.stringify({
            type: 'update',
            data: tick,
          })
        );
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

        if (historicalData.length === 0) {
          setError('No historical data available');
          setLoading(false);
          return;
        }

        // 2. Send data to WebView (wait a bit for WebView to be ready)
        setTimeout(() => {
          if (webViewRef.current && mounted) {
            webViewRef.current.postMessage(
              JSON.stringify({
                type: 'initial',
                data: historicalData,
              })
            );
            setLoading(false);
          }
        }, 500);

        // 3. Connect WebSocket for real-time updates
        await connectWebSocket();
      } catch (err) {
        if (!mounted) return;
        console.error('❌ Initialization error:', err);
        setError(err instanceof Error ? err.message : 'Failed to load chart');
        setLoading(false);
      }
    };

    initialize();

    // Cleanup
    return () => {
      mounted = false;
      if (wsConnectionRef.current) {
        wsConnectionRef.current.stop().catch(console.error);
        wsConnectionRef.current = null;
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
        }
      </style>
    </head>
    <body>
      <div id="status">Loading...</div>
      <div id="container"></div>
      
      <script>
        let chart = null;
        let candleSeries = null;
        let isInitialized = false;

        // Initialize chart
        function initChart() {
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
            
            if (message.type === 'initial') {
              // Initial data load
              if (!isInitialized) {
                initChart();
                isInitialized = true;
              }
              
              if (candleSeries && message.data && message.data.length > 0) {
                candleSeries.setData(message.data);
                chart.timeScale().fitContent();
                updateStatus(\`\${message.data.length} candles\`);
              }
            } else if (message.type === 'update') {
              // Real-time update
              if (candleSeries && message.data) {
                candleSeries.update(message.data);
                updateStatus('Live');
              }
            }
          } catch (err) {
            console.error('Error processing message:', err);
            updateStatus('Error');
          }
        });

        // Handle Android messages
        if (window.ReactNativeWebView) {
          document.addEventListener('message', (event) => {
            window.dispatchEvent(new MessageEvent('message', { data: event.data }));
          });
        }

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
            console.log('📨 Message from WebView:', event.nativeEvent.data);
          }}
        />
      )}

      {/* WebSocket Status Indicator */}
      {!loading && !error && (
        <View style={[styles.wsIndicator, { backgroundColor: wsConnected ? '#26a69a' : '#ef5350' }]}>
          <RNText style={styles.wsIndicatorText}>
            {wsConnected ? '● Live' : '○ Disconnected'}
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
