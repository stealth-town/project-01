import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { apiClient } from '../../api/client';
import { priceService } from '../../services/priceService';
import { TradingChart } from '../TradingChart';
import type { TownBuilding, Trade } from '@stealth-town/shared/types';
// styles in main.scss

interface BuildingActiveViewProps {
  building: TownBuilding;
}

export function BuildingActiveView({ building }: BuildingActiveViewProps) {
  const { user } = useAuth();
  const [trade, setTrade] = useState<Trade | null>(null);
  const [timeRemaining, setTimeRemaining] = useState<number>(0);
  const [currentPrice, setCurrentPrice] = useState<number>(0);

  // Load trade
  useEffect(() => {
    const loadTrade = async () => {
      if (!user) return;

      try {
        const trades = await apiClient.getUserTrades(user.id);
        const activeTrade = trades.find(
          (t) => t.buildingId === building.id && t.status === 'active'
        );
        if (activeTrade) {
          setTrade(activeTrade);
        }
      } catch (error) {
        console.error('Failed to load trade:', error);
      }
    };

    loadTrade();
  }, [user, building.id]);

  // Timer countdown
  useEffect(() => {
    if (!trade) return;

    const updateTimer = () => {
      const now = new Date().getTime();
      const completionTime = new Date(trade.completionTime).getTime();
      const remaining = Math.max(0, completionTime - now);
      setTimeRemaining(remaining);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, [trade]);

  // Live price updates
  useEffect(() => {
    const unsubscribe = priceService.subscribeToPriceUpdates('ETH', (price) => {
      setCurrentPrice(price);
    }, 1000); // Update every 1 seconds

    return unsubscribe;
  }, []);

  const formatTime = (ms: number) => {
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  if (!trade) {
    return <div className="building-active-view loading">Loading trade data...</div>;
  }

  const priceChange = currentPrice - trade.entryPrice;
  const priceChangePercent = (priceChange / trade.entryPrice) * 100;
  const isPositive = priceChange >= 0;

  // Calculate trade start time (from trade data or estimate)
  const tradeStartTime = trade.startedAt
    ? new Date(trade.startedAt)
    : new Date(Date.now() - 60000); // Fallback: 1 minute ago

  const tradeEndTime = new Date(trade.completionTime);

  return (
    <div className="building-active-view">
      {/* Clean Topbar */}
      <div className="trade-topbar">
        <div className="topbar-item">
          <span className="label">Mode</span>
          <span className="value">{trade.riskMode.toUpperCase()}</span>
        </div>

        <div className="topbar-item">
          <span className="label">Time Left</span>
          <span className="value timer">{formatTime(timeRemaining)}</span>
        </div>

        <div className="topbar-item">
          <span className="label">Entry</span>
          <span className="value">${trade.entryPrice.toFixed(2)}</span>
        </div>

        <div className="topbar-item">
          <span className="label">Current</span>
          <span className={`value ${isPositive ? 'positive' : 'negative'}`}>
            ${currentPrice.toFixed(2)}
            <span className="change">
              {isPositive ? '+' : ''}{priceChangePercent.toFixed(2)}%
            </span>
          </span>
        </div>

        <div className="topbar-item">
          <span className="label">Liq. Price</span>
          <span className="value danger">${trade.liquidationPrice.toFixed(2)}</span>
        </div>
      </div>

      {/* Real Trading Chart */}
      <TradingChart
        entryPrice={trade.entryPrice}
        liquidationPrice={trade.liquidationPrice}
        tradeStartTime={tradeStartTime}
        tradeEndTime={tradeEndTime}
      />
    </div>
  );
}
