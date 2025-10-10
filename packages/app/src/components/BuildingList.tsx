import type { TownBuilding, UserBalances } from '@stealth-town/shared/types';
import { BuildingCard } from './BuildingCard';
// styles in main.scss

interface BuildingListProps {
  buildings: TownBuilding[];
  balances: UserBalances;
  onUpdate: () => void;
}

export function BuildingList({ buildings, balances, onUpdate }: BuildingListProps) {
  if (buildings.length === 0) {
    return (
      <div className="building-list-empty">
        <div className="empty-state">
          <div className="empty-icon">🏗️</div>
          <h3>No Buildings Yet</h3>
          <p>Purchase your first building from the Building Shop to start trading!</p>
        </div>
      </div>
    );
  }

  return (
    <div className="building-list">
      <h2>Your Buildings</h2>
      <div className="buildings-container">
        {buildings.map((building) => (
          <BuildingCard
            key={building.id}
            building={building}
            balances={balances}
            onUpdate={onUpdate}
          />
        ))}
      </div>
    </div>
  );
}
