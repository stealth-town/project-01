import type { TownBuilding, UserBalances } from '@stealth-town/shared/types';
import { BuildingIdleView } from './building-states/BuildingIdleView';
import { BuildingActiveView } from './building-states/BuildingActiveView';
import { BuildingCompletedView } from './building-states/BuildingCompletedView';
import { BuildingLiquidatedView } from './building-states/BuildingLiquidatedView';

interface TradingMainContentProps {
  selectedBuilding: TownBuilding | null;
  balances: UserBalances;
  onUpdate: () => void;
  hasAnyBuildings: boolean;
}

export function TradingMainContent({ selectedBuilding, balances, onUpdate, hasAnyBuildings }: TradingMainContentProps) {
  // No building selected
  if (!selectedBuilding) {
    return (
      <div className="trading-main-content">
        <div className="empty-state">
          {hasAnyBuildings ? (
            <>
              <h2>Select a Building to Start Trading</h2>
              <p>Choose a building slot from the sidebar</p>
            </>
          ) : (
            <>
              <h2>Buy Your First Building</h2>
              <p>Purchase a building from the shop to start earning tokens</p>
            </>
          )}
        </div>
      </div>
    );
  }

  // Render appropriate view based on building status
  return (
    <div className="trading-main-content">
      {/* Building Number Header */}
      <div className="building-header">
        <h3 className="building-number">Building #{selectedBuilding.slotNumber}</h3>
      </div>

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
