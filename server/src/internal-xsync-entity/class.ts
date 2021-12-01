import * as alt from "alt-server"
import { IdProvider } from "../id-provider"
import { WSServer } from "../ws-server"
import { Streamer } from "../streamer"
import type { IWSClientOnServerEvent, WSEntity, WSEntityCreate } from "altv-xsync-entity-shared"
import {
  WSVectors,

  ClientOnServerEvents,
  WSClientOnServerEvents,
} from "altv-xsync-entity-shared"

import { Players } from "../players"
import { createLogger } from "altv-xlogger"
import type { InternalEntity } from "../internal-entity"

export class InternalXSyncEntity {
  // TODO move in shared
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
  public readonly streamer: Streamer

  public readonly players = new Players()

  private readonly log = createLogger("InternalXSyncEntity")

  constructor (
    public readonly websocketPort: number,
    streamDelay: number,
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

    this.streamer = new Streamer(
      this.onEntitiesStreamIn.bind(this),
      this.onEntitiesStreamOut.bind(this),
      this.onEntityDestroy.bind(this),
      streamDelay,
    )

    this.setupAltvEvents()
  }

  public addEntity (entity: InternalEntity): void {
    this.streamer.addEntity(entity)
  }

  public removeEntity (entity: InternalEntity): void {
    this.streamer.removeEntity(entity)
  }

  private emitWSPlayer <K extends WSClientOnServerEvents> (player: alt.Player, eventName: K, ...args: Parameters<IWSClientOnServerEvent[K]>) {
    this.wss.sendPlayer(
      player,
      eventName.toString(),
      ...args,
    )
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
    try {
      await this.wss.waitExternalIp()
      const authCode = this.wss.addPlayer(player)

      alt.emitClient(
        player,
        ClientOnServerEvents.addPlayer,
        authCode,

        // TODO wss and use clientside alt.getServerIp()

        // `wss://${this.wss.externalIp}:${this.wss.port}`,

        `ws://${this.wss.externalIp}:${this.wss.port}`,
      )

      // TEST
      const start = +new Date()

      await this.wss.waitPlayerConnect(player)

      this.log.log("player connected to ws in", +new Date() - start, "ms")

      this.players.add(player)
    } catch (e) {
      this.log.error(e)
    }
  }

  private removePlayer (player: alt.Player) {
    this.streamer.removedPlayer(player)
    this.players.remove(player)
  }

  private onEntitiesStreamIn (player: alt.Player, entities: InternalEntity[]) {
    // this.log.log("onEntitiesStreamIn", "player:", player.name, "entities:", entities.map(e => e.id))

    this.emitWSPlayer(
      player,
      WSClientOnServerEvents.EntitiesStreamIn,
      this.convertEntitiesToWSCreate(entities),
    )
  }

  private onEntitiesStreamOut (player: alt.Player, entities: InternalEntity[]) {
    // this.log.log("onEntitiesStreamOut", "player:", player.name, "entities:", entities.map(e => e.id))

    this.emitWSPlayer(
      player,
      WSClientOnServerEvents.EntitiesStreamOut,
      this.convertEntitiesToIds(entities),
    )
  }

  private onEntityDestroy (player: alt.Player, entityId: number) {
    this.emitWSPlayer(player, WSClientOnServerEvents.EntityDestroy, entityId)
  }

  private convertEntitiesToIds (entities: InternalEntity[]): number[] {
    return entities.map(({ id }) => id)
  }

  private convertEntitiesToWSCreate (entities: InternalEntity[]): WSEntityCreate[] {
    return entities.map((
      {
        poolId,
        id,
        pos,
        data,
      }) =>
      [
        poolId,
        id,
        WSVectors.altToWS(pos),
        data,
      ])
  }
}