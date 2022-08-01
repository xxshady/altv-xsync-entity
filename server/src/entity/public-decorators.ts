import type { EntityPool } from "../entity-pool"
import type { IEntityPoolEvent } from "../types"
import type { Entity } from "./class"

type EntityClass<T extends Entity> = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  new (...args: any[]): T
  setupEvents (entityPool: EntityPool, events: Partial<IEntityPoolEvent<T>>): void
}

export const onEntityEvents = <T extends Entity>(
  entityPool: EntityPool,
  events: Partial<IEntityPoolEvent<T>>,
) =>
  (EntityClass: EntityClass<T>): void => {
    EntityClass.setupEvents(entityPool, events)
  }
