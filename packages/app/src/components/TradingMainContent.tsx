import type { TownBuilding, UserBalances } from '@stealth-town/shared/types';
import { BuildingIdleView } from './building-states/BuildingIdleView';
import { BuildingActiveView } from './building-states/BuildingActiveView';
import { BuildingCompletedView } from './building-states/BuildingCompletedView';
import { BuildingLiquidatedView } from './building-states/BuildingLiquidatedView';

interface TradingMainContentProps {
  selectedBuilding: TownBuilding | null;
  balances: UserBalances;
  onUpdate: () => void;
}

export function TradingMainContent({ selectedBuilding, balances, onUpdate }: TradingMainContentProps) {
  // No building selected
  if (!selectedBuilding) {
    return (
      <div className="trading-main-content">
        <div className="empty-state">
          <h2>Select a Building to Start Trading</h2>
          <p>Choose a building slot from the sidebar</p>
        </div>
      </div>
    );
  }

  // Render appropriate view based on building status
  return (
    <div className="trading-main-content">
      {selectedBuilding.status === 'idle' && (
        <BuildingIdleView building={selectedBuilding} balances={balances} onUpdate={onUpdate} />
      )}

      {selectedBuilding.status === 'active' && (
        <BuildingActiveView building={selectedBuilding} />
      )}

      {selectedBuilding.status === 'completed' && (
        <BuildingCompletedView building={selectedBuilding} onUpdate={onUpdate} />
      )}

      {selectedBuilding.status === 'liquidated' && (
        <BuildingLiquidatedView building={selectedBuilding} onUpdate={onUpdate} />
      )}
    </div>
  );
}
