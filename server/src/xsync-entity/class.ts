import { InternalXSyncEntity } from "../internal-xsync-entity"

export class XSyncEntity {
  private static _instance: XSyncEntity | null = null

  private readonly internal: InternalXSyncEntity

  constructor (
    public readonly websocketPort = 7700,
    streamDelay = 100,
  ) {
    this.internal = new InternalXSyncEntity(websocketPort, streamDelay)

    if (XSyncEntity._instance) {
      throw new Error("XSyncEntity already initialized")
    }

    XSyncEntity._instance = this
  }
}