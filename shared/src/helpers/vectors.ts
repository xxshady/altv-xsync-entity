import type * as alt from "alt-shared"
import type { WSVector3 } from "../ws-events"

export class WSVectors {
  public static altToWS ({ x, y, z }: alt.IVector3): WSVector3 {
    return [
      +x.toFixed(3),
      +y.toFixed(3),
      +z.toFixed(3),
    ]
  }

  public static WStoAlt ([x, y, z]: WSVector3): alt.IVector3 {
    return { x, y, z }
  }
}