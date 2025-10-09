# System Overview

## The Bridge (User)
The central entity. Owns everything, initiates everything.
- Has a Character
- Owns Buildings (trade positions)
- Sends Character to Dungeons
- All state changes flow through the Bridge

## The River (Economy)
Manages all currency flows. Acts as the single source of truth for balances.
- Tracks: Energy, Tokens, USDC (mock for demo)
- Knows all sources (where currency comes from)
- Knows all sinks (where currency goes)
- No loop can create/destroy currency without River knowing

## The Three Loops

### Town (Investment/Trade)
- User spends Energy to start trades
- Price feed determines outcome (liquidation vs completion)
- Successful trades emit Tokens
- Failed trades lose Energy

### Character (Upgrade)
- User spends Tokens to buy Items
- Items increase Damage Rating
- Character gets stronger over time
- Pure sink for Tokens

### Dungeon (Combat/Rewards)
- User sends Character (with DR) to fight
- Time passes, rewards accumulate
- User claims USDC based on DR
- Pure source for USDC

## Connections
- All loops read from/write to River
- Bridge orchestrates which loop to engage
- Loops are independent but share economy via River

## Future-proofing
Each loop should be replaceable/upgradable without touching others.
River interface stays stable even as loops evolve.