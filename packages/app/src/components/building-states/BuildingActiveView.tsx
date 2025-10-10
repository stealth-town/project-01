import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { apiClient } from '../../api/client';
import type { TownBuilding, Trade } from '@stealth-town/shared/types';
// styles in main.scss

interface BuildingActiveViewProps {
  building: TownBuilding;
  isExpanded: boolean;
  onToggleExpand: () => void;
}

export function BuildingActiveView({ building, isExpanded, onToggleExpand }: BuildingActiveViewProps) {
  const { user } = useAuth();
  const [trade, setTrade] = useState<Trade | null>(null);
  const [timeRemaining, setTimeRemaining] = useState<number>(0);

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

  const formatTime = (ms: number) => {
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  if (!trade) {
    return <div className="building-active-view loading">Loading trade data...</div>;
  }

  return (
    <div className="building-active-view">
      <div className="trade-summary" onClick={onToggleExpand}>
        <div className="summary-row">
          <span>Risk Mode:</span>
          <span className="summary-value">{trade.riskMode.toUpperCase()}</span>
        </div>
        <div className="summary-row">
          <span>Time Remaining:</span>
          <span className="summary-value timer">{formatTime(timeRemaining)}</span>
        </div>
        <button className="expand-button">
          {isExpanded ? '▲ Collapse' : '▼ Expand'}
        </button>
      </div>

      {isExpanded && (
        <div className="trade-details-expanded">
          <div className="chart-placeholder">
            <div className="mock-chart">
              <div className="chart-label">📊 Trade Chart</div>
              <div className="chart-info">
                <div className="chart-stat">
                  <span className="stat-label">Entry Price:</span>
                  <span className="stat-value">${trade.entryPrice.toFixed(2)}</span>
                </div>
                <div className="chart-stat">
                  <span className="stat-label">Current Price:</span>
                  <span className="stat-value">$3,015.42</span>
                </div>
                <div className="chart-stat">
                  <span className="stat-label">Liquidation:</span>
                  <span className="stat-value danger">${trade.liquidationPrice.toFixed(2)}</span>
                </div>
              </div>
              <div className="chart-status">
                <span className="status-icon">✅</span>
                <span>Trade is running smoothly</span>
              </div>
            </div>
          </div>

          <div className="trade-info-grid">
            <div className="info-item">
              <span className="info-label">Energy Spent</span>
              <span className="info-value">{trade.energySpent} ⚡</span>
            </div>
            <div className="info-item">
              <span className="info-label">Potential Reward</span>
              <span className="info-value">{trade.tokensReward || 0} 🎁</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
