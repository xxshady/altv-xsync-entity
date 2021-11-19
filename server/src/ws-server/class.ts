import * as alt from "alt-server"
import * as ws from "ws-esm"
import type {
  IConnectionExtraReq,
  IWebSocketServerOptions,
  IWebSocketPlayer,
  RawClientMessageHandler,
} from "./types"
import http from "http"
import type net from "net"
import uuidv4 from "../utils/uuidv4"
import { createLogger } from "altv-xlogger"
import { MessageEventsManager } from "altv-xsync-entity-shared"
import { getExternalIp } from "../utils/external-ip"

export class WSServer {
  private readonly log = createLogger("WSServer")
  /**
   * key number - player.id
   */
  private readonly players = new Map<number, IWebSocketPlayer>()
  private readonly messageHandlers = new Set<RawClientMessageHandler>()

  private readonly wss: ws.Server
  private readonly eventsManager: MessageEventsManager
  private _externalIp: string | null = null

  constructor (port: number, { events }: IWebSocketServerOptions) {
    this.log.log(`init server on port: ${port}...`)

    const server = new http.Server()

    const wss = new ws.Server({
      noServer: true,
    })

    this.eventsManager = this.initUserEvents(events)
    this.wss = wss

    this.setupHttpEvents(server)
    this.setupWssEvents(wss)
    this.setupAltEvents()
    this.initExternalIp().catch(this.onInitExternalIpError.bind(this))
    server.listen(port)
  }

  private get externalIp (): string {
    const { _externalIp } = this

    if (!_externalIp) {
      throw new Error("external ip has not been getted yet")
    }

    return _externalIp
  }

  public sendPlayer (player: alt.Player, eventName: string, ...args: unknown[]): void {
    if (!player.valid) return

    const message = this.eventsManager.send(eventName, args)

    const playerData = this.players.get(player.id)

    if (!playerData) {
      throw new Error("[sendPlayer] player wasnt added")
    }

    const { socket } = playerData

    if (!socket) {
      throw new Error("[sendPlayer] player wasnt connected as ws")
    }

    socket.send(message, (err) => {
      this.log.log("[sendPlayer]", "socket.send cb err:")
      console.debug(err)
    })
  }

  /**
   *
   * @param player
   */
  public addPlayer (player: alt.Player): string {
    const { id } = player

    if (this.players.has(id)) {
      throw new Error("player already added")
    }

    const authCode = this.generatePlayerAuthCode()

    this.players.set(id, {
      socket: null,
      authCode,
    })

    this.log.log("[addPlayer]", `player id: ${player.id}`, "auth code:", authCode)

    return authCode
  }

  private addMessageHandler (handler: RawClientMessageHandler): void {
    this.messageHandlers.add(handler)
  }

  private setupHttpEvents (server: http.Server) {
    server.on("upgrade", this.onHttpUpgrade.bind(this))
    server.on("listening", this.onHttpListening.bind(this))
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

    this.log.log("[upgrade] headers:", "playerId:", playerId, "authCode:", authCode)

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

  private onHttpListening () {
    this.log.log("~gl~http server started listening")
  }

  private onError (error: Error) {
    this.log.error(`[error] ${error.stack}`)
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

    // TEST

    // const playerId = 0
    // const intPlayerId = 0
    // const player = { name: "test", id: playerId, valid: true }

    socket.on(
      "message",
      this.onSocketMessage.bind(this, socket, intPlayerId, player),
    )

    this.log.log(`~gl~successful connection~w~ player id: ${playerId}`)
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

    this.log.log("[onSocketMessage]", new Date().getMilliseconds())

    this.log.log("[onSocketMessage]", `player: ${player.id}`, "type:", data?.constructor?.name ?? typeof data, "data:")
    console.debug(data, "bytes:", data.byteLength, Array.from(data as Buffer), data.toString())

    // socket.send("ok")
    // socket.send(data)

    for (const handler of this.messageHandlers) {
      handler(player, data)
    }
  }

  private setupAltEvents () {
    alt.on(
      "playerDisconnect",
      this.onPlayerDisconnect.bind(this) as alt.IServerEvent["playerDisconnect"],
    )
  }

  private onPlayerDisconnect (player: alt.Player) {
    const { id } = player
    const playerData = this.players.get(id)

    if (!playerData) return

    this.players.delete(id)
    playerData.socket?.close()
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

  private async initExternalIp (): Promise<void> {
    const ip = await getExternalIp()

    this.log.log("~gl~received external ip:", ip)

    this._externalIp = ip
  }

  private onInitExternalIpError (e: Error) {
    this.log.error("failed get external ip")
    this.log.error(e)
  }
}