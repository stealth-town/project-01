# Char loop & DG loop - Task

_intro - general and tech overview are just intro_
_Happy hacking_

[figma](https://www.figma.com/design/GkH7M5NAgdhibe0FaK3lYO/tokabu-town?node-id=0-1&p=f&t=fRQfTfLCsZEVXBF2-0)




## General overview

Looking at our system we see constants that -
- user & his ability to perform actions in our system 
- entity handling money and transactions 
etc.

But we also see major components that we want to isolate and develop independently:
- The town investment loop (serves as ingress of tokens)
- The character & dungeon loop (two loops combined into one)

These two are major areas we wish to work on independently.




## Technical overview 

We want to be as flexible as possible when it comes to technical implementations.
We create components that
- plug-n-play into our system, 
- that are easily replaced
- that are easy to upgrade
- the mistakes ((un)intentional) are contained and manageable

Once we validate something, we move forward, making that component bulletproof and production ready
Entities that we see and speculate will become important in our system should become `standalone runtimes` (the earlier the better, if it doesnt influence our speed of dev)

Your hands are free and untied, there are no fuckups, everything is valid
(API endpoints dont need to be idempotent, we can have race conditions, we dont give a fuck as long as we are aware of them and they dont influence other things)

```
IMPORTANT

at the end of the day just prompt AI to make a really really concise .md file of the summary of changes made, no need for a changelog or any like that, just a concise "this was added / done". Our git log is of no use for that stuff still, so we gotta resort to MDs and such. Or a tg msg idk.
```





## Features we need (and some dummy user flow)

Task consists of two main loops, `char` and `dungeon` one.

### Char loop

First focus should be `char loop`. We want to represent players character and be able to play around with him (think of the online dressing games from 2000s).
World of warcraft style - you got an inventory, you got your hero, equip him from the stuff from your inventory

We also have the system that creates a sink for our tokens, buy gear with tokens - open up a case, gacha system. 
Its located on the left of the screen and has a button to buy a gear pack with tokens - resulting in opening of the pack and showing the item. 
The item is added to the inventory.

If the inventory is full, we will add a "destroy selected item" button, we could maybe put it into a little side panel that says "destroy selected" and "equip selected"

The gacha system will be a "slot like" system but for now we can just show what item we received.

There is a table with the listing of all the items, the item drops are gonna have certain type of rarity later on, but for now we can stick with just random drops (we dont care about rarity or stats)



### Dungeon loop

The `dungeon loop` comes afterwards and is just a node worker that leaches onto the existing character, puts it into "dungeon", locks some stuff and spits out the results. 
The broader vision of the dungeon loop is that we will have a
- "spectate mode" to see whats actually going on,
- combat logs in dungeon such as "YOU CRIT FOR 50" etc. (these combat logs can say funny degen stuff)
- multiplayer dungeons
- guilds of players going together into dungeons etc.


The dungeon loop as of now just runs in 2 mins, but in future its gonna be a longer time period. 
It has to be running constantly in the background and processing the char, damage, funny text etc. 
It is like this since we will be upgrading that dungeon QUITE A LOT, its one of the main selling points.

### Features (concise) - IMPORTANT
- User can buy item pack
- item pack opens up and item is added to the inventory
- - have in mind that gacha system is really important, its gonna be like a little slot machine baked in
- inventory can be previewed
- items can be equiped on their respective slots
- items can be destroyed in case the inventory is full
- - have in mind that we will have some kind of drag n drop (wow style) for items, or right click to equip / hover for preview
- user can see his character
- user can see his character stats (damage rating etc)
- user can see his character equiped items
- Now for the dungeon part - user can see the dungeon screen
- the dungeons are automatic, they start every day at set time and last for a set time. 
- characters join dungeons automatically (the first next dungeon)
- once in a dungeon, they always rejoin automatically
- upon dungeon completion, the user gets rewards in Tokens (for now, might be changed later)
- those rewards remain unclaimed, until the user clicks on a button to claim them






# Tasks and phases

Obvious one is gonna be the api side and the workers at first 

### 1. Start with the database

```
~/packages/database
```

Analyze what we have and what we dont have in the database, feel free to play with the migrations however you want. You generate the migrations using `npx supabase migration new <migration_name>`. Make sure to name your migrations a bit different cus we will squash them at the end of the Demo cycle.

You have your hands free for the database part.

You will need to dumb yourself down when you start creating the database, no need to optimize it, no need to implement elaborate data structs, we just need something that we can extend upon without A LOT (we can have some) headache.

"Whatever is the easiest" is the motto

To generate types from the DB into a .ts file, you would run `yarn type-gen` (check out package json). These types are used in construction of the Supa client for IDE autocompletion and ts compiler check.

### 2. Proceed with Types / Enums / Ifaces etc.

```
~/packages/shared
```

In case you need types to work with, you can create them here, Take a look at the shared directory and how i made some of the types. Feel free to do with them whatever you want. Generate them with AI if you want to, we dont care that much.


### 3. Start with the Server implementation 

```
~/packages/server
```

Start with creation of the repositories, theres already some in the `server` package, you can see examples there. 

You can notice that our server mostly contains dumb CRUD logic (**mostly**). All of our elaborate business logic is located within the `workers` i was mentioning (the standalone runtimes). Similar case will be with the dungeon and char loop too.

You should write down what API endpoints would you need (again follow the pattern) and start with the creation of `service layer for them`. Try to envision it without the usage of `dungeon` or `gacha` workers.

It should be pretty straightforward, containing endpoints for:
- inventory CRUD
- item CRUD
- item management 

have in mind that items are a sepparate table and are pre-seeded and can be managed independently.

### 4. Finish off with workers 

You got couple of workers in this case. Follow the existing pattern of the trading engine worker or implement something yourself, whatever works with you the best.

We want to fully complete the character loop since its the master of this char/dungeon loop and its ingress point.

can you also build a dummy `gacha worker` system so that we can move the item pack buying and logic outside of the API later on, just initiate it and have it say hello world or something. We might turn it into an inbound-API later on idk. But lets just have it.

You will need the `dungeon` worker, a worker that will be taking the characters into dungeons, and running them in the dungeon during its duration. During the dungeons, all the characters occasionally deal damage (this will later on be calculated with the character attack speed, damage etc. - but for now we only have damage rating every couple seconds). Have in mind that we will have a lot of characters being in the dungeons all the time - **thus this is pulled out of the system as standalone** so that we can scale it better (horizontally) and upgrade it
- right now its just randomly deal dmg and figure out if its crit or not every couple seconds
- later on its gonna be more complex (like if you're playing haste feral drood for more bleed ticks or crit feral drood)









## Closing words

Dont bother with the UI for this, but please please please

IMPORTANT - make some e2e tests, like literally simple JS scripts that will post it, or pull out logs from the dungeon worker, just so that we know it works 

feel free to use as much AI as you want, we dont care as long as we can manage it

clone the latest commit of mine (hopefully everything ready on master by tomorrow but if not - my latest wip branch commit, checkout a new bracnh `wip or feat /char-dungeon-loop) and do it there

gl and happy hacking, lmk if u need anything

