import type * as alt from "alt-client"
import type { EntityData } from "altv-xsync-entity-shared"
import type { Entity } from "../entity"
import type { InternalEntity } from "../internal-entity"

export interface IEntityClass<T extends Entity = Entity, U extends EntityData = T["data"]> {
  new (id: number, pos: alt.IVector3, data: U): T
}

export type EntitiesDict = Record<number, InternalEntity>