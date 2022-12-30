import * as alt from "alt-server"
import * as ws from "ws-esm"
import type {
  IConnectionExtraReq,
  IWebSocketServerOptions,
  IWebSocketPlayer,
  RawClientMessageHandler,
  SocketCloseHandler,
} from "./types"
import http from "http"
import https from "https"
import type net from "net"
import uuidv4 from "../utils/uuidv4"
import { Logger, MessageEventsManager } from "altv-xsync-entity-shared"
import fs from "fs"
import { WSConnectTimeoutError } from "./errors"

export class WSServer {
  private readonly log = new Logger("xsync:wss")
  /**
   * key number - player.id
   */
  private readonly players = new Map<number, IWebSocketPlayer>()
  private readonly messageHandlers = new Set<RawClientMessageHandler>()

  private readonly wss: ws.Server
  private readonly eventsManager: MessageEventsManager

  private readonly playerConnectWaits = new Map<
  alt.Player,
  { resolve: () => void }
  >()

  private readonly socketCloseHandler: SocketCloseHandler

  constructor (
    public readonly port: number,
    {
      useWss,
      events,
      keyPath,
      certPath,
      socketClose,
    }: IWebSocketServerOptions,
  ) {
    this.log.info(`init server on port: ${port}...`)

    let server: https.Server | http.Server

    if (useWss) {
      this.log.info("init wss (HTTPS) server")
      server = new https.Server({
        cert: fs.readFileSync(certPath),
        key: fs.readFileSync(keyPath),
      })
    }
    else {
      this.log.info("init ws (HTTP) server")
      server = new http.Server()
    }

    const wss = new ws.Server({
      noServer: true,
    })

    this.eventsManager = this.initUserEvents(events)
    this.wss = wss
    this.socketCloseHandler = socketClose

    this.setupHttpEvents(server)
    this.setupWssEvents(wss)
    server.listen(port)
  }

  public sendPlayer (player: alt.Player, eventName: string, ...args: unknown[]): void {
    const socket = this.getPlayerSocket(player)
    const message = this.eventsManager.send(eventName, args)

    socket.send(message, (err) => {
      if (!err) return
      this.log.error(err)
    })
  }

  /**
   *
   * @param player
   */
  public addPlayer (player: alt.Player): string {
    const { id } = player

    let playerData = this.players.get(id)

    if (playerData?.socket === null) {
      this.log.info("[addPlayer] playerData?.socket === null")
      playerData = undefined
    }

    if (playerData) {
      throw new Error("player already added")
    }

    const authCode = this.generatePlayerAuthCode()

    this.players.set(id, {
      socket: null,
      authCode,
    })

    // this.log.info("[addPlayer]", `player id: ${player.id}`, "auth code:", authCode)

    return authCode
  }

  public removePlayer (player: alt.Player): void {
    const playerData = this.players.get(player.id)

    if (!playerData) {
      throw new Error(`player not added: ${player.name} ${player.id}`)
    }

    try {
      playerData.socket?.close()
    }
    catch (e) {}

    this.players.delete(player.id)
  }

  public waitPlayerConnect (player: alt.Player, timeoutMs = 60_000): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      const timer = alt.setTimeout(() => {
        if (!this.playerConnectWaits.delete(player)) return
        reject(new WSConnectTimeoutError(player.valid ? `${player.name} [${player.id}]` : null))
      }, timeoutMs)

