# UI Restructure Implementation Plan

**Date Created:** 2025-01-14
**Status:** Ready for Implementation
**Estimated Effort:** 2-3 sessions

---

## Overview

Transform the current single-column building list into a **sidebar + main content** layout for better UX and scalability.

### Goals
- ✅ Buildings shown in vertical sidebar with status indicators
- ✅ Large main content area for trading charts and controls
- ✅ 3-card risk mode selection (clear, visual)
- ✅ Full-width trading chart integration
- ✅ Scalable for 4+ buildings in the future

---

## Current State

```
Town Page Layout (Current):
├── Left Panel: Shops (BalancesDisplay, EnergyShop, BuildingShop)
└── Right Panel: BuildingList (vertical list of BuildingCard components)
    └── Each BuildingCard contains:
        - BuildingIdleView (dropdown for risk selection)
        - BuildingActiveView (collapsible chart placeholder)
        - BuildingCompletedView (claim button)
        - BuildingLiquidatedView (claim button)
```

**Problems:**
- BuildingCard takes too much vertical space
- Chart is too small (collapsible placeholder)
- Risk mode selection is cramped (dropdown)
- Doesn't scale well for multiple buildings

---

## Target State

```
Town Page Layout (New):
├── Left Panel: Shops (UNCHANGED)
└── Right Panel: Trading Area
    ├── BuildingSidebar (left ~25-30%)
    │   └── BuildingSlotItem[] (vertical list)
    │       - Shows slot number
    │       - Status indicator (color + icon)
    │       - Click to select
    └── TradingMainContent (right ~70-75%)
        ├── If IDLE: 3 Mode Selection Cards
        ├── If ACTIVE: Large TradingChart + Trade Info
        └── If COMPLETED/LIQUIDATED: Claim View
```

---

## Phase 1: Component Structure

### 1.1 BuildingSlotItem Component

**File:** `src/components/BuildingSlotItem.tsx`

**Purpose:** Individual slot representation in sidebar

**Props:**
```typescript
interface BuildingSlotItemProps {
  building: TownBuilding | null;  // null = empty slot
  slotNumber: number;
  isSelected: boolean;
  onClick: () => void;
}
```

**Display Logic:**
```typescript
- If building === null:
  → Show "Empty Slot #N"
  → Gray background
  → "Buy Building" hint

- If building.status === 'idle':
  → Green dot indicator
  → "Ready to Trade"

- If building.status === 'active':
  → Animated blue dot
  → Show countdown timer (optional)

- If building.status === 'completed':
  → Pulsing green indicator
  → "Claim Rewards!"

- If building.status === 'liquidated':
  → Pulsing red indicator
  → "Claim Consolation"
```

**Styling:**
```scss
.building-slot-item {
  padding: 1rem;
  border-radius: 0.5rem;
  cursor: pointer;
  border: 2px solid transparent;
  transition: all 0.2s;

  &.selected {
    border-color: #3b82f6;
    background: rgba(59, 130, 246, 0.1);
  }

  &.empty { opacity: 0.6; }
  &.idle .status-dot { background: #10b981; }
  &.active .status-dot {
    background: #3b82f6;
    animation: pulse 2s infinite;
  }
  &.completed .status-dot {
    background: #10b981;
    animation: pulse 1.5s infinite;
  }
  &.liquidated .status-dot {
    background: #ef4444;
    animation: pulse 1.5s infinite;
  }
}

.status-dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}
```

**Estimated Lines:** ~60

---

### 1.2 BuildingSidebar Component

**File:** `src/components/BuildingSidebar.tsx`

**Purpose:** Container for all building slots

**Props:**
```typescript
interface BuildingSidebarProps {
  buildings: TownBuilding[];
  maxSlots: number;  // From TOWN_LEVEL_SLOTS or MAX_BUILDINGS
  selectedBuildingId: string | null;
  onSelectBuilding: (buildingId: string | null) => void;
}
```

