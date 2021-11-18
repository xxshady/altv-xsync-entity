import type * as alt from "alt-server"
import { InternalEntity } from "../internal-entity"
import { InternalXSyncEntity } from "../internal-xsync-entity"

export class Entity {
  private readonly internalInstance: InternalEntity

  constructor (
    public readonly type: number,
    public readonly pos: alt.IVector3,
    public readonly dimension?: number,
    public readonly streamRange?: number,
    public readonly migrationRange?: number,
  ) {
    const { instance } = InternalXSyncEntity

    this.internalInstance = new InternalEntity(
      this,
      instance.idProvider.getNext(),
      pos,
      dimension,
      streamRange,
      migrationRange,
    )
  }
}