import { createLogger } from "altv-xlogger"
import type { ILogger } from "altv-xlogger/dist/types"
import type { EntityData } from "altv-xsync-entity-shared"
import type { Entity } from "../entity"
import { InternalEntity } from "../internal-entity"
import { InternalXSyncEntity } from "../internal-xsync-entity"
import type { EntitiesDict, IEntityClass } from "./types"

export class InternalEntityPool<T extends EntityData = EntityData> {
  public static readonly entities: Readonly<EntitiesDict> = {}

  private static readonly log = createLogger("xsync:internal-entitypool")

  public static streamOutEntity (entityOrId: number | InternalEntity): void {
    let entity: InternalEntity

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
    this.log = createLogger(`xsync:entitypool ${EntityClass.name} (id: ${this.id})`)

    InternalXSyncEntity.instance.addEntityPool(this as InternalEntityPool)
  }

  public streamInEntity (entity: Entity): void {
    const internal = InternalEntity.getInternalByPublic(entity);

    (InternalEntityPool.entities as EntitiesDict)[entity.id] = internal
    internal.streamIn()
  }
}