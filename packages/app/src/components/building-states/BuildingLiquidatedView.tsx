import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { apiClient } from '../../api/client';
import type { TownBuilding, Trade } from '@stealth-town/shared/types';
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

  const priceDropPercent = (
    ((trade.entryPrice - trade.liquidationPrice) / trade.entryPrice) *
    100
  ).toFixed(1);

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
          <span className="detail-label">Consolation Tokens</span>
          <span className="detail-value">100 🎁</span>
        </div>
        <div className="detail-row loss">
          <span className="detail-label">Energy Lost</span>
          <span className="detail-value">{trade.energySpent} ⚡</span>
        </div>
      </div>

      <div className="trade-summary-liquidated">
        <div className="summary-item">
          <span>Risk Mode:</span>
          <span>{trade.riskMode.toUpperCase()}</span>
        </div>
        <div className="summary-item">
          <span>Entry Price:</span>
          <span>${trade.entryPrice.toFixed(2)}</span>
        </div>
        <div className="summary-item">
          <span>Liquidation Price:</span>
          <span className="danger">${trade.liquidationPrice.toFixed(2)}</span>
        </div>
        <div className="summary-item">
          <span>Price Drop:</span>
          <span className="danger">-{priceDropPercent}%</span>
        </div>
      </div>

      <div className="tip-box">
        <strong>💡 Tip:</strong> Try a less risky mode next time, or watch the market more closely!
      </div>

      <button
        onClick={handleAcknowledge}
        disabled={isLoading}
        className="acknowledge-button"
      >
        {isLoading ? 'Claiming...' : 'Claim Consolation (100 Tokens)'}
      </button>
    </div>
  );
}
