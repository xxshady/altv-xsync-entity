import type * as alt from "alt-client"
import type { EntityData } from "altv-xsync-entity-shared"
import { InternalEntity } from "../internal-entity"
import { InternalEntityPool } from "../internal-entity-pool"

export abstract class Entity<T extends EntityData = EntityData> {
  private readonly internalInstance: InternalEntity

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  public static getByID<T extends new (...args: any) => Entity> (this: T, id: number): InstanceType<T> | null {
    const entity = InternalEntityPool.entities[id]?.publicInstance as InstanceType<T>
    return (entity instanceof this) ? entity : null
  }

  constructor (
    public readonly id: number,
    pos: alt.IVector3,
    public readonly data: T,
  ) {
    this.internalInstance = new InternalEntity(this, id, pos)
  }

  public get pos (): alt.IVector3 {
    return this.internalInstance.pos
  }

  public get netOwnered (): boolean {
    return this.internalInstance.netOwnered
  }

  public abstract streamIn (pos: alt.IVector3, data: T): void
  public abstract streamOut (): void

  public posChange? (pos: alt.IVector3): void
}