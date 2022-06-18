import * as alt from "alt-server"
import type { IMarkerSyncedMeta } from "./shared"
import { EntityPools } from "./shared"
import { XSyncEntity, EntityPool, Entity } from "altv-xsync-entity-server"

new XSyncEntity(
  100,
  // xsyncentity will create websocket ws:// (http) server
  // that will use local machine ip for connecting on client (alt.WebSocketClient)
  // for e.g. your external ip is 9.9.9.9
  // remote client will use "ws://9.9.9.9:7700" in alt.WebSocketClient
  {
    port: 7700,
    localhost: true,
  },

  // for wss:// (https) server you will need to specify domain and ssl certificate
  // {
  //   domainName: 'domain.name',
  //   port: 7700,

  //   // paths for fs.readFileSync
  //   keyPath: './key.pem',
  //   certPath: './cert.cert',

  //   localhost: false
  // },

  // you can also specify useWss if you need http server and connect client to wss://domain.name
  // for e.g. this will create http server on server and use connect url "wss://domain.name" on client in alt.WebSocketClient
  // {
  //   domainName: 'domain.name',
  //   port: 7700,
  //   useWss: false,
  //   localhost: false,
  // }
)

const markersPool = new EntityPool(
  EntityPools.Marker,
  { maxStreamedIn: 50 },
)

class Marker extends Entity<IMarkerSyncedMeta> {
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

console.log('marker:', marker)

// this will send updated partial synced meta to the client in "syncedMetaChange" event
marker.setSyncedMeta({ type: 4 })
