import type * as alt from "alt-server"
import type { Entity } from "../entity"
import { InternalXSyncEntity } from "../internal-xsync-entity"

export class InternalEntity {
  constructor (
    public readonly publicInstance: Entity,
    public readonly poolId: number,
    public readonly id: number,
    public readonly pos: alt.IVector3,
    public readonly dimension = 0,
    public readonly streamRange = 300,
    public readonly migrationRange = streamRange / 2,
  ) {
    InternalXSyncEntity.instance.streamer.addEntity(this)
  }
}