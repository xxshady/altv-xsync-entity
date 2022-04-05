import { InternalEntityPool } from "../internal-entity-pool"
import type { IEntityClass } from "../internal-entity-pool"
import type { Entity } from "../main"

export class EntityPool <T extends Entity> {
  private readonly internal: InternalEntityPool

  constructor (
    public readonly id: number,
    public readonly EntityClass: IEntityClass<T>,
  ) {
    this.internal = new InternalEntityPool(id, EntityClass) as InternalEntityPool
  }
}