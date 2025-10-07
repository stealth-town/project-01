# Intro

_note - the names WILL change_


I see several core loops in here, each of which should be isolated from the others

The 3 loops are:
- `town` - investment loop
- `character` - upgrade loop
- `dungeon` - idle combat loop 

What i feel is that the core mechanics might change so my approach that i will be taking is several core concepts / entities all tied together by a very light layer (loosely tied together) - i shall call that layer `The Bridge`

`The Bridge` - will represent the user's account and the assets he disposes with 
- $TOKEN
- $USDC
- Energy


`The bridge` will funnel the assets to the places where they are needed (i.e. any of the 3 loops). In that process we also need a source / influx of those funds, but also the outflux - which we shall call `The River`

`The River` has an inflow and the outflow, and is a component / concept that will be responsible for the flow of money / money-like stuff in our system. It will have connection to the blockchain of our choice later on and it will be responsible for money handling.

Each loop will work on its own and will be interacting with the `river` and the `bridge` - but there will be no interactions between themselves.


### Important notes, ideas etc.

- Leave a way for admins of the game to fully controll everything (admins can drop custom legendary weapons, drop system for example) - a simple workaround at the beginning can turn into nice asset later on

- Have the player characters be listed on a WoW Armory like website (showoff to friends), make them brand ambasadors

- Have players be able to join guilds, no chat needed but one guild can myb attack other one (this is getting out of hand already xD)
