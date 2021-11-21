import type * as alt from "alt-server"
import { createLogger } from "altv-xlogger"
import { InternalEntity } from "../internal-entity"
import {
  StreamerFromWorkerEvents,
  StreamerWorkerEvents,
} from "./events"
import type {
  IStreamerWorkerEvent,
  IStreamerSharedWorkerMessage,
  IStreamerFromWorkerEvent,
} from "./events"
import Worker from "./streamer.worker.ts"
import type { EntityPool } from "../entity-pool"
import { InternalXSyncEntity } from "../internal-xsync-entity"
import type { ICurrentPlayersUpdate } from "./types"

export class Streamer {
  private readonly worker = new Worker()
  private readonly log = createLogger("altv-xsync-entity:streamer")

  private readonly currentPlayersUpdate: ICurrentPlayersUpdate = {
    pending: false,
    startMs: 0,
    removedEntityIds: {},
    removedPlayerIds: [],
  }

  private readonly eventHandlers: IStreamerFromWorkerEvent = {
    [StreamerFromWorkerEvents.StreamChangePlayerEntities]: (
      playersInEntities,
      playersOutEntities,
    ) => {
      const players = InternalXSyncEntity.instance.players.dict
      const entities = InternalEntity.all
      const streamInEntities: InternalEntity[] = []
      const streamOutEntities: InternalEntity[] = []
      const {
        removedEntityIds,
        removedPlayerIds,
      } = this.currentPlayersUpdate

      this.log.log("[StreamChangePlayerEntities]", playersInEntities)

      for (const playerId in playersOutEntities) {
        // TODO TEST
        if (removedPlayerIds[playerId]) continue

        const player = players[playerId]
        const entityIds = playersOutEntities[playerId]

        if (!player) {
          this.log.error(`non exist playerid: ${playerId}`)
          continue
        }

        for (let i = 0; i < entityIds.length; i++) {
          const entityId = entityIds[i]
          // TODO TEST
          if (removedEntityIds[entityId]) continue

          const entity = entities[entityId]

          if (!entity) {
            this.log.error(`non exist entity: ${entityId}`)
            continue
          }

          streamOutEntities.push(entity)
        }

        this.onEntitiesStreamOut(player, streamInEntities)
      }

      for (const playerId in playersInEntities) {
        // TODO TEST
        if (removedPlayerIds[playerId]) continue

        const player = players[playerId]
        const entityIds = playersInEntities[playerId]

        if (!player) {
          this.log.error(`non exist playerid: ${playerId}`)
          continue
        }

        for (let i = 0; i < entityIds.length; i++) {
          const entityId = entityIds[i]
          // TODO TEST
          if (removedEntityIds[entityId]) continue

          const entity = entities[entityId]

          if (!entity) {
            this.log.error(`non exist entity: ${entityId}`)
            continue
          }

          streamInEntities.push(entity)
        }

        this.onEntitiesStreamIn(player, streamInEntities)
      }

      this.clearCurrentPlayersUpdate()
    },

    [StreamerFromWorkerEvents.NetOwnerChangeEntities]: (netOwnersAndEntities) => {

    },
  }

  constructor (
    private readonly onEntitiesStreamIn: (player: alt.Player, entities: InternalEntity[]) => void,
    private readonly onEntitiesStreamOut: (player: alt.Player, entities: InternalEntity[]) => void,
    streamDelay = 100,
  ) {
    this.setupEvents()
    this.setupPlayersUpdateInterval(streamDelay)
  }

  public addPool ({ id, maxStreamedIn }: EntityPool): void {
    this.emitWorker(
      StreamerWorkerEvents.CreatePool,
      {
        id,
        maxStreamedIn,
      },
    )
  }

  public addEntity (
    {
      poolId,
      id,
      pos,
      dimension,
      streamRange,
      migrationRange,
    }: InternalEntity,
  ): void {
    this.emitWorker(
      StreamerWorkerEvents.CreateEntity,
      {
        poolId,
        id,
        pos: { x: pos.x, y: pos.y },
        dimension,
        streamRange,
        migrationRange,
      },
    )
  }

  public removeEntity ({ id }: InternalEntity): void {
    this.emitWorker(StreamerWorkerEvents.DestroyEntity, id)

    // TODO TEST remove & add entity while players update in process (entity id will be same)
    const { pending, removedEntityIds } = this.currentPlayersUpdate

    if (!pending) {
      removedEntityIds[id] = true
    }
  }

  public removedPlayer ({ id }: alt.Player): void {
    const { pending, removedPlayerIds } = this.currentPlayersUpdate

    if (!pending) return

    removedPlayerIds.push(id)
  }

  private emitWorker <K extends StreamerWorkerEvents> (
    eventName: K,
    ...args: Parameters<IStreamerWorkerEvent[K]>
  ): void {
    const message: IStreamerSharedWorkerMessage<IStreamerWorkerEvent, K> = {
      name: eventName,
      data: args,
    }

    this.worker.postMessage(message)
  }

  private setupEvents () {
    this.worker.on(
      "message",
      <K extends StreamerFromWorkerEvents> (
        { name, data }: IStreamerSharedWorkerMessage<IStreamerFromWorkerEvent, K>,
      ) => {
        const handler = this.eventHandlers[name]

        if (!handler) {
          this.log.error(`received unknown event: ${name}`)
          return
        }

        // fuck typescript complaints, i know what im doing
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        handler(...data as [firstArg: any, firstArg?: any])
      },
    )
  }

  private setupPlayersUpdateInterval (streamDelay: number) {
    setInterval(this.playersUpdatesProcess.bind(this), streamDelay)
  }

  private playersUpdatesProcess () {
    try {
      const players = InternalXSyncEntity.instance.players.array
      const { removedPlayerIds } = this.currentPlayersUpdate
      const playersData: Parameters<IStreamerWorkerEvent[StreamerWorkerEvents.PlayersUpdate]>[0] = []

      for (let i = 0; i < players.length; i++) {
        const { id, pos, dimension } = players[i]
        const pos2d = {
          x: pos.x,
          y: pos.y,
        }

        playersData[i] = [
          id,
          {
            pos2d,
            dimension,
          },
        ]
      }

      playersData.push(...removedPlayerIds)

      this.emitWorker(StreamerWorkerEvents.PlayersUpdate, playersData)
      this.startCurrentPlayersUpdate()
    } catch (e) {
      this.log.error(e)
    }
  }

  private clearCurrentPlayersUpdate () {
    const { currentPlayersUpdate } = this

    this.log.log("players update elapsed ms:", (+new Date() - currentPlayersUpdate.startMs))

    currentPlayersUpdate.pending = false
    currentPlayersUpdate.startMs = 0
    currentPlayersUpdate.removedEntityIds = {}
  }

  private startCurrentPlayersUpdate () {
    const { currentPlayersUpdate } = this

    if (currentPlayersUpdate.pending) {
      throw new Error("[startCurrentPlayersUpdate] players update still in process")
    }

    currentPlayersUpdate.pending = true
    currentPlayersUpdate.startMs = +new Date()
    currentPlayersUpdate.removedPlayerIds = []

    this.log.log("players update start")
  }
}