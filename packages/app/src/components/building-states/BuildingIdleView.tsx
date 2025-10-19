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

  // Calculate leverage based on liquidation threshold
  const getLeverage = (threshold: number) => {
    return Math.round(1 / threshold);
  };

  return (
    <div className="building-idle-view">
      <h2 style={{ marginBottom: '0.5rem', color: '#000000' }}>Choose trade duration and leverage</h2>

      <div style={{ marginBottom: '2rem' }}>
        <p style={{
          color: '#10b981',
          fontSize: '0.875rem',
          marginBottom: '0.5rem',
          lineHeight: '1.5'
        }}>
          If you survive the trade duration you will get <strong style={{ fontWeight: 700 }}>energy refund</strong>
        </p>
        <p style={{
          color: '#ef4444',
          fontSize: '0.875rem',
          lineHeight: '1.5'
        }}>
          If you get <strong style={{ fontWeight: 700 }}>liquidated</strong> you will get token <strong style={{ fontWeight: 700 }}>rewards faster</strong>
        </p>
      </div>

      <div className="mode-selection-grid">
        {[RiskMode.CHEETAH, RiskMode.WALK, RiskMode.TURTLE].map(mode => {
          const config = RISK_MODE_CONFIG[mode];
          const canAfford = balances.energy >= config.energyCost;
          const modeIcon = mode === RiskMode.TURTLE ? '🐢' : mode === RiskMode.WALK ? '🚶' : '🐆';
          const leverage = getLeverage(config.liquidationThreshold);

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
                  <span className="label">Leverage</span>
                  <span className="value">{leverage}x</span>
                </div>
                <div className="stat">
                  <span className="label">Reward</span>
                  <span className="value">{config.tokensReward} 🪙</span>
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
