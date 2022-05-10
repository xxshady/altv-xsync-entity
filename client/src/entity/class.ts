import type * as alt from "alt-client"
import type { EntityData } from "altv-xsync-entity-shared"
import { InternalEntity } from "../internal-entity"
import { InternalEntityPool } from "../internal-entity-pool"

export abstract class Entity<T extends EntityData = EntityData> {
  private readonly internalInstance: InternalEntity<T>

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  public static getByID<T extends new (...args: any) => Entity> (this: T, id: number): InstanceType<T> | null {
    const entity = InternalEntityPool.entities[id]?.publicInstance as InstanceType<T>
    return (entity instanceof this) ? entity : null
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  public static updateNetOwnerPos<U extends new (...args: any) => Entity> (this: U, entity: InstanceType<U>, pos: alt.IVector3): void {
    const entityPool = InternalEntityPool.getEntityPool(this)
    if (!entityPool) return

    entityPool.updateNetOwnerPos(entity, pos)
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  public static updateNetOwnerSyncedMeta<U extends new (...args: any) => Entity> (
    this: U,
    entity: InstanceType<U>,
    changedMeta: Partial<InstanceType<U>["syncedMeta"]>,
  ): void {
    const entityPool = InternalEntityPool.getEntityPool(this)
    if (!entityPool) return

    entityPool.updateNetOwnerSyncedMeta(entity, changedMeta)
  }

  // TODO: make constructor private
  constructor (
    public readonly id: number,
    pos: alt.IVector3,
    syncedMeta: Readonly<T>,
  ) {
    this.internalInstance = new InternalEntity<T>(this, id, pos, syncedMeta)
  }

  public get pos (): alt.IVector3 {
    return this.internalInstance.pos
  }

  public get netOwnered (): boolean {
    return this.internalInstance.netOwnered
  }

  public get syncedMeta (): Readonly<T> {
    return this.internalInstance.syncedMeta
  }

  public get streamed (): boolean {
    return this.internalInstance.streamed
  }
}
