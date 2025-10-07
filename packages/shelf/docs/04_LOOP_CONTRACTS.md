# Loop Contracts

## Town Loop (Investment/Trade)

### What it needs
- User ID
- Energy balance (from River)
- Price feed access
- Risk mode selection (Turtle/Walk/Cheetah)

### What it produces
- Building state changes
- Token emissions (on success)
- Energy deductions (on start and liquidation)

### Key actions
- `startTrade(userId, riskMode)` → should create Building, deduct Energy
- `checkTrades(userId)` → should monitor active Buildings, resolve outcomes
- `claimTokens(userId, buildingId)` → should transfer Tokens to River

### Notes
- Should NOT directly modify Character or Dungeon
- Should only talk to River for currency
- Price feed is external dependency (mock for demo)

---

## Character Loop (Upgrade)

### What it needs
- User ID
- Token balance (from River)
- Character data
- Item generation logic

### What it produces
- New Items in inventory
- Equipment changes
- Damage Rating updates
- Token deductions

### Key actions
- `buyItem(userId)` → should generate random Item, deduct Tokens
- `equipItem(userId, itemId, slot)` → should update equipment, recalculate DR
- `unequipItem(userId, slot)` → should move Item to inventory, recalculate DR
- `getDamageRating(userId)` → should sum equipped Items

### Notes
- Should NOT start trades or dungeons
- DR calculation should be simple and cacheable
- Item generation can be enhanced later (rarity, crafting, etc.)

---

## Dungeon Loop (Combat/Rewards)

### What it needs
- User ID
- Character DR (from Character Loop)
- Timer/duration config

### What it produces
- DungeonRun state
- USDC emissions (on claim)
- Dungeon completion status

### Key actions
- `startDungeon(userId)` → should create DungeonRun, lock Character (optional)
- `checkDungeon(userId)` → should calculate accumulated rewards
- `claimRewards(userId)` → should transfer USDC to River, mark as claimed

### Notes
- Should NOT modify Character stats permanently
- Reward calculation: `DR × time × multiplier = USDC`
- For demo: single-player, no shared boss

---

## Inter-Loop Communication

**Principle:** Loops should be loosely coupled.

- Town → River (currency)
- Character → River (currency)
- Dungeon → Character (read DR)
- Dungeon → River (currency)

**Anti-pattern:** Town directly modifying Character, or Character starting Dungeons.

**Pattern:** All actions initiated by User/Bridge, loops respond independently.