import { WSServer } from "../ws-server"

export class XSyncEntity {
  private readonly wss: WSServer

  constructor (
    public readonly websocketPort = 7700,
  ) {
    this.wss = new WSServer(
      websocketPort,
      {
        events: {},
      },
    )
  }
}