**Logic:**
```typescript
// Generate slot array (1 to maxSlots)
const slots = Array.from({ length: maxSlots }, (_, i) => i + 1);

// Map buildings to slots
const buildingMap = new Map(buildings.map(b => [b.slotNumber, b]));

// Render each slot
slots.map(slotNumber => {
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
});
```

**Styling:**
```scss
.building-sidebar {
  width: 280px;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  padding: 1rem;
  background: rgba(26, 26, 46, 0.5);
  border-radius: 0.75rem;
  overflow-y: auto;
  max-height: calc(100vh - 200px);
}

.sidebar-header {
  font-size: 0.875rem;
  font-weight: 600;
  color: #9ca3af;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: 0.5rem;
}
```

**Estimated Lines:** ~80

---

### 1.3 TradingMainContent Component

**File:** `src/components/TradingMainContent.tsx`

**Purpose:** Main right-side content area

**Props:**
```typescript
interface TradingMainContentProps {
  selectedBuilding: TownBuilding | null;
  balances: UserBalances;
  onUpdate: () => void;
}
```

**Logic:**
```typescript
if (!selectedBuilding) {
  return (
    <div className="empty-state">
      <h2>Select a Building to Start Trading</h2>
      <p>Choose a building slot from the sidebar</p>
    </div>
  );
}

// Delegate to existing view components based on status
switch (selectedBuilding.status) {
  case 'idle':
    return <BuildingIdleView building={selectedBuilding} balances={balances} onUpdate={onUpdate} />;
  case 'active':
    return <BuildingActiveView building={selectedBuilding} />;
  case 'completed':
    return <BuildingCompletedView building={selectedBuilding} onUpdate={onUpdate} />;
  case 'liquidated':
    return <BuildingLiquidatedView building={selectedBuilding} onUpdate={onUpdate} />;
}
```

**Styling:**
```scss
.trading-main-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  padding: 1.5rem;
  background: rgba(26, 26, 46, 0.3);
  border-radius: 0.75rem;
  min-height: 600px;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: #9ca3af;
}
```

**Estimated Lines:** ~70

---

## Phase 2: Update Existing Components

### 2.1 Update TownPage.tsx

**File:** `src/pages/TownPage.tsx`

**Changes:**
```typescript
// Add state for selected building
const [selectedBuildingId, setSelectedBuildingId] = useState<string | null>(null);

// Auto-select first building on load
useEffect(() => {
  if (buildings.length > 0 && !selectedBuildingId) {
    setSelectedBuildingId(buildings[0].id);
  }
}, [buildings, selectedBuildingId]);

// Get selected building
const selectedBuilding = buildings.find(b => b.id === selectedBuildingId) || null;

// Calculate max slots (from town level)
const maxSlots = TOWN_LEVEL_SLOTS[townLevel as keyof typeof TOWN_LEVEL_SLOTS] || MAX_BUILDINGS;
```

**New JSX Structure:**
```tsx
<main className="trading-panel">
  <div className="trading-layout">
    <BuildingSidebar
      buildings={buildings}
      maxSlots={maxSlots}
      selectedBuildingId={selectedBuildingId}
      onSelectBuilding={setSelectedBuildingId}
    />

    <TradingMainContent
      selectedBuilding={selectedBuilding}
      balances={balances}
      onUpdate={loadTownState}
    />
  </div>
</main>
```

**Remove:**
- `<BuildingList />` component usage

**Estimated Changes:** ~30 lines

---

### 2.2 Update BuildingIdleView.tsx

**File:** `src/components/building-states/BuildingIdleView.tsx`

**Current:**
- Compact dropdown for risk mode selection
- Small details section

**New:**
- 3 large mode selection cards (side-by-side grid)
- Each card is clickable and shows full details

