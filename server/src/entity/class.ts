import type * as alt from "alt-server"
import type { EntityData } from "altv-xsync-entity-shared"
import type { EntityPool } from "../entity-pool"
import { InternalEntity } from "../internal-entity"
import { InternalXSyncEntity } from "../internal-xsync-entity"
import { valid } from "./decorators"

export class Entity<TData extends EntityData = EntityData> {
  public static get all (): Entity[] {
    return Object.values(InternalEntity.all).map(e => e.publicInstance)
  }

  public static getByID (id: number): Entity | null {
    const entity = InternalEntity.all[id]

    return entity ? entity.publicInstance : null
  }

  public readonly id = InternalXSyncEntity.instance.idProvider.getNext()

  private readonly internalInstance: InternalEntity
  private _valid = true

  public readonly data: TData
  public readonly dimension: number
  public readonly streamRange: number
  public readonly migrationRange: number

  constructor (
    public readonly pool: EntityPool,
    private _pos: alt.IVector3,
    data = {} as TData,
    dimension = 0,
    streamRange = 300,
    migrationRange = streamRange / 2,
  ) {
    this.internalInstance = new InternalEntity(
      this,
      pool.id,
      this.id,
      _pos,
      data,
      dimension,
      streamRange,
      migrationRange,
    )

    this.data = data
    this.dimension = dimension
    this.streamRange = streamRange
    this.migrationRange = migrationRange
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

  @valid()
  public destroy (): void {
    this.internalInstance.destroy()
    InternalXSyncEntity.instance.idProvider.freeId(this.id)

    this._valid = false
  }
}