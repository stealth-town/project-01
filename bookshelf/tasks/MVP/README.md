# MVP Town-Investment Loop - Task Documentation

## Quick Start

Read the task documents in order:

1. **00_OVERVIEW.md** - Implementation strategy and architecture decisions
2. **01_PHASE_1_FOUNDATION.md** - Database migrations and type system
3. **02_PHASE_2_SERVER.md** - Repositories, services, and API endpoints
4. **03_PHASE_3_WORKER.md** - Trade engine with realtime subscriptions
5. **04_PHASE_4_FRONTEND.md** - React UI components

## Implementation Flow

```
Phase 1: Foundation (1-2 hours)
├── Create database migrations
├── Generate types
└── Define domain interfaces

Phase 2: Server Core (3-4 hours)
├── Build repositories (data layer)
├── Build Town service (business logic)
├── Create API routes
└── Test with manual API calls

Phase 3: Worker Integration (2-3 hours)
├── Connect worker to database
├── Implement trade resolution
├── Setup realtime subscriptions
└── Test trade lifecycle

Phase 4: Frontend (3-4 hours)
├── Build UI components
├── Setup realtime hooks
├── Connect to API
└── Test full loop end-to-end
```

## Key Decisions Summary

### Architecture
- **No River service for MVP** - Currency logic embedded in Town service
- **Repos in server package** - Not shared (workers can have their own)
- **Realtime subscriptions** - Supabase realtime for instant updates
- **Building ownership** - Users buy buildings, max 3 slots unlocked by town level

### Economy
- Starting balances: 30 Energy, 0 Tokens, 100 USDC
- Energy packages: 1/$1, 11/$10, 60/$50
- Building cost: $100 USDC
- Risk modes: Turtle (5min, 5 energy, 50 tokens), Walk (3min, 10 energy, 120 tokens), Cheetah (2min, 20 energy, 250 tokens)

### Trade Resolution
- Long-only trades (liquidation if price drops below threshold)
- Completion if timer expires without liquidation
- Worker resolves trades via realtime + polling
- Tokens rewarded on completion, energy already deducted on start

## Testing Strategy

### Phase 1
- Run migrations successfully
- Verify type generation
- Shared package builds

### Phase 2
- Test each API endpoint with curl/Postman
- Verify currency deductions/additions
- Test error cases (insufficient balance, invalid slots)

### Phase 3
- Start worker and verify realtime connection
- Create trade via API, verify worker picks it up
- Verify trade resolution (both success and liquidation)

### Phase 4
- Test auth flow (register/login)
- Test energy purchase
- Test building purchase
- Test trade start
- Test trade claim
- Verify realtime updates in UI

## Success Criteria

- [ ] User can register/login with ID workaround
- [ ] User can see balances (energy, tokens, USDC)
- [ ] User can buy energy in 3 packages
- [ ] User can buy buildings (respecting town level and max slots)
- [ ] User can start trades with 3 risk modes
- [ ] Worker automatically resolves trades
- [ ] User can claim rewards after trade completion
- [ ] All updates happen in real-time
- [ ] Full loop works: USDC → Energy → Trade → Tokens

## Estimated Time

- **Phase 1:** 1-2 hours
- **Phase 2:** 3-4 hours
- **Phase 3:** 2-3 hours
- **Phase 4:** 3-4 hours
- **Total:** 9-13 hours

## Next Steps After MVP

Once the town loop is working:
1. Character loop (buy items, equip, increase DR)
2. Dungeon loop (DR → USDC rewards)
3. Connect loops together
4. Polish UI/UX
5. Add error handling and edge cases
6. Performance optimization
