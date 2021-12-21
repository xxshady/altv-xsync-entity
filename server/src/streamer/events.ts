import type * as alt from "alt-server"
import type {
  EntityIdsNetOwnerChanges,
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
  EnableNetOwnerLogic,
  SetEntityPos,
}

export enum StreamerFromWorkerEvents {
  StreamChangePlayerEntities,
  EntitiesNetOwnerChange,
  EntitiesCreated,
}

export interface IStreamerFromWorkerEvent {
  [StreamerFromWorkerEvents.StreamChangePlayerEntities]: (
    playersInEntities: StreamerWorkerPlayersEntities,
    playersOutEntities: StreamerWorkerPlayersEntities
  ) => void
  [StreamerFromWorkerEvents.EntitiesNetOwnerChange]: (entityIdsNetOwnerChanges: EntityIdsNetOwnerChanges) => void
  [StreamerFromWorkerEvents.EntitiesCreated]: () => void
}

export interface IStreamerWorkerEvent {
  [StreamerWorkerEvents.CreatePool]: (pool: IStreamerWorkerCreateEntityPool) => void
  [StreamerWorkerEvents.CreateEntities]: (entities: IStreamerWorkerCreateEntity[]) => void
  [StreamerWorkerEvents.DestroyEntity]: (entityId: number) => void
  /**
   * player updated info
   * and removed player ids strings (strings because object keys cant be numbers)
   */
  [StreamerWorkerEvents.PlayersUpdate]: (players: PlayersUpdateData, removedPlayerIds: string[]) => void
  [StreamerWorkerEvents.EnableNetOwnerLogic]: () => void
  [StreamerWorkerEvents.SetEntityPos]: (entityId: number, pos: alt.IVector2) => void
}

export type IStreamerSharedWorkerMessage<
// eslint-disable-next-line @typescript-eslint/no-explicit-any
  TEventInterface extends Record<any, any>,
  K extends keyof TEventInterface = keyof TEventInterface,
> = {
  name: K
  data: Parameters<TEventInterface[K]>
}