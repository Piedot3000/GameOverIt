// The only module the UI imports. Which implementation you get is decided by ONE
// build-time variable, read here and nowhere else.
//
//   VITE_USE_MOCK_API === "false"  -> the real Express API at VITE_API_BASE_URL
//   anything else (unset, "true")  -> the browser-only fake
//
// Note which way round that is. Demo mode is the DEFAULT, so a fresh copy of
// this template builds into a working site before anything is configured. The
// alternative (defaulting to the real API) means a forgotten variable produces a
// deployed site that calls an empty URL and fails on every request, with nothing
// on the page explaining why. A visible demo notice is a much better failure
// than a silently broken app.
//
// Both modules are imported STATICALLY and one is chosen at run time. The
// tempting version of this uses `await import(...)` to load only the one you
// need, and it does not build: top-level await is not available in Vite's
// default browser target, so `vite build` fails with "Top-level await is not
// available in the configured target environment". Bundling both costs a
// couple of kilobytes and keeps the demo build available as your fallback,
// which you want anyway.

import * as mockApi from './mockApi.js'
import * as httpApi from './httpApi.js'

// The template's exported name, kept deliberately: components/DemoNotice.jsx
// imports exactly `USING_MOCK_API` and is not ours to rename. One name for
// one flag -- a second alias would be two names for the same boolean.
export const USING_MOCK_API = import.meta.env.VITE_USE_MOCK_API !== 'false'

const implementation = USING_MOCK_API ? mockApi : httpApi

export const {
  listGames,
  getGame,
  createGame,
  updateGame,
  deleteGame,
  getSteamProfile,
  connectSteam,
  syncSteam,
  disconnectSteam,
} = implementation

// Re-exported so callers can `instanceof` the error without importing the HTTP
// implementation directly.
export { ApiError } from './httpApi.js'