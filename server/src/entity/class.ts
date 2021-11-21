import type * as alt from "alt-server"
import type { EntityPool } from "../entity-pool"
import { InternalEntity } from "../internal-entity"
import { InternalXSyncEntity } from "../internal-xsync-entity"
import { valid } from "./decorators"

export class Entity {
  public readonly id = InternalXSyncEntity.instance.idProvider.getNext()

  private readonly internalInstance: InternalEntity
  private _valid = true

  constructor (
    public readonly pool: EntityPool,
    public readonly pos: alt.IVector3,
    public readonly dimension?: number,
    public readonly streamRange?: number,
    public readonly migrationRange?: number,
  ) {
    this.internalInstance = new InternalEntity(
      this,
      pool.id,
      this.id,
      pos,
      dimension,
      streamRange,
      migrationRange,
    )
  }

  public get valid (): boolean {
    return this._valid
  }

  @valid()
  public destroy (): void {
    this.internalInstance.destroy()
  }
}