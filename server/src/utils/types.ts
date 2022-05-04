import type * as alt from "alt-server"

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type FirstPlayerParamToInterface<T extends Record<any, any>> = {
  [K in keyof T]: (player: alt.Player, ...args: Parameters<T[K]>) => void
}
