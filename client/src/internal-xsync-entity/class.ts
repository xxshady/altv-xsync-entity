import * as alt from "alt-client"
import type {
  EntityData,
  IClientOnServerEvent,
  IWSClientOnServerEvent,
  IWSServerOnClientEvent,
  WSBoolean,
} from "altv-xsync-entity-shared"
import {
  WSServerOnClientEvents,
  WSVectors,
  ClientOnServerEvents,
  WSClientOnServerEvents,
} from "altv-xsync-entity-shared"
import { WSClient } from "../ws-client"
import { createLogger, LogLevel } from "altv-xlogger"
import { InternalEntityPool } from "../internal-entity-pool"
import { getServerIp } from "../utils/get-server-ip"
import type { INetOwnerLogicOptions } from "../xsync-entity/types"
import { InternalEntity } from "../internal-entity"
import type { Entity as PublicEntity } from "../entity"

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

  private readonly log = createLogger("xsync > main", {
    logLevel: ___DEV_MODE ? LogLevel.Info : LogLevel.Warn,
  })

  private readonly entityPools: Record<InternalEntityPool["id"], InternalEntityPool> = {}
  private readonly netOwnerChangeHandler?: INetOwnerLogicOptions["entityNetOwnerChange"]
  private readonly netOwneredEntityIds = new Set<number>()

  private readonly WSEventHandlers: IWSClientOnServerEvent = {
    [WSClientOnServerEvents.EntitiesStreamIn]: (entities) => {
      this.log.log(`stream in amount of entities: ${entities.length}`)

      for (let i = 0; i < entities.length; i++) {
        const [poolId, entityId, pos, syncedMeta, netOwnered] = entities[i]
        const entityPool = this.entityPools[poolId]

        if (!entityPool) {
          throw new Error(`[WSClientOnServerEvents.EntitiesStreamIn] unknown pool id: ${poolId}`)
        }

        const posVector3 = WSVectors.WStoAlt(pos)

        // TODO: make public Entity constructor private and remove this shit
        InternalEntity.reservedEntities[entityId] = true

        const entity = new entityPool.EntityClass(
          entityId,
          posVector3,
          syncedMeta,
        )

        this.log.log("stream in id:", entity.id, "type:", entityPool.EntityClass.name)

        entityPool.streamInEntity(entity)

        if (netOwnered) {
          this.handleEntityNetOwnerChange(entity.id, netOwnered)
        }
      }
    },

    [WSClientOnServerEvents.EntitiesStreamOut]: (entityIds) => {
      this.log.log(`stream out amount of entities: ${entityIds.length}`)

      for (let i = 0; i < entityIds.length; i++) {
        const entity = InternalEntityPool.entities[entityIds[i]]

        if (!entity) continue

        this.log.log("stream out id:", entity.id, "type:", entity.publicInstance.constructor?.name)

        this.removeNetOwneredEntity(entity)
        InternalEntityPool.streamOutEntity(entityIds[i])
      }
    },

    [WSClientOnServerEvents.EntityDestroy]: (entityId) => {
      const entity = InternalEntityPool.entities[entityId]

      if (!entity) return

      this.removeNetOwneredEntity(entity)
      InternalEntityPool.streamOutEntity(entityId)
    },

    [WSClientOnServerEvents.EntitiesNetOwnerChange]: (entities) => {
      for (let i = 0; i < entities.length; i++) {
        const [entityId, isLocalPlayerNetOwner, syncedMeta] = entities[i]
        this.handleEntityNetOwnerChange(entityId, isLocalPlayerNetOwner, syncedMeta)
      }
    },

    [WSClientOnServerEvents.EntityPosChange]: (entityId, pos) => {
      const entity = InternalEntityPool.entities[entityId]
      if (!entity) return

      entity.posChange(WSVectors.WStoAlt(pos))
    },

    [WSClientOnServerEvents.EntitySyncedMetaChange]: (entityId, syncedMeta) => {
      const entity = InternalEntityPool.entities[entityId]
      if (!entity) return

      entity.syncedMetaChange(syncedMeta)
    },
  }

  private ws: WSClient<IWSClientOnServerEvent> | null = null

  constructor (netOwnerLogic?: INetOwnerLogicOptions) {
    if (InternalXSyncEntity._instance) {
      throw new Error("InternalXSyncEntity already initialized")
    }

    InternalXSyncEntity._instance = this

    this.netOwnerChangeHandler = netOwnerLogic?.entityNetOwnerChange

    this.setupAltvEvents()
  }

  public addEntityPool (pool: InternalEntityPool): void {
    if (this.entityPools[pool.id]) {
      throw new Error(`[addEntityPool] already exist pool id: ${pool.id}`)
    }

    this.entityPools[pool.id] = pool
  }

  public updateNetOwnerSyncedMeta<T extends PublicEntity> (entity: T, meta: Partial<T["syncedMeta"]>): void {
    this.emitWSServer(WSServerOnClientEvents.UpdateEntitySyncedMeta, entity.id, meta)
  }

  public updateNetOwnerPos<T extends PublicEntity> (entity: T, pos: alt.IVector3): void {
    this.emitWSServer(WSServerOnClientEvents.UpdateEntityPos, entity.id, WSVectors.altToWS(pos))
  }

  private setupAltvEvents () {
    alt.onServer(
      ClientOnServerEvents.AddPlayer,
      this.onAddPlayer.bind(this) as IClientOnServerEvent[ClientOnServerEvents.AddPlayer],
    )
  }

  private emitWSServer <K extends WSServerOnClientEvents> (
    eventName: K,
    ...args: Parameters<IWSServerOnClientEvent[K]>
  ) {
    this.ws?.send(
      eventName.toString(),
      ...args,
    )
  }

  private onAddPlayer (authCode: string, serverUrl: string) {
    let fullServerUrl: string

    if (serverUrl.startsWith("localhost")) {
      // serverUrl is: localhost:<port>
      const port = serverUrl.slice(serverUrl.indexOf(":") + 1)

      fullServerUrl = `ws://${getServerIp()}:${port}`
    }
    else {
      fullServerUrl = `${serverUrl}`
    }

    this.log.log("onAddPlayer", authCode, serverUrl, fullServerUrl)

    const ws = new WSClient<IWSClientOnServerEvent>(fullServerUrl, authCode, {
      events: this.WSEventHandlers,
      close: this.onWSClose.bind(this),
    })

    this.ws = ws
  }

  private onWSClose () {
    this.log.log("on ws close destroy entities")

    // TODO destroy only streamed in entities
    for (const entityId in InternalEntityPool.entities) {
      try {
        InternalEntityPool.entities[entityId]?.streamOut()
      }
      catch (e) {
        this.log.error(e)
      }
    }
  }

  private removeNetOwneredEntity (entity: InternalEntity) {
    this.netOwneredEntityIds.delete(entity.id)
  }

  private handleEntityNetOwnerChange (entityId: number, isLocalPlayerNetOwner?: WSBoolean, syncedMeta?: EntityData) {
    const entity = InternalEntityPool.entities[entityId]
    if (!entity) return

    const netOwnered = !!isLocalPlayerNetOwner

    syncedMeta && entity.syncedMetaChange(syncedMeta)
    entity.netOwnerChange(netOwnered, syncedMeta)
    this.netOwnerChangeHandler?.(entity.publicInstance, netOwnered)

    if (netOwnered) {
      this.netOwneredEntityIds.add(entity.id)
    }
    else this.removeNetOwneredEntity(entity)
  }
}
