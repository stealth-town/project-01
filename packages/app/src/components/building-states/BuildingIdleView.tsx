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
  const [selectedRisk, setSelectedRisk] = useState<RiskMode | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const riskModes = [
    { mode: RiskMode.TURTLE, name: 'Turtle', icon: '🐢', color: '#48bb78' },
    { mode: RiskMode.WALK, name: 'Walk', icon: '🚶', color: '#ed8936' },
    { mode: RiskMode.CHEETAH, name: 'Cheetah', icon: '🐆', color: '#f56565' },
  ];

  const handleStartTrade = async () => {
    if (!user || !selectedRisk) return;

    setIsLoading(true);
    setError('');

    try {
      await apiClient.startTrade(user.id, building.id, selectedRisk);
      onUpdate();
      setSelectedRisk(null);
    } catch (err: any) {
      setError(err.message || 'Failed to start trade');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="building-idle-view">
      <p className="idle-message">Select a risk mode to start trading</p>

      <div className="risk-modes">
        {riskModes.map(({ mode, name, icon, color }) => {
          const config = RISK_MODE_CONFIG[mode];
          const canAfford = balances.energy >= config.energyCost;
          const isSelected = selectedRisk === mode;

          return (
            <button
              key={mode}
              className={`risk-mode-button ${isSelected ? 'selected' : ''} ${!canAfford ? 'disabled' : ''}`}
              style={{ borderColor: isSelected ? color : undefined }}
              onClick={() => canAfford && setSelectedRisk(mode)}
              disabled={!canAfford}
            >
              <div className="risk-icon">{icon}</div>
              <div className="risk-info">
                <span className="risk-name">{name}</span>
                <div className="risk-stats">
                  <span className="stat">⚡ {config.energyCost}</span>
                  <span className="stat">⏱️ {config.duration / 60}m</span>
                  <span className="stat">🎁 {config.tokensReward}</span>
                </div>
                {!canAfford && <span className="insufficient">Insufficient energy</span>}
              </div>
            </button>
          );
        })}
      </div>

      {selectedRisk && (
        <div className="trade-details">
          <div className="detail-row">
            <span>Energy Cost:</span>
            <span className="detail-value">{RISK_MODE_CONFIG[selectedRisk].energyCost} ⚡</span>
          </div>
          <div className="detail-row">
            <span>Duration:</span>
            <span className="detail-value">{RISK_MODE_CONFIG[selectedRisk].duration / 60} minutes</span>
          </div>
          <div className="detail-row">
            <span>Reward:</span>
            <span className="detail-value">{RISK_MODE_CONFIG[selectedRisk].tokensReward} tokens</span>
          </div>
          <div className="detail-row">
            <span>Liquidation:</span>
            <span className="detail-value danger">
              {(RISK_MODE_CONFIG[selectedRisk].liquidationThreshold * 100).toFixed(0)}% drop
            </span>
          </div>
        </div>
      )}

      {error && <div className="error-message">{error}</div>}

      <button
        onClick={handleStartTrade}
        disabled={!selectedRisk || isLoading}
        className="start-trade-button"
      >
        {isLoading ? 'Starting Trade...' : 'Start Trade'}
      </button>
    </div>
  );
}
