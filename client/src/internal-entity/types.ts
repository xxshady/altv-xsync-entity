import type * as alt from "alt-client"
import type { Entity } from "../entity"

type EntitySyncedMeta<T extends Entity> = Readonly<T["syncedMeta"]>

export interface IEntityEventHandlers<T extends Entity = Entity> {
  streamIn: (entity: T) => void
  streamOut: (entity: T) => void
  posChange?: (entity: T, pos: alt.IVector3) => void
  syncedMetaChange?: (entity: T, syncedMeta: Partial<EntitySyncedMeta<T>>) => void
  netOwnerChange?: (entity: T, isLocalPlayerNetOwner: boolean, syncedMeta?: EntitySyncedMeta<T>) => void
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type ParametersExceptFirst<F> = F extends (arg0: any, ...rest: infer R) => any ? R : never
