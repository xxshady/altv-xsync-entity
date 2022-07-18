import type * as alt from "alt-server"
import type {
  IOptions,
} from "./types"
import { InternalXSyncEntity } from "../internal-xsync-entity"

export class XSyncEntity {
  private static _instance: XSyncEntity | null = null

  private readonly internal: InternalXSyncEntity

  private readonly customClientInit: boolean

  constructor (options: IOptions = {}) {
    if (XSyncEntity._instance) {
      throw new Error("XSyncEntity already initialized")
    }

    XSyncEntity._instance = this

    if (!(options instanceof Object)) {
      throw new TypeError("xsync options should be an object")
    }

    const {
      streamDelay = 100,
      customClientInit = false,
      netOwnerLogic,
      wss = {},
      syncedMetaChange,
    } = options

    this.customClientInit = customClientInit

    const {
      certPath = "",
      keyPath = "",
      domainName = "",
      port = 7700,
      localhost = true,
      useWss: _useWss,
    } = wss

    const useWss = _useWss ?? !localhost

    if (useWss && !(certPath && keyPath && domainName)) {
      throw new Error("[XSyncEntity] failed to init: specify in wss options certPath & keyPath & domainName if useWss is true")
    }

    this.internal = new InternalXSyncEntity(
      streamDelay,
      {
        localhost,
        port,
        certPath,
        keyPath,
        domainName,
        useWss,
      },
      customClientInit,
      netOwnerLogic,
      syncedMetaChange,
    )
  }

  public initClient (player: alt.Player): void {
    if (!this.customClientInit) {
      throw new Error(
        "[initClient] you must first set 'customClientInit' to true in the constructor," +
        " otherwise client is initiated automatically when the player connects",
      )
    }

    this.internal.initClientConnect(player)
  }
}
