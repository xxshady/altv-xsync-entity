import { IdProvider } from "../id-provider"
import { WSServer } from "../ws-server"

export class XSyncEntity {
  private static _instance: XSyncEntity | null = null

  public static get instance (): XSyncEntity {
    const { _instance } = this

    if (!_instance) {
      throw new Error("XSyncEntity has not been initialized yet")
    }

    return _instance
  }

  private readonly wss: WSServer
  private readonly idProvider = new IdProvider()

  constructor (
    public readonly websocketPort = 7700,
  ) {
    this.wss = new WSServer(
      websocketPort,
      {
        events: {},
      },
    )

    if (XSyncEntity._instance) {
      throw new Error("XSyncEntity already initialized")
    }

    XSyncEntity._instance = this
  }
}