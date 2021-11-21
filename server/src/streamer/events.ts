import type {
  IStreamerWorkerCreateEntity,
  IStreamerWorkerCreateEntityPool,
  IStreamerWorkerUpdatePlayer,
  PlayerId,
  StreamerWorkerPlayersEntities,
} from "./types"

export enum StreamerWorkerEvents {
  CreatePool,
  CreateEntity,
  DestroyEntity,
  PlayersUpdate,
}

export enum StreamerFromWorkerEvents {
  StreamChangePlayerEntities,
  NetOwnerChangeEntities,
}

export interface IStreamerFromWorkerEvent {
  [StreamerFromWorkerEvents.StreamChangePlayerEntities]: (
    playersInEntities: StreamerWorkerPlayersEntities,
    playersOutEntities: StreamerWorkerPlayersEntities
  ) => void
  [StreamerFromWorkerEvents.NetOwnerChangeEntities]: (netOwnersAndEntities: StreamerWorkerPlayersEntities) => void
}

export interface IStreamerWorkerEvent {
  [StreamerWorkerEvents.CreatePool]: (pool: IStreamerWorkerCreateEntityPool) => void
  [StreamerWorkerEvents.CreateEntity]: (entity: IStreamerWorkerCreateEntity) => void
  [StreamerWorkerEvents.DestroyEntity]: (entityId: number) => void
  // player updated info or removed player id array
  [StreamerWorkerEvents.PlayersUpdate]: (players: ([PlayerId, IStreamerWorkerUpdatePlayer] | PlayerId)[]) => void
}

export type IStreamerSharedWorkerMessage<
// eslint-disable-next-line @typescript-eslint/no-explicit-any
  TEventInterface extends Record<any, any>,
  K extends keyof TEventInterface = keyof TEventInterface,
> = {
  name: K
  data: Parameters<TEventInterface[K]>
}