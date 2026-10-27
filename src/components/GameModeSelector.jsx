function GameModeSelector({ mode, disabled, onChange }) {
  return (
    <div className="mode-switch" role="group" aria-label="Game mode">
      <button
        className={mode === 'two-player' ? 'mode-button mode-button--active' : 'mode-button'}
        type="button"
        aria-pressed={mode === 'two-player'}
        disabled={disabled}
        onClick={() => onChange('two-player')}
      >
        Two Player
      </button>
      <button
        className={mode === 'computer' ? 'mode-button mode-button--active' : 'mode-button'}
        type="button"
        aria-pressed={mode === 'computer'}
        disabled={disabled}
        onClick={() => onChange('computer')}
      >
        Play Against Computer
      </button>
    </div>
  )
}

export default GameModeSelector
