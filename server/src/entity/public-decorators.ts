import type { EntityPool } from "../entity-pool"
import type { Entity } from "./class"
import type { IEntityEvents } from "./types"

type EntityClass<T extends Entity> = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  new (...args: any[]): T
  setupEvents (entityPool: EntityPool, events: IEntityEvents<T>): void
}

export const onEntityEvents = <T extends Entity>(
  entityPool: EntityPool,
  events: IEntityEvents<T>,
) =>
  (EntityClass: EntityClass<T>): void => {
    EntityClass.setupEvents(entityPool, events)
  }
