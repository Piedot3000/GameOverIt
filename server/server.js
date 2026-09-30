import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import { pool } from './db/pool.js'
import gamesRoutes from './routes/games.js'
import steamRoutes from './routes/steam.js'

const app = express()

// CORS before the routes. Middleware registered after a route never sees that
// route's requests, which is the m4 lesson showing up in production.
//
// Name your origins. app.use(cors()) with no options sends
// Access-Control-Allow-Origin: *, which lets any site on the internet call this
// API from a visitor's browser, and is incompatible with cookies.
const allowedOrigins = (process.env.CORS_ORIGINS || 'http://localhost:5173')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean)

// One line for several real protections (the course's security checklist asks for
// exactly this). Before CORS, so the security headers are set on every response
// including the preflight rejections.
app.use(helmet())

app.use(cors({ origin: allowedOrigins }))
app.use(express.json({ limit: '100kb' }))

// Is the process alive?
app.get('/healthz', (request, response) => {
  response.json({ ok: true })
})

// Is the database reachable? A different question, and the one that tells you
// in two seconds which half of a problem you have.
app.get('/readyz', async (request, response) => {
  try {
    await pool.query('SELECT 1')
    response.json({ ok: true, db: 'up' })
  } catch (error) {
    console.error('readyz failed:', error.message)
    response.status(503).json({ ok: false, db: 'down' })
  }
})

// The feature routers. Both are deliberately empty: the backlog endpoints are
// registered by a later task, the Steam ones by another. The mounts exist now so
// those tasks add routes without rewiring this file.
app.use('/api/games', gamesRoutes)
app.use('/api/steam', steamRoutes)

app.use((request, response) => {
  response.status(404).json({ error: 'No such route' })
})

// The single place an error becomes a response. The detail goes in your logs;
// the visitor gets a plain message. Sending a stack trace to a stranger tells
// them about your file layout and dependencies.
//
// Handlers signal the status they mean by putting it on the error (status), and
// a validation failure can carry a per-field map (fields) for the client to
// render next to each input. Anything without a status is a genuine fault and
// stays a 500.
//
// A rejected async handler only reaches here if it is registered through wrap()
// from ./lib/wrap.js, or caught and passed to next(error) by hand -- Express 4
// does not forward a rejected promise by itself, and an unhandled rejection
// gets no response and exits the process, taking the whole API down with it.
//
// Only a status res.status() will accept is honoured. A non-integer or
// out-of-range value would throw inside this middleware, and a throw here has
// nowhere left to go but Express's finalhandler, which prints the stack in the
// response outside production. Anything else is treated as a plain 500.
const isHttpErrorStatus = (error) =>
  Number.isInteger(error.status) && error.status >= 400 && error.status <= 599

app.use((error, request, response, next) => {
  console.error(error)
  if (isHttpErrorStatus(error)) {
    const body = { error: error.message }
    if (error.fields) body.fields = error.fields
    return response.status(error.status).json(body)
  }
  response.status(500).json({ error: 'Something went wrong on the server' })
})

// The host chooses the port and tells you through PORT. Hardcoding 3000 is the
// commonest reason a first deploy is marked unhealthy and killed.
const port = process.env.PORT || 3000

app.listen(port, () => {
  console.log(`API listening on http://localhost:${port}`)
  console.log(`CORS allows: ${allowedOrigins.join(', ')}`)
})
