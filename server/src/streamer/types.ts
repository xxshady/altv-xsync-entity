import type * as alt from "alt-server"

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
}

export interface IStreamerWorkerDistEntity {
  readonly poolId: number
  readonly id: number
  dist: number
}

export type StreamerWorkerPlayersEntities = Record<PlayerId, number[]>

export interface ICurrentPlayersUpdate {
  pending: boolean
  startMs: number
  removedEntityIds: Record<number, true>
  removedPlayerIds: PlayerId[]
}