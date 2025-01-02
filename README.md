# Inscryption Online
A remake of (parts of) Daniel Mullens' game *[Inscryption](https://store.steampowered.com/app/1092790/Inscryption/)* for a player-vs-player setting. Players build up decks of cards to face off using increasingly ridiculous strategies and combos.

## Playing 
A hosted version of the game can currently be found at [https://ink-seven.vercel.app/](https://ink-seven.vercel.app/) (url subject to change). This should have full functionality. If you want to instead run the code locally for development purposes, follow the following steps:

- Clone the repo with `git clone https://github.com/MaximilianMeiler/ink`
- In /client and /server, run `npm install` and `npm start` to run the frontend and the server respectively.
- NOTE: Be sure to change the API url in */client/src/App.js* to "http://localhost:4000", and the CORS url in *server/index.js* to "http://localhost:3000"

## Roadmap

The following changes are planned
- Addition of a somewhat usable website UI
- Fixes to game data "security" (there's a reason for no online multiplayer)
- An animation system.

Specific steps can be found in the repo's [TODO file](https://github.com/MaximilianMeiler/ink/blob/main/TODO.md).

## Contributing

If you encounter a bug or want to discuss a mechanic you think should be changed, feel free to [open an issue](https://github.com/MaximilianMeiler/ink/issues).

If you want to add or adjust a feature yourself, fork the repo and then issue a [pull request](https://github.com/MaximilianMeiler/ink/pulls) with the updated code. I appreciate all PRs - just make sure you include details on what your code changes.

## Attribution

Card art taken from the Inscryption game files - all credit goes to Daniel Mullins.