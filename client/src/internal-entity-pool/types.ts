import type * as alt from "alt-client"
import type { Entity } from "../entity"
import type { InternalEntity } from "../internal-entity"

export interface IEntityClass<T> {
  new (id: number, pos: alt.IVector3, data: T): Entity
}

export type EntitiesDict = Record<number, InternalEntity>