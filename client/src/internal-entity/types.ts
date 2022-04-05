import type * as alt from "alt-client"
import type { Entity } from "../entity"

export interface IEntityEventHandlers<T extends Entity = Entity> {
  streamIn: (entity: T) => void
  streamOut: (entity: T) => void
  posChange?: (entity: T, pos: alt.IVector3) => void
  dataChange?: (entity: T, data: Partial<Entity["data"]>) => void
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type ParametersExceptFirst<F> = F extends (arg0: any, ...rest: infer R) => any ? R : never