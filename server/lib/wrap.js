// Express 4 does not forward the rejection of an async handler's promise to the
// error middleware. A handler that awaits and then throws, with neither a
// try/catch nor this wrapper, gets no response at all -- the socket is torn down
// under the client (curl exit 56, not a timeout) and Node's default
// unhandled-rejection policy then kills the process, so the rest of the API
// goes offline with it and the port stops listening. It is not a quiet failure
// either: Node prints the fatal error and its stack to stderr.
//
// The one case where the request genuinely hangs is a registered
// process.on('unhandledRejection') listener, which suppresses that default
// policy and leaves the client waiting until it times out. Nothing in this app
// registers one, so process death is what you get.
//
// Register every async handler through wrap():
//
//   import { wrap } from '../lib/wrap.js'
//   router.get('/:id', wrap(async (request, response) => { ... }))
//
// Express 5 forwards rejections itself, so this becomes unnecessary on the day
// the dependency is upgraded -- but not before.
export const wrap = (fn) => (request, response, next) =>
  Promise.resolve(fn(request, response, next)).catch(next)