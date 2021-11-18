import type * as alt from "alt-server"
import type { Entity } from "../entity"

export class InternalEntity {
  constructor (
    public readonly publicInstance: Entity,
    public readonly id: number,
    public readonly pos: alt.IVector3,
    public readonly dimension = 0,
    public readonly streamRange = 300,
    public readonly migrationRange = streamRange / 2,
  ) {
  }
}