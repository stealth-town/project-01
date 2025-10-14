import type { TownBuilding } from '@stealth-town/shared/types';
import { BuildingSlotItem } from './BuildingSlotItem';

interface BuildingSidebarProps {
  buildings: TownBuilding[];
  maxSlots: number;
  selectedBuildingId: string | null;
  onSelectBuilding: (buildingId: string | null) => void;
}

export function BuildingSidebar({
  buildings,
  maxSlots,
  selectedBuildingId,
  onSelectBuilding
}: BuildingSidebarProps) {
  // Generate slot array (1 to maxSlots)
  const slots = Array.from({ length: maxSlots }, (_, i) => i + 1);

  // Map buildings to slots
  const buildingMap = new Map(buildings.map(b => [b.slotNumber, b]));

  return (
    <div className="building-sidebar">
      <div className="sidebar-header">Your Buildings</div>

      {slots.map(slotNumber => {
        const building = buildingMap.get(slotNumber) || null;
        return (
          <BuildingSlotItem
            key={slotNumber}
            building={building}
            slotNumber={slotNumber}
            isSelected={building?.id === selectedBuildingId}
            onClick={() => building && onSelectBuilding(building.id)}
          />
        );
      })}
    </div>
  );
}
