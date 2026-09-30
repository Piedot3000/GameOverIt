import { Router } from 'express'
import { listGames, createGame, getGame, updateGame, deleteGame } from '../handlers/games.js'
import { wrap } from '../lib/wrap.js'

// The backlog endpoints. Every handler goes through wrap(): Express 4 does not
// forward a rejected async handler's promise to the error middleware, so an
// unwrapped throw gets no response and exits the process.
const router = Router()

router.get('/', wrap(listGames))
router.post('/', wrap(createGame))
router.get('/:id', wrap(getGame))
router.patch('/:id', wrap(updateGame))
router.delete('/:id', wrap(deleteGame))

export default router