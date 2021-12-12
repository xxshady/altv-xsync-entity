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
  EntityIdsNetOwnerChanges,
} from "./types"
import { dist2dWithRange } from "../utils/dist-2d-range"

class StreamerWorker {
  private readonly pools: Record<number, IStreamerWorkerEntityPool> = {}
  private readonly entities: Record<number, IStreamerWorkerEntity> = {}
  private readonly players: Record<number, IStreamerWorkerPlayer> = {}

  /**
   * array for faster iteration through it in for loop
   */
  private entitiesArray: IStreamerWorkerDistEntity[] = []
  private oldEntitiesSize = 0
  private entitiesSizeBigger = false
  private netOwnerLogicEnabled = false

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
          netOwnerDist: Infinity,
        }
      }

      this.updateEntitiesArray()
      this.emit(StreamerFromWorkerEvents.EntitiesCreated)
    },

    [StreamerWorkerEvents.PlayersUpdate]: (playersData) => {
      // TEST
      // this.log.log("[PlayersUpdate] entities:", this.entities)
      // this.log.log("[PlayersUpdate] players:", this.players)

      // const label = `xsync streamer worker (${this.entitiesArray.length})`
      // console.time(label)
      const entitiesSize = this.entitiesArray.length
      const playersInEntityIds: StreamerWorkerPlayersEntities = {}
      const playersOutEntityIds: StreamerWorkerPlayersEntities = {}
      const entityIdsNetOwnerChanges: EntityIdsNetOwnerChanges = []

      this.entitiesSizeBigger = entitiesSize > this.oldEntitiesSize
      this.oldEntitiesSize = entitiesSize

      for (let i = 0; i < playersData.length; i++) {
        const playerDataOrId = playersData[i]

        // removed player id
        if (typeof playerDataOrId === "string") {
          const { owneredEntityIds } = this.players[playerDataOrId as unknown as number]

          for (const entityId of owneredEntityIds) {
            const entity = this.entities[entityId]

            if (!entity) continue

            entity.netOwnerId = null
            entity.netOwnerDist = Infinity
          }

          delete this.players[playerDataOrId as unknown as number]

          continue
        }

        const [playerId, { pos2d, dimension }] = playerDataOrId

        const PLAYER_DEFAULTS: IStreamerWorkerPlayer = {
          streamedEntityIds: new Set(),
          owneredEntityIds: new Set(),
          oldPos: { x: Infinity, y: Infinity },
          oldDimension: Infinity,
        } as const

        const player = this.players[playerId] ?? PLAYER_DEFAULTS

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
          player.owneredEntityIds,
          entityIdsNetOwnerChanges,
        )

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

      if (this.netOwnerLogicEnabled && Object.keys(entityIdsNetOwnerChanges).length) {
        this.emit(
          StreamerFromWorkerEvents.EntitiesNetOwnerChange,
          entityIdsNetOwnerChanges,
        )
      }
    },

    [StreamerWorkerEvents.DestroyEntity]: (entityId) => {
      const entity = this.entities[entityId]

      if (!entity) {
        this.log.error(`[DestroyEntity] unknown removed entity id: ${entityId}`)
        return
      }

      for (const playerId of entity.streamPlayerIds) {
        this.players[playerId]?.streamedEntityIds.delete(entityId)
      }

      if (this.netOwnerLogicEnabled) {
        if (entity.netOwnerId != null) {
          this.emit(
            StreamerFromWorkerEvents.EntitiesNetOwnerChange,
            [[entityId, entity.netOwnerId, null]],
          )
        }
      }

      delete this.entities[entityId]

      this.updateEntitiesArray()
      this.oldEntitiesSize = this.entitiesArray.length
    },

    [StreamerWorkerEvents.EnableNetOwnerLogic]: () => {
      this.netOwnerLogicEnabled = true
    },
  }

  constructor () {
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
       *  also i spent many hours to understand this shit
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
        netOwnerDist: Infinity,
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
    owneredEntityIds: Set<number>,
    netOwnerChanges: EntityIdsNetOwnerChanges,
  ): {
      streamIn: number[]
      streamOut: number[]
    } {
    const streamInIds: number[] = []
    const streamOutIds: number[] = []

    const entities = this.entitiesArray

    // TODO TEST 2 players
    if (!this.entitiesSizeBigger && oldDimension === dimension && oldPos.x === pos.x && oldPos.y === pos.y) {
      // this.log.log("old pos & dimension && entities size, skip distance checks")

      for (let i = 0; i < entities.length; i++) {
        const entity = entities[i]

        if (dimension === entity.dimension) continue

        this.streamOutEntityPlayer(
          playerId, entity.id, streamedEntityIds, streamOutIds,
          netOwnerChanges, owneredEntityIds,
        )

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
      const entity = sortedEntities[lastIdx]
      const { id, dist, poolId, streamRange, migrationRange } = entity

      if (this.netOwnerLogicEnabled) {
        const origEntity = this.entities[id]

        if (origEntity.netOwnerId === playerId) {
          if (dist > migrationRange && origEntity.streamPlayerIds.size <= 1) {
            owneredEntityIds.delete(id)
            netOwnerChanges.push([id, playerId, null])
            origEntity.netOwnerId = null
            origEntity.netOwnerDist = Infinity
          } else {
            origEntity.netOwnerDist = dist
          }
        }
      }

      if (dist > streamRange) {
        lastIdx++
        this.streamOutEntityPlayer(
          playerId, id, streamedEntityIds, streamOutIds,
          netOwnerChanges, owneredEntityIds,
        )
        continue
      }

      const poolStreamIn = poolsStreamIn[poolId] + 1

      if (poolStreamIn > this.pools[poolId].maxStreamedIn) {
        continue
      }

      lastIdx++

      poolsStreamIn[poolId] = poolStreamIn

      this.streamInEntityPlayer(
        playerId, id, streamedEntityIds, streamInIds,
        netOwnerChanges, owneredEntityIds, dist,
      )
    }

    for (let i = lastIdx; i < sortedEntities.length; i++) {
      this.streamOutEntityPlayer(
        playerId, sortedEntities[i].id, streamedEntityIds, streamOutIds,
        netOwnerChanges, owneredEntityIds,
      )
    }

    return {
      streamIn: streamInIds,
      streamOut: streamOutIds,
    }
  }

  private sortEntityDists (a: IStreamerWorkerDistEntity, b: IStreamerWorkerDistEntity) {
    return a.dist - b.dist
  }

  private streamOutEntityPlayer (
    playerId: number,
    entityId: number,
    streamedEntityIds: Set<number>,
    streamOutIds: number[],
    netOwnerChanges: EntityIdsNetOwnerChanges,
    owneredEntityIds: Set<number>,
  ) {
    if (!streamedEntityIds.delete(entityId)) return

    streamOutIds.push(entityId)

    const entity = this.entities[entityId]

    entity.streamPlayerIds.delete(playerId)

    if (this.netOwnerLogicEnabled) {
      if (entity.netOwnerId === playerId) {
        // TODO TEST AND REMOVE
        if (!owneredEntityIds.delete(entityId)) {
          this.log.error(`player: ${playerId} already NOT net owner of entity: ${entityId}`)
        } else {
          netOwnerChanges.push([entityId, playerId, null])
          entity.netOwnerId = null
          entity.netOwnerDist = Infinity
        }
      }
    }
  }

  private streamInEntityPlayer (
    playerId: number,
    entityId: number,
    streamedEntityIds: Set<number>,
    streamInIds: number[],
    netOwnerChanges: EntityIdsNetOwnerChanges,
    owneredEntityIds: Set<number>,
    dist: number,
  ) {
    const entity = this.entities[entityId]

    if (this.netOwnerLogicEnabled) {
      if (dist < entity.migrationRange && entity.netOwnerDist > entity.migrationRange) {
        // TODO TEST
        if (owneredEntityIds.has(entityId)) {
          this.log.error(`player: ${playerId} already net owner of entity: ${entityId}`)
        } else {
          owneredEntityIds.add(entityId)
          netOwnerChanges.push([entityId, entity.netOwnerId, playerId])
          entity.netOwnerId = playerId
          entity.netOwnerDist = dist
        }
      }
    }

    if (streamedEntityIds.has(entityId)) return

    streamedEntityIds.add(entityId)
    streamInIds.push(entityId)

    entity.streamPlayerIds.add(playerId)
  }
}

new StreamerWorker()