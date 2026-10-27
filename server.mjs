import { createServer } from 'node:http'
import { GameError, GameService } from './game-service.mjs'

const gameService = new GameService()
const port = Number(process.env.API_PORT || process.argv[2] || 3001)

function respond(response, status, data) {
  response.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8' })
  response.end(JSON.stringify(data))
}

function respondError(response, status, error) {
  respond(response, status, { error })
}

function readJson(request) {
  return new Promise((resolve, reject) => {
    let body = ''

    request.setEncoding('utf8')
    request.on('data', (chunk) => {
      if (body.length + chunk.length > 1024) {
        const error = new Error('Request body is too large')
        error.status = 413
        reject(error)
        return
      }

      body += chunk
    })
    request.on('end', () => {
      try {
        resolve(JSON.parse(body))
      } catch {
        const error = new Error('Request body must be valid JSON')
        error.status = 400
        reject(error)
      }
    })
    request.on('error', reject)
  })
}

const server = createServer(async (request, response) => {
  const url = new URL(request.url, `http://${request.headers.host || 'localhost'}`)

  if (request.method === 'GET' && url.pathname === '/api/scoreboard') {
    respond(response, 200, { scoreboard: gameService.getScoreboard() })
    return
  }

  if (request.method === 'POST' && url.pathname === '/api/scoreboard/reset') {
    respond(response, 200, { scoreboard: gameService.resetScoreboard() })
    return
  }

  try {
    if (request.method === 'POST' && url.pathname === '/api/games') {
      const body = await readJson(request)
      respond(response, 201, gameService.createGame(body?.mode))
      return
    }

    const gameMatch = url.pathname.match(/^\/api\/games\/([\w-]{1,100})(?:\/(moves|undo))?$/)
    if (!gameMatch) {
      respondError(response, 404, 'API route not found')
      return
    }

    const [, gameId, action] = gameMatch
    if (request.method === 'GET' && !action) {
      respond(response, 200, gameService.getGameState(gameId))
      return
    }

    if (request.method === 'POST' && action === 'moves') {
      const body = await readJson(request)
      respond(response, 200, gameService.submitMove(gameId, body))
      return
    }

    if (request.method === 'POST' && action === 'undo') {
      respond(response, 200, gameService.undoMove(gameId))
      return
    }

    respondError(response, 404, 'API route not found')
  } catch (error) {
    const status = error instanceof GameError ? error.status : error.status || 500
    respondError(response, status, error.message || 'Internal server error')
  }
})

server.listen(port, '127.0.0.1', () => {
  console.log(`Tic Tac Toe API listening on http://127.0.0.1:${port}`)
})
