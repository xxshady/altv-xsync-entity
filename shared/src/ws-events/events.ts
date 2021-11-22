import type {
  WSEntityCreate,
  WSEntity,
} from "./types"

export enum WSClientOnServerEvents {
  EntitiesStreamIn,
  EntitiesStreamOut,
}

export interface IWSClientOnServerEvent {
  [WSClientOnServerEvents.EntitiesStreamIn]: (entities: WSEntityCreate[]) => void
  [WSClientOnServerEvents.EntitiesStreamOut]: (entities: WSEntity[]) => void
}