import * as alt from "alt-server"
import { IdProvider } from "../id-provider"
import { WSServer } from "../ws-server"
import { Streamer } from "../streamer"
import { ClientOnServerEvents } from "altv-xsync-entity-shared"
import { Players } from "../players"
import { createLogger } from "altv-xlogger"

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
  private readonly addedPlayers = new Players()
  private readonly log = createLogger("InternalXSyncEntity")

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

  public get players (): ReadonlyArray<alt.Player> {
    return this.addedPlayers.array
  }

  private setupAltvEvents () {
    alt.on("playerConnect", this.onPlayerConnect.bind(this))
    alt.on("playerDisconnect", this.onPlayerDisconnect.bind(this))
  }

  private onPlayerConnect (player: alt.Player) {
    this.addPlayer(player).catch(this.log.error)
  }

  private onPlayerDisconnect (player: alt.Player) {
    this.removePlayer(player)
  }

  private async addPlayer (player: alt.Player) {
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

    this.addedPlayers.add(player)
  }

  private removePlayer (player: alt.Player) {
    this.addedPlayers.remove(player)
  }
}