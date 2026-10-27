async function requestJson(path, options) {
  const response = await fetch(path, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  })
  const body = await response.json()

  if (!response.ok) {
    throw new Error(body.error || `Request failed (${response.status})`)
  }

  return body
}

export function createGame(mode) {
  return requestJson('/api/games', {
    method: 'POST',
    body: JSON.stringify({ mode }),
  })
}

export function submitMove(gameId, player, index) {
  return requestJson(`/api/games/${encodeURIComponent(gameId)}/moves`, {
    method: 'POST',
    body: JSON.stringify({ player, index }),
  })
}

export function undoMove(gameId) {
  return requestJson(`/api/games/${encodeURIComponent(gameId)}/undo`, {
    method: 'POST',
  })
}

export function resetScoreboard() {
  return requestJson('/api/scoreboard/reset', { method: 'POST' })
}
