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
  EntitySyncedMetaChange,
}

export interface IWSClientOnServerEvent {
  [WSClientOnServerEvents.EntitiesStreamIn]: (entities: WSEntityCreate[]) => void
  [WSClientOnServerEvents.EntitiesStreamOut]: (entityIds: number[]) => void
  [WSClientOnServerEvents.EntityDestroy]: (entityId: number) => void
  [WSClientOnServerEvents.EntitiesNetOwnerChange]: (entities: WSEntityNetOwner[]) => void
  [WSClientOnServerEvents.EntityPosChange]: (entityId: number, pos: WSVector3) => void
  [WSClientOnServerEvents.EntitySyncedMetaChange]: (entityId: number, syncedMeta: Record<string, unknown>) => void
}

export enum WSServerOnClientEvents {
  UpdateEntitySyncedMeta,
  UpdateEntityPos,
}

export interface IWSServerOnClientEvent {
  [WSServerOnClientEvents.UpdateEntitySyncedMeta]: (entityId: number, syncedMeta: Record<string, unknown>) => void
  [WSServerOnClientEvents.UpdateEntityPos]: (entityId: number, pos: WSVector3) => void
}
