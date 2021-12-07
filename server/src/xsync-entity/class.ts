import { InternalXSyncEntity } from "../internal-xsync-entity"
import type { IWSSOptions } from "./types"

export class XSyncEntity {
  private static _instance: XSyncEntity | null = null

  private readonly internal: InternalXSyncEntity

  constructor (
    streamDelay = 100,
    wss: IWSSOptions,
  ) {
    const {
      certPath = "",
      keyPath = "",
      domainName = "",
      port = 7700,
      localhost = true,
    } = wss

    if (!(certPath && keyPath && domainName) && !localhost) {
      throw new Error("[XSyncEntity] failed to init: specify in wss options certPath & keyPath & domainName if localhost is false ")
    }

    this.internal = new InternalXSyncEntity(streamDelay, {
      localhost,
      port,
      certPath,
      keyPath,
      domainName,
    })

    if (XSyncEntity._instance) {
      throw new Error("XSyncEntity already initialized")
    }

    XSyncEntity._instance = this
  }
}