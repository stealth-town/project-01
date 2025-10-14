import { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { apiClient } from '../../api/client';
import { RiskMode, RISK_MODE_CONFIG, type TownBuilding, type UserBalances } from '@stealth-town/shared/types';
// styles in main.scss

interface BuildingIdleViewProps {
  building: TownBuilding;
  balances: UserBalances;
  onUpdate: () => void;
}

export function BuildingIdleView({ building, balances, onUpdate }: BuildingIdleViewProps) {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleStartTrade = async (mode: RiskMode) => {
    if (!user) return;

    setIsLoading(true);
    setError('');

    try {
      await apiClient.startTrade(user.id, building.id, mode);
      onUpdate();
    } catch (err: any) {
      setError(err.message || 'Failed to start trade');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="building-idle-view">
      <h2>Select Risk Mode</h2>

      <div className="mode-selection-grid">
        {[RiskMode.TURTLE, RiskMode.WALK, RiskMode.CHEETAH].map(mode => {
          const config = RISK_MODE_CONFIG[mode];
          const canAfford = balances.energy >= config.energyCost;
          const modeIcon = mode === RiskMode.TURTLE ? '🐢' : mode === RiskMode.WALK ? '🚶' : '🐆';

          return (
            <div key={mode} className={`mode-card mode-${mode}`}>
              <div className="mode-header">
                <span className="mode-icon">{modeIcon}</span>
                <h3>{mode.toUpperCase()}</h3>
              </div>

              <div className="mode-stats">
                <div className="stat">
                  <span className="label">Duration</span>
                  <span className="value">{config.duration}s</span>
                </div>
                <div className="stat">
                  <span className="label">Liquidation</span>
                  <span className="value">{(config.liquidationThreshold * 100).toFixed(2)}%</span>
                </div>
                <div className="stat">
                  <span className="label">Reward</span>
                  <span className="value">{config.tokensReward} 🎁</span>
                </div>
              </div>

              <button
                onClick={() => handleStartTrade(mode)}
                disabled={isLoading || !canAfford}
                className="start-trade-button"
              >
                {isLoading ? 'Starting...' : canAfford ? `Start (${config.energyCost} ⚡)` : 'Insufficient Energy'}
              </button>
            </div>
          );
        })}
      </div>

      {error && <div className="error-message">{error}</div>}
    </div>
  );
}
