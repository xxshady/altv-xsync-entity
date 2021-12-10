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
import { createLogger, LogLevel } from "altv-xlogger"
import { InternalEntityPool } from "../internal-entity-pool"
import { getServerIp } from "../utils/get-server-ip"

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

  private readonly log = createLogger("XSyncEntity", {
    logLevel: ___DEV_MODE ? LogLevel.Info : LogLevel.Warn,
  })

  private readonly entityPools: Record<InternalEntityPool["id"], InternalEntityPool> = {}

  private readonly WSEventHandlers: IWSClientOnServerEvent = {
    [WSClientOnServerEvents.EntitiesStreamIn]: (entities) => {
      this.log.log(`stream in: ${entities.length}`)

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
      this.log.log(`stream out: ${entityIds.length}`)

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
      ClientOnServerEvents.AddPlayer,
      this.onAddPlayer.bind(this) as IClientOnServerEvent[ClientOnServerEvents.AddPlayer],
    )
  }

  private onAddPlayer (authCode: string, serverUrl: string, serverPort: number) {
    let fullServerUrl: string

    if (serverUrl.startsWith("localhost")) {
      // serverUrl is: localhost:<port>
      const port = serverUrl.slice(serverUrl.indexOf(":") + 1)

      fullServerUrl = `ws://${getServerIp()}:${port}`
    } else {
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
      } catch (e) {
        this.log.error(e)
      }
    }
  }
}