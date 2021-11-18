var __defProp = Object.defineProperty;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __publicField = (obj, key, value) => {
  __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);
  return value;
};

// client/src/test.ts
import {
  onServer
} from "alt-client";

// node_modules/altv-xlogger/dist/create.js
import alt2 from "alt-shared";

// node_modules/altv-xlogger/dist/class.js
import alt from "alt-shared";

// node_modules/altv-xlogger/dist/decorators.js
var checkEnabled = (logType) => {
  return function(target, propertyKey, descriptor) {
    const originalMethod = descriptor.value;
    descriptor.value = function(...args) {
      if (!this.enabled)
        return;
      if (logType < this.logLevel)
        return;
      originalMethod.apply(this, args);
    };
  };
};

// node_modules/altv-xlogger/dist/enums.js
var LogLevel;
(function(LogLevel3) {
  LogLevel3[LogLevel3["Info"] = 0] = "Info";
  LogLevel3[LogLevel3["Warn"] = 1] = "Warn";
  LogLevel3[LogLevel3["Error"] = 2] = "Error";
})(LogLevel || (LogLevel = {}));

// node_modules/altv-xlogger/dist/class.js
var __decorate = function(decorators, target, key, desc) {
  var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
  if (typeof Reflect === "object" && typeof Reflect.decorate === "function")
    r = Reflect.decorate(decorators, target, key, desc);
  else
    for (var i = decorators.length - 1; i >= 0; i--)
      if (d = decorators[i])
        r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
  return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = function(k, v) {
  if (typeof Reflect === "object" && typeof Reflect.metadata === "function")
    return Reflect.metadata(k, v);
};
var _Logger = class {
  name;
  enabled = true;
  logLevel = LogLevel.Info;
  constructor(name, options) {
    this.name = name;
    if (options)
      this.applyOptions(options);
    this.log = this.log.bind(this);
    this.warn = this.warn.bind(this);
    this.error = this.error.bind(this);
  }
  static create(name, options) {
    return new _Logger(name, options);
  }
  applyOptions(options) {
    const { logLevel = this.logLevel, enabled = this.enabled } = options;
    this.logLevel = logLevel;
    this.enabled = enabled;
  }
  log(...args) {
    alt.log(`${_Logger.startLogColor}[${this.name}]~w~`, ...args);
  }
  warn(...args) {
    alt.logWarning(`[${this.name}]`, ...args);
  }
  error(...args) {
    if (args[0] instanceof Error) {
      args[0] = args[0].stack;
    }
    alt.logError(`[${this.name}]`, ...args);
  }
};
var Logger = _Logger;
__publicField(Logger, "startLogColor", "~cl~");
__decorate([
  checkEnabled(LogLevel.Info),
  __metadata("design:type", Function),
  __metadata("design:paramtypes", [Object]),
  __metadata("design:returntype", void 0)
], Logger.prototype, "log", null);
__decorate([
  checkEnabled(LogLevel.Warn),
  __metadata("design:type", Function),
  __metadata("design:paramtypes", [Object]),
  __metadata("design:returntype", void 0)
], Logger.prototype, "warn", null);
__decorate([
  checkEnabled(LogLevel.Error),
  __metadata("design:type", Function),
  __metadata("design:paramtypes", [Object]),
  __metadata("design:returntype", void 0)
], Logger.prototype, "error", null);

// node_modules/altv-xlogger/dist/create.js
function create_default(name, options = {}) {
  const { enabled = true, logLevel = alt2.debug ? LogLevel.Info : LogLevel.Warn } = options;
  return Logger.create(name, { enabled, logLevel });
}

// client/src/ws-client/class.ts
import {
  Player,
  WebSocketClient,
  nextTick
} from "alt-client";

// shared/dist/main.js
import alt22 from "alt-shared";
import alt3 from "alt-shared";
var __defProp2 = Object.defineProperty;
var __defNormalProp2 = (obj, key, value) => key in obj ? __defProp2(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __publicField2 = (obj, key, value) => {
  __defNormalProp2(obj, typeof key !== "symbol" ? key + "" : key, value);
  return value;
};
var checkEnabled2 = (logType) => {
  return function(target, propertyKey, descriptor) {
    const originalMethod = descriptor.value;
    descriptor.value = function(...args) {
      if (!this.enabled)
        return;
      if (logType < this.logLevel)
        return;
      originalMethod.apply(this, args);
    };
  };
};
var LogLevel2;
(function(LogLevel22) {
  LogLevel22[LogLevel22["Info"] = 0] = "Info";
  LogLevel22[LogLevel22["Warn"] = 1] = "Warn";
  LogLevel22[LogLevel22["Error"] = 2] = "Error";
})(LogLevel2 || (LogLevel2 = {}));
var __decorate2 = function(decorators, target, key, desc) {
  var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
  if (typeof Reflect === "object" && typeof Reflect.decorate === "function")
    r = Reflect.decorate(decorators, target, key, desc);
  else
    for (var i = decorators.length - 1; i >= 0; i--)
      if (d = decorators[i])
        r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
  return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata2 = function(k, v) {
  if (typeof Reflect === "object" && typeof Reflect.metadata === "function")
    return Reflect.metadata(k, v);
};
var _Logger2 = class {
  name;
  enabled = true;
  logLevel = LogLevel2.Info;
  constructor(name, options) {
    this.name = name;
    if (options)
      this.applyOptions(options);
    this.log = this.log.bind(this);
    this.warn = this.warn.bind(this);
    this.error = this.error.bind(this);
  }
  static create(name, options) {
    return new _Logger2(name, options);
  }
  applyOptions(options) {
    const { logLevel = this.logLevel, enabled = this.enabled } = options;
    this.logLevel = logLevel;
    this.enabled = enabled;
  }
  log(...args) {
    alt3.log(`${_Logger2.startLogColor}[${this.name}]~w~`, ...args);
  }
  warn(...args) {
    alt3.logWarning(`[${this.name}]`, ...args);
  }
  error(...args) {
    if (args[0] instanceof Error) {
      args[0] = args[0].stack;
    }
    alt3.logError(`[${this.name}]`, ...args);
  }
};
var Logger2 = _Logger2;
__publicField2(Logger2, "startLogColor", "~cl~");
__decorate2([
  checkEnabled2(LogLevel2.Info),
  __metadata2("design:type", Function),
  __metadata2("design:paramtypes", [Object]),
  __metadata2("design:returntype", void 0)
], Logger2.prototype, "log", null);
__decorate2([
  checkEnabled2(LogLevel2.Warn),
  __metadata2("design:type", Function),
  __metadata2("design:paramtypes", [Object]),
  __metadata2("design:returntype", void 0)
], Logger2.prototype, "warn", null);
__decorate2([
  checkEnabled2(LogLevel2.Error),
  __metadata2("design:type", Function),
  __metadata2("design:paramtypes", [Object]),
  __metadata2("design:returntype", void 0)
], Logger2.prototype, "error", null);
function create_default2(name, options = {}) {
  const { enabled = true, logLevel = alt22.debug ? LogLevel2.Info : LogLevel2.Warn } = options;
  return Logger2.create(name, { enabled, logLevel });
}
var MessageEventsManager = class {
  log = create_default2("MessageManager");
  eventsHandlers;
  constructor(events) {
    this.eventsHandlers = events;
  }
  send(eventName, args) {
    let message = `${eventName}|`;
    message += JSON.stringify(args);
    return message;
  }
  receive(rawMessage, extraFirstArgs = []) {
    try {
      const delimiter = rawMessage.indexOf("|");
      if (delimiter === -1) {
        throw new Error("invalid rawMessage (no delimiter)");
      }
      const eventName = rawMessage.slice(0, delimiter);
      const rawArgs = rawMessage.slice(delimiter + 1);
      const handler = this.eventsHandlers[eventName];
      if (!handler) {
        this.log.warn("[receive]", `event: ${eventName} no handlers`);
        return;
      }
      const args = JSON.parse(rawArgs);
      handler(...extraFirstArgs, ...args);
    } catch (e) {
      this.log.error("[receive]");
      this.log.error(e);
    }
  }
};

// client/src/ws-client/class.ts
var WSClient = class {
  log = create_default("WSClient");
  player = Player.local;
  messageHandlers = new Set();
  eventsManager;
  waitConnectPromise;
  client;
  connected = false;
  constructor(url, authCode, { events }) {
    this.client = this.initClient(authCode, url);
    this.waitConnectPromise = this.initWaitConnectPromise();
    this.eventsManager = this.initUserEvents(events);
    this.setupWsClientEvents(this.client);
  }
  send(eventName, ...args) {
    const message = this.eventsManager.send(eventName, args);
    return this.client.send(message);
  }
  addMessageHandler(handler) {
    this.messageHandlers.add(handler);
  }
  waitConnect() {
    return this.waitConnectPromise.promise;
  }
  initClient(authCode, url) {
    const client = new WebSocketClient(url);
    client.setExtraHeader("authcode", authCode);
    client.setExtraHeader("playerid", this.player.id.toString());
    client.pingInterval = 30;
    client.autoReconnect = false;
    client.perMessageDeflate = true;
    client.start();
    this.log.log("started connecting...", new Date().getMilliseconds());
    return client;
  }
  setupWsClientEvents(client) {
    client.on("open", this.onOpen.bind(this));
    client.on("close", this.onClose.bind(this));
    client.on("error", this.onError.bind(this));
    client.on("message", this.onMessage.bind(this));
  }
  onOpen() {
    this.connected = true;
    this.waitConnectPromise.resolve();
    this.log.log("~gl~successful connection~w~ to the server", new Date().getMilliseconds());
  }
  onClose(code, reason) {
    this.waitConnectPromise.reject(new Error(reason));
    this.log.error("[close]", "code:", code, "reason:", reason);
  }
  onMessage(message) {
    for (const handler of this.messageHandlers) {
      handler(message);
    }
  }
  onError(error) {
    if (!this.connected) {
      this.waitConnectPromise.reject(new Error(error));
    }
    this.log.error("[error]", error);
  }
  initUserEvents(events) {
    const manager = new MessageEventsManager(events);
    this.addMessageHandler((raw) => {
      manager.receive(raw);
    });
    return manager;
  }
  initWaitConnectPromise() {
    return {
      promise: new Promise((resolve, reject) => {
        nextTick(() => {
          this.waitConnectPromise.resolve = resolve;
          this.waitConnectPromise.reject = (_error) => {
            const error = new Error(`[connection reject] ${_error.message}`);
            error.stack = _error.stack;
            reject(error);
          };
        });
      })
    };
  }
};

// client/src/test.ts
var log = create_default("xsync-entity:test");
onServer("xsyncEntity:test", async (authCode) => {
  log.log("received test event from server authCode:", authCode);
  const client = new WSClient("ws://127.0.0.1:7700", authCode, {
    events: {
      kek(...args) {
        log.log("[kek event]", "args:~gl~", JSON.stringify(args));
      }
    }
  });
  await client.waitConnect();
  client.send("kek", 1, 2, 3);
});
