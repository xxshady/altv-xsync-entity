var __defProp = Object.defineProperty;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __publicField = (obj, key, value) => {
  __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);
  return value;
};

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
(function(LogLevel2) {
  LogLevel2[LogLevel2["Info"] = 0] = "Info";
  LogLevel2[LogLevel2["Warn"] = 1] = "Warn";
  LogLevel2[LogLevel2["Error"] = 2] = "Error";
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

// shared/src/messageEventsManager/class.ts
var MessageEventsManager = class {
  log = create_default("MessageManager");
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
export {
  MessageEventsManager
};
