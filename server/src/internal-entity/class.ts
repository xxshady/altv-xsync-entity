import type * as alt from "alt-server"
import type { EntityData } from "altv-xsync-entity-shared"
import type { Entity } from "../entity"
import { InternalXSyncEntity } from "../internal-xsync-entity"
import type { InternalEntityDict } from "./types"

export class InternalEntity {
  public static readonly all: Readonly<InternalEntityDict> = {}

  constructor (
    public readonly publicInstance: Entity,
    public readonly poolId: number,
    public readonly id: number,
    public readonly pos: alt.IVector3,
    public readonly data: EntityData,
    public readonly dimension: number,
    public readonly streamRange: number,
    public readonly migrationRange: number,
  ) {
    (InternalEntity.all as InternalEntityDict)[id] = this
    InternalXSyncEntity.instance.addEntity(this)
  }

  public destroy (): void {
    delete (InternalEntity.all as InternalEntityDict)[this.id]
    InternalXSyncEntity.instance.removeEntity(this)
  }
}