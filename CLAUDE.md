# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a game project with three core gameplay loops (Town/Investment, Character/Upgrade, Dungeon/Combat) connected through a central "Bridge" (user account) and "River" (economy system). The architecture is designed to keep loops isolated and loosely coupled for future flexibility.

**Core Concepts:**
- **The Bridge (User)**: Central entity that owns everything and initiates all actions
- **The River (Economy)**: Single source of truth for all currency (Energy, Tokens, USDC)
- **Three Loops**:
  - Town Loop: Investment/trade system (spend Energy → earn Tokens)
  - Character Loop: Upgrade system (spend Tokens → increase Damage Rating)
  - Dungeon Loop: Combat/rewards (use DR → earn USDC)

**Architecture Principles:**
- Loops are independent and only communicate through the River and Bridge
- No direct inter-loop dependencies (anti-pattern: Town modifying Character directly)
- All currency changes must flow through River for consistency
- Each loop should be replaceable without touching others

## MVP/Demo Scope (IMPORTANT)

**Current Phase:** Building a functional Web2 demo to prove the core loop works end-to-end.

**Demo Success Criteria:**
- Player completes 3 full loops in <10 minutes
- Energy → trades → tokens → character upgrades → dungeon rewards all functional
- Demo feels self-contained and understandable without blockchain context
- 70%+ survival rate for Turtle risk mode; visible difference in risk outcomes

**MVP Feature Set (What to Build):**

### Town Loop (Investment)
- Start build with 3 risk profiles: Turtle (low risk, slow), Walk (medium), Cheetah (high risk, fast)
- Building cards show timer + ✔/✖ result (no charts yet)
- Click to collect tokens on completion
- Energy & token counters on UI
- **Max 3 building slots**
- Long-only trades with ETH price feed (mocked or real)
- Liquidation if price ≤ threshold; survival if timer ends

### Character Loop (Upgrade)
- Single stat: **Damage Rating (DR)**
- "Buy Item (100 tokens)" → get random item via gacha
- Equip items into **6 available slots** to increase DR
- Inventory shows owned items
- No rarity system, no gacha animation, no crafting/reroll

### Dungeon Loop (Idle Combat)
- Short timer (2-5 minutes for demo)
- Display: damage dealt, tokens earned
- "Claim Rewards" button
- Reward = mock USDC (single-player, no shared boss)
- No animations or visuals

### Economy (Demo)
- **Energy**: Starting balance 30, lost on liquidation, spent on trades
- **Token**: Earned from successful trades, spent on items
- **USDC (mock)**: Earned from dungeon rewards
- Pause trades if price feed stops; reject entry if no tick within 2s

**UX Scope:**
- 3 screens: Town Home, Character, Dungeon
- Simple guest IDs for auth (no wallet)
- Energy & token counters, progress timers, claim buttons
- **NO**: animations, sound, cosmetic polish, on-chain wallet

**Explicitly Out of Scope for MVP:**
- Take-profit mechanic (TP mode)
- Character levels, crit/survivability stats
- Crafting/reroll system
- Town level & building ownership
- Real USDC, NFTs, or marketplace
- On-chain deployment
- Art polish or themed buildings

**System Values:**
- Maximum flexibility over everything else
- Easily replaceable code pieces
- Open-ended, upgradable solutions
- Contain solutions to control pollution (lots of experimentation expected)

## Repository Structure

This is a Yarn 4 monorepo with the following workspaces:

- `packages/app` - React + Vite frontend
- `packages/server` - Express REST API server
- `packages/database` - Supabase database (local dev setup)
- `packages/shared` - Shared types and Supabase client utilities
- `packages/workers/trade-engine` - Worker thread for trade monitoring/resolution
- `packages/workers/dungeon-runtime` - (In development) Dungeon worker
- `bookshelf/` - Design documentation and system architecture docs

## Development Setup

### Initial Setup (First Time)
```bash
# Run the comprehensive setup script
yarn config:dev
```

This script will:
1. Install Supabase CLI and start local database
2. Generate and copy TypeScript types from database schema
3. Install all workspace dependencies
4. Build the shared package (required dependency for others)

### Database Management
```bash
# In packages/database directory:
yarn start          # Start Supabase local instance
yarn stop           # Stop Supabase
yarn restart        # Restart Supabase
yarn status         # Check Supabase status
yarn types-gen      # Generate TypeScript types from schema
yarn types-copy     # Copy types to shared package
```

