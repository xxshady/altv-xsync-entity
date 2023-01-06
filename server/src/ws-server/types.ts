import type * as alt from "alt-server"
import type * as ws from "ws-esm"

export interface IConnectionExtraReq {
  headers?: {
    playerid?: string
    authcode?: string
  }
}

export interface IWebSocketPlayer {
  socket: ws.WebSocket | null
  authCode: string
  player: alt.Player
}

export type RawClientMessageHandler = (player: alt.Player, message: Buffer) => void

export type SocketCloseHandler = (player: alt.Player) => void

export interface IWebSocketServerOptions {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  events: Record<string, (player: alt.Player, ...args: any[]) => void>
  certPath: string
  keyPath: string
  useWss?: boolean
  socketClose: SocketCloseHandler
}
