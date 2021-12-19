import type * as alt from "alt-server"
import type { InternalEntity } from "../internal-entity"

export type PlayerId = alt.Player["id"]

export interface IStreamerWorkerCreateEntity {
  readonly id: number
  readonly poolId: number
  readonly pos: alt.IVector2
  readonly dimension: number
  readonly streamRange: number
  readonly migrationRange: number
}

export interface IStreamerWorkerEntity extends IStreamerWorkerCreateEntity {
  netOwnerId: PlayerId | null
  streamPlayerIds: Set<PlayerId>
  netOwnerDist: number
  arrayIndex: number
}

export interface IStreamerWorkerEntityPool {
  readonly maxStreamedIn: number
}

export interface IStreamerWorkerCreateEntityPool extends IStreamerWorkerEntityPool {
  id: number
}

export interface IStreamerWorkerUpdatePlayer {
  readonly pos2d: alt.IVector2
  readonly dimension: number
}

export interface IStreamerWorkerPlayer {
  streamedEntityIds: Set<number>
  owneredEntityIds: Set<PlayerId>
  oldPos: alt.IVector2
  oldDimension: number
}

export interface IStreamerWorkerArrEntity extends IStreamerWorkerEntity {
  dist: number
}

export type StreamerWorkerPlayersEntities = Record<PlayerId, number[]>

export interface ICurrentPlayersUpdate {
  pending: boolean
  startMs: number
  /**
   * entity id as string
   */
  removedEntityIds: Record<string, true>
  /**
   * player id as string
   */
  removedPlayerIds: Record<string, true>
}

export type PlayersUpdateData = ([PlayerId, IStreamerWorkerUpdatePlayer])[]

export interface IEntityCreateQueue {
  readonly chunkSize: number
  readonly entities: InternalEntity[]
  sendPromise: { resolve: () => void } | null
  started: boolean
}

export type EntityIdsNetOwnerChanges = [entityId: number, oldPlayer: number | null, newPlayer: number | null][]
export type EntityIdsNetOwnerChangesDict = Record<number, [oldPlayer: number | null, newPlayer: number | null]>