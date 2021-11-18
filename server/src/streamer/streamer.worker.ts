import { parentPort } from "worker_threads"

class StreamerWorker {
  private readonly entities = new Set()
  private readonly log = {
    log (...args: unknown[]) {
      console.log("[xsync-entity:worker]", ...args)
    },
  }

  constructor () {
    this.log.log("worker started")
    parentPort?.postMessage({ test: [1, 2, 3] })
  }
}

new StreamerWorker()