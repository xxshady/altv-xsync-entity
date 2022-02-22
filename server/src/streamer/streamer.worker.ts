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
  IStreamerWorkerArrEntity,
  IStreamerWorkerEntity,
  IStreamerWorkerEntityPool,
  StreamerWorkerPlayersEntities,
  EntityIdsNetOwnerChanges,
} from "./types"
import { dist2dWithRange } from "../utils/dist-2d-range"

class Logger {
  private readonly prefix = "[xsync:streamer:worker]"
  private label = ""
  private readonly enableInfo = ___DEV_MODE

  public log (...args: unknown[]) {
    if (!this.enableInfo) return

    console.log(this.prefix, ...args)
  }

  public error (...args: unknown[]) {
    console.error(
      // red color
      "\x1b[31m",
      this.prefix,
      ...args,
    )
  }

  public time (label = "1") {
    if (!this.enableInfo) return

    this.label = label
    console.time(label)
  }

  public timeEnd (label = this.label) {
    if (!this.enableInfo) return

    console.timeEnd(label)
  }
}

class StreamerWorker {
  private readonly pools: Record<number, IStreamerWorkerEntityPool> = {}
  private readonly entities: Record<number, IStreamerWorkerEntity> = {}
  private readonly players: Record<number, IStreamerWorkerPlayer> = {}

  /**
   * array for faster iteration through it in for loop
   */
  private entitiesArray: IStreamerWorkerArrEntity[] = []
  // private oldEntitiesSize = 0
  // private entitiesSizeBigger = false
  private netOwnerLogicEnabled = false

  private readonly log = new Logger()

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

        const newEntity = {
          ...entity,
          netOwnerId: null,
          streamPlayerIds: new Set<number>(),
          netOwnerDist: Infinity,
          arrayIndex: -1,
        }