**New Structure:**
```tsx
<div className="building-idle-view">
  <h2>Select Risk Mode</h2>
  <p>Choose your trade duration and liquidation threshold</p>

  <div className="mode-selection-grid">
    {[RiskMode.TURTLE, RiskMode.WALK, RiskMode.CHEETAH].map(mode => {
      const config = RISK_MODE_CONFIG[mode];
      return (
        <div key={mode} className={`mode-card mode-${mode}`}>
          <div className="mode-header">
            <span className="mode-icon">
              {mode === 'turtle' ? '🐢' : mode === 'walk' ? '🚶' : '🐆'}
            </span>
            <h3>{mode.toUpperCase()}</h3>
          </div>

          <div className="mode-stats">
            <div className="stat">
              <span className="label">Duration</span>
              <span className="value">{config.duration}s</span>
            </div>
            <div className="stat">
              <span className="label">Energy Cost</span>
              <span className="value">{config.energyCost} ⚡</span>
            </div>
            <div className="stat">
              <span className="label">Liquidation</span>
              <span className="value">{(config.liquidationThreshold * 100).toFixed(2)}%</span>
            </div>
            <div className="stat">
              <span className="label">Reward</span>
              <span className="value">{config.tokensReward} 🎁</span>
            </div>
          </div>

          <button
            onClick={() => handleStartTrade(mode)}
            disabled={isLoading || balances.energy < config.energyCost}
            className="start-trade-button"
          >
            {isLoading ? 'Starting...' : 'Start Trade'}
          </button>
        </div>
      );
    })}
  </div>

  {error && <div className="error-message">{error}</div>}
</div>
```

**Styling:**
```scss
.mode-selection-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1.5rem;
  margin-top: 2rem;
}

.mode-card {
  padding: 2rem;
  border-radius: 1rem;
  background: rgba(42, 42, 62, 0.6);
  border: 3px solid transparent;
  cursor: pointer;
  transition: all 0.3s;

  &:hover {
    border-color: #3b82f6;
    transform: translateY(-4px);
    box-shadow: 0 8px 16px rgba(59, 130, 246, 0.2);
  }

  &.mode-turtle { ... }
  &.mode-walk { ... }
  &.mode-cheetah { ... }
}

.mode-header {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1.5rem;

  .mode-icon {
    font-size: 3rem;
  }

  h3 {
    font-size: 1.5rem;
    font-weight: 700;
  }
}

.mode-stats {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.stat {
  display: flex;
  justify-content: space-between;

  .label {
    color: #9ca3af;
    font-size: 0.875rem;
  }

  .value {
    font-weight: 600;
  }
}

.start-trade-button {
  width: 100%;
  padding: 0.75rem;
  border-radius: 0.5rem;
  background: #3b82f6;
  color: white;
  font-weight: 600;
  border: none;
  cursor: pointer;

  &:hover:not(:disabled) {
    background: #2563eb;
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
}
```

**Remove:**
- Dropdown select element
- Old compact layout

**Estimated Changes:** ~100 lines

---

### 2.3 Update BuildingActiveView.tsx

**File:** `src/components/building-states/BuildingActiveView.tsx`

**Current:**
- Collapsible chart placeholder
- Compact trade summary

**New:**
- Full-width TradingChart (always visible)
- Trade info cards below chart

**New Structure:**
```tsx
<div className="building-active-view">
  <h2>Trade in Progress</h2>

  {/* Trading Chart */}
  <TradingChart
    entryPrice={trade.entryPrice}
    liquidationPrice={trade.liquidationPrice}
    currentPrice={3000} // Will be replaced with real current price
  />

  {/* Trade Info Grid */}
  <div className="trade-info-grid">
    <div className="info-card">
      <span className="label">Risk Mode</span>
      <span className="value">{trade.riskMode.toUpperCase()}</span>
    </div>

    <div className="info-card">
      <span className="label">Time Remaining</span>
      <span className="value timer">{formatTime(timeRemaining)}</span>
    </div>

    <div className="info-card">
      <span className="label">Entry Price</span>
      <span className="value">${trade.entryPrice.toFixed(2)}</span>
    </div>

    <div className="info-card">
      <span className="label">Liquidation Price</span>
      <span className="value danger">${trade.liquidationPrice.toFixed(2)}</span>
    </div>

    <div className="info-card">
      <span className="label">Energy Spent</span>
      <span className="value">{trade.energySpent} ⚡</span>
    </div>

    <div className="info-card">
      <span className="label">Potential Reward</span>
      <span className="value">{trade.tokensReward || 0} 🎁</span>
    </div>
  </div>
</div>
```

