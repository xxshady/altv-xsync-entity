import type * as alt from "alt-server"
import type { WebSocket } from "ws"

export interface IConnectionExtraReq {
  headers?: {
    playerid?: string
    authcode?: string
  }
}

export interface IWebSocketPlayer {
  socket: WebSocket | null
  authCode: string
}

export type RawClientMessageHandler = (player: alt.Player, message: Buffer) => void

export type SocketCloseHandler = (player: alt.Player) => void

export interface IWebSocketServerOptions {
  events: Record<string, (player: alt.Player, ...args: unknown[]) => void>
  certPath: string
  keyPath: string
  localhost?: boolean
  socketClose: SocketCloseHandler
}