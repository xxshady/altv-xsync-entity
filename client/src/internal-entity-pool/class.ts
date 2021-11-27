import { createLogger } from "altv-xlogger"
import type { ILogger } from "altv-xlogger/dist/types"
import type { EntityData } from "altv-xsync-entity-shared"
import type { Entity } from "../entity"
import { InternalXSyncEntity } from "../internal-xsync-entity"
import type { IEntityClass } from "./types"

type EntitiesDict = Record<number, Entity>

export class InternalEntityPool<T extends EntityData = EntityData> {
  private static readonly entities: EntitiesDict = {}
  private static readonly log = createLogger("InternalEntityPool")

  public static streamOutEntity (id: number): void {
    const entity = this.entities[id]

    if (!entity) {
      this.log.error(`[streamOutEntity] unknown entity id: ${id}`)
      return
    }

    entity.streamOut()
    delete this.entities[id]
  }

  private readonly log: ILogger

  constructor (
    public readonly id: number,
    public readonly EntityClass: IEntityClass<T>,
  ) {
    this.log = createLogger(`EntityPool ${EntityClass.name} (id: ${this.id})`)

    InternalXSyncEntity.instance.addEntityPool(this as InternalEntityPool)
  }

  public streamInEntity (entity: Entity): void {
    InternalEntityPool.entities[entity.id] = entity
    entity.streamIn(entity.pos, entity.data)
  }
}