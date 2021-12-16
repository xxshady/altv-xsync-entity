// server.ts
import * as alt from "alt-server";
import { XSyncEntity, EntityPool, Entity } from "altv-xsync-entity-server";

// shared.ts
var EntityPools = /* @__PURE__ */ ((EntityPools2) => {
  EntityPools2[EntityPools2["Marker"] = 0] = "Marker";
  return EntityPools2;
})(EntityPools || {});

// server.ts
new XSyncEntity(100, {
  port: 7700,
  localhost: true
});
var markersPool = new EntityPool(EntityPools.Marker, { maxStreamedIn: 50 });
var Marker = class extends Entity {
  constructor(pos, type) {
    super(markersPool, pos, { type }, 1, 10);
  }
};
new Marker(new alt.Vector3(0, 0, 71.5), 0);
new Marker(new alt.Vector3(0, 1, 71.5), 1);
new Marker(new alt.Vector3(0, 2, 71.5), 2);
