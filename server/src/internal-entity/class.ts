import type * as alt from "alt-server"
import { createLogger } from "altv-xlogger"
import type { EntityData } from "altv-xsync-entity-shared"
import type { Entity } from "../entity"
import { InternalXSyncEntity } from "../internal-xsync-entity"
import type { InternalEntityDict } from "./types"

export class InternalEntity {
  public static readonly all: Readonly<InternalEntityDict> = {}

  private static readonly log = createLogger("xsync:internal-entity")

  constructor (
    public readonly publicInstance: Entity,
    public readonly poolId: number,
    public readonly id: number,
    public _pos: alt.IVector3,
    public readonly syncedMeta: EntityData,
    public readonly dimension: number,
    public readonly streamRange: number,
    public readonly migrationRange: number,
  ) {
    (InternalEntity.all as InternalEntityDict)[id] = this
    InternalXSyncEntity.instance.addEntity(this)
  }

  public get pos (): alt.IVector3 {
    return this._pos
  }

  public set pos (value: alt.IVector3) {
    this._pos = value

    InternalXSyncEntity.instance.updateEntityPos(this)
  }

  public destroy (): void {
    delete (InternalEntity.all as InternalEntityDict)[this.id]
    InternalXSyncEntity.instance.removeEntity(this)
  }
}