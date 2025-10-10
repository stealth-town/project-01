# **Tokabu Town Demo Scope Specification**

---

## **0\) Overview**

* **Goal:** Deliver a functional Web2 demo proving the core loop works end-to-end (energy → trades → tokens → caracter upgrades → dungeon rewards).

* **Focus:** Simplicity, clarity, and fun feedback. No blockchain, no marketplace, no art polish.

---

## **1\) Core Gameplay Loop**

1. **Earn/Buy Energy** → player uses starting balance.

2. **Start Build** → pick risk mode (Turtle / Walk / Cheetah).

3. **Trade Simulation:** price feed drives either *liquidation* or *survival* outcome.

4. **Trade completes** → emits tokens.

5. **Spend tokens** → buy random item, which increases Damage Rating.

6. **Dungeon screen** → Damage Rating converts to usdc rewards when dungeon finishes.

---

## **2\) Systems to Implement**

### **2.1 Town (Investment Loop)**

* **Mechanic:** Liquidation-completion mode .

* **Features:**

  * Start build (3 risk profiles).

  * Building cards show timer \+ ✔/✖ result (they dont show the chart yet).

  * Click to collect tokens on completion.

  * Energy counter & token counter on UI.

* **Simplifications:**

  * No art or themed buildings.

  * Fixed building 3 slots max.

  * No town level system.

  * No NFT purchases.

### **2.2 Character (Upgrade Loop)**

* **Mechanic:** Buy random item through a gatcha and equip it to increase Damage Rating.

* **Features:**

  * One stat: **Damage Rating (DR)**.

  * Inventory shows owned items (no rarity system yet).

  * “Buy Item (100 tokens)” →get a random item

  * Equip into 1 of 6 available slots to get \+DR.

* **Simplifications:**

  * No gacha animation.

  * No crafting, reroll, or filters.

  * No character leveling.

### **2.3 Dungeon (Idle Combat Loop)**

* **Mechanic:** Translate DR into reward tokens.

* **Features:**

  * Timer (short for demo, e.g., 2–5 minutes).

  * Display: damage dealt, tokens earned.

  * “Claim Rewards” button.

* **Simplifications:**

  * Reward \= mock USDC.

  * No shared/global boss; single-player simulation.

  * No animations or visuals.

---

## **3\) Economy Model (Demo)**

* **Currencies:**

  * **Energy** \= off-chain credit (starter balance: 30).

  * **Token** \= reward currency.

* **Sinks:** energy lost on liquidation; tokens spent on item purchases.

* **Sources:** building trade completions(tokens); dungeon rewards(usdc).

* **Reward pacing:**

  * Turtle: low risk, slow completion.

  * Walk: medium risk, moderate speed.

  * Cheetah: high risk, fast completion.

---

## **4\) Price System**

* **Feed:** Pull HL price stream (mocked or real) for ETH.

* **Liquidation logic:**

  * Long-only.

  * If price ≤ liq threshold → liquidation.

  * If timer ends → survive.

* **Simplified latency policy:**

  * Pause if feed stops.

  * Reject entry if no new tick within 2s.

---

## **5\) UX Scope**

* **Screens:**

  1. Town Home → buy building, start trade, collect tokens.

  2. Character → buy item, equip items, show DR.

  3. Dungeon → automatically enter, fight/claim.

* **UI elements:** energy & token counters, progress timers, claim button.

* **No:** animations, sound, cosmetic polish, on-chain wallet.

---

## **6\) Technical Scope**

* **Stack:** React frontend → simple API → mock price feed → Postgres DB.
* **Workers:** settle trades; update dungeon damage.

* **Auth:** simple guest IDs.

---

## **7\) Out of Scope (For Later)**

* Take-profit mechanic? (TP mode).

* Character levels, crit/survivability stats.

* Crafting / reroll system.

* Town level & building ownership.

* Real USDC, NFTs, or marketplace.

* On-chain deployment.

---

## **8\) Demo Success Criteria**

* Player can complete 3 full loops in \<10 min.

* Metrics: //70%+ survival rate for Turtle; visible difference in risk outcomes.

* Tokens → item → DR → reward all work.

* Demo feels self-contained and understandable without blockchain context.

---

---

# Tech page

[Excalidraw](https://excalidraw.com/#room=85266a71a67065434fba,t2eoR2LIR6-Bv64-EjhLPg)

### Tech stack

Best way to move forward is to go with full flexibility.

JS and the JS ecosystem is the best choice \-   
\- hard typing, good enough dev ux  
\- cheapest cost of labor, biggest pool of devs  
\- allows for quick validation  
\- huge ecosystem & support

Deployments should be managed by ourselves for maximum control, start small then scale 

Docker & Compose \- on a rented VPS  
Supabase as the DB solution of choice \- either cloud or hosted no matter  
React & Node as for FE & BE \+ TS

### System of values 

- Maximum flexibility over anything else  
- Easily replace the piece of code we make later on  
- Solutions are open ended and upgradable  
- Easily contain the solutions we create (controlling the pollution, theres gonna be lots of it)

### Approach towards the codebase

Start with the all-around approach with minimal implementations, start with something that can grow.

Example \- we can participate in both loops with minimal implementations

From the technical perspective i see two major areas:  
\- the “dungeon/game” area \- character, upgrades and the dungeon itself  
\- the “kickstart” area \- the incentive to get dragged into the game, faucet type of thing 

