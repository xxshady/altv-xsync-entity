import type { Entity } from "./class"

export const valid = () => function (
  target: { constructor: { name: string } },
  propertyKey: string,
  descriptor: PropertyDescriptor,
): void {
  const originalMethod = descriptor.value

  if (typeof originalMethod !== "function") {
    const originalSetter = descriptor.set

    if (typeof originalSetter !== "function") {
      throw new Error(`@valid(): ${target?.constructor?.name}.${propertyKey} must be method or setter`)
    }

    descriptor.set = function (this: Entity, value: unknown): void {
      assertValidEntity(this)
      originalSetter.call(this, value)
    }

    return
  }

  descriptor.value = function (this: Entity, ...args: unknown[]): void {
    assertValidEntity(this)
    originalMethod.apply(this, args)
  }
}

function assertValidEntity (entity: Entity) {
  if (entity.valid) return
  throw new Error(`[xsync-entity] entity pool: ${entity.pool.id} id: ${entity.id} invalid`)
}