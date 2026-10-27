function Scoreboard({ scores, disabled, onReset }) {
  return (
    <section className="score-card" aria-labelledby="score-heading">
      <div className="section-heading">
        <div>
          <p className="eyebrow">KEEPING SCORE</p>
          <h2 id="score-heading">Scoreboard</h2>
        </div>
        <span className="score-icon" aria-hidden="true">↗</span>
      </div>
      <div className="score-row">
        <span className="player-label"><span className="player-symbol player-symbol--x">X</span> Player X</span>
        <strong>{scores.X}</strong>
      </div>
      <div className="score-row">
        <span className="player-label"><span className="player-symbol player-symbol--o">O</span> Player O</span>
        <strong>{scores.O}</strong>
      </div>
      <div className="score-row score-row--draws">
        <span className="player-label"><span className="draw-symbol">=</span> Draws</span>
        <strong>{scores.draws}</strong>
      </div>
      <div className="score-actions">
        <p className="score-caption">Session scores are managed by the game server.</p>
        <button className="score-reset-button" type="button" onClick={onReset} disabled={disabled}>Reset scoreboard</button>
      </div>
    </section>
  )
}

export default Scoreboard
