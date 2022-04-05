import type { IEntityEventHandlers } from "../../internal-entity"
import { InternalEntity } from "../../internal-entity"
import type { IEntityClass } from "../../internal-entity-pool"
import type { Entity } from "../class"

export const onEntityEvents =
  <T extends Entity>(events: IEntityEventHandlers<T>) =>
    (entityClass: IEntityClass<T>): void => {
      InternalEntity.addEventHandlers(entityClass, events as IEntityEventHandlers)
    }