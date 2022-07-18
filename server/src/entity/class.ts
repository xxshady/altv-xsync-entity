import type * as alt from "alt-server"
import type { EntityData } from "altv-xsync-entity-shared"
import type { EntityPool } from "../entity-pool"
import { InternalEntity } from "../internal-entity"
import { InternalXSyncEntity } from "../internal-xsync-entity"
import type { EntitySyncedMetaChangeHandler } from "../types"
import { valid } from "./decorators"
import type { IEntityEvents } from "./types"

export class Entity<TSyncedMeta extends EntityData = EntityData, TMeta extends EntityData = EntityData> {
  private static eventsSet = false

  public static get all (): Entity[] {
    return Object.values(InternalEntity.all).map(e => e.publicInstance)
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  public static getByID<T extends new (...args: any) => Entity> (this: T, id: number): InstanceType<T> | null {
    const entity = InternalEntity.all[id]?.publicInstance as InstanceType<T>
    return (entity instanceof this) ? entity : null
  }

  public static setupEvents <T extends typeof Entity> (
    this: T,
    entityPool: EntityPool,
    events: IEntityEvents<InstanceType<T>>,
  ): void {
    if (this.eventsSet) throw new Error("Events already set")
    this.eventsSet = true

    InternalXSyncEntity.instance
      .onEntitySyncedMetaChangePool(
        entityPool,
        events.syncedMetaChange as EntitySyncedMetaChangeHandler,
      )
  }

  public readonly id = InternalXSyncEntity.instance.idProvider.getNext()

  private readonly internalInstance: InternalEntity
  private _valid = true

  private readonly _meta: TMeta
  public readonly dimension: number
  public readonly streamRange: number
  public readonly migrationRange: number

  constructor (
    public readonly pool: EntityPool,
    _pos: alt.IVector3,
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

    this.dimension = dimension
    this.streamRange = streamRange
    this.migrationRange = migrationRange
    this._meta = meta
  }

  public get valid (): boolean {
    return this._valid
  }

  public get pos (): alt.IVector3 {
    return this.internalInstance.pos
  }

  @valid()
  public set pos (value: alt.IVector3) {
    this.internalInstance.pos = value
  }

  public get syncedMeta (): Readonly<TSyncedMeta> {
    return this.internalInstance.syncedMeta as Readonly<TSyncedMeta>
  }

  public get meta (): Readonly<TMeta> {
    return this._meta
  }

  public get netOwner (): alt.Player | null {
    return this.internalInstance.netOwner
  }

  @valid()
  public destroy (): void {
    this.internalInstance.destroy()
    InternalXSyncEntity.instance.idProvider.freeId(this.id)

    this._valid = false
  }

  @valid()
  public setSyncedMeta (value: Partial<TSyncedMeta>): void {
    this.internalInstance.setSyncedMeta(value)
  }

  @valid()
  public setMeta (value: Partial<TMeta>): void {
    for (const key in value) {
      this._meta[key as keyof TMeta] = value[key as keyof TMeta] as TMeta[keyof TMeta]
    }
  }

  @valid()
  public setNetOwner (netOwner: alt.Player, disableMigration = false): void {
    this.internalInstance.setNetOwner(netOwner, disableMigration)
  }

  @valid()
  public resetNetOwner (): void {
    this.internalInstance.resetNetOwner()
  }
}
