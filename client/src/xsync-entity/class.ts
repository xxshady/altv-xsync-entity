import { InternalXSyncEntity } from "../internal-xsync-entity"
import type { INetOwnerLogicOptions } from "./types"

export class XSyncEntity {
  private internal: InternalXSyncEntity

  constructor (netOwnerLogic?: INetOwnerLogicOptions) {
    this.internal = new InternalXSyncEntity(netOwnerLogic)
  }
}