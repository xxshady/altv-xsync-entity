import type * as alt from "alt-server"
import type { EntityData } from "altv-xsync-entity-shared"
import type { Entity } from "../entity"
import type { EntitySyncedMetaChangeHandler } from "../types"

export interface IWSSOptions {
  certPath?: string
  keyPath?: string
  domainName?: string
  port?: number
  /**
   * default is true
   */
  localhost?: boolean
  /**
   * default is !localhost
   */
  useWss?: boolean
}

export interface INetOwnerLogicOptions {
  entityNetOwnerChange?: (entity: Entity, netOwner: alt.Player | null, oldNetOwner: alt.Player | null) => void
  /**
   * @param player is watcher, not netowner
   */
  requestUpdateEntitySyncedMeta?: (entity: Entity, watcher: alt.Player, changedMeta: Readonly<Partial<EntityData>>) => boolean
}

export interface IOptions {
  /**
   * 100 by default
   */
  streamDelay?: number
  wss?: IWSSOptions
  netOwnerLogic?: INetOwnerLogicOptions
  customClientInit?: boolean
  syncedMetaChange?: EntitySyncedMetaChangeHandler
}
