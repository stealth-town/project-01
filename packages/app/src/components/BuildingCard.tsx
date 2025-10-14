import type { TownBuilding, UserBalances } from '@stealth-town/shared/types';
import { BuildingStatus } from '@stealth-town/shared/types';
import { BuildingIdleView } from './building-states/BuildingIdleView';
import { BuildingActiveView } from './building-states/BuildingActiveView';
import { BuildingCompletedView } from './building-states/BuildingCompletedView';
import { BuildingLiquidatedView } from './building-states/BuildingLiquidatedView';
// styles in main.scss

interface BuildingCardProps {
  building: TownBuilding;
  balances: UserBalances;
  onUpdate: () => void;
}

/**
 * BuildingCard - The main container for building/trading UI
 *
 * This component acts as a facade that delegates rendering to specialized
 * view components based on building status. This makes it easy to:
 * 1. Replace entire trading UI by swapping view components
 * 2. Experiment with different UI designs per status
 * 3. Maintain clean separation of concerns
 */
export function BuildingCard({ building, balances, onUpdate }: BuildingCardProps) {
  const renderBuildingState = () => {
    switch (building.status) {
      case BuildingStatus.IDLE:
        return (
          <BuildingIdleView
            building={building}
            balances={balances}
            onUpdate={onUpdate}
          />
        );

      case BuildingStatus.ACTIVE:
        return (
          <BuildingActiveView
            building={building}
          />
        );

      case BuildingStatus.COMPLETED:
        return (
          <BuildingCompletedView
            building={building}
            onUpdate={onUpdate}
          />
        );

      case BuildingStatus.LIQUIDATED:
        return (
          <BuildingLiquidatedView
            building={building}
            onUpdate={onUpdate}
          />
        );

      default:
        return <div>Unknown building status</div>;
    }
  };

  return (
    <div className={`building-card status-${building.status}`}>
      <div className="building-header">
        <div className="building-title">
          <span className="building-icon">🏢</span>
          <span className="building-number">Building #{building.slotNumber}</span>
        </div>
        <span className={`status-badge status-${building.status}`}>
          {building.status}
        </span>
      </div>

      <div className="building-content">
        {renderBuildingState()}
      </div>
    </div>
  );
}
