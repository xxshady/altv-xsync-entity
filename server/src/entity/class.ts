import type * as alt from "alt-server"
import type { EntityData } from "altv-xsync-entity-shared"
import type { EntityPool } from "../entity-pool"
import { InternalEntity } from "../internal-entity"
import { InternalXSyncEntity } from "../internal-xsync-entity"
import { valid } from "./decorators"

export class Entity<TSyncedMeta extends EntityData = EntityData, TMeta extends EntityData = EntityData> {
  public static get all (): Entity[] {
    return Object.values(InternalEntity.all).map(e => e.publicInstance)
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  public static getByID<T extends new (...args: any) => Entity> (this: T, id: number): InstanceType<T> | null {
    const entity = InternalEntity.all[id]?.publicInstance as InstanceType<T>
    return (entity instanceof this) ? entity : null
  }

  public readonly id = InternalXSyncEntity.instance.idProvider.getNext()

  private readonly internalInstance: InternalEntity
  private _valid = true

  private readonly _syncedMeta: TSyncedMeta
  private readonly _meta: TMeta
  public readonly dimension: number
  public readonly streamRange: number
  public readonly migrationRange: number

  constructor (
    public readonly pool: EntityPool,
    private _pos: alt.IVector3,
    syncedMeta = {} as TSyncedMeta,
    meta = {} as TMeta,
    dimension = 0,
    streamRange = 300,
    migrationRange = streamRange / 2,
  ) {
    this.internalInstance = new InternalEntity(
      this,
      pool.id,
      this.id,
      _pos,
      syncedMeta,
      dimension,
      streamRange,
      migrationRange,
    )

    this._syncedMeta = syncedMeta
    this.dimension = dimension
    this.streamRange = streamRange
    this.migrationRange = migrationRange
    this._meta = meta
  }

  public get valid (): boolean {
    return this._valid
  }

  public get pos (): alt.IVector3 {
    return this._pos
  }

  @valid()
  public set pos (value: alt.IVector3) {
    this.internalInstance.pos = value
    this._pos = value
  }

  public get syncedMeta (): Readonly<TSyncedMeta> {
    return this._syncedMeta
  }

  public get meta (): Readonly<TMeta> {
    return this._meta
  }

  @valid()
  public destroy (): void {
    this.internalInstance.destroy()
    InternalXSyncEntity.instance.idProvider.freeId(this.id)

    this._valid = false
  }

  @valid()
  public setSyncedMeta (value: Partial<TSyncedMeta>): void {
    for (const key in value) {
      this._syncedMeta[key as keyof TSyncedMeta] = value[key as keyof TSyncedMeta] as TSyncedMeta[keyof TSyncedMeta]
    }

    InternalXSyncEntity.instance.updateEntitySyncedMeta(this.internalInstance, value)
  }

  @valid()
  public setMeta (value: Partial<TMeta>): void {
    for (const key in value) {
      this._meta[key as keyof TMeta] = value[key as keyof TMeta] as TMeta[keyof TMeta]
    }
  }
}