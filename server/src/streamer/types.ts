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
  oldPos: alt.IVector2
  oldDimension: number
}

export interface IStreamerWorkerDistEntity extends IStreamerWorkerEntity {
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

/**
 * player data or removed player id as string
 */
export type PlayersUpdateData = ([PlayerId, IStreamerWorkerUpdatePlayer] | string)[]

export interface IEntityCreateQueue {
  readonly chunkSize: number
  readonly entities: InternalEntity[]
  sendPromise: { resolve: () => void } | null
  started: boolean
}