import type {
  WSEntityCreate,
  WSEntityNetOwner,
  WSVector3,
} from "./types"

export enum WSClientOnServerEvents {
  EntitiesStreamIn,
  EntitiesStreamOut,
  EntityDestroy,
  EntitiesNetOwnerChange,
  EntityPosChange,
  EntityDataChange,
}

export interface IWSClientOnServerEvent {
  [WSClientOnServerEvents.EntitiesStreamIn]: (entities: WSEntityCreate[]) => void
  [WSClientOnServerEvents.EntitiesStreamOut]: (entityIds: number[]) => void
  [WSClientOnServerEvents.EntityDestroy]: (entityId: number) => void
  [WSClientOnServerEvents.EntitiesNetOwnerChange]: (entities: WSEntityNetOwner[]) => void
  [WSClientOnServerEvents.EntityPosChange]: (entityId: number, pos: WSVector3) => void
  [WSClientOnServerEvents.EntityDataChange]: (entityId: number, data: Record<string, unknown>) => void
}