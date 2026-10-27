function MoveHistory({ moves }) {
  return (
    <section className="history-card" aria-labelledby="history-heading">
      <div className="section-heading">
        <div>
          <p className="eyebrow">THIS ROUND</p>
          <h2 id="history-heading">Move history</h2>
        </div>
        <span className="move-count">{moves.length.toString().padStart(2, '0')}</span>
      </div>
      {moves.length === 0 ? (
        <div className="history-empty">
          <span className="empty-board-icon" aria-hidden="true">⌗</span>
          <p>No moves yet</p>
          <span>Your game will show up here.</span>
        </div>
      ) : (
        <div className="history-table-wrap">
          <table className="history-table">
            <thead>
              <tr><th>Move</th><th>Player</th><th>Position</th></tr>
            </thead>
            <tbody>
              {moves.map((move) => (
                <tr key={move.moveNumber}>
                  <td>{move.moveNumber}</td>
                  <td><span className={`move-player move-player--${move.player.toLowerCase()}`}>{move.player}</span></td>
                  <td>Row {move.row}, Column {move.column}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  )
}

export default MoveHistory
