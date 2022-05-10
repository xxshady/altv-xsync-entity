import type * as alt from "alt-client"
import { InternalEntityPool } from "../internal-entity-pool"
import type { IEntityClass } from "../internal-entity-pool"
import type { Entity } from "../entity"
import { InternalXSyncEntity } from "../internal-xsync-entity"

export class EntityPool <T extends Entity> {
  private readonly internal: InternalEntityPool

  constructor (
    public readonly id: number,
    public readonly EntityClass: IEntityClass<T>,
  ) {
    this.internal = new InternalEntityPool(
      id,
      EntityClass,
      this as unknown as EntityPool<Entity>,
    ) as InternalEntityPool
  }

  public updateNetOwnerSyncedMeta (entity: Entity, syncedMeta: Partial<T["syncedMeta"]>): void {
    if (!entity.netOwnered) return
    InternalXSyncEntity.instance.updateNetOwnerSyncedMeta(entity, syncedMeta)
  }

  public updateNetOwnerPos (entity: Entity, pos: alt.IVector3): void {
    if (!entity.netOwnered) return
    InternalXSyncEntity.instance.updateNetOwnerPos(entity, pos)
  }
}
