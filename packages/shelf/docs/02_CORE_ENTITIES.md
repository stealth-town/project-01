# Core Entities

## User (Bridge)
- ID (primary identifier)
- Owns one Character
- Has currency balances (via River)
- Can own multiple Buildings

## Character
- Belongs to one User
- Has Damage Rating (DR)
- Has Inventory (collection of Items)
- Has Equipment slots (6 slots for demo)

## Building
- Represents an active trade position
- Has risk mode (Turtle/Walk/Cheetah)
- Has state (building, active, completed, liquidated)
- Has timer
- Linked to a price feed

## Item
- Has type (weapon, armor, accessory, etc.)
- Has DR contribution (+5, +10, etc.)
- Can be equipped or in inventory
- Generated randomly on purchase

## Trade (or BuildingSession)
- Represents one trade lifecycle
- Tracks entry price, liquidation threshold
- Monitors price feed
- Resolves to completion or liquidation
- Emits Tokens on success

## DungeonRun
- Represents one dungeon session
- Has duration
- Has starting DR (from Character)
- Accumulates rewards over time
- Can be claimed when complete

## Currency (managed by River)
- Energy (starting resource)
- Token (earned from trades)
- USDC (earned from dungeons, mock for demo)

## Notes
- All entities should have timestamps (created_at, updated_at)
- All entities should be easily serializable (future API needs)
- Relationships should be clear and one-directional where possible