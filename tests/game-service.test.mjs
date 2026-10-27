import assert from 'node:assert/strict'
import test from 'node:test'
import { GameError, GameService, selectComputerMove } from '../game-service.mjs'

function createService() {
  let id = 0
  return new GameService({ createId: () => `game-${++id}` })
}

function playMoves(service, gameId, moves) {
  let state
  for (const [player, index] of moves) {
    state = service.submitMove(gameId, { player, index })
  }
  return state
}

function assertGameError(action, status) {
  assert.throws(action, (error) => error instanceof GameError && error.status === status)
}

test('creates a new game with a complete initial state', () => {
  const service = createService()
  const game = service.createGame('two-player')

  assert.equal(game.gameId, 'game-1')
  assert.deepEqual(game.board, Array(9).fill(null))
  assert.equal(game.currentPlayer, 'X')
  assert.equal(game.gameMode, 'two-player')
  assert.equal(game.gameStatus, 'InProgress')
  assert.equal(game.winner, null)
  assert.deepEqual(game.winningCells, [])
  assert.deepEqual(game.moveHistory, [])
  assert.deepEqual(game.scoreboard, { X: 0, O: 0, draws: 0 })
})

test('rejects invalid game modes, move indexes, and players', () => {
  const service = createService()
  const game = service.createGame('two-player')

  assertGameError(() => service.createGame('invalid'), 400)
  assertGameError(() => service.submitMove(game.gameId, { player: 'X', index: -1 }), 400)
  assertGameError(() => service.submitMove(game.gameId, { player: 'X', index: 9 }), 400)
  assertGameError(() => service.submitMove(game.gameId, { player: 'Z', index: 0 }), 400)
})

test('accepts a valid move, switches turns, and rejects occupied or out-of-turn moves', () => {
  const service = createService()
  const game = service.createGame('two-player')
  const afterX = service.submitMove(game.gameId, { player: 'X', index: 0 })

  assert.equal(afterX.board[0], 'X')
  assert.equal(afterX.currentPlayer, 'O')
  assert.deepEqual(afterX.moveHistory[0], {
    moveNumber: 1,
    player: 'X',
    index: 0,
    row: 1,
    column: 1,
  })
  assertGameError(() => service.submitMove(game.gameId, { player: 'X', index: 1 }), 409)
  assertGameError(() => service.submitMove(game.gameId, { player: 'O', index: 0 }), 409)
})

test('detects a row win, winning cells, and a single scoreboard update', () => {
  const service = createService()
  const game = service.createGame('two-player')
  const result = playMoves(service, game.gameId, [
    ['X', 0], ['O', 3], ['X', 1], ['O', 4], ['X', 2],
  ])

  assert.equal(result.gameStatus, 'Won')
  assert.equal(result.winner, 'X')
  assert.deepEqual(result.winningCells, [0, 1, 2])
  assert.deepEqual(result.scoreboard, { X: 1, O: 0, draws: 0 })
  assert.deepEqual(service.getScoreboard(), { X: 1, O: 0, draws: 0 })
})

test('detects a column win', () => {
  const service = createService()
  const game = service.createGame('two-player')
  const result = playMoves(service, game.gameId, [
    ['X', 0], ['O', 1], ['X', 3], ['O', 2], ['X', 6],
  ])

  assert.equal(result.gameStatus, 'Won')
  assert.deepEqual(result.winningCells, [0, 3, 6])
})

test('detects a diagonal win', () => {
  const service = createService()
  const game = service.createGame('two-player')
  const result = playMoves(service, game.gameId, [
    ['X', 0], ['O', 1], ['X', 4], ['O', 2], ['X', 8],
  ])

  assert.equal(result.gameStatus, 'Won')
  assert.deepEqual(result.winningCells, [0, 4, 8])
})

test('detects a draw and adds one draw to the scoreboard', () => {
  const service = createService()
  const game = service.createGame('two-player')
  const result = playMoves(service, game.gameId, [
    ['X', 0], ['O', 1], ['X', 2],
    ['O', 4], ['X', 3], ['O', 5],
    ['X', 7], ['O', 6], ['X', 8],
  ])

  assert.equal(result.gameStatus, 'Draw')
  assert.equal(result.winner, null)
  assert.deepEqual(result.winningCells, [])
  assert.equal(result.moveHistory.length, 9)
  assert.deepEqual(result.scoreboard, { X: 0, O: 0, draws: 1 })
})

