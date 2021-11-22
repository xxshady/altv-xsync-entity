import type * as alt from "alt-client"
import type { EntityData } from "altv-xsync-entity-shared"

export abstract class Entity<T extends EntityData = EntityData> {
  constructor (
    public readonly id: number,
    public readonly pos: alt.IVector3,
    public readonly data: T,
  ) {}

  public abstract streamIn (pos: alt.IVector3, data: T): void
  public abstract streamOut (): void
}