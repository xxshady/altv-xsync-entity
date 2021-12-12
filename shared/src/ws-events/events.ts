import type {
  WSEntityCreate,
  WSEntityNetOwner,
} from "./types"

export enum WSClientOnServerEvents {
  EntitiesStreamIn,
  EntitiesStreamOut,
  EntityDestroy,
  EntitiesNetOwnerChange,
}

export interface IWSClientOnServerEvent {
  [WSClientOnServerEvents.EntitiesStreamIn]: (entities: WSEntityCreate[]) => void
  [WSClientOnServerEvents.EntitiesStreamOut]: (entityIds: number[]) => void
  [WSClientOnServerEvents.EntityDestroy]: (entityId: number) => void
  [WSClientOnServerEvents.EntitiesNetOwnerChange]: (entities: WSEntityNetOwner[]) => void
}