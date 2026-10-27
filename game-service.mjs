const WINNING_LINES = [
  [0, 1, 2],
  [3, 4, 5],
  [6, 7, 8],
  [0, 3, 6],
  [1, 4, 7],
  [2, 5, 8],
  [0, 4, 8],
  [2, 4, 6],
]
const CORNERS = [0, 2, 6, 8]

export class GameError extends Error {
  constructor(status, message) {
    super(message)
    this.status = status
  }
}

function getBoard(moves) {
  const board = Array(9).fill(null)
  moves.forEach(({ player, index }) => {
    board[index] = player
  })
  return board
}

function getWinningLine(board) {
  return WINNING_LINES.find(([first, second, third]) => (
    board[first] && board[first] === board[second] && board[first] === board[third]
  )) || null
}

function findWinningMove(board, player) {
  return board.findIndex((cell, index) => {
    if (cell) return false
    const nextBoard = [...board]
    nextBoard[index] = player
    return Boolean(getWinningLine(nextBoard))
  })
}

export function selectComputerMove(board) {
  const winningMove = findWinningMove(board, 'O')
  if (winningMove !== -1) return winningMove

  const blockingMove = findWinningMove(board, 'X')
  if (blockingMove !== -1) return blockingMove

  if (!board[4]) return 4

  const corner = CORNERS.find((index) => !board[index])
  if (corner !== undefined) return corner

  return board.findIndex((cell) => !cell)
}

export class GameService {
  constructor({ createId = () => globalThis.crypto.randomUUID() } = {}) {
    this.createId = createId
    this.games = new Map()
    this.resultsByGame = new Map()
  }

  getScoreboard() {
    const scoreboard = { X: 0, O: 0, draws: 0 }

    for (const result of this.resultsByGame.values()) {
      if (result === 'draw') scoreboard.draws += 1
      else scoreboard[result] += 1
    }

    return scoreboard
  }

  resetScoreboard() {
    this.resultsByGame.clear()
    return this.getScoreboard()
  }

  createGame(mode) {
    if (!['two-player', 'computer'].includes(mode)) {
      throw new GameError(400, 'Mode must be two-player or computer')
    }

    const game = { id: this.createId(), mode, moves: [] }
    this.games.set(game.id, game)
    return this.getGameState(game.id)
  }

  getGameState(gameId) {
    const game = this.games.get(gameId)
    if (!game) throw new GameError(404, 'Game not found')

    const board = getBoard(game.moves)
    const winningLine = getWinningLine(board)
    const gameStatus = winningLine
      ? 'Won'
      : board.every(Boolean)
        ? 'Draw'
        : 'InProgress'
    const winner = winningLine ? board[winningLine[0]] : null
    const currentPlayer = gameStatus === 'InProgress'
      ? (game.moves.length % 2 === 0 ? 'X' : 'O')
      : game.moves.at(-1)?.player || 'X'

    return {
      gameId: game.id,
      board,
      currentPlayer,
      gameMode: game.mode,
      gameStatus,
      winner,
      winningCells: winningLine || [],
      moveHistory: game.moves.map((move, index) => ({
        moveNumber: index + 1,
        player: move.player,
        index: move.index,
        row: Math.floor(move.index / 3) + 1,
        column: (move.index % 3) + 1,
      })),
      scoreboard: this.getScoreboard(),
    }
  }

  submitMove(gameId, { player, index } = {}) {
    const game = this.games.get(gameId)
    if (!game) throw new GameError(404, 'Game not found')
    if (!['X', 'O'].includes(player)) {
      throw new GameError(400, 'Player must be X or O')
    }
    if (!Number.isInteger(index) || index < 0 || index > 8) {
      throw new GameError(400, 'Cell index must be an integer from 0 to 8')
    }

    const state = this.getGameState(gameId)
    if (state.gameStatus !== 'InProgress') {
      throw new GameError(409, 'Game is already complete')
    }
    if (player !== state.currentPlayer) {
      throw new GameError(409, `It is ${state.currentPlayer}'s turn`)
    }
    if (game.mode === 'computer' && player !== 'X') {
      throw new GameError(409, 'The computer controls O')
    }
    if (state.board[index]) {
      throw new GameError(409, 'Cell is already occupied')
    }

    game.moves.push({ player, index })
    this.recordResult(game)

    let nextState = this.getGameState(gameId)
    if (game.mode === 'computer' && nextState.gameStatus === 'InProgress') {
      const computerIndex = selectComputerMove(nextState.board)
      if (computerIndex !== -1) {
        game.moves.push({ player: 'O', index: computerIndex })
        this.recordResult(game)
      }
      nextState = this.getGameState(gameId)
    }

    return nextState
  }

  undoMove(gameId) {
    const game = this.games.get(gameId)
    if (!game) throw new GameError(404, 'Game not found')
    if (game.moves.length === 0) {
      throw new GameError(409, 'There are no moves to undo')
    }

    const removeCount = game.mode === 'computer' && game.moves.length > 1 ? 2 : 1
    game.moves.splice(-removeCount, removeCount)
    this.resultsByGame.delete(game.id)
    return this.getGameState(gameId)
  }

  recordResult(game) {
    const state = this.getGameState(game.id)
    if (state.gameStatus === 'Won') this.resultsByGame.set(game.id, state.winner)
    else if (state.gameStatus === 'Draw') this.resultsByGame.set(game.id, 'draw')
  }
}