test('rejects moves after a game is complete', () => {
  const service = createService()
  const game = service.createGame('two-player')
  playMoves(service, game.gameId, [
    ['X', 0], ['O', 3], ['X', 1], ['O', 4], ['X', 2],
  ])

  assertGameError(() => service.submitMove(game.gameId, { player: 'O', index: 5 }), 409)
})

test('starting a reset game preserves the session scoreboard', () => {
  const service = createService()
  const firstGame = service.createGame('two-player')
  playMoves(service, firstGame.gameId, [
    ['X', 0], ['O', 3], ['X', 1], ['O', 4], ['X', 2],
  ])

  const resetGame = service.createGame('two-player')
  assert.equal(resetGame.gameStatus, 'InProgress')
  assert.equal(resetGame.moveHistory.length, 0)
  assert.deepEqual(resetGame.scoreboard, { X: 1, O: 0, draws: 0 })
})

test('undoes one two-player move and restores its turn', () => {
  const service = createService()
  const game = service.createGame('two-player')
  service.submitMove(game.gameId, { player: 'X', index: 0 })
  service.submitMove(game.gameId, { player: 'O', index: 4 })

  const result = service.undoMove(game.gameId)
  assert.equal(result.board[4], null)
  assert.equal(result.currentPlayer, 'O')
  assert.equal(result.moveHistory.length, 1)
})

test('undo after a two-player win reverses its scoreboard result', () => {
  const service = createService()
  const game = service.createGame('two-player')
  playMoves(service, game.gameId, [
    ['X', 0], ['O', 3], ['X', 1], ['O', 4], ['X', 2],
  ])

  const result = service.undoMove(game.gameId)
  assert.equal(result.gameStatus, 'InProgress')
  assert.equal(result.currentPlayer, 'X')
  assert.equal(result.scoreboard.X, 0)
  assertGameError(() => service.submitMove(game.gameId, { player: 'O', index: 5 }), 409)
})

test('computer mode makes valid automatic moves and undo removes both moves', () => {
  const service = createService()
  const game = service.createGame('computer')
  assertGameError(() => service.submitMove(game.gameId, { player: 'O', index: 4 }), 409)

  const afterHumanMove = service.submitMove(game.gameId, { player: 'X', index: 0 })
  assert.equal(afterHumanMove.moveHistory.length, 2)
  assert.equal(afterHumanMove.moveHistory[1].player, 'O')
  assert.equal(afterHumanMove.board[afterHumanMove.moveHistory[1].index], 'O')

  const undone = service.undoMove(game.gameId)
  assert.equal(undone.moveHistory.length, 0)
  assert.equal(undone.currentPlayer, 'X')
})

test('computer mode undo after an X win removes the final human/computer turn pair', () => {
  const service = createService()
  const game = service.createGame('computer')
  const state = service.games.get(game.gameId)
  state.moves = [
    { player: 'X', index: 0 },
    { player: 'O', index: 3 },
    { player: 'X', index: 1 },
    { player: 'O', index: 4 },
    { player: 'X', index: 2 },
  ]
  service.recordResult(state)

  const undone = service.undoMove(game.gameId)
  assert.equal(undone.gameStatus, 'InProgress')
  assert.equal(undone.moveHistory.length, 3)
  assert.equal(undone.currentPlayer, 'O')
  assert.equal(undone.scoreboard.X, 0)
})

test('computer selects a winning move before blocking', () => {
  assert.equal(selectComputerMove(['O', 'O', null, 'X', 'X', null, null, null, null]), 2)
})

test('computer blocks a player win when it cannot win', () => {
  assert.equal(selectComputerMove(['X', 'X', null, 'O', null, null, null, null, null]), 2)
})

test('computer prioritizes center, then a corner, then any available cell', () => {
  assert.equal(selectComputerMove(Array(9).fill(null)), 4)
  assert.equal(selectComputerMove(['X', null, null, null, 'O', null, null, null, null]), 2)
  assert.equal(selectComputerMove(['X', 'O', 'X', 'X', 'O', 'O', 'O', 'X', null]), 8)
})

test('resetting scoreboard clears session results without changing the game', () => {
  const service = createService()
  const game = service.createGame('two-player')
  playMoves(service, game.gameId, [
    ['X', 0], ['O', 3], ['X', 1], ['O', 4], ['X', 2],
  ])

  assert.deepEqual(service.resetScoreboard(), { X: 0, O: 0, draws: 0 })
  assert.equal(service.getGameState(game.gameId).gameStatus, 'Won')
})
