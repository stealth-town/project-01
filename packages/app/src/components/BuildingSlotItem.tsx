import type { TownBuilding } from '@stealth-town/shared/types';

interface BuildingSlotItemProps {
  building: TownBuilding | null;  // null = empty slot
  slotNumber: number;
  isSelected: boolean;
  onClick: () => void;
}

export function BuildingSlotItem({ building, slotNumber, isSelected, onClick }: BuildingSlotItemProps) {

  // Empty slot
  if (!building) {
    return (
      <div className="building-slot-item empty">
        <div className="slot-number">{slotNumber}</div>
        <div className="slot-content">
          <div className="slot-title">Empty Slot</div>
          <div className="slot-status">Purchase a building</div>
        </div>
      </div>
    );
  }

  // Get status display info
  const getStatusInfo = () => {
    switch (building.status) {
      case 'idle':
        return { label: 'Ready', className: 'idle' };
      case 'active':
        return { label: 'Trading', className: 'active' };
      case 'completed':
        return { label: '🎁 Claim', className: 'completed' };
      case 'liquidated':
        return { label: '💥 Claim', className: 'liquidated' };
      default:
        return { label: 'Unknown', className: '' };
    }
  };

  const statusInfo = getStatusInfo();

  return (
    <div
      className={`building-slot-item ${statusInfo.className} ${isSelected ? 'selected' : ''}`}
      onClick={onClick}
    >
      <div className="slot-number">{slotNumber}</div>
      <div className="slot-content">
        <div className="slot-title">Slot {slotNumber}</div>
        <div className="status-indicator">
          <span className="status-dot"></span>
          <span className="slot-status">{statusInfo.label}</span>
        </div>
      </div>
    </div>
  );
}
