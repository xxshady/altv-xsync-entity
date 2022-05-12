import { createLogger } from "altv-xlogger"
import type { ILogger } from "altv-xlogger/dist/types"
import type { Entity } from "../entity"
import type { EntityPool } from "../entity-pool"
import { InternalEntity } from "../internal-entity"
import { InternalXSyncEntity } from "../internal-xsync-entity"
import type { EntitiesDict, IEntityClass } from "./types"

export class InternalEntityPool {
  public static readonly entities: Readonly<EntitiesDict> = {}

  private static readonly log = createLogger("xsync:internal-entitypool")
  private static readonly entityPoolByEntityClass = new Map<IEntityClass, EntityPool<Entity>>()

  public static streamOutEntity (entityOrId: number | InternalEntity): void {
    let entity: InternalEntity

    if (typeof entityOrId === "number") {
      entity = this.entities[entityOrId]
    }
    else {
      entity = entityOrId
    }

    if (!entity) {
      this.log.error(`[streamOutEntity] unknown entity id: ${entityOrId}`)
      return
    }

    entity.streamOut()
    delete (this.entities as EntitiesDict)[entity.id]
  }

  public static getEntityPool (entityClass: IEntityClass): EntityPool<Entity> | null {
    const entityPool = InternalEntityPool.entityPoolByEntityClass.get(entityClass)
    if (!entityPool) {
      throw new Error(`[getEntityPool] unknown entity class: ${entityClass.name}`)
    }

    return entityPool
  }

  private readonly log: ILogger

  constructor (
    public readonly id: number,
    public readonly EntityClass: IEntityClass,
    public readonly publicInstance: EntityPool<Entity>,
  ) {
    this.log = createLogger(`xsync:entitypool ${EntityClass.name} (id: ${this.id})`)

    InternalXSyncEntity.instance.addEntityPool(this as InternalEntityPool)
    InternalEntityPool.entityPoolByEntityClass.set(EntityClass, publicInstance)
  }

  public streamInEntity (entity: Entity): void {
    const internal = InternalEntity.getInternalByPublic(entity);

    (InternalEntityPool.entities as EntitiesDict)[entity.id] = internal
    internal.streamIn()
  }
}
