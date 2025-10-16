# Character & Dungeon Loop - UI & Missing Features Task

## Objective
Complete the Character and Dungeon loops by:
1. Adding missing backend features (token deduction, item deletion)
2. Building complete UI for both Character and Dungeon screens
3. Ensuring end-to-end flow works (tokens → items → DR → dungeons → rewards)

---

## Phase 1: Backend Missing Features

### 1.1 Add Token Deduction for Item Purchase
**File:** `packages/server/src/services/item/ItemService.ts`

**Modify:** `createItem()` method
- Add token cost parameter (e.g., 100 tokens from demo spec)
- Check user token balance via `UserRepo`
- Deduct tokens before creating item
- Throw error if insufficient tokens

**Example:**
```typescript
async createItem(characterId: CharacterId, userId: UserId) {
  const ITEM_COST = 100; // tokens
  
  // Check balance
  const user = await this.userRepo.findById(userId);
  if (user.tokens < ITEM_COST) {
    throw new Error("Insufficient tokens");
  }
  
  // Deduct tokens
  await this.userRepo.addCurrency(userId, "tokens", -ITEM_COST);
  
  // Create item (existing logic)
  ...
}
```

**File:** `packages/server/src/routes/item.routes.ts`

**Modify:** `POST /api/items` endpoint
- Add `userId` to request body validation
- Pass `userId` to `createItem()`

---

### 1.2 Add Item Deletion Endpoint
**File:** `packages/server/src/services/item/ItemService.ts`

**Add method:**
```typescript
async deleteItem(itemId: ItemId) {
  const item = await this.itemRepo.findById(itemId);
  if (!item) throw new Error("Item not found");
  
  // If equipped, update character DR first
  if (item.is_equipped) {
    await this.characterService.updateDamageRating(
      item.character_id, 
      item.damage_contribution, 
      false
    );
  }
  
  return await this.itemRepo.delete(itemId);
}
```

**File:** `packages/server/src/repos/ItemRepo.ts`

**Add method:**
```typescript
async delete(itemId: ItemId) {
  const { data, error } = await supabaseClient
    .from("items")
    .delete()
    .eq("id", itemId)
    .select()
    .single();
    
  if (error) throw error;
  return data;
}
```

**File:** `packages/server/src/routes/item.routes.ts`

**Add endpoint:**
```typescript
DELETE /api/items/:itemId
// Body: { userId } for validation
// Calls: itemService.deleteItem(itemId)
```

---

### 1.3 Fix Character-Dungeon Integration
**File:** `packages/server/src/services/character/CharacterService.ts`

**Modify:** `createCharacter()` method
- After creating character, call `dungeonService.createDungeonRunIfNeeded(characterId)`
- Import `DungeonService`

**File:** `packages/server/src/routes/character.routes.ts`

**Modify:** `POST /api/characters/generate` endpoint
- Ensure it returns both character AND first dungeon run created

---

## Phase 2: Frontend - Character Screen

### 2.1 Character Display Component
**File:** `packages/web/src/components/CharacterScreen.tsx` (NEW)

**Features:**
- Display character sprite/avatar (placeholder for now)
- Display damage rating prominently
- Display equipped items in 6 slots (visual grid)
- Display token balance

**API Calls:**
- `GET /api/characters/:characterId`
- `GET /api/items/character/:characterId/summary`

---

### 2.2 Inventory Component
**File:** `packages/web/src/components/Inventory.tsx` (NEW)

**Features:**
- Display all unequipped items in scrollable list/grid
- Show item type, damage contribution for each
- "Equip" button for each item → opens slot selector modal
- "Destroy" button for each item → confirmation dialog

**API Calls:**
- `GET /api/items/character/:characterId`
- `POST /api/items/equip` (when equipping)
- `DELETE /api/items/:itemId` (when destroying)

---

### 2.3 Equipment Slots Component
**File:** `packages/web/src/components/EquipmentSlots.tsx` (NEW)

**Features:**
- 6 slots in grid/list (slots 1-6)
- Show equipped item in each slot (type, damage)
- "Unequip" button on equipped items
- Empty slots show as available

**API Calls:**
- `POST /api/items/unequip` (when clicking unequip)

---

### 2.4 Buy Item Button
**File:** `packages/web/src/components/BuyItemButton.tsx` (NEW)

**Features:**
- Big prominent button: "Buy Item Pack (100 tokens)"
- Disable if insufficient tokens
- On click: 
  - Call API
  - Show simple animation/feedback (e.g., "Item received!")
  - Refresh inventory

**API Calls:**
- `POST /api/items` with `{ characterId, userId }`

---

### 2.5 Character Screen Layout
**File:** `packages/web/src/pages/CharacterPage.tsx` (NEW)

