import type * as alt from "alt-server"
import type {
  IStreamWorkerCreateEntity,
  IStreamWorkerCreateEntityPool,
  PlayerId,
} from "./types"

export enum StreamerWorkerEvents {
  CreatePool,
  CreateEntity,
  DestroyEntity,
  PlayerPosChanges,
  PlayerDimensionChanges,
}

export enum StreamerFromWorkerEvents {
  StreamInPlayerEntities,
  StreamOutPlayerEntities,
  NetOwnerChangeEntities,
}

export interface IStreamerFromWorkerEvent {
  [StreamerFromWorkerEvents.StreamInPlayerEntities]: (playersAndEntities: Record<PlayerId, number[]>) => void
  [StreamerFromWorkerEvents.StreamOutPlayerEntities]: (playersAndEntities: Record<PlayerId, number[]>) => void
  [StreamerFromWorkerEvents.NetOwnerChangeEntities]: (netOwnersAndEntities: Record<PlayerId, number[]>) => void
}

export interface IStreamerWorkerEvent {
  [StreamerWorkerEvents.CreatePool]: (pool: IStreamWorkerCreateEntityPool) => void
  [StreamerWorkerEvents.CreateEntity]: (entity: IStreamWorkerCreateEntity) => void
  [StreamerWorkerEvents.DestroyEntity]: (entityId: number) => void
  [StreamerWorkerEvents.PlayerPosChanges]: (players: Record<PlayerId, alt.IVector3>) => void
  [StreamerWorkerEvents.PlayerDimensionChanges]: (players: Record<PlayerId, number>) => void
}

export type IStreamerSharedWorkerMessage<
// eslint-disable-next-line @typescript-eslint/no-explicit-any
  TEventInterface extends Record<any, any>,
  K extends keyof TEventInterface = keyof TEventInterface,
> = {
  name: K
  data: Parameters<TEventInterface[K]>
}