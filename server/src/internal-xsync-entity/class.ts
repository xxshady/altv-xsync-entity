import * as alt from "alt-server"
import { IdProvider } from "../id-provider"
import { WSServer } from "../ws-server"
import { Streamer } from "../streamer"
import type {
  IWSClientOnServerEvent,
  WSEntityCreate,
  WSEntityNetOwner,
} from "altv-xsync-entity-shared"
import {
  WSVectors,
  ClientOnServerEvents,
  WSClientOnServerEvents,
} from "altv-xsync-entity-shared"
import { Players } from "../players"
import { createLogger } from "altv-xlogger"
import type { InternalEntity } from "../internal-entity"
import type {
  INetOwnerLogicOptions,
  IWSSOptions,
} from "../xsync-entity/types"

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
  public readonly streamer: Streamer
  public readonly idProvider = new IdProvider()
  public readonly players = new Players()

  private readonly log = createLogger("InternalXSyncEntity")
  private readonly wsServerUrl: string

  private readonly netOwnerChangeHandler: INetOwnerLogicOptions["entityNetOwnerChange"]

  constructor (
    streamDelay: number,
    wss: Required<IWSSOptions>,
    netOwnerLogic?: INetOwnerLogicOptions,
  ) {
    if (InternalXSyncEntity._instance) {
      throw new Error("InternalXSyncEntity already initialized")
    }

    InternalXSyncEntity._instance = this

    const {
      certPath,
      keyPath,
      domainName,
      port,
      localhost,
      useWss,
    } = wss

    this.wsServerUrl = localhost ? `localhost:${port}` : `wss://${domainName}`

    this.wss = new WSServer(
      port,
      {
        events: {},
        certPath,
        keyPath,
        useWss,
        socketClose: this.onWSSocketClose.bind(this),
      },
    )

    this.streamer = new Streamer(
      streamDelay,
      !!netOwnerLogic,
      this.onEntitiesStreamIn.bind(this),
      this.onEntitiesStreamOut.bind(this),
      this.onEntityDestroy.bind(this),
      this.onEntityNetOwnerChange.bind(this),
    )

    this.netOwnerChangeHandler = netOwnerLogic?.entityNetOwnerChange

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
      this.log.log(`~gl~addPlayer:~w~ ${player.valid ? player.id : "unknown id"}`)

      const authCode = this.wss.addPlayer(player)

      alt.emitClient(
        player,
        ClientOnServerEvents.AddPlayer,
        authCode,
        this.wsServerUrl,
      )

      const start = +new Date()

      await this.wss.waitPlayerConnect(player)

      this.log.log("player connected to ws in", +new Date() - start, "ms")

      this.players.add(player)
    } catch (e) {
      this.log.error(e)
    }
  }

  private removePlayer (player: alt.Player) {
    this.log.log(`~yl~removePlayer:~w~ ${player.valid ? player.id : "unknown id"}`)

    if (!this.players.has(player)) return

    this.players.remove(player)
    this.streamer.removePlayer(player)
    this.wss.removePlayer(player)
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

  private onEntityNetOwnerChange (entityNetOwnerChanges: [entity: InternalEntity, oldNetOwner: alt.Player | null, newNetOwner: alt.Player | null][]) {
    const WSEntitiesData = new Map<alt.Player, WSEntityNetOwner[]>()

    for (let i = 0; i < entityNetOwnerChanges.length; i++) {
      const [entity, oldNetOwner, newNetOwner] = entityNetOwnerChanges[i]

      if (oldNetOwner) {
        const entities = WSEntitiesData.get(oldNetOwner) ?? []
        entities.push([entity.id, 0])
        WSEntitiesData.set(oldNetOwner, entities)
      }
      if (newNetOwner) {
        const entities = WSEntitiesData.get(newNetOwner) ?? []
        entities.push([entity.id, 1])
        WSEntitiesData.set(newNetOwner, entities)
      }

      this.netOwnerChangeHandler?.(entity.publicInstance, newNetOwner, oldNetOwner)
    }

    for (const [player, data] of WSEntitiesData) {
      this.emitWSPlayer(player, WSClientOnServerEvents.EntitiesNetOwnerChange, data)
    }
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

  private onWSSocketClose (player: alt.Player) {
    this.log.warn("socket close player:", player.name, "trying to add again..")

    this.removePlayer(player)
    this.addPlayer(player).catch(this.log.error)
  }
}