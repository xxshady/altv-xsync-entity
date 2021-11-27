import type * as alt from "alt-server"
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
import type {
  ICurrentPlayersUpdate,
  IEntityCreateQueue,
  IStreamerWorkerCreateEntity,
  PlayerId,
  PlayersUpdateData,
} from "./types"
import { createLogger } from "altv-xlogger"
import type { Entity } from "../entity"

export class Streamer {
  private readonly worker = new Worker()
  private readonly log = createLogger("altv-xsync-entity:streamer")

  private readonly currentPlayersUpdate: ICurrentPlayersUpdate = {
    pending: false,
    startMs: 0,
    removedEntityIds: {},
    removedPlayerIds: {},
  }

  private readonly entitiesStreamedPlayerIds: Record<Entity["id"], Set<PlayerId>> = {}
  private readonly playersStreamEntityIds: Record<PlayerId, Set<Entity["id"]>> = {}

  private readonly entityCreateQueue: IEntityCreateQueue = {
    chunkSize: 3000,
    entities: [],
    sendPromise: null,
    started: false,
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

      // if (Object.keys(playersInEntities).length > 0) {
      //   this.log.log("[streamIn]")
      //   this.log.nodeLog(playersInEntities)
      // }
      // if (Object.keys(playersOutEntities).length > 0) {
      //   this.log.log("[streamOut]")
      //   this.log.nodeLog(playersOutEntities)
      // }

      for (const playerId in playersOutEntities) {
        try {
          // TODO TEST
          if (removedPlayerIds[playerId]) continue

          const player = players[playerId]
          const entityIds = playersOutEntities[playerId]

          if (!player) {
            throw new Error(`[xsync-entity:streamer] non exist player id: ${playerId}`)
          }

          for (let i = 0; i < entityIds.length; i++) {
            try {
              const entityId = entityIds[i]

              if (removedEntityIds[entityId]) continue

              const entity = entities[entityId]

              if (!entity) {
                throw new Error(`[xsync-entity:streamer] non exist entity id: ${entityId}`)
              }

              this.removeStreamEntityPlayerLink(+playerId, entityId)
              streamOutEntities.push(entity)
            } catch (e) {
              this.log.error(e)
            }
          }

          this.onEntitiesStreamOut(player, streamOutEntities)
        } catch (e) {
          this.log.error(e)
        }
      }

      for (const playerId in playersInEntities) {
        try {
          if (removedPlayerIds[playerId]) continue

          const player = players[playerId]
          const entityIds = playersInEntities[playerId]

          if (!player) {
            throw new Error(`[xsync-entity:streamer] non exist player id: ${playerId}`)
          }

          for (let i = 0; i < entityIds.length; i++) {
            const entityId = entityIds[i]
            // TODO TEST
            if (removedEntityIds[entityId]) continue

            const entity = entities[entityId]

            if (!entity) {
              throw new Error(`[xsync-entity:streamer] non exist entity id: ${entityId}`)
            }

            this.addStreamEntityPlayerLink(+playerId, entityId)
            streamInEntities.push(entity)
          }

          this.onEntitiesStreamIn(player, streamInEntities)
        } catch (e) {
          this.log.error(e)
        }
      }

      this.clearCurrentPlayersUpdate()
    },

    [StreamerFromWorkerEvents.NetOwnerChangeEntities]: (netOwnersAndEntities) => {

    },

