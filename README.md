# Tic Tac Toe

## Project overview

A responsive 3 × 3 Tic Tac Toe game. The React frontend displays the current game, while a Node.js REST API owns and validates game state, computer moves, and the session scoreboard.

## Tech stack

- React 19
- Vite 6
- Node.js built-in HTTP server and test runner
- JavaScript ES modules

## Features

- Two Player and Play Against Computer modes
- Server-validated turns, board positions, and completed-game rules
- Computer move priority: win, block, center, corner, then any available cell
- Game state includes board, turn, mode, status, winner, winning cells, history, and scoreboard
- Move history lists the move number, player, and row/column
- Undo follows the selected mode and restores a completed game's scoreboard result
- Reset Game starts a fresh game without clearing scores
- Reset Scoreboard separately clears session scores
- Responsive board and accessible turn and result messages

## Run locally

From the project directory, install dependencies once:

```sh
npm install
```

In the first terminal, start the backend:

```sh
npm run server
```

In a second terminal, start the frontend:

```sh
npm run dev
```

Open the Vite URL printed in the second terminal (normally `http://localhost:5173`). Vite proxies `/api` requests to `http://127.0.0.1:3001`. To use another backend port, set `API_PORT` for the backend and update the proxy target in `vite.config.js` to match.

## API endpoints

| Method | Endpoint | Purpose |
| --- | --- | --- |
| `POST` | `/api/games` | Create a game with `{ "mode": "two-player" }` or `{ "mode": "computer" }`; returns the full game state. |
| `GET` | `/api/games/:gameId` | Retrieve the latest game state. |
| `POST` | `/api/games/:gameId/moves` | Submit `{ "player": "X", "index": 0 }`; validates and applies a move. Computer mode also applies O's move before responding. |
| `POST` | `/api/games/:gameId/undo` | Undo the last move or the last human/computer turn, depending on game mode. |
| `GET` | `/api/scoreboard` | Retrieve session scoreboard totals. |
| `POST` | `/api/scoreboard/reset` | Clear the session scoreboard. |

Game state responses contain `gameId`, `board`, `currentPlayer`, `gameMode`, `gameStatus` (`InProgress`, `Won`, or `Draw`), `winner`, `winningCells`, numbered `moveHistory` entries with row and column, and `scoreboard`. Invalid moves return an appropriate HTTP error and a JSON `error` message.

## Tests and checks

Run backend game-rule and state-transition tests:

```sh
npm test
```

Run the frontend lint:

```sh
npm run lint
```

Build the production frontend:

```sh
npm run build
```

The backend tests cover valid and invalid moves, turns, row/column/diagonal wins, draws, completed-game rejection, reset behavior, undo in both modes, scoreboard changes, and computer move priorities.

## AI-assisted development

An AI coding assistant was used to help implement the requested React game, REST API, file organization, and tests. The prompts described the game behavior, API state and move validation, frontend controls, undo rules, scoreboard behavior, and README/testing requirements. The assistant drafted implementation and test code; the author reviewed the state transitions, computer move priorities, API errors, undo/scoreboard interaction, and test coverage, and ran the project checks. The final implementation should be reviewed and understood by the submitting author before submission.

## Design decisions

- The backend is authoritative for game rules and returns complete state after each action; the frontend renders those responses.
- Game rules live in `game-service.mjs` so they can be unit tested without starting the HTTP server.
- Game and scoreboard state are held in memory. A map keyed by game ID makes recording a result idempotent.
- Undo after completion is allowed (Option B). Reversing a completed game removes its result from the scoreboard.
- In Computer mode, the API makes the human and computer moves as one request, preventing the frontend from submitting computer moves.
- Node's built-in `node:test` avoids an additional test dependency.

## Clarifications and assumptions

- Undo after completion uses Option B: it restores the prior game state and adjusts the scoreboard.
- A computer-mode undo removes the most recent human/computer turn pair when both moves exist; if only the opening human move exists, it removes that single move.
- Reset Game creates a new game and does not change the scoreboard. Reset Scoreboard clears session totals independently.
- “Session-level” means the lifetime of the running backend process, shared by games using that process.
- Cell indexes are zero-based (`0` through `8`), ordered left-to-right and top-to-bottom. History rows and columns are one-based for display.

## Known limitations

- Restarting the backend clears games and scoreboard because state is in memory.
- Game IDs are not tied to users, and there is no persistence or multi-user account system.
- The computer follows the specified tactical priority, not a full optimal-play strategy.

## Future improvements

- Persist games and scores in SQLite or another database.
- Add user identities and separate scoreboards per player or match.
- Add integration tests for HTTP status codes and frontend rendering.
- Add an optional stronger computer strategy and replayable game history.

## Project structure

- `src/App.jsx` coordinates the frontend and renders the page layout.
- `src/api/gameApi.js` contains frontend API request functions.
- `src/components/` contains the game board, mode selector, move history, and scoreboard.
- `game-service.mjs` contains backend game rules and state transitions.
- `server.mjs` exposes the REST API.
- `tests/game-service.test.mjs` tests backend game rules and transitions.
