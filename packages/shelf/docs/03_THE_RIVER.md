# The River (Economy)

## Purpose
Single source of truth for all currency. No loop creates/destroys currency without River knowing.

## Currency Types

### Energy
- Initial balance: 30 (demo)
- Non-renewable in demo
- Used to start trades

### Token
- Earned from successful trades
- Spent on Item purchases
- Main progression currency

### USDC (mock)
- Earned from dungeon rewards
- No sinks in demo (pure extraction)
- Represents real value in future

## Sources (Inflow)

| Currency | Source | Condition |
|----------|--------|-----------|
| Energy   | Initial grant | New user |
| Token    | Trade completion | Building survives |
| USDC     | Dungeon reward | DungeonRun claimed |

## Sinks (Outflow)

| Currency | Sink | Condition |
|----------|------|-----------|
| Energy   | Trade start | Any building |
| Energy   | Liquidation | Trade fails |
| Token    | Item purchase | Character upgrade |

## Balance Rules
- Cannot start trade if Energy < cost
- Cannot buy Item if Token < price
- No negative balances
- USDC has no spend in demo (future: marketplace)

## River Interface (concept)
- `getBalance(userId, currency)` → should return current balance
- `addCurrency(userId, currency, amount, source)` → should record inflow
- `deductCurrency(userId, currency, amount, sink)` → should record outflow
- `canAfford(userId, currency, amount)` → should validate before action

## Notes
- River should log all transactions for debugging
- All currency changes should be atomic
- Consider transaction history for future analytics