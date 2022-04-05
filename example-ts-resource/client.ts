import * as alt from "alt-client"
import * as native from "natives"
import * as xsync from "altv-xsync-entity-client"
import type { IMarkerData } from "./shared"
import { EntityPools } from "./shared"

// in the future, options will be passed to the constructor
new xsync.XSyncEntity()

@xsync.onEntityEvents<Marker>({
  streamIn: (entity) => entity.streamIn(),
  streamOut: (entity) => entity.streamOut(),
  dataChange: (entity, data) => entity.dataChange(data),
  posChange: (entity, pos) => entity.posChange(pos),
})
class Marker extends xsync.Entity<IMarkerData> {
  private render = 0

  private streamIn(): void {
    this.render = alt.everyTick(() => {
      native.drawMarker(
        this.data.type,
        this.pos.x, this.pos.y, this.pos.z,
        0, 0, 0,
        0, 0, 0,
        0.5, 0.5, 0.5,
        100, 170, 255, 200,
        false,
        false,
        2,
        true,
        undefined as unknown as string,
        undefined as unknown as string,
        false,
      )
    })
  }

  private streamOut(): void {
    alt.clearEveryTick(this.render)
  }

  private dataChange(data: Partial<IMarkerData>) {
    alt.log("dataChange:", JSON.stringify(data, null, 2))
  }

  public posChange(pos: alt.IVector3): void {
    alt.log(`marker [${this.id}] pos changed:`, pos.x, pos.y)
  }
}

new xsync.EntityPool(EntityPools.Marker, Marker)