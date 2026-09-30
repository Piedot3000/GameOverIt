import { Router } from "express";
import { getSteamProfile, connectSteam, disconnectSteam, syncSteam } from "../handlers/steam.js";
import { wrap } from "../lib/wrap.js";

const router = Router();

// Every handler goes through wrap(), for the same reason the games routes do:
// Express 4 does not catch a rejected promise from an async handler, so an
// unwrapped one takes the whole process down instead of returning 502/503.
router.get("/profile", wrap(getSteamProfile));
router.post("/connect", wrap(connectSteam));
router.delete("/profile", wrap(disconnectSteam));
router.post("/sync", wrap(syncSteam));

export default router;