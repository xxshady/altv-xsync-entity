import type * as alt from "alt-server"
import { parentPort } from "worker_threads"
import {
  StreamerWorkerEvents,
  StreamerFromWorkerEvents,
} from "./events"
import type {
  IStreamerWorkerEvent,
  IStreamerSharedWorkerMessage,
  IStreamerFromWorkerEvent,
} from "./events"
import type {
  IStreamerWorkerPlayer,
  IStreamerWorkerDistEntity,
  IStreamerWorkerEntity,
  IStreamerWorkerEntityPool,
  StreamerWorkerPlayersEntities,
} from "./types"
import { dist2dWithRange } from "../utils/dist-2d-range"

class StreamerWorker {
  private readonly pools: Record<number, IStreamerWorkerEntityPool> = {}
  private readonly entities: Record<number, IStreamerWorkerEntity> = {}
  private readonly players: Record<number, IStreamerWorkerPlayer> = {}

  /**
   * array for faster iteration through it in for loop
   */
  private entitiesArray: IStreamerWorkerEntity[] = []

  private readonly log = {
    prefix: "[xsync-entity:streamer:worker]",
    log (...args: unknown[]) {
      console.log(this.prefix, ...args)
    },
    error (...args: unknown[]) {
      console.error(
        // red color
        "\x1b[31m",
        this.prefix,
        ...args,
      )
    },
  }

  private readonly eventHandlers: IStreamerWorkerEvent = {
    [StreamerWorkerEvents.CreatePool]: ({ id, maxStreamedIn }) => {
      this.pools[id] = {
        maxStreamedIn,
      }
    },

    [StreamerWorkerEvents.CreateEntity]: (
      { poolId, id, dimension, pos, streamRange, migrationRange },
    ) => {
      this.entities[id] = {
        id,
        poolId,
        dimension,
        pos,
        streamRange,
        migrationRange,
        netOwnerId: null,
      }

      this.updateEntitiesArray()
    },

    [StreamerWorkerEvents.DestroyEntity]: (entityId) => {
      delete this.entities[entityId]

      this.updateEntitiesArray()
    },

    [StreamerWorkerEvents.PlayersUpdate]: (playersData) => {
      const playersInEntities: StreamerWorkerPlayersEntities = {}
      const playersOutEntities: StreamerWorkerPlayersEntities = {}

      for (let i = 0; i < playersData.length; i++) {
        const playerDataOrId = playersData[i]

        // removed player id
        if (typeof playerDataOrId === "number") {
          delete this.players[playerDataOrId]
          continue
        }

        const [playerId, { pos2d, dimension }] = playerDataOrId

        let streamedEntityIds: Set<number>
        const player = this.players[playerId]

        if (player) {
          streamedEntityIds = player.streamedEntityIds
        } else {
          streamedEntityIds = new Set()
        }

        const {
          streamIn,
          streamOut,
        } = this.streamEntitiesForPlayer(pos2d, dimension, streamedEntityIds)

        playersInEntities[playerId] = streamIn
        playersOutEntities[playerId] = streamOut

        this.players[playerId] = { streamedEntityIds }
      }

      this.emit(
        StreamerFromWorkerEvents.StreamChangePlayerEntities,
        playersInEntities,
        playersOutEntities,
      )
    },
  }

  constructor () {
    // this.log.log("worker started")
    this.setupEvents()
  }

  private emit <K extends StreamerFromWorkerEvents> (
    eventName: K,
    ...args: Parameters<IStreamerFromWorkerEvent[K]>
  ): void {
    const message: IStreamerSharedWorkerMessage<IStreamerFromWorkerEvent, K> = {
      name: eventName,
      data: args,
    }

    parentPort?.postMessage(message)
  }

  private setupEvents () {
    parentPort?.on(
      "message",
      <K extends StreamerWorkerEvents> (
        { name, data }: IStreamerSharedWorkerMessage<IStreamerWorkerEvent, K>,
      ) => {
        const handler = this.eventHandlers[name]

        if (!handler) {
          this.log.error(`received unknown event: ${name}`)
          return
        }

        // fuck typescript complaints, i know what im doing
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        handler(...data as [firstArg: any])
      },
    )
  }

  private updateEntitiesArray () {
    this.entitiesArray = Object.values(this.entities)
  }

  private streamEntitiesForPlayer (
    pos: alt.IVector2,
    dimension: number,
    streamedEntityIds: Set<number>,
  ): {
      streamIn: number[]
      streamOut: number[]
    } {
    const streamInIds: number[] = []
    const streamOutIds: number[] = []
    const entities = this.entitiesArray
    const filteredEntities: IStreamerWorkerDistEntity[] = []

    for (let i = 0; i < entities.length; i++) {
      const {
        poolId,
        id,
        dimension: entityDimension,
        pos: entityPos,
        streamRange,
      } = entities[i]

      if (dimension !== entityDimension) {
        this.streamOutEntityPlayer(id, streamedEntityIds, streamOutIds)
        continue
      }

      filteredEntities.push({
        poolId,
        id,
        dist: dist2dWithRange(
          entityPos,
          pos,
          streamRange,
        ),
      })
    }

    const sortedEntities = filteredEntities.sort(this.sortEntityDists)

    // console.log(`sortedEntities: ${sortedEntities.map(e => e.id).join(", ")}`)

    let lastIdx = 0

    // { pool id -> number of entities }
    const poolsStreamIn: Record<number, number> = {}

    for (const poolId in this.pools) {
      poolsStreamIn[poolId] = 0
    }

    for (; lastIdx < sortedEntities.length; lastIdx++) {
      const { id, dist, poolId } = sortedEntities[lastIdx]

      if (dist === Infinity) {
        this.streamOutEntityPlayer(id, streamedEntityIds, streamOutIds)
        continue
      }

      const poolStreamIn = poolsStreamIn[poolId] + 1

      // TODO TEST correct calculation of max streamed in entities
      if (poolStreamIn > this.pools[poolId].maxStreamedIn) {
        continue
      }

      this.streamInEntityPlayer(id, streamedEntityIds, streamInIds)
    }

    for (let i = lastIdx + 1; i < sortedEntities.length; i++) {
      this.streamOutEntityPlayer(sortedEntities[i].id, streamedEntityIds, streamOutIds)
    }

    return {
      streamIn: streamInIds,
      streamOut: streamOutIds,
    }
  }

  private sortEntityDists (a: IStreamerWorkerDistEntity, b: IStreamerWorkerDistEntity) {
    return a.dist - b.dist
  }

  private streamOutEntityPlayer (entityId: number, streamedEntityIds: Set<number>, streamOutIds: number[]) {
    if (!streamedEntityIds.delete(entityId)) return

    streamOutIds.push(entityId)
  }

  private streamInEntityPlayer (entityId: number, streamedEntityIds: Set<number>, streamInIds: number[]) {
    if (streamedEntityIds.has(entityId)) return

    streamedEntityIds.add(entityId)
    streamInIds.push(entityId)
  }
}

new StreamerWorker()