import type { Entity } from "./class"

export const valid = () => function (
  target: unknown,
  propertyKey: string,
  descriptor: PropertyDescriptor,
): void {
  const originalMethod = descriptor.value

  descriptor.value = function (this: Entity, ...args: unknown[]): void {
    if (!this.valid) {
      throw new Error(`[xsync-entity] entity pool: ${this.pool.id} id: ${this.id} invalid`)
    }
    originalMethod.apply(this, args)
  }
}