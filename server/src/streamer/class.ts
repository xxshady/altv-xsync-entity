import * as alt from "alt-server"
import { createLogger } from "altv-xlogger"
import type { InternalEntity } from "../internal-entity"
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

export class Streamer {
  private readonly worker = new Worker()

  private readonly entities = new Set()
  private readonly log = createLogger("altv-xsync-entity:streamer")

  private readonly eventHandlers: IStreamerFromWorkerEvent = {
    [StreamerFromWorkerEvents.StreamInPlayerEntities]: (playersAndEntities) => {

    },

    [StreamerFromWorkerEvents.StreamOutPlayerEntities]: (playersAndEntities) => {

    },

    [StreamerFromWorkerEvents.NetOwnerChangeEntities]: (netOwnersAndEntities) => {

    },
  }

  constructor (streamDelay = 100) {
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

  public addEntity ({ poolId, id, pos, dimension }: InternalEntity): void {
    this.emitWorker(
      StreamerWorkerEvents.CreateEntity,
      {
        poolId,
        id,
        pos,
        dimension,
      },
    )
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

  public removeEntity ({ id }: InternalEntity): void {
    this.emitWorker(StreamerWorkerEvents.DestroyEntity, id)
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
        handler(...data as [firstArg: any])
      },
    )
  }

  private setupPlayersUpdateInterval (streamDelay: number) {
    setInterval(this.playersUpdatesProcess.bind(this), streamDelay)
  }

  private playersUpdatesProcess () {
    try {
      const players = InternalXSyncEntity.instance.players
      const playersChanges: Parameters<IStreamerWorkerEvent[StreamerWorkerEvents.PlayersUpdate]>[0] = []

      for (let i = 0; i < players.length; i++) {
        const { id, pos, dimension } = players[i]
        const pos2d = {
          x: pos.x,
          y: pos.y,
        }

        playersChanges[i] = [
          id,
          {
            pos2d,
            dimension,
          },
        ]
      }

      this.emitWorker(StreamerWorkerEvents.PlayersUpdate, playersChanges)
    } catch (e) {
      this.log.error(e)
    }
  }
}