**Styling:**
```scss
.building-active-view {
  h2 {
    margin-bottom: 1.5rem;
  }
}

.trade-info-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1rem;
  margin-top: 1.5rem;
}

.info-card {
  padding: 1.5rem;
  background: rgba(42, 42, 62, 0.6);
  border-radius: 0.75rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;

  .label {
    color: #9ca3af;
    font-size: 0.875rem;
    font-weight: 500;
  }

  .value {
    font-size: 1.5rem;
    font-weight: 700;

    &.timer {
      color: #3b82f6;
      font-variant-numeric: tabular-nums;
    }

    &.danger {
      color: #ef4444;
    }
  }
}
```

**Remove:**
- `isExpanded` state
- `onToggleExpand` prop
- Expand/collapse button
- Chart placeholder mock

**Estimated Changes:** ~50 lines

---

## Phase 3: Styling (main.scss)

**File:** `src/main.scss`

**New Styles to Add:**

```scss
/* ========================================
   TRADING LAYOUT (Sidebar + Main Content)
   ======================================== */

.trading-layout {
  display: flex;
  gap: 1.5rem;
  height: 100%;
  min-height: 700px;
}

/* Building Sidebar */
.building-sidebar {
  width: 280px;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  padding: 1rem;
  background: rgba(26, 26, 46, 0.5);
  border-radius: 0.75rem;
  overflow-y: auto;
  max-height: calc(100vh - 200px);
}

.sidebar-header {
  font-size: 0.875rem;
  font-weight: 600;
  color: #9ca3af;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: 0.5rem;
}

/* Building Slot Item */
.building-slot-item {
  padding: 1rem;
  border-radius: 0.5rem;
  cursor: pointer;
  border: 2px solid transparent;
  transition: all 0.2s;
  background: rgba(42, 42, 62, 0.4);

  display: flex;
  align-items: center;
  gap: 0.75rem;

  &:hover {
    background: rgba(42, 42, 62, 0.7);
  }

  &.selected {
    border-color: #3b82f6;
    background: rgba(59, 130, 246, 0.1);
  }

  &.empty {
    opacity: 0.6;
    cursor: default;

    &:hover {
      background: rgba(42, 42, 62, 0.4);
    }
  }
}

.slot-number {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border-radius: 0.375rem;
  background: rgba(59, 130, 246, 0.2);
  font-weight: 700;
  color: #3b82f6;
}

.slot-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.slot-status {
  font-size: 0.75rem;
  color: #9ca3af;
}

.status-indicator {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.status-dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;

  .idle & { background: #10b981; }
  .active & {
    background: #3b82f6;
    animation: pulse 2s infinite;
  }
  .completed & {
    background: #10b981;
    animation: pulse 1.5s infinite;
  }
  .liquidated & {
    background: #ef4444;
    animation: pulse 1.5s infinite;
  }
}

@keyframes pulse {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.5; transform: scale(1.1); }
}

/* Trading Main Content */
.trading-main-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  padding: 1.5rem;
  background: rgba(26, 26, 46, 0.3);
  border-radius: 0.75rem;
  min-height: 600px;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: #9ca3af;

  h2 {
    font-size: 1.5rem;
    margin-bottom: 0.5rem;
  }

  p {
    font-size: 1rem;
  }
}

/* Mode Selection Grid */
.mode-selection-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1.5rem;
  margin-top: 2rem;
}

.mode-card {
  padding: 2rem;
  border-radius: 1rem;
  background: rgba(42, 42, 62, 0.6);
  border: 3px solid transparent;
  cursor: pointer;
  transition: all 0.3s;

  &:hover {
    border-color: #3b82f6;
    transform: translateY(-4px);
    box-shadow: 0 8px 16px rgba(59, 130, 246, 0.2);
  }

  &.mode-turtle {
    border-color: rgba(16, 185, 129, 0.3);
    &:hover { border-color: #10b981; }
  }

  &.mode-walk {
    border-color: rgba(59, 130, 246, 0.3);
    &:hover { border-color: #3b82f6; }
  }

  &.mode-cheetah {
    border-color: rgba(239, 68, 68, 0.3);
    &:hover { border-color: #ef4444; }
  }
}

.mode-header {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1.5rem;

  .mode-icon {
    font-size: 3rem;
  }

  h3 {
    font-size: 1.5rem;
    font-weight: 700;
  }
}

.mode-stats {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.stat {
  display: flex;
  justify-content: space-between;

  .label {
    color: #9ca3af;
    font-size: 0.875rem;
  }

  .value {
    font-weight: 600;
  }
}

.start-trade-button {
  width: 100%;
  padding: 0.75rem;
  border-radius: 0.5rem;
  background: #3b82f6;
  color: white;
  font-weight: 600;
  border: none;
  cursor: pointer;
  transition: all 0.2s;

  &:hover:not(:disabled) {
    background: #2563eb;
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
}

/* Trade Info Grid */
.trade-info-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1rem;
  margin-top: 1.5rem;
}

.info-card {
  padding: 1.5rem;
  background: rgba(42, 42, 62, 0.6);
  border-radius: 0.75rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;

  .label {
    color: #9ca3af;
    font-size: 0.875rem;
    font-weight: 500;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .value {
    font-size: 1.5rem;
    font-weight: 700;

    &.timer {
      color: #3b82f6;
      font-variant-numeric: tabular-nums;
    }

    &.danger {
      color: #ef4444;
    }
  }
}

/* Chart Container */
.trading-chart-container {
  width: 100%;
  margin-bottom: 1rem;

  .chart {
    border-radius: 0.75rem;
    overflow: hidden;
  }
}
```

