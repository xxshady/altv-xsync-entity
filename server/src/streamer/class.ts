import { createLogger } from "altv-xlogger"
import Worker from "./streamer.worker.ts"

export class Streamer {
  private readonly worker = new Worker()
  private readonly entities = new Set()
  private readonly log = createLogger("altv-xsync-entity:streamer")

  constructor () {
    this.worker.on("message", (value) => {
      this.log.log("worker message:")
      console.log(value)
    })
  }
}