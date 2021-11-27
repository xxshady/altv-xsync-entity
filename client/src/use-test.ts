import * as alt from "alt-client"
import { createLogger } from "altv-xlogger"
import { XSyncEntity, Entity, EntityPool } from "./main"

const log = createLogger("use-test")

new XSyncEntity()

enum EntityPools {
  Ped,
}

class Ped extends Entity<{ model: string }> {
  public streamIn (pos: alt.Vector3, { model }: { model: string }): void {
    log.log(`ped [${this.id}] streamIn model: ${model} pos: ${pos}`)
    alt.emit("streamInPed", model, pos)
  }

  public streamOut (): void {
    log.log(`ped [${this.id}] streamOut`)
    alt.emit("streamOutPed", this.data.model, this.pos)
  }
}

const peds = new EntityPool(EntityPools.Ped, Ped)