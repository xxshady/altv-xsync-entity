import { Logger } from "../logger"
import type { Events } from "./types"
// import * as alt from "alt-shared"
// import { WSClientOnServerEvents, WSServerOnClientEvents } from "../ws-events"

export class MessageEventsManager<T extends Events = Events> {
  private readonly log = new Logger("xsync:message-manager")
  private readonly eventsHandlers: T

  constructor (events: T) {
    this.eventsHandlers = events
  }

  public send <K extends keyof T> (eventName: K, args: Parameters<T[K]>): string {
    let message = `${eventName as string}|`

    message += JSON.stringify(args)

    return message
  }

  public receive (rawMessage: string, extraFirstArgs: unknown[] = []): void {
    try {
      const delimiter = rawMessage.indexOf("|")

      if (delimiter === -1) {
        throw new Error("invalid rawMessage (no delimiter)")
      }

      const eventName = rawMessage.slice(0, delimiter)
      const rawArgs = rawMessage.slice(delimiter + 1)
      const handler = this.eventsHandlers[eventName]

      if (!handler) {
        this.log.warn("[receive]", `event: ${eventName} no handlers`)
        return
      }

      const args = JSON.parse(rawArgs)

      // this.log.moreInfo(
      //   "[receive]",
      //   "eventName:",
      //   alt.isClient ? WSClientOnServerEvents[eventName as any] : WSServerOnClientEvents[eventName as any],
      //   args,
      // )

      handler(...extraFirstArgs, ...args)
    }
    catch (e) {
      this.log.error("[receive]")
      this.log.error(e)
    }
  }
}
