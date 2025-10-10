# MVP Town-Investment Loop - Implementation Overview

## Goal
Build the Town-Investment loop end-to-end: User registration → Energy purchase → Building purchase → Trade execution → Reward claiming

## Success Criteria
- User can register/login with ID workaround
- User can buy energy (1/$1, 11/$10, 60/$50 USDC)
- User can buy buildings ($100 USDC, max 3 slots)
- Town levels (1-3) unlock building slots (slot 1 auto-unlocked)
- User can start trades with 3 risk modes (Turtle/Walk/Cheetah)
- Trade engine resolves trades via realtime subscriptions
- User can claim rewards (tokens) or losses (energy deducted)
- Frontend displays all of this in real-time

## Architecture Decisions

### Currency Management
- **No River service for MVP** - embed currency logic in Town service
- All currency changes tracked in Town service for now
- Can extract to River later without breaking anything

### Repository Location
- Server repos: `packages/server/src/repos/`
- Workers can create their own repos if needed
- Shared package stays lightweight (types + Supabase client only)

### Realtime Strategy
- Supabase realtime subscriptions for trade updates
- Frontend subscribes to user's active trades
- Worker subscribes to all active trades for resolution

### Building & Town System
- Users start with 0 buildings, must buy them
- First building slot auto-unlocked (town level 1)
- Town levels 2-3 unlock additional slots (max 3 total)
- Buildings cost 100 USDC each

## Implementation Phases

### Phase 1: Foundation (Database & Types)
- Database migrations for all entities
- Type generation and shared types
- Domain interfaces and enums

### Phase 2: Server Core (API & Business Logic)
- User registration/auth workaround
- Town service (currency + business logic)
- Repositories for data access
- API routes for all actions

### Phase 3: Worker Integration (Trade Resolution)
- Connect trade-engine to database
- Implement resolution logic (liquidation vs completion)
- Update balances on trade outcomes

### Phase 4: Frontend (React UI)
- Town screen layout
- Energy/building shop
- Building slots with risk mode selection
- Trade status display
- Real-time updates

## Task Documents
- `01_PHASE_1_FOUNDATION.md` - Database schema and types
- `02_PHASE_2_SERVER.md` - Server implementation
- `03_PHASE_3_WORKER.md` - Trade engine integration
- `04_PHASE_4_FRONTEND.md` - React components

## Next Steps
Start with Phase 1 - database migrations and types.
