import * as alt from "alt-server"
import { IdProvider } from "../id-provider"
import { WSServer } from "../ws-server"
import { Streamer } from "../streamer"
import type { IClientOnServerEvent } from "altv-xsync-entity-shared"
import { ClientOnServerEvents } from "altv-xsync-entity-shared"

export class InternalXSyncEntity {
  private static _instance: InternalXSyncEntity | null = null

  public static get instance (): InternalXSyncEntity {
    const { _instance } = this

    if (!_instance) {
      throw new Error("InternalXSyncEntity has not been initialized yet")
    }

    return _instance
  }

  public readonly wss: WSServer
  public readonly idProvider = new IdProvider()
  public readonly streamer = new Streamer()

  constructor (
    public readonly websocketPort: number,
  ) {
    if (InternalXSyncEntity._instance) {
      throw new Error("InternalXSyncEntity already initialized")
    }

    InternalXSyncEntity._instance = this

    this.wss = new WSServer(
      websocketPort,
      {
        events: {},
      },
    )

    this.setupAltvEvents()
  }

  private setupAltvEvents () {
    alt.on("playerConnect", this.onPlayerConnect.bind(this))
  }

  private async onPlayerConnect (player: alt.Player) {
    await this.wss.waitExternalIp()
    const authCode = this.wss.addPlayer(player)

    alt.emitClient(
      player,
      ClientOnServerEvents.addPlayer,
      authCode,

      // TODO wss
      // `wss://${this.wss.externalIp}:${this.wss.port}`,

      `ws://${this.wss.externalIp}:${this.wss.port}`,
    )
  }
}