        this.entities[entity.id] = newEntity
        this.copyEntityIntoArray(newEntity)
      }

      this.emit(StreamerFromWorkerEvents.EntitiesCreated)
    },

    [StreamerWorkerEvents.PlayersUpdate]: (playersData, removedPlayerIds) => {
      // this.log.log(
      //   "[PlayersUpdate] entities:",
      //   ___DEV_MODE
      //     ? Object.values(this.entities).map(({
      //       id,
      //       arrayIndex,
      //       pos,
      //       streamPlayerIds,
      //       netOwnerId,
      //       netOwnerDist,
      //     }) => ({
      //       id,
      //       arrayIndex,
      //       pos,
      //       streamPlayerIds,
      //       netOwnerId,
      //       netOwnerDist: +netOwnerDist.toFixed(1),
      //     }))
      //     : null,
      // )
      // this.log.log("[PlayersUpdate] entitiesArray:", this.entitiesArray.map(({ id, arrayIndex }) => ({ id, arrayIndex })))
      // this.log.log("[PlayersUpdate] playersData:", playersData, "removed players:", removedPlayerIds)

      // const label = `entities: ${this.entitiesArray.length}`
      // this.log.time(label)

      // const entitiesSize = this.entitiesArray.length
      const playersInEntityIds: StreamerWorkerPlayersEntities = {}
      const playersOutEntityIds: StreamerWorkerPlayersEntities = {}
      const entityIdsNetOwnerChanges: EntityIdsNetOwnerChanges = {}

      // this.entitiesSizeBigger = entitiesSize > this.oldEntitiesSize
      // this.oldEntitiesSize = entitiesSize

      for (let i = 0; i < removedPlayerIds.length; i++) {
        const playerId = +removedPlayerIds[i]

        const removedPlayer = this.players[playerId]
        if (!removedPlayer) continue

        for (const entityId of removedPlayer.owneredEntityIds) {
          const entity = this.entities[entityId]
          if (!entity) continue

          entity.netOwnerId = null
          entity.netOwnerDist = Infinity

          const arrEntity = this.entitiesArray[entity.arrayIndex]
          if (!arrEntity) continue

          arrEntity.netOwnerId = null
          arrEntity.netOwnerDist = Infinity
        }

        for (const entityId of removedPlayer.streamedEntityIds) {
          const entity = this.entities[entityId]
          if (!entity) continue

          entity.streamPlayerIds.delete(playerId)
        }

        delete this.players[playerId]
      }

      for (let i = 0; i < playersData.length; i++) {
        const [playerId, { pos2d, dimension }] = playersData[i]

        const PLAYER_DEFAULTS: IStreamerWorkerPlayer = {
          streamedEntityIds: new Set(),
          owneredEntityIds: new Set(),
          oldPos: { x: Infinity, y: Infinity },
          oldDimension: Infinity,
        } as const

        let player = this.players[playerId]

        if (!player) {
          this.log.log(`added player: ${playerId}`)
          player = PLAYER_DEFAULTS
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

      // this.log.timeEnd(label)

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
      if (!entity) return

      for (const playerId of entity.streamPlayerIds) {
        this.players[playerId]?.streamedEntityIds.delete(entityId)
      }

      if (this.netOwnerLogicEnabled) {
        if (entity.netOwnerId != null) {
          this.emit(
            StreamerFromWorkerEvents.EntitiesNetOwnerChange,
            { [entityId]: [entity.netOwnerId, null] },
          )
        }
      }

      delete this.entities[entityId]

      this.updateEntitiesArray()
      // this.oldEntitiesSize = this.entitiesArray.length
    },

    [StreamerWorkerEvents.EnableNetOwnerLogic]: () => {
      this.netOwnerLogicEnabled = true
    },

    [StreamerWorkerEvents.SetEntityPos]: (entityId, pos) => {
      // this.log.log(`SetEntityPos entity: ${entityId} pos:`, pos)

      const entity = this.entities[entityId]
      if (!entity) return

      entity.pos = pos
      this.entitiesArray[entity.arrayIndex].pos = pos

      // TODO maybe add simple distance check here
      // for faster stream out or netowner migration
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
        handler(...data as [firstArg: any, secondArg?: any])
      },
    )
  }

  private updateEntitiesArray () {
    this.entitiesArray = []

    for (const entityId in this.entities) {
      this.copyEntityIntoArray(this.entities[entityId])
    }
  }

  private copyEntityIntoArray (entity: IStreamerWorkerEntity) {
    /**
     * copy the entity object here so as not to make a reference to the object
     *
     * if we just passed a reference to the object from {@link StreamerWorker#entities},
     * it would significantly degrade performance in the for loop
     * also i spent many hours to understand this shit
     *
    */

    const arrayIndex = this.entitiesArray.length
    const {
      poolId,
      id,
      pos,
      dimension,
      migrationRange,
      netOwnerId,
      streamPlayerIds,
      streamRange,
    } = entity

    entity.arrayIndex = arrayIndex

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
      arrayIndex,
    })
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

    // TODO fix it for netowners & dynamic entity pos change
    // if (!this.netOwnerLogicEnabled) {
    //   if (!this.entitiesSizeBigger && oldDimension === dimension && oldPos.x === pos.x && oldPos.y === pos.y) {
    //     // this.log.log("old pos & dimension && entities size, skip distance checks")

    //     for (let i = 0; i < entities.length; i++) {
    //       const entity = entities[i]

    //       if (dimension === entity.dimension) continue

    //       this.streamOutEntityPlayer(
    //         playerId, entity, streamedEntityIds, streamOutIds,
    //         netOwnerChanges, owneredEntityIds,
    //       )

    //       entity.dist = Infinity
    //     }

    //     return {
    //       streamIn: streamInIds,
    //       streamOut: streamOutIds,
    //     }
    //   }
    // }

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

    const sortedEntities = [...entities].sort(this.sortEntityDists)

    // console.log(`sortedEntities: ${sortedEntities.map(e => e.id).join(", ")}`)

    let lastIdx = 0

    // { [pool id]: player's streamed in number of entities }
    const poolsStreamIn: Record<number, number> = {}

    for (const poolId in this.pools) {
      poolsStreamIn[poolId] = 0
    }
    for (let i = 0; i < sortedEntities.length; i++) {
      const arrEntity = sortedEntities[lastIdx]
      const {
        id,
        dist,
        poolId,
        streamRange,
        migrationRange,
        netOwnerId,
        netOwnerDist,
      } = arrEntity

      if (this.netOwnerLogicEnabled) {
        if (netOwnerId === playerId) {
          const origEntity = this.entities[id]

          if (dist > migrationRange) {
            owneredEntityIds.delete(id)
            netOwnerChanges[id] = [playerId, null]
            origEntity.netOwnerId = null
            origEntity.netOwnerDist = Infinity
            arrEntity.netOwnerId = null
            arrEntity.netOwnerDist = Infinity
          } else {
            origEntity.netOwnerDist = dist
            arrEntity.netOwnerDist = dist
          }
        }
      }

      if (dist > streamRange) {
        lastIdx++
        this.streamOutEntityPlayer(
          playerId, arrEntity, streamedEntityIds, streamOutIds,
          netOwnerChanges, owneredEntityIds,
        )
        continue
      }

      if (this.netOwnerLogicEnabled) {
        if (netOwnerId !== playerId && dist < migrationRange && netOwnerDist > migrationRange) {
          if (owneredEntityIds.has(id)) {
            this.log.error(`player: ${playerId} already net owner of entity: ${id}`)
          } else {
            // this.log.log(`set net owner entity: ${entity.id} player: ${playerId}`)
            const entity = this.entities[id]

            owneredEntityIds.add(id)

            let netOwnerChange = netOwnerChanges[id]

            if (netOwnerChange) {
              this.log.log(`netOwnerChange null to oldNetOwner entity: ${id} newNetOwner: ${playerId}`)

              // it is assumed netOwnerChange here is:
              // [oldNetOwnerId: number, newNetOwnerId: null]
              // and we change newNetOwnerId to our current playerId

              if (netOwnerChange[0] == null) {
                this.log.error(`oldNetOwner is null netOwnerChange null to oldNetOwner entity: ${id} newNetOwner: ${playerId}`)
              } else {
                netOwnerChange[1] = playerId
              }
            } else {
              netOwnerChange = [netOwnerId, playerId]
            }
            netOwnerChanges[id] = netOwnerChange

            if (netOwnerId != null) {
              this.players[netOwnerId]?.owneredEntityIds.delete(id)
            }

            entity.netOwnerId = playerId
            entity.netOwnerDist = dist
            arrEntity.netOwnerId = playerId
            arrEntity.netOwnerDist = dist
          }
        }
      }

      const poolStreamIn = poolsStreamIn[poolId] + 1

      if (poolStreamIn > this.pools[poolId].maxStreamedIn) {
        continue
      }

      lastIdx++

      poolsStreamIn[poolId] = poolStreamIn

      this.streamInEntityPlayer(
        playerId, arrEntity, streamedEntityIds, streamInIds,
      )
    }

    for (let i = lastIdx; i < sortedEntities.length; i++) {
      this.streamOutEntityPlayer(
        playerId, sortedEntities[i], streamedEntityIds, streamOutIds,
        netOwnerChanges, owneredEntityIds,
      )
    }

    return {
      streamIn: streamInIds,
      streamOut: streamOutIds,
    }
  }

  private sortEntityDists (a: IStreamerWorkerArrEntity, b: IStreamerWorkerArrEntity) {
    return a.dist - b.dist
  }

  private streamOutEntityPlayer (
    playerId: number,
    arrEntity: IStreamerWorkerArrEntity,
    streamedEntityIds: Set<number>,
    streamOutIds: number[],
    netOwnerChanges: EntityIdsNetOwnerChanges,
    owneredEntityIds: Set<number>,
  ) {
    const entityId = arrEntity.id

    if (!streamedEntityIds.delete(entityId)) return

    streamOutIds.push(entityId)

    const entity = this.entities[entityId]

    entity.streamPlayerIds.delete(playerId)

    if (this.netOwnerLogicEnabled) {
      if (entity.netOwnerId === playerId) {
        if (!owneredEntityIds.delete(entityId)) {
          this.log.error(`player: ${playerId} already NOT net owner of entity: ${entityId}`)
        } else {
          netOwnerChanges[entityId] = [playerId, null]
          entity.netOwnerId = null
          entity.netOwnerDist = Infinity
          arrEntity.netOwnerId = null
          arrEntity.netOwnerDist = Infinity
        }
      }
    }
  }

  private streamInEntityPlayer (
    playerId: number,
    arrEntity: IStreamerWorkerArrEntity,
    streamedEntityIds: Set<number>,
    streamInIds: number[],
  ) {
    const entityId = arrEntity.id
    const entity = this.entities[entityId]
    if (streamedEntityIds.has(entityId)) return

    streamedEntityIds.add(entityId)
    streamInIds.push(entityId)

    entity.streamPlayerIds.add(playerId)
  }
}

new StreamerWorker()