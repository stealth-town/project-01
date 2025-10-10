import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { apiClient } from '../api/client';
import type { TownBuilding, UserBalances } from '@stealth-town/shared/types';
// styles in main.scss

interface BuildingShopProps {
  townLevel: number;
  buildings: TownBuilding[];
  balances: UserBalances;
  onPurchase: () => void;
}

const BUILDING_COST = 100;
const MAX_BUILDINGS_PER_LEVEL: Record<number, number> = {
  1: 1,
  2: 2,
  3: 3,
};

export function BuildingShop({ townLevel, buildings, balances, onPurchase }: BuildingShopProps) {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const maxBuildings = MAX_BUILDINGS_PER_LEVEL[townLevel] || 3;
  const currentBuildingCount = buildings.length;
  const canAfford = balances.usdc >= BUILDING_COST;
  const hasSlotAvailable = currentBuildingCount < maxBuildings;

  const handlePurchase = async () => {
    if (!user || !canAfford || !hasSlotAvailable) return;

    setIsLoading(true);
    setError('');

    try {
      const nextSlot = buildings.length + 1;
      await apiClient.buyBuilding(user.id, nextSlot);
      onPurchase();
    } catch (err: any) {
      setError(err.message || 'Purchase failed');
    } finally {
      setIsLoading(false);
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
            {currentBuildingCount} / {maxBuildings}
          </span>
        </div>
        <div className="info-row">
          <span>Town Level:</span>
          <span className="info-value">{townLevel}</span>
        </div>
      </div>

      <div className="purchase-section">
        <div className="building-card">
          <div className="building-icon">🏢</div>
          <div className="building-details">
            <span className="building-name">New Building Slot</span>
            <span className="building-price">${BUILDING_COST} USDC</span>
          </div>
        </div>

        <button
          onClick={handlePurchase}
          disabled={isLoading || !canAfford || !hasSlotAvailable}
          className="buy-building-button"
        >
          {!hasSlotAvailable
            ? `Max slots unlocked (Level ${townLevel})`
            : !canAfford
            ? 'Insufficient USDC'
            : isLoading
            ? 'Buying...'
            : 'Buy Building'}
        </button>
      </div>
    </div>
  );
}
