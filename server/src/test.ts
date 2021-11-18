import * as alt from "alt-server"
import { createLogger } from "altv-xlogger"
import { WSServer } from "./ws-server"

const log = createLogger("xsync-entity")

const server = new WSServer(7700, {
  events: {
    kek (player, ...args: unknown[]) {
      log.log(`[kek event] player: ${player.name} args:`)
      console.debug(args)

      server.sendPlayer(player, "kek", "yes")
    },
  },
})

alt.on("playerConnect", (player) => {
  log.log("~gl~[playerConnect]~w~", `player: ${player.name}`, "add into websocket")

  const authCode = server.addPlayer(player)

  alt.emitClient(player, "xsyncEntity:test", authCode)
})