import { parentPort } from "worker_threads"
import { StreamerWorkerEvents } from "./events"
import type {
  IStreamerWorkerEvent,
  IStreamerSharedWorkerMessage,
} from "./events"
import type {
  IStreamWorkerEntity,
  IStreamWorkerEntityPool,
} from "./types"
import { dist2dWithRange } from "../utils/dist-2d-range"

class StreamerWorker {
  private readonly pools: Record<number, IStreamWorkerEntityPool> = {}
  private readonly entities: Record<number, IStreamWorkerEntity> = {}

  /**
   * array for faster iteration through it in for loop
   */
  private entitiesArray: IStreamWorkerEntity[] = []

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

    [StreamerWorkerEvents.CreateEntity]: ({ poolId, id, dimension, pos }) => {
      this.entities[id] = {
        poolId,
        dimension,
        pos,
        netOwnerId: null,
        inStreamPlayerIds: [],
      }

      this.updateEntitiesArray()
    },

    [StreamerWorkerEvents.DestroyEntity]: (entityId) => {
      delete this.entities[entityId]

      this.updateEntitiesArray()
    },

    [StreamerWorkerEvents.PlayersUpdate]: (players) => {
      for (let i = 0; i < players.length; i++) {
        const [playerId, { pos2d, dimension }] = players[i]
      }
    },
  }

  constructor () {
    // this.log.log("worker started")
    this.setupEvents()
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

  // private streamProcess () {
  //   const streamInIds: number[] = []
  //   const streamOutIds: number[] = []

  //   const entities = this.entitiesArray as StreamEntityDist[]

  //   for (let i = 0; i < entities.length; i++) {
  //     entities[i].dist = dist2dWithRange(
  //       entities[i].pos,
  //       this.streamPos,
  //       entities[i].streamRange,
  //     )
  //   }

  //   const sortedEntities = (entities as Required<StreamEntityDist>[]).sort(
  //     (a, b) => a.dist - b.dist,
  //   )

  //   // console.log(`sortedEntities: ${sortedEntities.map(e => e.id).join(", ")}`)

  //   let lastIdx = 0

  //   for (let thisTickStreamIn = 0; lastIdx < sortedEntities.length; lastIdx++) {
  //     const entity = sortedEntities[lastIdx]

  //     if (entity.dist > entity.streamRange) {
  //       this.streamOutEntity(entity, streamOutIds)
  //       continue
  //     }

  //     thisTickStreamIn++

  //     this.streamInEntity(entity, streamInIds)

  //     if (thisTickStreamIn === this.maxStreamedIn) break
  //   }

  //   for (let i = lastIdx + 1; i < sortedEntities.length; i++) {
  //     this.streamOutEntity(sortedEntities[i], streamOutIds)
  //   }

  //   if (streamInIds.length > 0) {
  //     this.sendMessage(FromStreamWorkerMessage.StreamIn, streamInIds)
  //   }

  //   if (streamOutIds.length > 0) {
  //     this.sendMessage(FromStreamWorkerMessage.StreamOut, streamOutIds)
  //   }
  // }
}

new StreamerWorker()