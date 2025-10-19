import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { apiClient } from '../../api/client';
import type { TownBuilding, Trade } from '@stealth-town/shared/types';
// styles in main.scss

interface BuildingCompletedViewProps {
  building: TownBuilding;
  onUpdate: () => void;
}

export function BuildingCompletedView({ building, onUpdate }: BuildingCompletedViewProps) {
  const { user } = useAuth();
  const [trade, setTrade] = useState<Trade | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadTrade = async () => {
      if (!user) return;

      try {
        const trades = await apiClient.getUserTrades(user.id);
        const completedTrade = trades.find(
          (t) => t.buildingId === building.id && t.status === 'completed'
        );
        if (completedTrade) {
          setTrade(completedTrade);
        }
      } catch (error) {
        console.error('Failed to load trade:', error);
      }
    };

    loadTrade();
  }, [user, building.id]);

  const handleClaimReward = async () => {
    if (!user || !trade) return;

    setIsLoading(true);
    setError('');

    try {
      await apiClient.claimReward(user.id, trade.id);
      onUpdate();
    } catch (err: any) {
      setError(err.message || 'Failed to claim reward');
    } finally {
      setIsLoading(false);
    }
  };

  if (!trade) {
    return <div className="building-completed-view loading">Loading trade data...</div>;
  }

  return (
    <div className="building-completed-view">
      <div className="success-banner">
        <div className="success-icon">🎉</div>
        <div className="success-message">
          <h3>You survived!</h3>
          <p>You get energy refund</p>
        </div>
      </div>

      <div className="reward-details">
        <div className="reward-item">
          <span className="reward-label">Tokens Earned</span>
          <span className="reward-value tokens">{trade.tokensReward || 0} 🪙</span>
        </div>
        <div className="reward-item">
          <span className="reward-label">Energy Refund</span>
          <span className="reward-value energy">{trade.energySpent} ⚡</span>
        </div>
      </div>
    

      {error && <div className="error-message">{error}</div>}

      <button
        onClick={handleClaimReward}
        disabled={isLoading}
        className="claim-reward-button"
      >
        {isLoading ? 'Claiming...' : 'Collect Rewards'}
      </button>
    </div>
  );
}
