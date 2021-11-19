import * as alt from "alt-client"
import { createLogger } from "altv-xlogger"
import type { IClientOnServerEvent } from "altv-xsync-entity-shared"
import { ClientOnServerEvents } from "altv-xsync-entity-shared"
import { WSClient } from "../ws-client"

export class XSyncEntity {
  private readonly log = createLogger("XSyncEntity")
  private client: WSClient | null = null

  constructor () {
    this.setupAltvEvents()
  }

  private setupAltvEvents () {
    alt.onServer(
      ClientOnServerEvents.addPlayer,
      this.onAddPlayer.bind(this) as IClientOnServerEvent[ClientOnServerEvents.addPlayer],
    )
  }

  private onAddPlayer (authCode: string, serverUrl: string) {
    this.log.log("onAddPlayer", authCode, serverUrl)

    this.client = new WSClient(serverUrl, authCode, {
      events: {},
    })
  }
}