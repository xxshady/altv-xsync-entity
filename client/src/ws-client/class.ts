import * as alt from "alt-client"
import { createLogger, LogLevel } from "altv-xlogger"
import type {
  EventsType,
  EventsTypeAny,
  IWaitConnectPromise,
  IWebSocketOptions,
} from "./types"
import {
  MessageEventsManager,
} from "altv-xsync-entity-shared"

export class WSClient<TEvents extends EventsTypeAny> {
  private readonly log = createLogger("WSClient", {
    logLevel: ___DEV_MODE ? LogLevel.Info : LogLevel.Warn,
  })

  private readonly player = alt.Player.local
  private readonly messageHandlers = new Set<((message: string) => void)>()
  private readonly eventsManager: MessageEventsManager

  private readonly waitConnectPromise: IWaitConnectPromise
  private readonly client: alt.WebSocketClient

  private readonly socketCloseHandler: () => void

  private connected = false

  constructor (url: string, authCode: string, options: IWebSocketOptions<TEvents>) {
    this.log.log(`connect url: ${url}`)

    this.client = this.initClient(authCode, url)
    this.waitConnectPromise = this.initWaitConnectPromise()
    this.eventsManager = this.initUserEvents(options)

    this.socketCloseHandler = options.close

    this.setupWsClientEvents(this.client)
  }

  public send (eventName: string, ...args: unknown[]): boolean {
    const message = this.eventsManager.send(eventName, args)

    return this.client.send(message)
  }

  private addMessageHandler (handler: (message: string) => void): void {
    this.messageHandlers.add(handler)
  }

  public waitConnect (): Promise<void> {
    return this.waitConnectPromise.promise
  }

  private initClient (authCode: string, url: string) {
    const client = new alt.WebSocketClient(url)

    client.setExtraHeader("authcode", authCode)
    client.setExtraHeader("playerid", this.player.id.toString())

    // interval in seconds
    client.pingInterval = 15

    client.autoReconnect = false
    client.perMessageDeflate = true

    client.start()

    this.log.log("started connecting...", new Date().getMilliseconds())

    return client
  }

  private setupWsClientEvents (client: alt.WebSocketClient) {
    client.on("open", this.onOpen.bind(this))
    client.on("close", this.onClose.bind(this))
    client.on("error", this.onError.bind(this))
    client.on("message", this.onMessage.bind(this))
  }

  private onOpen () {
    this.connected = true
    this.waitConnectPromise.resolve()

    this.log.log("~gl~successful connection~w~ to the server", new Date().getMilliseconds())
  }

  private onClose (code: number, reason: string) {
    this.waitConnectPromise.reject(new Error(reason))

    this.log.error("[close]", "code:", code, "reason:", reason)

    this.socketCloseHandler()
  }

  private onMessage (message: string) {
    // this.log.log("[message]", message)

    for (const handler of this.messageHandlers) {
      handler(message)
    }
  }

  private onError (error: string) {
    if (!this.connected) {
      this.waitConnectPromise.reject(new Error(error))
    }

    this.log.error("[error]", error)
  }

  private initUserEvents ({ events }: IWebSocketOptions<EventsType>): MessageEventsManager {
    const manager = new MessageEventsManager(events)

    this.addMessageHandler((raw) => {
      manager.receive(raw)
    })

    return manager
  }

  private initWaitConnectPromise (): IWaitConnectPromise {
    return {
      promise: new Promise<void>((resolve, reject) => {
        alt.nextTick(() => {
          this.waitConnectPromise.resolve = resolve
          this.waitConnectPromise.reject = (_error) => {
            const error = new Error(`[connection reject] ${_error.message}`)

            error.stack = _error.stack
            reject(error)
          }
        })
      }),
    } as IWaitConnectPromise
  }
}