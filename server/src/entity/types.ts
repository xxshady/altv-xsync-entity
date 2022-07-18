import type { EntitySyncedMetaChangeHandler } from "../types"
import type { Entity } from "./class"

export interface IEntityEvents<T extends Entity> {
  syncedMetaChange: EntitySyncedMetaChangeHandler<T>
}
