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
import { InternalEntity } from "../internal-entity"

class StreamerWorker {
  private readonly pools: Record<number, IStreamerWorkerEntityPool> = {}
  private readonly entities: Record<number, IStreamerWorkerEntity> = {}
  private readonly players: Record<number, IStreamerWorkerPlayer> = {}

  /**
   * array for faster iteration through it in for loop
   */
  private entitiesArray: IStreamerWorkerDistEntity[] = []

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

    [StreamerWorkerEvents.CreateEntities]: (
      entities,
    ) => {
      for (let i = 0; i < entities.length; i++) {
        const entity = entities[i]

        this.entities[entity.id] = {
          ...entity,
          netOwnerId: null,
          streamPlayerIds: new Set(),
        }
      }

      this.updateEntitiesArray()
      this.emit(StreamerFromWorkerEvents.EntitiesCreated)
    },

    [StreamerWorkerEvents.PlayersUpdate]: (playersData) => {
      // this.log.log("PlayersUpdate playersData:", playersData)

      // const label = `xsync streamer worker (${this.entitiesArray.length})`
      // console.time(label)
      const playersInEntityIds: StreamerWorkerPlayersEntities = {}
      const playersOutEntityIds: StreamerWorkerPlayersEntities = {}

      for (let i = 0; i < playersData.length; i++) {
        const playerDataOrId = playersData[i]

        // removed player id
        if (typeof playerDataOrId === "string") {
          delete this.players[playerDataOrId as unknown as number]
          continue
        }

        const [playerId, { pos2d, dimension }] = playerDataOrId

        const player = this.players[playerId] ?? {
          streamedEntityIds: new Set(),
          oldPos: pos2d,
          oldDimension: dimension,
        }

        const {
          streamIn,
          streamOut,
        } = this.streamEntitiesForPlayer(
          playerId,
          pos2d,
          player.oldPos,
          dimension,
          player.oldDimension,
          player.streamedEntityIds,
        )

        // if (streamIn.length > 0) {
        //   this.log.log(`returned streamEntitiesForPlayer player: ${playerId} streamIn:`, streamIn)
        // }

        if (streamIn.length > 0) {
          playersInEntityIds[playerId] = streamIn
        }
        if (streamOut.length > 0) {
          playersOutEntityIds[playerId] = streamOut
        }

        if (dimension !== player.oldDimension) {
          player.oldDimension = dimension
        }
        player.oldPos = pos2d

        this.players[playerId] = player
      }

      // console.timeEnd(label)

      this.emit(
        StreamerFromWorkerEvents.StreamChangePlayerEntities,
        playersInEntityIds,
        playersOutEntityIds,
      )
    },

    [StreamerWorkerEvents.DestroyEntity]: (entityId) => {
      const entity = this.entities[entityId]

      if (!entity) {
        this.log.error(`[PlayersUpdate] unknown removed entity id: ${entityId}`)
        return
      }

      for (const playerId of entity.streamPlayerIds) {
        this.players[playerId]?.streamedEntityIds.delete(entityId)
      }

      delete this.entities[entityId]

      this.updateEntitiesArray()
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
    this.entitiesArray = []

    for (const entityId in this.entities) {
      /**
       * copy the entity object here so as not to make a reference to the object
       * (if we just passed a reference to the object from {@link StreamerWorker#entities},
       * it would significantly degrade performance in the for loop
       *
       *  also i spent many hours to understand this :)
       * )
       */
      const {
        poolId,
        id,
        pos,
        dimension,
        migrationRange,
        netOwnerId,
        streamPlayerIds,
        streamRange,
      } = this.entities[entityId]

      this.entitiesArray.push({
        poolId,
        id,
        dimension,
        streamRange,
        migrationRange,
        netOwnerId,
        pos: { ...pos },
        streamPlayerIds: new Set(streamPlayerIds),
        dist: Infinity,
      })
    }
  }

  private streamEntitiesForPlayer (
    playerId: number,
    pos: alt.IVector2,
    oldPos: alt.IVector2,
    dimension: number,
    oldDimension: number,
    streamedEntityIds: Set<number>,
  ): {
      streamIn: number[]
      streamOut: number[]
    } {
    const streamInIds: number[] = []
    const streamOutIds: number[] = []

    const entities = this.entitiesArray

    if (oldDimension === dimension && oldPos.x === pos.x && oldPos.y === pos.y) {
      // this.log.log("old pos & dimension, skip distance checks")

      for (let i = 0; i < entities.length; i++) {
        const entity = entities[i]

        if (dimension === entity.dimension) continue

        this.streamOutEntityPlayer(playerId, entity.id, streamedEntityIds, streamOutIds)

        entity.dist = Infinity
      }

      return {
        streamIn: streamInIds,
        streamOut: streamOutIds,
      }
    }

    for (let i = 0; i < entities.length; i++) {
      const entity = entities[i]

      if (dimension !== entity.dimension) {
        entity.dist = Infinity
        continue
      }

      entity.dist = dist2dWithRange(
        entity.pos,
        pos,
        entity.streamRange,
      )
    }

    const sortedEntities = entities.sort(this.sortEntityDists)

    // console.log(`sortedEntities: ${sortedEntities.map(e => e.id).join(", ")}`)

    let lastIdx = 0

    // { [pool id]: player's streamed in number of entities }
    const poolsStreamIn: Record<number, number> = {}

    for (const poolId in this.pools) {
      poolsStreamIn[poolId] = 0
    }

    for (let i = 0; i < sortedEntities.length; i++) {
      const { id, dist, poolId, streamRange } = sortedEntities[lastIdx]

      if (dist > streamRange) {
        lastIdx++
        this.streamOutEntityPlayer(playerId, id, streamedEntityIds, streamOutIds)
        continue
      }

      const poolStreamIn = poolsStreamIn[poolId] + 1

      if (poolStreamIn > this.pools[poolId].maxStreamedIn) {
        continue
      }

      lastIdx++

      poolsStreamIn[poolId] = poolStreamIn

      this.streamInEntityPlayer(playerId, id, streamedEntityIds, streamInIds)
    }

    for (let i = lastIdx; i < sortedEntities.length; i++) {
      this.streamOutEntityPlayer(playerId, sortedEntities[i].id, streamedEntityIds, streamOutIds)
    }

    return {
      streamIn: streamInIds,
      streamOut: streamOutIds,
    }
  }

  private sortEntityDists (a: IStreamerWorkerDistEntity, b: IStreamerWorkerDistEntity) {
    return a.dist - b.dist
  }

  private streamOutEntityPlayer (playerId: number, entityId: number, streamedEntityIds: Set<number>, streamOutIds: number[]) {
    if (!streamedEntityIds.delete(entityId)) return

    streamOutIds.push(entityId)

    this.entities[entityId].streamPlayerIds.delete(playerId)
  }

  private streamInEntityPlayer (playerId: number, entityId: number, streamedEntityIds: Set<number>, streamInIds: number[]) {
    if (streamedEntityIds.has(entityId)) return

    streamedEntityIds.add(entityId)
    streamInIds.push(entityId)

    this.entities[entityId].streamPlayerIds.add(playerId)
  }
}

new StreamerWorker()