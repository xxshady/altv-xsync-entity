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
]

export type WSEntityNetOwner = [entityId: number, isClientNetOwner: 1 | 0]