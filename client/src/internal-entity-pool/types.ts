import type * as alt from "alt-client"
import type { EntityData } from "altv-xsync-entity-shared"
import type { Entity } from "../entity"
import type { InternalEntity } from "../internal-entity"

export interface IEntityClass<T extends Entity = Entity, U extends EntityData = T["syncedMeta"]> {
  new (id: number, pos: alt.IVector3, syncedMeta: U): T
}

export type EntitiesDict = Record<number, InternalEntity>