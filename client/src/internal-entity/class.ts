import type * as alt from "alt-client"
import type { Entity } from "../entity"

export class InternalEntity {
  private static readonly publicInternals = new Map<Entity, InternalEntity>()

  public static getInternalByPublic (publicEntity: Entity): InternalEntity {
    const internal = this.publicInternals.get(publicEntity)

    if (!internal) {
      throw new Error(`InternalEntity: getInternalByPublic unknown publicEntity: ${publicEntity?.id}`)
    }

    return internal
  }

  public netOwnered = false

  constructor (
    public readonly publicInstance: Entity,
    public readonly id: number,
    public pos: alt.IVector3,
  ) {
    InternalEntity.publicInternals.set(publicInstance, this)
  }

  public streamIn (): void {
    this.publicInstance.streamIn(this.publicInstance.pos, this.publicInstance.data)
  }

  public streamOut (): void {
    this.publicInstance.streamOut()
  }

  public posChange (pos: alt.IVector3): void {
    this.pos = pos
    this.publicInstance.posChange?.(pos)
  }
}