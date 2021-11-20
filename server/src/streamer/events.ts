import type {
  IStreamerWorkerPlayerChange,
  IStreamWorkerCreateEntity,
  IStreamWorkerCreateEntityPool,
  PlayerId,
} from "./types"

export enum StreamerWorkerEvents {
  CreatePool,
  CreateEntity,
  DestroyEntity,
  PlayersUpdate,
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
  [StreamerWorkerEvents.PlayersUpdate]: (players: [PlayerId, IStreamerWorkerPlayerChange][]) => void
}

export type IStreamerSharedWorkerMessage<
// eslint-disable-next-line @typescript-eslint/no-explicit-any
  TEventInterface extends Record<any, any>,
  K extends keyof TEventInterface = keyof TEventInterface,
> = {
  name: K
  data: Parameters<TEventInterface[K]>
}