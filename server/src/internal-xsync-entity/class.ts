import * as alt from "alt-server"
import { IdProvider } from "../id-provider"
import { WSConnectTimeoutError, WSServer } from "../ws-server"
import { Streamer } from "../streamer"
import type {
  IWSClientOnServerEvent,
  IWSServerOnClientEvent,
  WSBoolean,
  WSEntityCreate,
  WSEntityNetOwner,
} from "altv-xsync-entity-shared"
import {
  WSServerOnClientEvents,
  WSVectors,
  ClientOnServerEvents,
  WSClientOnServerEvents,
} from "altv-xsync-entity-shared"
import { Players } from "../players"
import { createLogger, LogLevel } from "altv-xlogger"
import { InternalEntity } from "../internal-entity"
import type {
  INetOwnerLogicOptions,
  IWSSOptions,
} from "../xsync-entity/types"
import type { FirstPlayerParamToInterface } from "../utils/types"
import type { PlayerRemoveHandler } from "./types"
import { dist2dWithRange } from "../utils/dist-2d-range"
import type { EntityPool } from "../entity-pool"
import type {
  EntityNetOwnerChangeHandler,
  EntityPoolEventHandlers,
  EntityPoolEventNames,
  EntityStreamInHandler,
  EntityStreamOutHandler,
  EntitySyncedMetaChangeHandler,
  IEntityPoolEvent,
} from "../types"

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

  private readonly log = createLogger("xsync:internal", {
    logLevel: ___DEV_MODE ? LogLevel.Info : LogLevel.Warn,
  })

  private readonly wsServerUrl: string

  private readonly netOwnerChangeHandler: INetOwnerLogicOptions["entityNetOwnerChange"]
  private readonly requestUpdateEntitySyncedMetaHandler: INetOwnerLogicOptions["requestUpdateEntitySyncedMeta"]

  private readonly playerRemoveHandlers = new Map<alt.Player, Set<PlayerRemoveHandler>>()

  private readonly WSEventHandlers: FirstPlayerParamToInterface<IWSServerOnClientEvent> = {
    [WSServerOnClientEvents.UpdateEntitySyncedMeta]: (player, entityId, meta) => {
      const entity = this.getEntityForNetOwner(player, entityId)
      if (!entity) return

      entity.netOwnerSyncedMetaUpdate(meta)
      this.updateEntitySyncedMeta(entity, meta, player)
    },

    [WSServerOnClientEvents.UpdateEntityPos]: (player, entityId, pos) => {
      const entity = this.getEntityForNetOwner(player, entityId)
      if (!entity) return

      entity.netOwnerPosUpdate(WSVectors.WStoAlt(pos))
      this.updateEntityPos(entity, player)
    },

    [WSServerOnClientEvents.RequestUpdateEntitySyncedMeta]: (player, entityId, meta) => {
      if (!this.requestUpdateEntitySyncedMetaHandler) {
        this.log.error("[RequestUpdateEntitySyncedMeta] received request, while handler is not set")
        return
      }

      const entity = InternalEntity.all[entityId]
      if (!entity) {
        this.log.warn(`[RequestUpdateEntitySyncedMeta] received invalid entityId: ${entityId}`)
        return
      }

      const { streamRange } = entity
      if (dist2dWithRange(entity.pos, player.pos, streamRange) > streamRange) {
        this.log.warn(`[RequestUpdateEntitySyncedMeta] received entityId: ${entityId} over stream range (${streamRange})`)
        return
      }

      const result = this.requestUpdateEntitySyncedMetaHandler(entity.publicInstance, player, meta)
      if (!result) {
        this.log.log(`[RequestUpdateEntitySyncedMeta] canceled, player: ${player.name} entity id: ${entityId}`)
        return
      }

      entity.netOwnerSyncedMetaUpdate(meta)
      this.updateEntitySyncedMeta(entity, meta, player)
    },
  }

  private readonly entitySyncedMetaChangeHandler: EntitySyncedMetaChangeHandler

  private readonly entityEventsPoolHandlers: EntityPoolEventHandlers = {
    streamIn: new Map(),
    streamOut: new Map(),
    syncedMetaChange: new Map(),
    netOwnerChange: new Map(),
  }

  constructor (
    streamDelay: number,
    wss: Required<IWSSOptions>,
    private readonly customClientInit: boolean,
    netOwnerLogic?: INetOwnerLogicOptions,
    entitySyncedMetaChange?: EntitySyncedMetaChangeHandler,
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

    // TODO: add explicit log method to logger
    const { logLevel } = this.log
    this.log.logLevel = LogLevel.Info
    this.log.log(`use client connection url: "${this.wsServerUrl}"`)
    this.log.logLevel = logLevel

    this.wss = new WSServer(
      port,
      {
        events: this.WSEventHandlers,
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
    this.requestUpdateEntitySyncedMetaHandler = netOwnerLogic?.requestUpdateEntitySyncedMeta

    this.setupAltvEvents()

    this.entitySyncedMetaChangeHandler = (entity, changedMeta, byPlayer) => {
      entitySyncedMetaChange?.(entity, changedMeta, byPlayer)

      this.entityEventsPoolHandlers.syncedMetaChange
        .get(entity.pool)
        ?.(entity, changedMeta, byPlayer)
    }
  }

  public addEntity (entity: InternalEntity): void {
    this.streamer.addEntity(entity)
  }

  public removeEntity (entity: InternalEntity): void {
    this.streamer.removeEntity(entity)
  }

  public updateEntityPos (entity: InternalEntity, byNetOwner: alt.Player | null): void {
    this.streamer.updateEntityPos(entity)

    this.emitWSStreamedPlayers(
      entity,
      WSClientOnServerEvents.EntityPosChange,
      [
        entity.id,
        WSVectors.altToWS(entity.pos),
      ],
      byNetOwner,
    )
  }

  public updateEntitySyncedMeta (entity: InternalEntity, syncedMeta: Record<string, unknown>, byPlayer: alt.Player | null): void {
    this.entitySyncedMetaChangeHandler(entity.publicInstance, syncedMeta, byPlayer)

    this.emitWSStreamedPlayers(
      entity,
      WSClientOnServerEvents.EntitySyncedMetaChange,
      [
        entity.id,
        syncedMeta,
      ],
      byPlayer,
    )
  }

  public setEntityNetOwner (entity: InternalEntity, netOwner: alt.Player, disableMigration: boolean): void {
    this.streamer.setEntityNetOwner(entity, netOwner, disableMigration)
  }

  public resetEntityNetOwner (entity: InternalEntity): void {
    this.streamer.resetEntityNetOwner(entity)
  }

  public onPlayerRemove (player: alt.Player, handler: (player: alt.Player) => void): () => void {
    const handlers = this.playerRemoveHandlers.get(player) ?? new Set()

    handlers.add(handler)

    this.playerRemoveHandlers.set(player, handlers)

    return () => {
      this.playerRemoveHandlers.get(player)?.delete(handler)
    }
  }

  public addEntityPoolEventHandlers (entityPool: EntityPool, handlers: Partial<IEntityPoolEvent>): void {
    for (const _event in handlers) {
      const event = _event as EntityPoolEventNames

      this.entityEventsPoolHandlers[event].set(
        entityPool,
        // TODO: fix this shit
        handlers[event] as EntitySyncedMetaChangeHandler &
        EntityStreamInHandler &
        EntityStreamOutHandler &
        EntityNetOwnerChangeHandler,
      )
    }
  }

  private emitWSPlayer <K extends WSClientOnServerEvents> (
    player: alt.Player,
    eventName: K,
    ...args: Parameters<IWSClientOnServerEvent[K]>
  ) {
    this.wss.sendPlayer(
      player,
      eventName.toString(),
      ...args,
    )
  }

  private emitWSStreamedPlayers <K extends WSClientOnServerEvents> (
    entity: InternalEntity,
    eventName: K,
    args: Parameters<IWSClientOnServerEvent[K]>,
    excludePlayer: alt.Player | null,
  ) {
    const players = this.streamer.getEntityStreamedPlayers(entity, excludePlayer)

    for (let i = 0; i < players.length; i++) {
      this.emitWSPlayer(
        players[i],
        eventName,
        ...args,
      )
    }
  }

  private setupAltvEvents () {
    if (!this.customClientInit) {
      alt.on("playerConnect", this.initClientConnect.bind(this))
    }

    alt.on("playerDisconnect", this.onPlayerDisconnect.bind(this))
  }

  public initClientConnect (player: alt.Player): void {
    this.addPlayer(player).catch((e) => {
      if (e instanceof WSConnectTimeoutError) return
      this.log.error("initClientConnect error:", e.stack)
    })
  }

  private onPlayerDisconnect (player: alt.Player) {
    this.removePlayer(player)
  }

  private async addPlayer (player: alt.Player, connectTimeoutMs?: number) {
    this.log.log(`~gl~addPlayer:~w~ ${player.valid ? player.id : "unknown id"}`)

    const authCode = this.wss.addPlayer(player)

    alt.emitClient(
      player,
      ClientOnServerEvents.AddPlayer,
      authCode,
      this.wsServerUrl,
    )

    const start = +new Date()

    await this.wss.waitPlayerConnect(player, connectTimeoutMs)

    this.log.log("player connected to ws in", +new Date() - start, "ms")

    this.players.add(player)
  }

  private removePlayer (player: alt.Player) {
    this.log.log(`~yl~removePlayer:~w~ ${player.valid ? player.id : "unknown id"}`)

    if (!this.players.has(player)) return

    this.players.remove(player)
    this.streamer.removePlayer(player)
    this.wss.removePlayer(player)

    const handlers = this.playerRemoveHandlers.get(player)
    if (!handlers) return

    this.playerRemoveHandlers.delete(player)
    for (const handler of handlers) handler(player)
  }

  private onEntitiesStreamIn (player: alt.Player, entities: InternalEntity[]) {
    // this.log.log("onEntitiesStreamIn", "player:", player.name, "entities:", entities.map(e => e.id))

    this.emitWSPlayer(
      player,
      WSClientOnServerEvents.EntitiesStreamIn,
      this.convertEntitiesToWSCreate(entities, player, ({ publicInstance }) => {
        this.entityEventsPoolHandlers.streamIn
          .get(publicInstance.pool)
          ?.(publicInstance, player)
      }),
    )
  }

  private onEntitiesStreamOut (player: alt.Player, entities: InternalEntity[]) {
    // this.log.log("onEntitiesStreamOut", "player:", player.name, "entities:", entities.map(e => e.id))

    this.emitWSPlayer(
      player,
      WSClientOnServerEvents.EntitiesStreamOut,
      this.convertEntitiesToIds(
        entities,
        ({ publicInstance }) => {
          this.entityEventsPoolHandlers.streamOut
            .get(publicInstance.pool)
            ?.(publicInstance, player)
        },
      ),
    )
  }

  private onEntityDestroy (player: alt.Player, entityId: number) {
    this.emitWSPlayer(player, WSClientOnServerEvents.EntityDestroy, entityId)
  }

  // TODO: dont send event to client, if this client is already netowner,
  // send netOwnered param in entity stream in event instead
  private onEntityNetOwnerChange (
    entityNetOwnerChanges: [
      entity: InternalEntity,
      oldNetOwner: alt.Player | null,
      newNetOwner: alt.Player | null,
    ][],
  ) {
    const WSEntitiesData = new Map<alt.Player, WSEntityNetOwner[]>()

    for (let i = 0; i < entityNetOwnerChanges.length; i++) {
      const [entity, oldNetOwner, newNetOwner] = entityNetOwnerChanges[i]

      if (oldNetOwner) {
        const entities = WSEntitiesData.get(oldNetOwner) ?? []
        entities.push([entity.id, 0, entity.syncedMeta])
        WSEntitiesData.set(oldNetOwner, entities)
      }
      if (newNetOwner) {
        const entities = WSEntitiesData.get(newNetOwner) ?? []
        entities.push([entity.id, 1])
        WSEntitiesData.set(newNetOwner, entities)
      }

      entity.netOwnerChange(newNetOwner)
      this.netOwnerChangeHandler?.(entity.publicInstance, newNetOwner, oldNetOwner)

      this.entityEventsPoolHandlers.netOwnerChange
        .get(entity.publicInstance.pool)
        ?.(entity.publicInstance, newNetOwner, oldNetOwner)
    }

    for (const [player, data] of WSEntitiesData) {
      this.emitWSPlayer(player, WSClientOnServerEvents.EntitiesNetOwnerChange, data)
    }
  }

  private convertEntitiesToIds (entities: InternalEntity[], callback?: (entity: InternalEntity) => void): number[] {
    return entities.map((entity) => {
      callback?.(entity)
      return entity.id
    })
  }

  private convertEntitiesToWSCreate (entities: InternalEntity[], player: alt.Player, callback?: (entity: InternalEntity) => void): WSEntityCreate[] {
    return entities.map((entity) => {
      const {
        poolId,
        id,
        pos,
        syncedMeta,
        disabledMigration,
        netOwner,
      } = entity

      const entityCreate: WSEntityCreate = [
        poolId,
        id,
        WSVectors.altToWS(pos),
        syncedMeta,
      ]

      if (disabledMigration && netOwner === player) {
        // netOwnered param
        entityCreate.push(1 as WSBoolean)
      }

      callback?.(entity)

      return entityCreate
    })
  }

  private onWSSocketClose (player: alt.Player) {
    this.log.warn("socket close player:", `${player.name} [${player.id}]`, "trying to add again..")

    this.removePlayer(player)
    this.addPlayer(player, 30_000)
      .catch((error) => {
        if (error instanceof WSConnectTimeoutError) {
          const { playerInfo } = error
          if (!playerInfo) return

          this.log.error("socket close player:", playerInfo, "connect timed out")
          return
        }

        this.log.error("socket close", error.stack)
      })
  }

  private getEntityForNetOwner (netOwner: alt.Player, entityId: number): InternalEntity | null {
    const entity = InternalEntity.all[entityId]
    if (!entity) {
      this.log.warn(`[getEntityForNetOwner] received invalid entityId: ${entityId}`)
      return null
    }

    if (entity.netOwner !== netOwner) {
      this.log.warn(`[getEntityForNetOwner] player is not netowner (${netOwner.id}) of entityId: ${entityId}`)
      return null
    }

    return entity
  }
}
