function GameBoard({
  board,
  winningCells,
  currentPlayer,
  gameStatus,
  winner,
  computerTurn,
  disabled,
  onMove,
  onUndo,
  onReset,
  canUndo,
}) {
  const gameComplete = gameStatus !== 'InProgress'
  const gameMessage = gameStatus === 'Won'
    ? `${winner} takes the game!`
    : gameStatus === 'Draw'
      ? "It's a draw!"
      : computerTurn && disabled
        ? 'Computer is thinking...'
        : `${currentPlayer}'s turn to play`

  return (
    <section className="play-card" aria-label="Game board">
      <div className="game-status" aria-live="polite">
        <span className={`turn-indicator ${gameStatus === 'Won' ? 'turn-indicator--winner' : ''} ${gameStatus === 'Draw' ? 'turn-indicator--draw' : ''}`}>
          {gameStatus === 'Draw' ? '=' : winner || currentPlayer}
        </span>
        <div>
          <p className="status-label">{gameComplete ? 'ROUND COMPLETE' : computerTurn ? 'COMPUTER TURN' : 'CURRENT TURN'}</p>
          <p className="status-message">{gameMessage}</p>
        </div>
        {gameComplete && <span className="complete-badge">FINISHED</span>}
      </div>

      <div className="board" role="group" aria-label="Tic Tac Toe board">
        {board.map((cell, index) => {
          const row = Math.floor(index / 3) + 1
          const column = (index % 3) + 1

          return (
            <button
              className={[
                'board-cell',
                cell ? `board-cell--${cell.toLowerCase()}` : '',
                winningCells.includes(index) ? 'board-cell--winning' : '',
              ].filter(Boolean).join(' ')}
              type="button"
              aria-label={`Row ${row}, column ${column}${cell ? `, ${cell}` : ', empty'}`}
              disabled={disabled || Boolean(cell) || gameComplete || computerTurn}
              key={index}
              onClick={() => onMove(index)}
            >
              {cell && <span>{cell}</span>}
            </button>
          )
        })}
      </div>

      <div className="board-footer">
        <span><kbd>TIP</kbd> First to line up three wins</span>
        <div className="game-actions">
          <button className="reset-button undo-button" type="button" onClick={onUndo} disabled={disabled || !canUndo}>
            <span aria-hidden="true">↶</span> Undo last move
          </button>
          <button className="reset-button" type="button" onClick={onReset} disabled={disabled}>
            <span aria-hidden="true">↻</span> Reset game
          </button>
        </div>
      </div>
    </section>
  )
}

export default GameBoard
