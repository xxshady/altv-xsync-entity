import type * as alt from "alt-shared"
import type {
  IStreamerWorkerCreateEntity,
  IStreamerWorkerCreateEntityPool,
  PlayersUpdateData,
  StreamerWorkerPlayersEntities,
} from "./types"

export enum StreamerWorkerEvents {
  CreatePool,
  CreateEntities,
  DestroyEntity,
  PlayersUpdate,
}

export enum StreamerFromWorkerEvents {
  StreamChangePlayerEntities,
  NetOwnerChangeEntities,
  EntitiesCreated,
}

export interface IStreamerFromWorkerEvent {
  [StreamerFromWorkerEvents.StreamChangePlayerEntities]: (
    playersInEntities: StreamerWorkerPlayersEntities,
    playersOutEntities: StreamerWorkerPlayersEntities
  ) => void
  [StreamerFromWorkerEvents.NetOwnerChangeEntities]: (netOwnersAndEntities: StreamerWorkerPlayersEntities) => void
  [StreamerFromWorkerEvents.EntitiesCreated]: () => void
}

export interface IStreamerWorkerEvent {
  [StreamerWorkerEvents.CreatePool]: (pool: IStreamerWorkerCreateEntityPool) => void
  [StreamerWorkerEvents.CreateEntities]: (entities: IStreamerWorkerCreateEntity[]) => void
  [StreamerWorkerEvents.DestroyEntity]: (entityId: number) => void
  // player updated info or removed player id array
  [StreamerWorkerEvents.PlayersUpdate]: (players: PlayersUpdateData) => void
}

export type IStreamerSharedWorkerMessage<
// eslint-disable-next-line @typescript-eslint/no-explicit-any
  TEventInterface extends Record<any, any>,
  K extends keyof TEventInterface = keyof TEventInterface,
> = {
  name: K
  data: Parameters<TEventInterface[K]>
}