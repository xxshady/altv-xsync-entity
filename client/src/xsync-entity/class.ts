import { InternalXSyncEntity } from "../internal-xsync-entity"

export class XSyncEntity {
  private internal: InternalXSyncEntity

  constructor () {
    this.internal = new InternalXSyncEntity()
  }
}