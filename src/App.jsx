import { useEffect, useState } from 'react'
import { createGame, resetScoreboard as resetScoreboardApi, submitMove, undoMove } from './api/gameApi.js'
import GameBoard from './components/GameBoard.jsx'
import GameModeSelector from './components/GameModeSelector.jsx'
import MoveHistory from './components/MoveHistory.jsx'
import Scoreboard from './components/Scoreboard.jsx'
import './App.css'

const EMPTY_SCOREBOARD = { X: 0, O: 0, draws: 0 }

function App() {
  const [game, setGame] = useState(null)
  const [mode, setMode] = useState('two-player')
  const [scoreboard, setScoreboard] = useState(EMPTY_SCOREBOARD)
  const [isBusy, setIsBusy] = useState(true)
  const [apiError, setApiError] = useState('')

  useEffect(() => {
    let active = true

    createGame('two-player')
      .then((gameState) => {
        if (!active) return
        setGame(gameState)
        setScoreboard(gameState.scoreboard)
        setIsBusy(false)
        setApiError('')
      })
      .catch((error) => {
        if (!active) return
        setIsBusy(false)
        setApiError(error.message)
      })

    return () => {
      active = false
    }
  }, [])

  const gameId = game?.gameId
  const currentMode = game?.gameMode ?? mode
  const board = game?.board ?? Array(9).fill(null)
  const moves = game?.moveHistory ?? []
  const currentPlayer = game?.currentPlayer ?? 'X'
  const gameStatus = game?.gameStatus ?? 'InProgress'
  const winner = game?.winner ?? null
  const winningCells = game?.winningCells ?? []
  const gameComplete = gameStatus !== 'InProgress'
  const computerTurn = currentMode === 'computer' && currentPlayer === 'O' && !gameComplete

  async function startGame(nextMode) {
    setIsBusy(true)
    setApiError('')
    try {
      const nextGame = await createGame(nextMode)
      setGame(nextGame)
      setMode(nextGame.gameMode)
      setScoreboard(nextGame.scoreboard)
    } catch (error) {
      setApiError(error.message)
    } finally {
      setIsBusy(false)
    }
  }

  async function playMove(index) {
    if (!gameId || isBusy || gameComplete || board[index] || computerTurn) return

    setIsBusy(true)
    setApiError('')
    try {
      const nextGame = await submitMove(gameId, currentPlayer, index)
      setGame(nextGame)
      setScoreboard(nextGame.scoreboard)
    } catch (error) {
      setApiError(error.message)
    } finally {
      setIsBusy(false)
    }
  }

  async function undoLastMove() {
    if (!gameId || isBusy || moves.length === 0) return

    setIsBusy(true)
    setApiError('')
    try {
      const nextGame = await undoMove(gameId)
      setGame(nextGame)
      setScoreboard(nextGame.scoreboard)
    } catch (error) {
      setApiError(error.message)
    } finally {
      setIsBusy(false)
    }
  }

  async function resetScoreboard() {
    setIsBusy(true)
    setApiError('')
    try {
      const response = await resetScoreboardApi()
      setScoreboard(response.scoreboard)
      setGame((previousGame) => (
        previousGame ? { ...previousGame, scoreboard: response.scoreboard } : previousGame
      ))
    } catch (error) {
      setApiError(error.message)
    } finally {
      setIsBusy(false)
    }
  }

  return (
    <main className="app-shell">
      <header className="topbar">
        <a className="brand" href="/" aria-label="Tic Tac Toe home">
          <span className="brand-mark" aria-hidden="true">T<span>.</span></span>
          <span>PLAYGROUND</span>
        </a>
        <span className="topbar-note"><span className="live-dot" /> {currentMode === 'computer' ? 'PLAYING THE COMPUTER' : 'TWO PLAYER MODE'}</span>
      </header>

      <section className="game-layout" aria-label="Tic Tac Toe game">
        <div className="game-main">
          <div className="intro">
            <p className="eyebrow">THE CLASSIC, REIMAGINED</p>
            <h1>Tic Tac Toe<span className="title-period">.</span></h1>
            <p className="intro-copy">A little friendly rivalry never hurt.</p>
          </div>

          <GameModeSelector mode={currentMode} disabled={isBusy} onChange={startGame} />

          <GameBoard
            board={board}
            winningCells={winningCells}
            currentPlayer={currentPlayer}
            gameStatus={gameStatus}
            winner={winner}
            computerTurn={computerTurn}
            disabled={isBusy || !game}
            canUndo={moves.length > 0}
            onMove={playMove}
            onUndo={undoLastMove}
            onReset={() => startGame(currentMode)}
          />

          <p className="page-footnote">MADE FOR THE LOVE OF THE GAME <span>✳</span></p>
        </div>

        <aside className="side-panel">
          <Scoreboard scores={scoreboard} disabled={isBusy} onReset={resetScoreboard} />
          <MoveHistory moves={moves} />
          {apiError && <p className="api-error" role="alert">Game server error: {apiError}</p>}
        </aside>
      </section>

      <footer className="app-footer">
        <span>© {new Date().getFullYear()} PLAYGROUND</span>
        <span>GOOD GAMES, GOOD COMPANY.</span>
      </footer>
    </main>
  )
}

export default App
