import type * as alt from "alt-server"

export class Entity {
  constructor (
    public readonly type: number,
    public readonly pos: alt.IVector3,
    public readonly dimension?: number,
    public readonly streamRange?: number,
    public readonly migrationRange?: number,
  ) {

  }
}