import type { IVector2 } from "alt-shared"

export const dist2dWithRange = (a: IVector2, b: IVector2, maxRange: number): number => {
  const ab1 = b.x - a.x
  const ab2 = b.y - a.y

  if (Math.abs(ab1) > maxRange) return Infinity
  if (Math.abs(ab2) > maxRange) return Infinity

  return Math.sqrt(
    ab1 * ab1 +
    ab2 * ab2,
  )
}