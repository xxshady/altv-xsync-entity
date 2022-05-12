import type * as alt from "alt-server"
import { createLogger } from "altv-xlogger"
import type { EntityData } from "altv-xsync-entity-shared"
import type { Entity } from "../entity"
import { InternalXSyncEntity } from "../internal-xsync-entity"
import type { InternalEntityDict } from "./types"

export class InternalEntity {
  public static readonly all: Readonly<InternalEntityDict> = {}
  private static readonly log = createLogger("xsync:internal-entity")

  public netOwner: alt.Player | null = null
  public disabledMigration = false

  private offPlayerRemoveHandler: (() => void) | null = null

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

  // used for public api Entity class
  public set pos (value: alt.IVector3) {
    this._pos = value
    InternalXSyncEntity.instance.updateEntityPos(this)
  }

  public destroy (): void {
    delete (InternalEntity.all as InternalEntityDict)[this.id]
    InternalXSyncEntity.instance.removeEntity(this)
  }

  public netOwnerSyncedMetaUpdate (syncedMeta: EntityData): void {
    Object.assign(this.syncedMeta, syncedMeta)
  }

  public netOwnerPosUpdate (pos: alt.IVector3): void {
    this._pos = pos
  }

  public netOwnerChange (newNetOwner: alt.Player | null): void {
    this.netOwner = newNetOwner
  }

  public setSyncedMeta (syncedMeta: Partial<EntityData>): void {
    Object.assign(this.syncedMeta, syncedMeta)
    InternalXSyncEntity.instance.updateEntitySyncedMeta(this, syncedMeta)
  }

  public setNetOwner (netOwner: alt.Player, disableMigration: boolean): void {
    if (
      this.netOwner === netOwner &&
      this.disabledMigration === disableMigration
    ) return
    this.disabledMigration = disableMigration

    if (disableMigration) {
      this.offPlayerRemoveHandler?.()
      this.offPlayerRemoveHandler = InternalXSyncEntity.instance
        .onPlayerRemove(netOwner, () => {
          this.offPlayerRemoveHandler = null
          this.resetNetOwner()
        })
    }

    InternalXSyncEntity.instance.setEntityNetOwner(this, netOwner, disableMigration)
  }

  public resetNetOwner (): void {
    if (!this.disabledMigration) return
    this.disabledMigration = false

    InternalXSyncEntity.instance.resetEntityNetOwner(this)

    this.offPlayerRemoveHandler?.()
    this.offPlayerRemoveHandler = null
  }
}
