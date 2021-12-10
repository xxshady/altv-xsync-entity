import type * as alt from "alt-server"
import type { Entity } from "../entity"

export interface IWSSOptions {
  certPath?: string
  keyPath?: string
  domainName?: string
  port?: number
  /**
   * default is true
   */
  localhost?: boolean
}

export interface INetOwnerLogicOptions {
  entityNetOwnerChange?: (entity: Entity, netOwner: alt.Player) => void
}