**Estimated Lines:** ~200

---

## Phase 4: Implementation Order

### Step-by-Step Sequence

**Session 1: Core Components**
1. ✅ Create `BuildingSlotItem.tsx`
2. ✅ Create `BuildingSidebar.tsx`
3. ✅ Create `TradingMainContent.tsx`
4. ✅ Test components in isolation

**Session 2: Integration & Updates**
5. ✅ Update `TownPage.tsx` (wire new components)
6. ✅ Update `BuildingIdleView.tsx` (3-card layout)
7. ✅ Update `BuildingActiveView.tsx` (integrate chart)
8. ✅ Add CSS to `main.scss`

**Session 3: Testing & Polish**
9. ✅ Test complete user flow
10. ✅ Fix edge cases (no buildings, empty slots)
11. ✅ Test responsiveness
12. ✅ Performance check

---

## Phase 5: Files Summary

### Files to CREATE
- `src/components/BuildingSlotItem.tsx` (~60 lines)
- `src/components/BuildingSidebar.tsx` (~80 lines)
- `src/components/TradingMainContent.tsx` (~70 lines)

### Files to UPDATE
- `src/pages/TownPage.tsx` (~30 line changes)
- `src/components/building-states/BuildingIdleView.tsx` (~100 line changes)
- `src/components/building-states/BuildingActiveView.tsx` (~50 line changes)
- `src/components/building-states/BuildingCompletedView.tsx` (~10 line changes - minor layout)
- `src/components/building-states/BuildingLiquidatedView.tsx` (~10 line changes - minor layout)
- `src/main.scss` (~200 new lines)

### Files to DEPRECATE (don't delete yet, for reference)
- `src/components/BuildingList.tsx`
- `src/components/BuildingCard.tsx`

