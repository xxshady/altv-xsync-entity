import { createLogger } from "altv-xlogger"
import type { ILogger } from "altv-xlogger/dist/types"
import type { EntityData } from "altv-xsync-entity-shared"
import type { Entity } from "../entity"
import { InternalXSyncEntity } from "../internal-xsync-entity"
import type { IEntityClass } from "./types"

type EntitiesDict = Record<number, Entity>

export class InternalEntityPool<T extends EntityData = EntityData> {
  public static readonly entities: Readonly<EntitiesDict> = {}

  private static readonly log = createLogger("InternalEntityPool")

  public static streamOutEntity (entityOrId: number | Entity): void {
    let entity: Entity

    if (typeof entityOrId === "number") {
      entity = this.entities[entityOrId]
    } else {
      entity = entityOrId
    }

    if (!entity) {
      this.log.error(`[streamOutEntity] unknown entity id: ${entityOrId}`)
      return
    }

    entity.streamOut()
    delete (this.entities as EntitiesDict)[entity.id]
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
    (InternalEntityPool.entities as EntitiesDict)[entity.id] = entity
    entity.streamIn(entity.pos, entity.data)
  }
}