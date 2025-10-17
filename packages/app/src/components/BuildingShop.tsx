import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { apiClient } from '../api/client';
import type { TownBuilding, UserBalances } from '@stealth-town/shared/types';
import { BUILDING_COST_USDC, TOWN_UPGRADE_COST, MAX_TOWN_LEVEL, TOWN_LEVEL_SLOTS } from '@stealth-town/shared/types';
// styles in main.scss

interface BuildingShopProps {
  townLevel: number;
  buildings: TownBuilding[];
  balances: UserBalances;
  onPurchase: () => void;
}

export function BuildingShop({ townLevel, buildings, balances, onPurchase }: BuildingShopProps) {
  const { user } = useAuth();
  const [isLoadingBuilding, setIsLoadingBuilding] = useState(false);
  const [isLoadingUpgrade, setIsLoadingUpgrade] = useState(false);
  const [error, setError] = useState('');

  const maxSlots = TOWN_LEVEL_SLOTS[townLevel as keyof typeof TOWN_LEVEL_SLOTS] || 1;
  const currentBuildingCount = buildings.length;
  const canAffordBuilding = balances.usdc >= BUILDING_COST_USDC;
  const hasSlotAvailable = currentBuildingCount < maxSlots;

  const canUpgradeTown = townLevel < MAX_TOWN_LEVEL;
  const upgradeCost = TOWN_UPGRADE_COST[townLevel as keyof typeof TOWN_UPGRADE_COST];
  const canAffordUpgrade = upgradeCost !== undefined && balances.usdc >= upgradeCost;

  const handlePurchaseBuilding = async () => {
    if (!user || !canAffordBuilding || !hasSlotAvailable) return;

    setIsLoadingBuilding(true);
    setError('');

    try {
      const nextSlot = buildings.length + 1;
      await apiClient.buyBuilding(user.id, nextSlot);
      onPurchase();
    } catch (err: any) {
      setError(err.message || 'Purchase failed');
    } finally {
      setIsLoadingBuilding(false);
    }
  };

  const handleUpgradeTown = async () => {
    if (!user || !canAffordUpgrade || !canUpgradeTown) return;

    setIsLoadingUpgrade(true);
    setError('');

    try {
      await apiClient.upgradeTown(user.id);
      onPurchase(); // Refresh town state
    } catch (err: any) {
      setError(err.message || 'Upgrade failed');
    } finally {
      setIsLoadingUpgrade(false);
    }
  };

  return (
    <div className="building-shop">
      <h2>Building Shop</h2>
      {error && <div className="shop-error">{error}</div>}

      <div className="building-info">
        <div className="info-row">
          <span>Buildings:</span>
          <span className="info-value">
            {currentBuildingCount} / {maxSlots}
          </span>
        </div>
        <div className="info-row">
          <span>Town Level:</span>
          <span className="info-value">{townLevel} / {MAX_TOWN_LEVEL}</span>
        </div>
      </div>

      {/* Town Upgrade Section */}
      {canUpgradeTown && (
        <div className="purchase-section">
          <div className="building-card">
            <div className="building-icon">⬆️</div>
            <div className="building-details">
              <span className="building-name">Upgrade Town to Level {townLevel + 1}</span>
              <span className="building-price">${upgradeCost} USDC</span>
              <span style={{ fontSize: '12px', color: '#888' }}>
                Unlocks {TOWN_LEVEL_SLOTS[(townLevel + 1) as keyof typeof TOWN_LEVEL_SLOTS]} building slot{TOWN_LEVEL_SLOTS[(townLevel + 1) as keyof typeof TOWN_LEVEL_SLOTS] > 1 ? 's' : ''}
              </span>
            </div>
          </div>

          <button
            onClick={handleUpgradeTown}
            disabled={isLoadingUpgrade || !canAffordUpgrade}
            className="buy-building-button"
            style={{ backgroundColor: canAffordUpgrade ? '#FF9800' : '#666' }}
          >
            {!canAffordUpgrade
              ? 'Insufficient USDC'
              : isLoadingUpgrade
              ? 'Upgrading...'
              : `Upgrade Town ($${upgradeCost})`}
          </button>
        </div>
      )}

      {/* Building Purchase Section */}
      <div className="purchase-section">
        <div className="building-card">
          <div className="building-icon">🏢</div>
          <div className="building-details">
            <span className="building-name">New Building Slot</span>
            <span className="building-price">${BUILDING_COST_USDC} USDC</span>
          </div>
        </div>

        <button
          onClick={handlePurchaseBuilding}
          disabled={isLoadingBuilding || !canAffordBuilding || !hasSlotAvailable}
          className="buy-building-button"
        >
          {!hasSlotAvailable
            ? canUpgradeTown
              ? `Upgrade town to unlock more slots`
              : `Max slots reached (${maxSlots}/${maxSlots})`
            : !canAffordBuilding
            ? 'Insufficient USDC'
            : isLoadingBuilding
            ? 'Buying...'
            : `Buy Building ($${BUILDING_COST_USDC})`}
        </button>
      </div>
    </div>
  );
}
