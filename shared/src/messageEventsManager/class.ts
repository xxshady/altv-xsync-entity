import { createLogger } from "altv-xlogger"
import type { Events } from "./types"

export class MessageEventsManager<T extends Events = Events> {
  private readonly log = createLogger("MessageManager")
  private readonly eventsHandlers: T

  constructor (events: T) {
    this.eventsHandlers = events
  }

  public send <K extends keyof T> (eventName: K, args: Parameters<T[K]>): string {
    let message = `${eventName}|`

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

      handler(...extraFirstArgs, ...args)
    } catch (e) {
      this.log.error("[receive]")
      this.log.error(e)
    }
  }
}