    [StreamerFromWorkerEvents.EntitiesCreated]: () => {
      const { entityCreateQueue } = this

      if (!entityCreateQueue.sendPromise) return

      entityCreateQueue.sendPromise.resolve()
      entityCreateQueue.sendPromise = null
    },
  }

  constructor (
    private readonly onEntitiesStreamIn: (player: alt.Player, entities: InternalEntity[]) => void,
    private readonly onEntitiesStreamOut: (player: alt.Player, entities: InternalEntity[]) => void,
    private readonly onEntityDestroy: (player: alt.Player, entityId: number) => void,
    streamDelay = 100,
  ) {
    this.setupWorkerEvents()
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
    entity: InternalEntity,
  ): void {
    this.entityCreateQueue.entities.push(entity)
    this.startEntityCreateQueue().catch(this.log.error)
  }

  public removeEntity ({ id }: InternalEntity): void {
    this.currentPlayersUpdate.removedEntityIds[id] = true

    this.emitWorker(StreamerWorkerEvents.DestroyEntity, id)

    const playerIds = this.deleteEntityStreamedPlayerIds(id)

    if (!playerIds) return

    for (const playerId of playerIds) {
      const player = InternalXSyncEntity.instance.players.dict[playerId]

      if (!player) continue

      this.onEntityDestroy(player, id)
    }
  }

  public removedPlayer ({ id }: alt.Player): void {
    this.currentPlayersUpdate.removedPlayerIds[id] = true
    this.deletePlayerStreamEntityIds(id)
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

  private setupWorkerEvents () {
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

        try {
          // fuck typescript complaints, i know what im doing
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          handler(...data as [firstArg: any, secondArg?: any])
        } catch (e) {
          this.log.error("error in handler from worker event")
          this.log.error(e)
        }
      },
    )

    this.worker.on("error", (err) => {
      this.log.error("from worker error:", err.stack)
    })
  }

  private setupPlayersUpdateInterval (streamDelay: number) {
    setInterval(this.playersUpdatesProcess.bind(this), streamDelay)
  }

  private playersUpdatesProcess () {
    try {
      if (this.currentPlayersUpdate.pending) {
        this.log.warn(`players update process takes too long, need to increase streamDelay (> ${+new Date() - this.currentPlayersUpdate.startMs}ms) `)
        return
      }
      const players = InternalXSyncEntity.instance.players.array

      if (!players.length) return

      const {
        removedPlayerIds,
      } = this.currentPlayersUpdate
      const playersData: PlayersUpdateData = []

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

      playersData.push(...Object.keys(removedPlayerIds))

      this.emitWorker(
        StreamerWorkerEvents.PlayersUpdate,
        playersData,
      )
      this.startCurrentPlayersUpdate()
    } catch (e) {
      this.log.error(e)
    }
  }

  private clearCurrentPlayersUpdate () {
    const { currentPlayersUpdate } = this

    // this.log.log("players update elapsed ms:", (+new Date() - currentPlayersUpdate.startMs))

    currentPlayersUpdate.pending = false
    currentPlayersUpdate.startMs = 0
  }

  private startCurrentPlayersUpdate () {
    const { currentPlayersUpdate } = this

    if (currentPlayersUpdate.pending) {
      throw new Error("[startCurrentPlayersUpdate] players update still in process")
    }

    currentPlayersUpdate.pending = true
    currentPlayersUpdate.startMs = +new Date()
    currentPlayersUpdate.removedPlayerIds = {}
    currentPlayersUpdate.removedEntityIds = {}
  }

  private addStreamEntityPlayerLink (playerId: number, entityId: number) {
    const playerIds = this.entitiesStreamedPlayerIds[entityId] ?? new Set()
    const entityIds = this.playersStreamEntityIds[playerId] ?? new Set()

    playerIds.add(playerId)
    entityIds.add(entityId)

    this.entitiesStreamedPlayerIds[entityId] = playerIds
    this.playersStreamEntityIds[playerId] = entityIds

    // this.log.log("addStreamEntityPlayerLink", "player:", playerId, "entity:", entityId)
    // this.log.nodeLog("playerIds:", playerIds, "entityIds:", entityIds)
  }

  private removeStreamEntityPlayerLink (playerId: number, entityId: number) {
    this.entitiesStreamedPlayerIds[entityId]?.delete(playerId)
    this.playersStreamEntityIds[playerId]?.delete(entityId)
  }

  private deletePlayerStreamEntityIds (playerId: number) {
    const entityIds = this.playersStreamEntityIds[playerId]

    if (!entityIds) return

    for (const id of entityIds) {
      this.removeStreamEntityPlayerLink(playerId, id)
    }

    delete this.playersStreamEntityIds[playerId]
  }

  private deleteEntityStreamedPlayerIds (entityId: number): Set<number> | undefined {
    const playerIds = this.entitiesStreamedPlayerIds[entityId]

    if (!playerIds) return

    for (const id of playerIds) {
      this.removeStreamEntityPlayerLink(id, entityId)
    }

    delete this.entitiesStreamedPlayerIds[entityId]

    return playerIds
  }

  private async startEntityCreateQueue () {
    const { entityCreateQueue } = this
    const { entities, chunkSize } = entityCreateQueue

    if (entityCreateQueue.started) {
      return
    }

    entityCreateQueue.started = true

    while (entities.length > 1) {
      const entitiesToSend = entities.splice(0, chunkSize)
      if (entitiesToSend.length < 1) return

      const label = `xsync streamer entity create (${entitiesToSend[entitiesToSend.length - 1].id})`
      console.time(label)
      this.sendCreateEntities(entitiesToSend)
      await this.waitEntitiesCreate()
      console.timeEnd(label)
    }

    entityCreateQueue.started = false
  }

  private waitEntitiesCreate (): Promise<void> {
    return new Promise<void>(resolve => {
      this.entityCreateQueue.sendPromise = { resolve }
    }).catch(this.log.error)
  }

  private sendCreateEntities (entities: InternalEntity[]) {
    const _entities: IStreamerWorkerCreateEntity[] = entities.map(
      (entity) => ({
        ...entity,
        pos: {
          x: entity.pos.x,
          y: entity.pos.y,
        },
      }))

    this.emitWorker(
      StreamerWorkerEvents.CreateEntities,
      _entities,
    )
  }
}