import type * as alt from "alt-client"
import type { InternalEntityPool } from "./class"
import type { Entity } from "../entity"

export interface IEntityClass<T> {
  internalPool: InternalEntityPool
  new (pos: alt.IVector3, data: T): Entity
}