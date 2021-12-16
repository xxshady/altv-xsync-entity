import * as alt from "alt-client"
import * as native from "natives"
import { XSyncEntity, EntityPool, Entity } from "altv-xsync-entity-client"
import { EntityPools, IMarkerData } from "./shared"

// in the future, options will be passed to the constructor
new XSyncEntity()

new EntityPool(EntityPools.Marker, class Marker extends Entity<IMarkerData> {
  private render = 0

  public streamIn (pos: alt.Vector3, { type }: IMarkerData): void {
    this.render = alt.everyTick(() => {
      native.drawMarker(
        type,
        pos.x, pos.y, pos.z,
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

  public streamOut (): void {
    alt.clearEveryTick(this.render)
  }
})