---

## Phase 6: Edge Cases to Handle

### No Buildings Purchased
```tsx
if (buildings.length === 0) {
  return (
    <div className="empty-state">
      <h2>No Buildings Yet</h2>
      <p>Purchase your first building to start trading</p>
      <button onClick={() => /* scroll to building shop */}>
        Buy Building
      </button>
    </div>
  );
}
```

### Building Purchase in Progress
- Sidebar should update reactively when new building is added
- Auto-select newly purchased building

### Trade Resolution
- When trade completes, sidebar status indicator updates
- Main content switches to claim view automatically
- No need to refresh manually

### Multiple Active Trades
- Sidebar shows status for each building independently
- User can switch between active trades to monitor

---

## Phase 7: Scalability Considerations

### 4+ Buildings
- Sidebar becomes scrollable (`overflow-y: auto`)
- Consider adding slot numbers as badges
- Maximum tested: 10 buildings (should work fine)

### Future Enhancements
- Add search/filter for buildings (if >10)
- Add sorting (by status, slot number)
- Add "favorite" buildings
- Add building naming/customization

---

## Phase 8: Success Criteria

**Must Have:**
- ✅ All 3 risk modes visible as cards
- ✅ Building sidebar shows all slots (including empty)
- ✅ Chart displays full-width when trading
- ✅ Status indicators work for all states
- ✅ Clicking slot selects building
- ✅ Claim flow works from main content area

**Nice to Have:**
- ✅ Smooth animations on state changes
- ✅ Hover effects on mode cards
- ✅ Responsive layout (works on smaller screens)

---

## Phase 9: Testing Checklist

### Functional Tests
- [ ] Can purchase building and see it in sidebar
- [ ] Can select building from sidebar
- [ ] Can start trade in all 3 modes
- [ ] Chart displays with correct prices
- [ ] Trade resolves to completed/liquidated
- [ ] Can claim rewards from main area
- [ ] Building returns to idle after claim
- [ ] Can start another trade

### Visual Tests
- [ ] Status indicators show correct colors
- [ ] Selected building is highlighted
- [ ] Mode cards are clearly differentiated
- [ ] Chart is readable and responsive
- [ ] Layout doesn't break with 1, 2, or 3 buildings

### Edge Case Tests
- [ ] Works with 0 buildings
- [ ] Works with 1 building
- [ ] Works with 3 buildings (max)
- [ ] Works when all trades are active
- [ ] Works when all buildings need claim

---

## Estimated Impact

**Code Metrics:**
- New Lines: ~410 lines
- Modified Lines: ~200 lines
- Deleted Lines: 0 (deprecated files kept for reference)
- Net Change: +610 lines

**Performance:**
- Chart only renders when selected (lazy loading)
- Sidebar items are lightweight (no nested components)
- No additional API calls required

**User Experience:**
- 🟢 Easier to see all buildings at a glance
- 🟢 Clearer risk mode selection
- 🟢 Larger, more usable trading chart
- 🟢 Scales well for future building additions

---

## Implementation Checklist

### Session 1
- [ ] Create BuildingSlotItem component
- [ ] Create BuildingSidebar component
- [ ] Create TradingMainContent component

### Session 2
- [ ] Update TownPage layout
- [ ] Update BuildingIdleView (3 cards)
- [ ] Update BuildingActiveView (chart integration)
- [ ] Add CSS styles

### Session 3
- [ ] Test complete flow
- [ ] Fix bugs
- [ ] Polish animations
- [ ] Update documentation

---

## Notes

- Keep old BuildingList and BuildingCard components for reference during migration
- Test with real Binance price data once implemented
- Consider adding keyboard navigation (arrow keys to switch buildings)
- May want to add building slot names/labels in future
- Chart data will be replaced with real price history in next phase

---

**Status:** Ready to implement
**Next Step:** Create BuildingSlotItem.tsx
