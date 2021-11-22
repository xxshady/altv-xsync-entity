import type { EntityData } from "altv-xsync-entity-shared"
import type { Entity } from "../entity"
import { InternalXSyncEntity } from "../internal-xsync-entity"
import type { IEntityClass } from "./types"

type EntitiesDict = Record<number, Entity>

export class InternalEntityPool<T extends EntityData = EntityData> {
  public readonly entities: Readonly<EntitiesDict> = {}

  constructor (
    public readonly id: number,
    public readonly EntityClass: IEntityClass<T>,
  ) {
    InternalXSyncEntity.instance.addEntityPool(this as InternalEntityPool)
  }

  public addEntity (entity: Entity): void {
    (this.entities as EntitiesDict)[entity.id] = entity
  }

  public removeEntity (id: number): void {
    delete (this.entities as EntitiesDict)[id]
  }
}