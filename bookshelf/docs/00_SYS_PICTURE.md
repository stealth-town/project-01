# System Picture

```
                    ┌─────────────┐
                    │  THE BRIDGE │
                    │   (User)    │
                    └──────┬──────┘
                           │
          ┌────────────────┼────────────────┐
          │                │                │
          ▼                ▼                ▼
    ┌─────────┐      ┌──────────┐    ┌──────────┐
    │  TOWN   │      │CHARACTER │    │ DUNGEON  │
    │ (Trade) │      │(Upgrade) │    │ (Combat) │
    └────┬────┘      └────┬─────┘    └────┬─────┘
         │                │               │
         └────────────────┼───────────────┘
                          │
                    ┌─────▼─────┐
                    │ THE RIVER │
                    │ (Economy) │
                    └───────────┘
                    ↑           ↓
                 inflow      outflow
```

## Flow
- User initiates actions in any loop
- Loops consume/produce via River
- River tracks all currency movement
- Loops don't talk directly to each other

## Key principle
Everything flows through Bridge → Loop → River