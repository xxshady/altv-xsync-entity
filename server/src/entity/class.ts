import type * as alt from "alt-server"
import type { EntityPool } from "../entity-pool"
import { InternalEntity } from "../internal-entity"
import { InternalXSyncEntity } from "../internal-xsync-entity"

export class Entity {
  private readonly internalInstance: InternalEntity

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
      InternalXSyncEntity.instance.idProvider.getNext(),
      pos,
      dimension,
      streamRange,
      migrationRange,
    )
  }
}