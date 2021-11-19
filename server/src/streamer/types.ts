import type * as alt from "alt-server"

export type PlayerId = alt.Player["id"]

interface IStreamWorkerSharedEntity {
  poolId: number
  pos: alt.IVector3
  dimension: number
}

export interface IStreamWorkerCreateEntity extends IStreamWorkerSharedEntity {
  id: number
}

export interface IStreamWorkerEntity extends IStreamWorkerSharedEntity {
  netOwnerId: PlayerId | null
  inStreamPlayerIds: PlayerId[]
}

export interface IStreamWorkerSharedEntityPool {
  maxStreamedIn: number
}

export interface IStreamWorkerCreateEntityPool extends IStreamWorkerSharedEntityPool {
  id: number
}

export interface IStreamWorkerEntityPool extends IStreamWorkerSharedEntityPool {

}