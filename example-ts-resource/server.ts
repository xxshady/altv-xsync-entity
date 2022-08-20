import * as alt from "alt-server"
import type { IMarkerSyncedMeta } from "./shared"
import { EntityPools } from "./shared"
import * as xsync from "altv-xsync-entity-server"

new xsync.XSyncEntity({
  wss: {
    port: 7700,
    localhost: true,
  },
})

const markersPool = new xsync.EntityPool(
  EntityPools.Marker,
  { maxStreamedIn: 50 },
)

@xsync.onEntityEvents<Marker>(markersPool, {
  syncedMetaChange: (marker, changedData) => {
    alt.log("Marker syncedMetaChange |", "id:", marker.id, "changed data:", changedData)
  },
})
class Marker extends xsync.Entity<IMarkerSyncedMeta> {
  constructor(pos: alt.IVector3, type: number) {
    super(
      markersPool,
      pos,
      { type },
      {},
      0,
      10,
    )
  }
}

new Marker(
  new alt.Vector3(0, 0, 71.5),
  0,
)

new Marker(
  new alt.Vector3(0, 1, 71.5),
  1,
)

const marker = new Marker(
  new alt.Vector3(0, 2, 71.5),
  2,
)

alt.log("created marker id:", marker.id)

// this will send updated partial synced meta to the client in "syncedMetaChange" event
marker.setSyncedMeta({ type: 4 })
