import type { EntityData } from "../types"

export type WSVector3 = [x: number, y: number, z: number]

export type WSEntity = [poolId: number, entityId: number]
export type WSEntityCreate = [
  /**
   * {@link WSEntity}
   */
  poolId: number, entityId: number,
  pos: WSVector3,
  syncedMeta: EntityData,
  /**
   * used for entity.setNetOwner (disableMigration)
   */
  netOwnered?: WSBoolean,
]

export type WSBoolean = 1 | 0

export type WSEntityNetOwner =
  [entityId: number, isClientNetOwner: 0, syncedMeta: EntityData] |
  [entityId: number, isClientNetOwner: 1]
