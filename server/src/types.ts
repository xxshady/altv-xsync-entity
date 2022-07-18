import type * as alt from "alt-server"
import type { Entity } from "./entity"

export type EntitySyncedMetaChangeHandler<T extends Entity = Entity> = (
  entity: T,
  changedMeta: Partial<T["syncedMeta"]>,
  byPlayer: alt.Player | null
) => void
