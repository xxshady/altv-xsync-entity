import type { InternalEntityPool } from "../internal-entity-pool"

export abstract class Entity {
  private static internalPool: InternalEntityPool

  abstract streamOut (): void
}