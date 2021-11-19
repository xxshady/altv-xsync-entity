import { InternalXSyncEntity } from "../internal-xsync-entity"
import type { IEntityPoolOptions } from "./types"

export class EntityPool {
  private _maxStreamedIn: number

  constructor (
    public readonly id: number,
    {
      maxStreamedIn = 150,
    }: Partial<IEntityPoolOptions>,
  ) {
    this._maxStreamedIn = maxStreamedIn

    InternalXSyncEntity.instance.streamer.addPool(this)
  }

  // TODO set maxStreamedIn
  public get maxStreamedIn (): number {
    return this._maxStreamedIn
  }
}