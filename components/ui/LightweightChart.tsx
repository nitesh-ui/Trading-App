// LightWeightChart.tsx - Native chart implementation
import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import WebView from 'react-native-webview';

interface ChartData {
  time: string | number;
  open: number;
  high: number;
  low: number;
  close: number;
}

interface LightweightChartProps {
  symbol: string;
  data?: ChartData[];
  width?: number;
  height?: number;
  isDark?: boolean;
}

export const LightweightChart: React.FC<LightweightChartProps> = ({ 
  symbol, 
  data = [], 
  width,
  height = 300,
  isDark = true 
}) => {
  const chartWidth = width || Dimensions.get('window').width;

  // Generate some realistic fake data if none provided
  const chartData = data.length > 0 ? data : generateFakeData();

  const chartHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
      <script src="https://unpkg.com/lightweight-charts/dist/lightweight-charts.standalone.production.js"></script>
      <style>
        body { margin: 0; padding: 0; background-color: ${isDark ? '#000000' : '#ffffff'}; overflow: hidden; }
        #container { width: 100%; height: 100vh; position: absolute; }
      </style>
    </head>
    <body>
      <div id="container"></div>
      <script>
        const container = document.getElementById('container');
        const chart = LightweightCharts.createChart(container, {
          width: container.clientWidth,
          height: container.clientHeight,
          layout: {
            background: { color: '${isDark ? '#000000' : '#ffffff'}' },
            textColor: '${isDark ? '#d1d4dc' : '#333333'}',
          },
          grid: {
            vertLines: { color: '${isDark ? 'rgba(42, 46, 57, 0.5)' : '#f0f3fa'}' },
            horzLines: { color: '${isDark ? 'rgba(42, 46, 57, 0.5)' : '#f0f3fa'}' },
          },
          timeScale: {
            timeVisible: true,
            secondsVisible: false,
          },
          crosshair: {
            mode: LightweightCharts.CrosshairMode.Normal,
          },
        });

        const candleSeries = chart.addCandlestickSeries({
          upColor: '#26a69a',
          downColor: '#ef5350',
          borderVisible: false,
          wickUpColor: '#26a69a',
          wickDownColor: '#ef5350',
        });

        const data = ${JSON.stringify(chartData)};
        
        // Sort data by time just in case
        data.sort((a, b) => (new Date(a.time) - new Date(b.time)));
        
        candleSeries.setData(data);
        chart.timeScale().fitContent();

        // Handle resize
        window.addEventListener('resize', () => {
          chart.applyOptions({ 
            width: container.clientWidth, 
            height: container.clientHeight 
          });
        });
      </script>
    </body>
    </html>
  `;

  return (
    <View style={[styles.container, { width: chartWidth, height }]}>
      <WebView
        originWhitelist={['*']}
        source={{ html: chartHtml }}
        style={{ backgroundColor: isDark ? '#000000' : '#ffffff' }}
        scrollEnabled={false}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
  },
});

// Helper to generate fake OHLC data
function generateFakeData(count = 100) {
  let date = new Date();
  date.setDate(date.getDate() - count);
  let previousClose = 100 + Math.random() * 50;
  
  const data = [];
  
  for (let i = 0; i < count; i++) {
    date.setDate(date.getDate() + 1);
    const time = date.toISOString().split('T')[0];
    
    const open = previousClose;
    const change = (Math.random() - 0.5) * 5;
    const close = open + change;
    const high = Math.max(open, close) + Math.random() * 2;
    const low = Math.min(open, close) - Math.random() * 2;
    
    data.push({ time, open, high, low, close });
    previousClose = close;
  }
  
  return data;
}

export default LightweightChart;