**Layout:**
```
┌─────────────────────────────────┐
│  Character Stats                │
│  DR: 250                        │
│  Tokens: 500                    │
├─────────────┬───────────────────┤
│ Equipment   │  Inventory        │
│ Slots (6)   │  (scrollable)     │
│             │                   │
│ [Slot 1]    │  [Item] [Equip]   │
│ [Slot 2]    │  [Item] [Destroy] │
│ ...         │  ...              │
└─────────────┴───────────────────┘
│  [Buy Item Pack - 100 tokens]   │
└─────────────────────────────────┘
```

---

## Phase 3: Frontend - Dungeon Screen

### 3.1 Dungeon Status Component
**File:** `packages/web/src/components/DungeonStatus.tsx` (NEW)

**Features:**
- Display current active dungeon (if any)
- Show timer countdown (based on `started_at` + `duration_seconds`)
- Show damage dealt per second estimate (DR / duration)
- Show "Dungeon in progress..." status

**API Calls:**
- `GET /api/dungeon/character/:characterId/runs`
- Filter for runs where `finished_at` is null

---

### 3.2 Unclaimed Rewards Component
**File:** `packages/web/src/components/UnclaimedRewards.tsx` (NEW)

**Features:**
- List all finished, unclaimed dungeon runs
- Show reward amount for each
- Show when dungeon finished
- "Claim" button per run OR "Claim All" button

**API Calls:**
- `GET /api/dungeon/character/:characterId/unclaimed`
- `POST /api/dungeon/claim` or `POST /api/dungeon/claim-all`

---

### 3.3 Dungeon History Component
**File:** `packages/web/src/components/DungeonHistory.tsx` (NEW)

**Features:**
- Show past completed dungeons (last 10)
- Show rewards claimed
- Show DR at time of dungeon

**API Calls:**
- `GET /api/dungeon/character/:characterId/runs`

---

### 3.4 Dungeon Screen Layout
**File:** `packages/web/src/pages/DungeonPage.tsx` (NEW)

**Layout:**
```
┌────────────────────────────────┐
│  Current Dungeon               │
│  Timer: 1:23 remaining         │
│  Damage: ~25/sec               │
├────────────────────────────────┤
│  Unclaimed Rewards             │
│  Run #1: 250 tokens [Claim]    │
│  Run #2: 300 tokens [Claim]    │
│  [Claim All - 550 tokens]      │
├────────────────────────────────┤
│  History (last 10 runs)        │
│  ...                           │
└────────────────────────────────┘
```

---

## Phase 4: Integration & Navigation

### 4.1 Add Routes
**File:** `packages/web/src/App.tsx` (or router config)

**Add:**
- `/character` → CharacterPage
- `/dungeon` → DungeonPage

---

### 4.2 Navigation Menu
**File:** `packages/web/src/components/Navigation.tsx`

**Modify to include:**
- Link to Character screen
- Link to Dungeon screen
- Display token balance in header

---

### 4.3 Realtime Updates (Optional but Nice)
**File:** `packages/web/src/hooks/useRealtimeDungeon.ts` (NEW)

**Feature:**
- Subscribe to dungeon_runs table changes
- Auto-refresh when dungeon finishes
- Show notification when rewards available

---

## Phase 5: Testing

### 5.1 E2E Test Script
**File:** `packages/server/test/e2e-char-dungeon.ts` (NEW)

**Test flow:**
1. Create character
2. Buy item (verify token deduction)
3. Equip item (verify DR increase)
4. Wait for dungeon to finish
5. Claim rewards (verify token addition)
6. Buy another item with earned tokens
7. Delete an item

---

## File Checklist

### Backend (Modify):
- [ ] `packages/server/src/services/item/ItemService.ts` - add token deduction, delete method
- [ ] `packages/server/src/repos/ItemRepo.ts` - add delete method
- [ ] `packages/server/src/routes/item.routes.ts` - modify POST endpoint, add DELETE endpoint
- [ ] `packages/server/src/services/character/CharacterService.ts` - add dungeon auto-start

### Frontend (Create New):
- [ ] `packages/web/src/pages/CharacterPage.tsx`
- [ ] `packages/web/src/components/CharacterScreen.tsx`
- [ ] `packages/web/src/components/Inventory.tsx`
- [ ] `packages/web/src/components/EquipmentSlots.tsx`
- [ ] `packages/web/src/components/BuyItemButton.tsx`
- [ ] `packages/web/src/pages/DungeonPage.tsx`
- [ ] `packages/web/src/components/DungeonStatus.tsx`
- [ ] `packages/web/src/components/UnclaimedRewards.tsx`
- [ ] `packages/web/src/components/DungeonHistory.tsx`

### Frontend (Modify):
- [ ] `packages/web/src/App.tsx` - add routes
- [ ] `packages/web/src/components/Navigation.tsx` - add links

---

## Success Criteria

- [ ] User can buy items with tokens (balance decreases)
- [ ] User can equip/unequip items (DR updates)
- [ ] User can delete items from inventory
- [ ] User can see active dungeon timer
- [ ] User can claim dungeon rewards (tokens increase)
- [ ] Dungeons auto-restart after claiming
- [ ] Full loop: tokens → items → DR → dungeon → tokens works end-to-end
- [ ] UI is responsive and updates in real-time