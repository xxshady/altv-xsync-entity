import type { WSEntity } from "./types"

export enum WSClientOnServerEvents {
  EntitiesStreamIn,
  EntitiesStreamOut,
}

export interface IWSClientOnServerEvent {
  [WSClientOnServerEvents.EntitiesStreamIn]: (entities: WSEntity[]) => void
  [WSClientOnServerEvents.EntitiesStreamOut]: (entities: WSEntity[]) => void
}