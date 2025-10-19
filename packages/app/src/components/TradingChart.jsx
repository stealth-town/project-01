import { useEffect, useRef, useLayoutEffect, useState } from 'react';
import { createChart, AreaSeries, createSeriesMarkers } from 'lightweight-charts';

// Get price range based on risk mode
const getPriceRange = (riskMode) => {
  switch (riskMode) {
    case 'turtle':
      return 25; // ±25 USD
    case 'walk':
      return 5; // ±5 USD
    case 'cheetah':
      return 2; // ±2 USD
    default:
      return 10; // fallback
  }
};

export function TradingChart({
  entryPrice,
  liquidationPrice,
  tradeStartTime,
  tradeEndTime,
  riskMode,
  currentPrice  // New prop: current price from parent
}) {
  const chartContainerRef = useRef(null);
  const chartApiRef = useRef(null);
  const seriesRef = useRef(null);
  const liquidationLineRef = useRef(null);
  const entryLineRef = useRef(null);
  const [historicalDataLoaded, setHistoricalDataLoaded] = useState(false);
  const lastUpdateTimeRef = useRef(0); // Track last update timestamp to avoid duplicates

  // Create chart only once
  useLayoutEffect(() => {
    if (!chartContainerRef.current) return;

    // Calculate responsive height
    const getChartHeight = () => {
      const containerWidth = chartContainerRef.current?.clientWidth || 500;
      // Use viewport height for better responsiveness
      const viewportHeight = window.innerHeight;

      // Base height on viewport and screen size
      if (viewportHeight <= 768) {
        return 300; // Smaller screens
      } else if (viewportHeight <= 900) {
        return 350; // Medium screens (like MacBook Air)
      } else {
        return 400; // Larger screens (reduced from 450px)
      }
    };

    // Create chart with dark theme
    const chart = createChart(chartContainerRef.current, {
      layout: {
        background: { type: 'solid', color: '#1a1a2e' },
        textColor: '#d1d5db',
      },
      grid: {
        vertLines: { color: '#2d3748' },
        horzLines: { color: '#2d3748' },
      },
      width: chartContainerRef.current.clientWidth,
      height: getChartHeight(),
      timeScale: {
        timeVisible: true,
        secondsVisible: true,
        borderColor: '#4a5568',
      },
      rightPriceScale: {
        borderColor: '#4a5568',
      },
    });

    chartApiRef.current = chart;

    // Add area series (v5 syntax) with shading below the line
    const series = chart.addSeries(AreaSeries, {
      lineColor: '#60a5fa',        // Bright blue line
      topColor: 'rgba(96, 165, 250, 0.56)',    // Semi-transparent blue at top
      bottomColor: 'rgba(96, 165, 250, 0.04)', // Very transparent blue at bottom
      lineWidth: 3,
      crosshairMarkerVisible: true,
      crosshairMarkerRadius: 6,
      crosshairMarkerBorderColor: '#60a5fa',
      crosshairMarkerBackgroundColor: '#1e40af',
      lastValueVisible: true,
      priceLineVisible: true,
    });

    seriesRef.current = series;

    // Handle resize (both width and height)
    const handleResize = () => {
      if (chartContainerRef.current) {
        const viewportHeight = window.innerHeight;
        let newHeight = 400;

        if (viewportHeight <= 768) {
          newHeight = 300;
        } else if (viewportHeight <= 900) {
          newHeight = 350;
        }

        chart.applyOptions({
          width: chartContainerRef.current.clientWidth,
          height: newHeight,
        });
      }
    };

    window.addEventListener('resize', handleResize);

    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize);
      chart.remove();
    };
  }, []); // Only create once

  // Update liquidation line and entry line when prices change
  useEffect(() => {
    if (!seriesRef.current) return;

    // Remove old liquidation line if exists
    if (liquidationLineRef.current) {
      seriesRef.current.removePriceLine(liquidationLineRef.current);
    }

    // Remove old entry line if exists
    if (entryLineRef.current) {
      seriesRef.current.removePriceLine(entryLineRef.current);
    }

    // Add liquidation price line (thick red line)
    liquidationLineRef.current = seriesRef.current.createPriceLine({
      price: liquidationPrice,
      color: '#ef4444',
      lineWidth: 3,
      lineStyle: 0, // Solid line
      axisLabelVisible: true,
      title: 'Liquidation',
    });

    // Add entry price line (green dashed line)
    entryLineRef.current = seriesRef.current.createPriceLine({
      price: entryPrice,
      color: '#10b981',
      lineWidth: 2,
      lineStyle: 2, // Dashed line
      axisLabelVisible: true,
      title: 'Entry',
    });
  }, [liquidationPrice, entryPrice]);

  // Set fixed price range to ensure liquidation line is ALWAYS visible
  useEffect(() => {
    if (!chartApiRef.current || !seriesRef.current || !entryPrice || !liquidationPrice || !riskMode || !historicalDataLoaded) return;

    const range = getPriceRange(riskMode);

    // Calculate fixed price range with large margins to keep liquidation visible
    // For long-only trades: liquidation is always below entry
    const liquidationDistance = Math.abs(entryPrice - liquidationPrice);
    const minBufferBelow = liquidationDistance * 0.3; // 30% extra space below liquidation
    const maxBufferAbove = range * 1; // 200% of the risk mode range above entry

    const minPrice = liquidationPrice - minBufferBelow;
    const maxPrice = entryPrice + maxBufferAbove;

    // Disable auto-scale and set fixed range
    chartApiRef.current.priceScale('right').applyOptions({
      autoScale: true, // DISABLE auto-scaling to keep liquidation visible
      scaleMargins: {
        top: 0.05,      // 5% margin at top
        bottom: 0.2,   // 20% margin at bottom
      },
    });

    // Set fixed visible price range using autoscaleInfoProvider
    seriesRef.current.applyOptions({
      priceFormat: {
        type: 'price',
        precision: 2,
        minMove: 0.01,
      },
      autoscaleInfoProvider: () => ({
        priceRange: {
          minValue: minPrice,
          maxValue: maxPrice,
        },
      }),
    });

    // Set visible time range
    chartApiRef.current.timeScale().applyOptions({
      rightOffset: 10, // More buffer on the right for live updates
      leftOffset: 10, // More buffer on the left for entry marker
      barSpacing: 6,
      minBarSpacing: 3,
      fixLeftEdge: false,
      // fixLeftEdge: true,
      fixRightEdge: false,
    });

    // Fit content and scroll to show latest data
    chartApiRef.current.timeScale().fitContent();

    // After a short delay, scroll to real-time position
    setTimeout(() => {
      if (chartApiRef.current) {
        chartApiRef.current.timeScale().scrollToRealTime();
      }
    }, 100);
  }, [entryPrice, liquidationPrice, riskMode, historicalDataLoaded]); // Don't update on currentPrice changes to keep scale stable

  // Prefetch 30 seconds of historical data BEFORE entry time
  useEffect(() => {
    if (!seriesRef.current || historicalDataLoaded) return;

    const fetchHistoricalData = async () => {
      try {
        // Fetch 30 seconds of data BEFORE the actual trade entry time
        const tradeEntryTime = new Date(tradeStartTime).getTime();
        const endTime = tradeEntryTime; // Entry time
        const startTime = endTime - 30000; // 30 seconds BEFORE entry

        console.log('[TradingChart] Fetching historical data:', {
          startTime: new Date(startTime).toISOString(),
          endTime: new Date(endTime).toISOString(),
          tradeStartTime: new Date(tradeStartTime).toISOString()
        });

        // Using Binance klines API for 1-second data
        const response = await fetch(
          `https://api.binance.com/api/v3/klines?symbol=ETHUSDT&interval=1s&startTime=${startTime}&endTime=${endTime}&limit=120`
        );

        if (!response.ok) {
          console.error('Failed to fetch historical data');
          // Set historical data as loaded even if fetch failed to allow real-time updates
          setHistoricalDataLoaded(true);
          return;
        }

        const klines = await response.json();

        // Convert klines to line data format (using close price)
        // Kline format: [openTime, open, high, low, close, volume, closeTime, ...]
        const lineData = klines.map(kline => ({
          time: Math.floor(kline[0] / 1000), // Convert ms to seconds
          value: parseFloat(kline[4]), // Close price
        }));

        // Set historical line data
        if (lineData.length > 0) {
          seriesRef.current.setData(lineData);

          // Initialize lastUpdateTimeRef with the actual trade entry time
          const tradeEntryTimeInSeconds = Math.floor(tradeEntryTime / 1000);
          lastUpdateTimeRef.current = tradeEntryTimeInSeconds;
          console.log('[TradingChart] Initialized lastUpdateTime to trade entry time:', tradeEntryTimeInSeconds);

          // Add entry marker at the ACTUAL trade entry time (not the last data point)
          // This ensures the marker aligns with the entry price line
          const markers = [
            {
              time: tradeEntryTimeInSeconds,
              position: 'aboveBar',
              color: '#10b981',
              shape: 'arrowDown',
              text: 'Entry @ $' + entryPrice.toFixed(2),
            },
          ];
          createSeriesMarkers(seriesRef.current, markers);
          console.log('[TradingChart] Entry marker placed at:', new Date(tradeEntryTime).toISOString());

          console.log(`[TradingChart] Loaded ${lineData.length} historical data points`);
        }
        
        // Always set historical data as loaded, even if no data was fetched
        setHistoricalDataLoaded(true);
      } catch (error) {
        console.error('Error fetching historical data:', error);
        // Set historical data as loaded even if fetch failed to allow real-time updates
        setHistoricalDataLoaded(true);
      }
    };

    fetchHistoricalData();
  }, [historicalDataLoaded, tradeStartTime, entryPrice]); // Include tradeStartTime and entryPrice

  // Update chart with current price from parent component (real-time updates)
  useEffect(() => {

    if (!seriesRef.current || !currentPrice) {
      console.log('[TradingChart] Skipping update - missing series or price');
      return;
    }

    const currentTimestamp = Math.floor(Date.now() / 1000);

    // If this is the first update and we don't have historical data loaded yet,
    // initialize the chart with a single data point
    if (!historicalDataLoaded && lastUpdateTimeRef.current === 0) {
      const initialData = {
        time: currentTimestamp,
        value: currentPrice,
      };
      
      // console.log('[TradingChart] Initializing chart with first real-time data point:', initialData);
      
      try {
        seriesRef.current.setData([initialData]);
        lastUpdateTimeRef.current = currentTimestamp;
        
        // Auto-scroll to show the latest data
        if (chartApiRef.current) {
          chartApiRef.current.timeScale().scrollToRealTime();
        }
        
        console.log('[TradingChart] Chart initialized with real-time data');
        return;
      } catch (error) {
        console.error('[TradingChart] Error initializing chart:', error);
      }
    }

    // Ensure timestamp is always increasing (lightweight-charts requirement)
    // If we get updates faster than 1 second, use the last timestamp + 1
    const timestamp = currentTimestamp > lastUpdateTimeRef.current
      ? currentTimestamp
      : lastUpdateTimeRef.current + 1;

    lastUpdateTimeRef.current = timestamp;

    // Update the chart with new price data
    const updateData = {
      time: timestamp,
      value: currentPrice,
    };


    try {
      seriesRef.current.update(updateData);

      // Auto-scroll to show the latest data (keep chart at real-time position)
      if (chartApiRef.current) {
        chartApiRef.current.timeScale().scrollToRealTime();
      }
      
      // console.log('[TradingChart] Chart update successful');
    } catch (error) {
      console.error('[TradingChart] Error updating chart:', error);
    }
  }, [currentPrice, historicalDataLoaded]); // Include historicalDataLoaded to handle initialization

  return (
    <div className="trading-chart-container">
      <div ref={chartContainerRef} className="chart" />
    </div>
  );
}
