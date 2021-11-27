import type {
  WSEntityCreate,
} from "./types"

export enum WSClientOnServerEvents {
  EntitiesStreamIn,
  EntitiesStreamOut,
  EntityDestroy,
}

export interface IWSClientOnServerEvent {
  [WSClientOnServerEvents.EntitiesStreamIn]: (entities: WSEntityCreate[]) => void
  [WSClientOnServerEvents.EntitiesStreamOut]: (entityIds: number[]) => void
  [WSClientOnServerEvents.EntityDestroy]: (entityId: number) => void
}