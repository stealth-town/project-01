import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { apiClient } from '../../api/client';
import type { TownBuilding, Trade } from '@stealth-town/shared/types';
import { RISK_MODE_CONFIG } from '@stealth-town/shared/types';
// styles in main.scss

interface BuildingLiquidatedViewProps {
  building: TownBuilding;
  onUpdate: () => void;
}

export function BuildingLiquidatedView({ building, onUpdate }: BuildingLiquidatedViewProps) {
  const { user } = useAuth();
  const [trade, setTrade] = useState<Trade | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const loadTrade = async () => {
      if (!user) return;

      try {
        const trades = await apiClient.getUserTrades(user.id);
        const liquidatedTrade = trades.find(
          (t) => t.buildingId === building.id && t.status === 'liquidated'
        );
        if (liquidatedTrade) {
          setTrade(liquidatedTrade);
        }
      } catch (error) {
        console.error('Failed to load trade:', error);
      }
    };

    loadTrade();
  }, [user, building.id]);

  const handleAcknowledge = async () => {
    if (!user || !trade) return;

    setIsLoading(true);

    try {
      // Claim to reset building (even though no rewards)
      await apiClient.claimReward(user.id, trade.id);
      onUpdate();
    } catch (error) {
      console.error('Failed to acknowledge:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!trade) {
    return <div className="building-liquidated-view loading">Loading trade data...</div>;
  }

  // Calculate time saved
  const totalDuration = RISK_MODE_CONFIG[trade.riskMode].duration; // in seconds
  const startTime = new Date(trade.startedAt || trade.createdAt).getTime();
  const endTime = new Date(trade.resolvedAt || new Date()).getTime();
  const actualDurationSeconds = Math.floor((endTime - startTime) / 1000);
  const timeSavedSeconds = Math.max(0, totalDuration - actualDurationSeconds);
  const timeSavedSecondsDisplay = Math.floor(timeSavedSeconds);

  return (
    <div className="building-liquidated-view">
      <div className="liquidation-banner">
        <div className="liquidation-icon">💥</div>
        <div className="liquidation-message">
          <h3>Trade Liquidated</h3>
          <p>The price dropped below your liquidation threshold</p>
        </div>
      </div>

      <div className="liquidation-details">
        <div className="detail-row consolation">
          <span className="detail-label">Rewarded Tokens</span>
          <span className="detail-value">100 🪙</span>
        </div>
        <div className="detail-row" style={{ borderColor: '#4d8bf0' }}>
          <span className="detail-label">Time Saved</span>
          <span className="detail-value" style={{ color: '#4d8bf0' }}>{timeSavedSecondsDisplay} mins</span>
          <span className="detail-label"><i>Demo time duration</i></span>
        </div>
      </div>

      <button
        onClick={handleAcknowledge}
        disabled={isLoading}
        className="acknowledge-button"
      >
        {isLoading ? 'Claiming...' : 'Claim Reward (100 Tokens)'}
      </button>
    </div>
  );
}
