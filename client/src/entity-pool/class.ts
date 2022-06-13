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
    if (!entity.netOwnered) {
      throw new Error(
        "xsync updateNetOwnerSyncedMeta | local player is not netowner" +
        `of that entity: ${entity.id} (class: ${entity.constructor?.name})`,
      )
    }
    InternalXSyncEntity.instance.updateNetOwnerSyncedMeta(entity, syncedMeta)
  }

  public requestUpdateWatcherSyncedMeta (entity: Entity, syncedMeta: Partial<T["syncedMeta"]>): void {
    if (entity.netOwnered) {
      throw new Error(
        "xsync requestUpdateWatcherSyncedMeta | local player is netowner, use updateNetOwnerSyncedMeta" +
        `of that entity: ${entity.id} (class: ${entity.constructor?.name})`,
      )
    }
    InternalXSyncEntity.instance.requestUpdateWatcherSyncedMeta(entity, syncedMeta)
  }

  public updateNetOwnerPos (entity: Entity, pos: alt.IVector3): void {
    if (!entity.netOwnered) {
      throw new Error(
        "xsync updateNetOwnerPos | local player is not netowner" +
        `of that entity: ${entity.id} (class: ${entity.constructor?.name})`,
      )
    }
    InternalXSyncEntity.instance.updateNetOwnerPos(entity, pos)
  }
}
