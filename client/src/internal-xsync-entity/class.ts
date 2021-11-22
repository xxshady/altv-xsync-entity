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
import type { InternalEntityPool } from "../internal-entity-pool"

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

        entity.streamIn(posVector3, data)
        entityPool.addEntity(entity)
      }
    },

    [WSClientOnServerEvents.EntitiesStreamOut]: (entities) => {
      for (let i = 0; i < entities.length; i++) {
        const [poolId, entityId] = entities[i]
        const entityPool = this.entityPools[poolId]

        if (!entityPool) {
          throw new Error(`[WSClientOnServerEvents.EntitiesStreamOut] unknown pool: ${poolId}`)
        }

        // TODO TEST REMOVE (just for tests, useless)
        if (!entityPool.entities[entityId]) {
          throw new Error(`[WSClientOnServerEvents.EntitiesStreamOut] unknown entity: ${entityId} (pool: ${poolId})`)
        }

        entityPool.removeEntity(entityId)
      }
    },
  }

  private ws: WSClient<IWSClientOnServerEvent> | null = null

  constructor () {
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