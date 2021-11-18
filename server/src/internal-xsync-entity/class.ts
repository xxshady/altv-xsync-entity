import { IdProvider } from "../id-provider"
import { WSServer } from "../ws-server"
import { Streamer } from "../streamer"

export class InternalXSyncEntity {
  private static _instance: InternalXSyncEntity | null = null

  public static get instance (): InternalXSyncEntity {
    const { _instance } = this

    if (!_instance) {
      throw new Error("InternalXSyncEntity has not been initialized yet")
    }

    return _instance
  }

  public readonly wss: WSServer
  public readonly idProvider = new IdProvider()
  public readonly streamer = new Streamer()

  constructor (
    public readonly websocketPort: number,
  ) {
    this.wss = new WSServer(
      websocketPort,
      {
        events: {},
      },
    )

    if (InternalXSyncEntity._instance) {
      throw new Error("InternalXSyncEntity already initialized")
    }

    InternalXSyncEntity._instance = this
  }
}