      this.playerConnectWaits.set(player, {
        resolve: () => {
          alt.clearTimeout(timer)
          resolve()
        },
      })
    })
  }

  public getPlayerSocket (player: alt.Player): ws.WebSocket {
    if (!player.valid) {
      throw new Error("player is invalid")
    }

    const playerData = this.players.get(player.id)
    if (!playerData) {
      throw new Error("player is not added")
    }

    const { socket } = playerData
    if (!socket) {
      throw new Error("player is not connected to websocket server")
    }

    if (socket.readyState === socket.CLOSED) {
      throw new Error("player socket closed")
    }

    return socket
  }

  private addMessageHandler (handler: RawClientMessageHandler): void {
    this.messageHandlers.add(handler)
  }

  private setupHttpEvents (server: https.Server | http.Server) {
    server.on("error", this.onHttpError.bind(this))
    server.on("upgrade", this.onHttpUpgrade.bind(this))
    server.on("listening", this.onHttpListening.bind(this))
  }

  private onHttpError (error: Error & { code?: string }) {
    this.log.error("http(s) server error")
    this.log.error(error)

    if (error.code === "EADDRINUSE") process.exit()
  }

  private onHttpListening () {
    this.log.infoUnchecked(`~gl~http(s) server started listening on port: ${this.port}`)
  }

  private onHttpUpgrade (
    req: http.IncomingMessage & IConnectionExtraReq,
    socket: net.Socket,
    head: Buffer,
  ) {
    const { headers } = req

    if (!headers) return this.abortHttpUpgrade(socket)

    const {
      playerid: playerId,
      authcode: authCode,
    } = headers

    // this.log.info("[upgrade] headers:", "playerId:", playerId, "authCode:", authCode)

    if (!(
      playerId &&
      authCode
    )) {
      this.log.warn("[upgrade] invalid headers")
      return this.abortHttpUpgrade(socket)
    }

    const intPlayerId = parseInt(playerId)

    if (isNaN(intPlayerId)) {
      this.log.warn("[upgrade]", `NaN player id: ${playerId}`)
      return this.abortHttpUpgrade(socket)
    }

    const playerData = this.players.get(intPlayerId)

    if (!playerData) {
      this.log.warn("[upgrade]", `invalid player id: ${playerId}`)
      return this.abortHttpUpgrade(socket)
    }

    if (playerData.authCode !== authCode) {
      this.log.warn("[upgrade]", `invalid auth code: ${authCode} (playerId: ${playerId})`)
      return this.abortHttpUpgrade(socket)
    }

    if (playerData.socket) {
      this.log.warn("[upgrade]", `socket already connected (playerId: ${playerId})`)
      return this.abortHttpUpgrade(socket)
    }

    this.acceptHttpUpgrade(req, socket, head)
  }

  private abortHttpUpgrade (socket: net.Socket) {
    socket.destroy()
  }

  private acceptHttpUpgrade (req: http.IncomingMessage, socket: net.Socket, head: Buffer) {
    this.wss.handleUpgrade(req, socket, head, (ws) => {
      this.wss.emit("connection", ws, req)
    })
  }

  private setupWssEvents (wss: ws.Server) {
    wss.on("connection", this.onConnection.bind(this))
    wss.on("error", this.onError.bind(this))
  }

  private onError (error: Error) {
    this.log.error(`[error][wss] ${error.stack}`)
  }

  private onConnection (socket: ws.WebSocket, { headers }: http.IncomingMessage & IConnectionExtraReq) {
    const {
      playerid: playerId,
    } = headers

    if (playerId == null) {
      this.log.error("[connection]", `invalid playerId: ${playerId}`)
      return
    }

    const intPlayerId = +playerId

    const playerData = this.players.get(intPlayerId)

    if (!playerData) {
      this.log.error("[connection]", `invalid playerId ${playerId}: cannot get playerData`)
      return
    }

    const player = alt.Player.getByID(intPlayerId)

    if (!player) {
      this.log.error("[connection]", `invalid playerId: ${playerId} cannot find altv player`)
      return
    }

    playerData.socket = socket

    socket.on(
      "message",
      this.onSocketMessage.bind(this, socket, intPlayerId, player),
    )
    socket.on(
      "close",
      this.onSocketClose.bind(this, socket, intPlayerId, player),
    )
    socket.on(
      "error",
      this.onSocketError.bind(this, socket, intPlayerId, player),
    )

    const waiter = this.playerConnectWaits.get(player)

    if (waiter) {
      waiter.resolve()
      this.playerConnectWaits.delete(player)
    }

    this.log.info(`~gl~successful connection~w~ player id: ${playerId}`)
  }

  private onSocketMessage (
    socket: ws.WebSocket,
    playerId: number,
    player: alt.Player,
    data: Buffer,
  ) {
    if (!player.valid) {
      this.log.warn("received socket message from disconnected player:", playerId)
      return
    }

    // this.log.info("[onSocketMessage]", new Date().getMilliseconds())

    // this.log.info("[onSocketMessage]", `player: ${player.id}`, "type:", data?.constructor?.name ?? typeof data, "data:")
    // console.debug(data, "bytes:", data.byteLength, Array.from(data as Buffer), data.toString())

    // socket.send("ok")
    // socket.send(data)

    for (const handler of this.messageHandlers) {
      handler(player, data)
    }
  }

  private onSocketClose (
    socket: ws.WebSocket,
    playerId: number,
    player: alt.Player,
  ) {
    if (!player.valid) return

    this.socketCloseHandler(player)
  }

  private onSocketError (
    socket: ws.WebSocket,
    playerId: number,
    player: alt.Player,
    error: Error,
  ) {
    const playerName = player.valid ? player.name : "(disconnected)"

    this.log.error(`socket error player: ${playerName} [${playerId}]`)
    this.log.error(error)
  }

  private initUserEvents (events: IWebSocketServerOptions["events"]): MessageEventsManager {
    const manager = new MessageEventsManager(
      events as Record<string, ((...args: unknown[]) => void)>,
    )

    this.addMessageHandler((player, raw) => {
      manager.receive(raw.toString(), [player])
    })

    return manager
  }

  private generatePlayerAuthCode (): string {
    return uuidv4()
  }
}
