import { useEffect, useRef, useLayoutEffect } from 'react';
import { createChart, LineSeries } from 'lightweight-charts';

export function TradingChart({
  entryPrice,
  liquidationPrice,
  tradeStartTime,
  tradeEndTime
}) {
  const chartContainerRef = useRef(null);
  const chartApiRef = useRef(null);
  const seriesRef = useRef(null);
  const wsRef = useRef(null);
  const liquidationLineRef = useRef(null);

  // Create chart only once
  useLayoutEffect(() => {
    if (!chartContainerRef.current) return;

    // Create chart
    const chart = createChart(chartContainerRef.current, {
      layout: {
        background: { type: 'solid', color: 'white' },
        textColor: 'black',
      },
      grid: {
        vertLines: { color: '#e0e0e0' },
        horzLines: { color: '#e0e0e0' },
      },
      width: chartContainerRef.current.clientWidth,
      height: 450,
      timeScale: {
        timeVisible: true,
        secondsVisible: true,
        borderColor: '#cccccc',
      },
      rightPriceScale: {
        borderColor: '#cccccc',
      },
    });

    chartApiRef.current = chart;

    // Add line series
    const series = chart.addSeries(LineSeries, {
      color: '#3b82f6',
      lineWidth: 2,
    });

    seriesRef.current = series;

    // Handle resize
    const handleResize = () => {
      if (chartContainerRef.current) {
        chart.applyOptions({
          width: chartContainerRef.current.clientWidth,
        });
      }
    };

    window.addEventListener('resize', handleResize);

    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize);
      if (wsRef.current) {
        wsRef.current.close();
      }
      chart.remove();
    };
  }, []); // Only create once

  // Update liquidation line when liquidationPrice changes
  useEffect(() => {
    if (!seriesRef.current) return;

    // Remove old liquidation line if exists
    if (liquidationLineRef.current) {
      seriesRef.current.removePriceLine(liquidationLineRef.current);
    }

    // Add new liquidation price line (thick red line)
    liquidationLineRef.current = seriesRef.current.createPriceLine({
      price: liquidationPrice,
      color: '#ff0000',
      lineWidth: 4,
      lineStyle: 0, // Solid line
      axisLabelVisible: true,
      title: 'Liquidation',
    });
  }, [liquidationPrice]);

  // Setup WebSocket for real-time updates
  useEffect(() => {
    if (!seriesRef.current) return;

    const ws = new WebSocket('wss://stream.binance.com:9443/ws/ethusdt@trade');
    wsRef.current = ws;

    ws.onopen = () => {
      console.log('WebSocket connected');
    };

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      const price = parseFloat(data.p);
      const timestamp = Math.floor(data.T / 1000);

      seriesRef.current.update({
        time: timestamp,
        value: price,
      });
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    ws.onclose = () => {
      console.log('WebSocket closed');
    };

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, []); // Only setup once

  return (
    <div className="trading-chart-container">
      <div ref={chartContainerRef} className="chart" />
    </div>
  );
}
