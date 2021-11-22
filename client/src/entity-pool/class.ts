import { InternalEntityPool } from "../internal-entity-pool"
import type { IEntityClass } from "../internal-entity-pool"
import type { EntityData } from "altv-xsync-entity-shared"

export class EntityPool<T extends EntityData = EntityData> {
  private readonly internal: InternalEntityPool

  constructor (
    public readonly id: number,
    public readonly EntityClass: IEntityClass<T>,
  ) {
    this.internal = new InternalEntityPool(id, EntityClass) as InternalEntityPool
  }
}