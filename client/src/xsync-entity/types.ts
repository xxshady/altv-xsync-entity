import type { Entity } from "../entity"

export interface INetOwnerLogicOptions {
  entityNetOwnerChange?: (entity: Entity, isLocalPlayerNetOwner: boolean) => void
}