**Important:** After schema changes, always run `yarn types-gen && yarn types-copy` to update types across the codebase.

### Running Services

```bash
# Frontend (Vite dev server)
cd packages/app
yarn dev            # http://localhost:5173
yarn build          # Build for production
yarn lint           # Run ESLint

# Backend API server
cd packages/server
yarn dev            # tsx with watch mode
yarn start          # Run compiled version
yarn build          # Compile TypeScript

# Trade Engine Worker
cd packages/workers/trade-engine
yarn dev            # tsx with watch mode
yarn start          # Run compiled version
yarn build          # Compile TypeScript

# Shared Package (after changes)
cd packages/shared
yarn build          # Must rebuild after type changes
yarn config:dev     # Copy .env.dev to .env
```

## Key Technical Details

### TypeScript & Build System
- All packages use TypeScript 5.9+
- ESM modules (`"type": "module"` in package.json)
- `tsx` for development (watch mode)
- `tsc` for production builds
- App uses Vite with React plugin

### Database (Supabase)
- Local development using Supabase CLI
- Migrations in `packages/database/supabase/migrations/`
- Generated types in `packages/database/supabase/supa-ts-types/`
- Types are copied to `packages/shared/src/supabase/` for workspace-wide use
- Seed data in `packages/database/supabase/seed.sql`

### Shared Package Structure
The `@stealth-town/shared` package has multiple export paths:
- `@stealth-town/shared` - Main exports (index)
- `@stealth-town/shared/supabase` - Supabase client and types
- `@stealth-town/shared/types` - Game domain types

### Trade Engine Worker
- Uses Node.js worker threads for background processing
- Manager spawns workers and handles respawning on errors
- TradeMonitor polls database for active trades
- TradeResolverWrapper handles trade resolution logic
- Currently uses MockTradeResolver (will connect to real price feeds)

### Server Architecture
- Express 5.x with TypeScript
- CORS enabled
- Routes organized in `src/routes/`
- Services in `src/services/` (e.g., DummyService)
- Repositories in `src/repos/` for database access
- Health check endpoint: `/health`
- API routes under `/api/*`

## Important Documentation

**Read these files to understand the system** (in `bookshelf/`):
1. `intro/00-INTRO.md` - Core loop concepts and design philosophy
2. `docs/01_SYS_OVERVIEW.md` - Bridge, River, and loop interactions
3. `docs/02_CORE_ENTITIES.md` - Database entities and relationships
4. `docs/03_THE_RIVER.md` - Economy system (currency flows)
5. `docs/04_LOOP_CONTRACTS.md` - Loop interfaces and communication patterns

**The bookshelf/README suggests:** Read `unsorted/` first, then `docs/` (~4 min total)

## Common Patterns

### Adding a New Feature to a Loop
1. Determine which loop it belongs to (Town/Character/Dungeon)
2. Check if it needs new currency flows (update River documentation)
3. Add database migration if needed
4. Update shared types
5. Implement in the appropriate service
6. Ensure it only communicates through River/Bridge

### Database Schema Changes
1. Create migration in `packages/database/supabase/migrations/`
2. Run `yarn workspace database types-gen`
3. Run `yarn workspace database types-copy`
4. Rebuild shared package: `yarn workspace @stealth-town/shared build`
5. Update affected services

### Working with Types
- Database types are auto-generated, don't edit manually
- Domain types are in `packages/shared/src/types/`
- Import from `@stealth-town/shared/types` in other packages
- Supabase types from `@stealth-town/shared/supabase`

## Testing & Quality

### Linting
```bash
cd packages/app
yarn lint           # ESLint for React app
```

### Build Verification
```bash
# Build all TypeScript packages
yarn workspace @stealth-town/shared build
yarn workspace server build
yarn workspace trade-engine build
yarn workspace app build
```

## Current State & Future Plans

**What's Working:**
- Monorepo structure with Yarn workspaces
- Local Supabase database with migrations
- Express API server with basic routes
- Trade engine worker thread architecture
- React frontend with Vite
- Type generation pipeline

**In Progress:**
- Dungeon runtime worker
- Trade resolution with price feeds (currently mocked)
- Loop implementations (Town, Character, Dungeon)
- River economy system implementation

**Future Considerations** (from docs):
- Admin tools for game management
- WoW Armory-style character showcase
- Guild system
- Blockchain integration for The River
