import type * as alt from "alt-server"
import type { Entity } from "./entity"
import type { EntityPool } from "./entity-pool"

export type EntitySyncedMetaChangeHandler<T extends Entity = Entity> = (
  entity: T,
  changedMeta: Partial<T["syncedMeta"]>,
  byPlayer: alt.Player | null
) => void

export type EntityStreamInHandler<T extends Entity = Entity> = (
  entity: T,
  toPlayer: alt.Player
) => void

export type EntityStreamOutHandler<T extends Entity = Entity> = (
  entity: T,
  fromPlayer: alt.Player
) => void

export type EntityNetOwnerChangeHandler<T extends Entity = Entity> = (entity: T, netOwner: alt.Player | null, oldNetOwner: alt.Player | null) => void

export interface IEntityPoolEvent<T extends Entity = Entity> {
  syncedMetaChange: EntitySyncedMetaChangeHandler<T>
  streamIn: EntityStreamInHandler<T>
  streamOut: EntityStreamOutHandler<T>
  netOwnerChange: EntityNetOwnerChangeHandler<T>
}

export type EntityPoolEventNames = keyof IEntityPoolEvent

export type EntityPoolEventHandlers = { [K in EntityPoolEventNames]: Map<EntityPool, IEntityPoolEvent[K]> }
