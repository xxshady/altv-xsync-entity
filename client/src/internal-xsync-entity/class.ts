import * as alt from "alt-client"
import type {
  IClientOnServerEvent,
  IWSClientOnServerEvent,
} from "altv-xsync-entity-shared"
import {
  WSVectors,
  ClientOnServerEvents,
  WSClientOnServerEvents,
} from "altv-xsync-entity-shared"
import { WSClient } from "../ws-client"
import { createLogger } from "altv-xlogger"
import { InternalEntityPool } from "../internal-entity-pool"

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

  private readonly log = createLogger("XSyncEntity")
  private readonly entityPools: Record<InternalEntityPool["id"], InternalEntityPool> = {}

  private readonly WSEventHandlers: IWSClientOnServerEvent = {
    [WSClientOnServerEvents.EntitiesStreamIn]: (entities) => {
      for (let i = 0; i < entities.length; i++) {
        const [poolId, entityId, pos, data] = entities[i]
        const entityPool = this.entityPools[poolId]

        if (!entityPool) {
          throw new Error(`[WSClientOnServerEvents.EntitiesStreamIn] unknown pool id: ${poolId}`)
        }

        const posVector3 = WSVectors.WStoAlt(pos)
        const entity = new entityPool.EntityClass(
          entityId,
          posVector3,
          data,
        )

        entityPool.streamInEntity(entity)
      }
    },

    [WSClientOnServerEvents.EntitiesStreamOut]: (entityIds) => {
      // this.log.log("from server stream out:", JSON.stringify(entities))

      for (let i = 0; i < entityIds.length; i++) {
        InternalEntityPool.streamOutEntity(entityIds[i])
      }
    },

    [WSClientOnServerEvents.EntityDestroy]: (entityId) => {
      InternalEntityPool.streamOutEntity(entityId)
    },
  }

  private ws: WSClient<IWSClientOnServerEvent> | null = null

  constructor () {
    if (InternalXSyncEntity._instance) {
      throw new Error("InternalXSyncEntity already initialized")
    }

    InternalXSyncEntity._instance = this

    this.setupAltvEvents()
  }

  public addEntityPool (pool: InternalEntityPool): void {
    if (this.entityPools[pool.id]) {
      throw new Error(`[addEntityPool] already exist pool id: ${pool.id}`)
    }

    this.entityPools[pool.id] = pool
  }

  private setupAltvEvents () {
    alt.onServer(
      ClientOnServerEvents.addPlayer,
      this.onAddPlayer.bind(this) as IClientOnServerEvent[ClientOnServerEvents.addPlayer],
    )
  }

  private onAddPlayer (authCode: string, serverUrl: string) {
    this.log.log("onAddPlayer", authCode, serverUrl)

    const ws = new WSClient<IWSClientOnServerEvent>(serverUrl, authCode, {
      events: this.WSEventHandlers,
    })

    this.ws = ws
  }
}