import type * as alt from "alt-client"
import { Logger } from "altv-xsync-entity-shared"
import type { EntityData } from "altv-xsync-entity-shared"
import type { Entity } from "../entity"
import type { IEntityClass } from "../internal-entity-pool"
import type { IEntityEventHandlers, ParametersExceptFirst } from "./types"

const log = new Logger("internal-entity")

export class InternalEntity<T extends EntityData = EntityData> {
  private static readonly publicInternals = new Map<Entity, InternalEntity>()
  private static handlers = new Map<IEntityClass, IEntityEventHandlers>()

  public static readonly reservedEntities: Partial<Record<Entity["id"], true>> = {}

  public static getInternalByPublic (publicEntity: Entity): InternalEntity {
    const internal = this.publicInternals.get(publicEntity)

    if (!internal) {
      throw new Error(`InternalEntity: getInternalByPublic unknown publicEntity: ${publicEntity?.id}`)
    }

    return internal
  }

  public static addEventHandlers (entityClass: IEntityClass, handlers: IEntityEventHandlers): void {
    this.handlers.set(entityClass, handlers)
  }

  private static handleEvent <K extends keyof IEntityEventHandlers> (
    entity: InternalEntity,
    eventName: K,
    ...args: ParametersExceptFirst<Required<IEntityEventHandlers>[K]>
  ) {
    const entityClass = entity.publicInstance.constructor as IEntityClass
    const logMessage = `received remote event "${eventName}" for entity class: ${entityClass.name} |`

    const handlers = this.handlers.get(entityClass)
    if (!handlers) {
      throw new Error(`[xsync] ${logMessage} no event handlers are set, use the @onEntityEvents() decorator on your entity class`)
    }

    const handler = handlers[eventName]
    if (!handler) {
      log.warn(`${logMessage} no handler is set, which can be set in the @onEntityEvents() decorator`)
      return
    }

    // shut up stupid ts
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    handler(entity.publicInstance, ...args as [first?: any])
  }

  public netOwnered = false
  public streamed = true

  constructor (
    public readonly publicInstance: Entity,
    public readonly id: number,
    public pos: alt.IVector3,
    public readonly syncedMeta: T,
  ) {
    // TODO: make public Entity constructor private and remove this shit
    if (!InternalEntity.reservedEntities[id]) {
      throw new Error("Entity cannot be created by client")
    }
    delete InternalEntity.reservedEntities[id]

    InternalEntity.publicInternals.set(publicInstance, this)
  }

  public streamIn (): void {
    InternalEntity.handleEvent(this, "streamIn")
  }

  public streamOut (): void {
    this.streamed = false
    this.netOwnered = false
    InternalEntity.handleEvent(this, "streamOut")
  }

  public posChange (pos: alt.IVector3): void {
    this.pos = pos
    InternalEntity.handleEvent(this, "posChange", pos)
  }

  public syncedMetaChange (syncedMeta: Partial<T>): void {
    Object.assign(this.syncedMeta, syncedMeta)
    InternalEntity.handleEvent(this, "syncedMetaChange", syncedMeta)
  }

  public netOwnerChange (isLocalPlayerNetOwner: boolean, syncedMeta?: T): void {
    this.netOwnered = isLocalPlayerNetOwner
    InternalEntity.handleEvent(this, "netOwnerChange", isLocalPlayerNetOwner, syncedMeta)
  }
}
