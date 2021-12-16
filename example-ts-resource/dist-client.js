// client.ts
import * as alt5 from "alt-client";
import * as native from "natives";

// node_modules/altv-xsync-entity-client/dist/main.js
import {
  onServer
} from "alt-client";
import alt2 from "alt-shared";
import alt from "alt-shared";
import {
  Player,
  WebSocketClient,
  nextTick
} from "alt-client";
import alt4 from "alt-shared";
import alt3 from "alt-shared";
import {
  getServerIp
} from "alt-client";
var __defProp = Object.defineProperty;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __publicField = (obj, key, value) => {
  __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);
  return value;
};
var __defProp2 = Object.defineProperty;
var __defNormalProp2 = (obj, key, value) => key in obj ? __defProp2(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __publicField2 = (obj, key, value) => {
  __defNormalProp2(obj, typeof key !== "symbol" ? key + "" : key, value);
  return value;
};
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
var LogLevel;
(function(LogLevel22) {
  LogLevel22[LogLevel22["Info"] = 0] = "Info";
  LogLevel22[LogLevel22["Warn"] = 1] = "Warn";
  LogLevel22[LogLevel22["Error"] = 2] = "Error";
})(LogLevel || (LogLevel = {}));
var formatRegExp = /%[sdj%]/g;
var format = function(f) {
  if (!isString(f)) {
    const objects = [];
    for (let i2 = 0; i2 < arguments.length; i2++) {
      objects.push(inspect(arguments[i2]));
    }
    return objects.join(" ");
  }
  let i = 1;
  const args = arguments;
  const len = args.length;
  let str = String(f).replace(formatRegExp, function(x) {
    if (x === "%%")
      return "%";
    if (i >= len)
      return x;
    switch (x) {
      case "%s":
        return String(args[i++]);
      case "%d":
        return Number(args[i++]);
      case "%j":
        try {
          return JSON.stringify(args[i++]);
        } catch (_) {
          return "[Circular]";
        }
      default:
        return x;
    }
  });
  for (let x = args[i]; i < len; x = args[++i]) {
    if (isNull(x) || !isObject(x)) {
      str += " " + x;
    } else {
      str += " " + inspect(x);
    }
  }
  return str;
};
function isArray(ar) {
  return Array.isArray(ar);
}
function isBoolean(arg) {
  return typeof arg === "boolean";
}
function isNull(arg) {
  return arg === null;
}
function isNumber(arg) {
  return typeof arg === "number";
}
function isString(arg) {
  return typeof arg === "string";
}
function isUndefined(arg) {
  return arg === void 0;
}
function isRegExp(re) {
  return isObject(re) && objectToString(re) === "[object RegExp]";
}
function isObject(arg) {
  return typeof arg === "object" && arg !== null;
}
function isDate(d) {
  return isObject(d) && objectToString(d) === "[object Date]";
}
function isError(e) {
  return isObject(e) && (objectToString(e) === "[object Error]" || e instanceof Error);
}
function isFunction(arg) {
  return typeof arg === "function";
}
function inspect(obj, opts) {
  const ctx = {
    seen: [],
    stylize: stylizeNoColor
  };
  if (arguments.length >= 3)
    ctx.depth = arguments[2];
  if (arguments.length >= 4)
    ctx.colors = arguments[3];
  if (isBoolean(opts)) {
    ctx.showHidden = opts;
  } else if (opts) {
    _extend(ctx, opts);
  }
  if (isUndefined(ctx.showHidden))
    ctx.showHidden = false;
  if (isUndefined(ctx.depth))
    ctx.depth = 2;
  if (isUndefined(ctx.colors))
    ctx.colors = false;
  if (isUndefined(ctx.customInspect))
    ctx.customInspect = true;
  if (ctx.colors)
    ctx.stylize = stylizeWithColor;
  return formatValue(ctx, obj, ctx.depth);
}
function stylizeNoColor(str, styleType) {
  return str;
}
function formatValue(ctx, value, recurseTimes) {
  if (ctx.customInspect && value && isFunction(value.inspect) && value.inspect !== inspect && !(value.constructor && value.constructor.prototype === value)) {
    let ret = value.inspect(recurseTimes, ctx);
    if (!isString(ret)) {
      ret = formatValue(ctx, ret, recurseTimes);
    }
    return ret;
  }
  const primitive = formatPrimitive(ctx, value);
  if (primitive) {
    return primitive;
  }
  let keys = Object.keys(value);
  const visibleKeys = arrayToHash(keys);
  if (ctx.showHidden) {
    keys = Object.getOwnPropertyNames(value);
  }
  if (isError(value) && (keys.indexOf("message") >= 0 || keys.indexOf("description") >= 0)) {
    return formatError(value);
  }
  if (keys.length === 0) {
    if (isFunction(value)) {
      const name = value.name ? ": " + value.name : "";
      return ctx.stylize("[Function" + name + "]", "special");
    }
    if (isRegExp(value)) {
      return ctx.stylize(RegExp.prototype.toString.call(value), "regexp");
    }
    if (isDate(value)) {
      return ctx.stylize(Date.prototype.toString.call(value), "date");
    }
    if (isError(value)) {
      return formatError(value);
    }
  }
  let base = "", array = false, braces = ["{", "}"];
  if (isArray(value)) {
    array = true;
    braces = ["[", "]"];
  }
  if (isFunction(value)) {
    const n = value.name ? ": " + value.name : "";
    base = " [Function" + n + "]";
  }
  if (isRegExp(value)) {
    base = " " + RegExp.prototype.toString.call(value);
  }
  if (isDate(value)) {
    base = " " + Date.prototype.toUTCString.call(value);
  }
  if (isError(value)) {
    base = " " + formatError(value);
  }
  if (keys.length === 0 && (!array || value.length == 0)) {
    return braces[0] + base + braces[1];
  }
  if (recurseTimes < 0) {
    if (isRegExp(value)) {
      return ctx.stylize(RegExp.prototype.toString.call(value), "regexp");
    } else {
      return ctx.stylize("[Object]", "special");
    }
  }
  ctx.seen.push(value);
  let output;
  if (array) {
    output = formatArray(ctx, value, recurseTimes, visibleKeys, keys);
  } else {
    output = keys.map(function(key) {
      return formatProperty(ctx, value, recurseTimes, visibleKeys, key, array);
    });
  }
  ctx.seen.pop();
  return reduceToSingleString(output, base, braces);
}
function reduceToSingleString(output, base, braces) {
  let numLinesEst = 0;
  const length = output.reduce(function(prev, cur) {
    numLinesEst++;
    if (cur.indexOf("\n") >= 0)
      numLinesEst++;
    return prev + cur.replace(/\u001b\[\d\d?m/g, "").length + 1;
  }, 0);
  if (length > 60) {
    return braces[0] + (base === "" ? "" : base + "\n ") + " " + output.join(",\n  ") + " " + braces[1];
  }
  return braces[0] + base + " " + output.join(", ") + " " + braces[1];
}
function formatPrimitive(ctx, value) {
  if (isUndefined(value))
    return ctx.stylize("undefined", "undefined");
  if (isString(value)) {
    const simple = "'" + JSON.stringify(value).replace(/^"|"$/g, "").replace(/'/g, "\\'").replace(/\\"/g, '"') + "'";
    return ctx.stylize(simple, "string");
  }
  if (isNumber(value))
    return ctx.stylize("" + value, "number");
  if (isBoolean(value))
    return ctx.stylize("" + value, "boolean");
  if (isNull(value))
    return ctx.stylize("null", "null");
}
function formatError(value) {
  return "[" + Error.prototype.toString.call(value) + "]";
}
function formatArray(ctx, value, recurseTimes, visibleKeys, keys) {
  const output = [];
  for (let i = 0, l = value.length; i < l; ++i) {
    if (hasOwnProperty(value, String(i))) {
      output.push(formatProperty(ctx, value, recurseTimes, visibleKeys, String(i), true));
    } else {
      output.push("");
    }
  }
  keys.forEach(function(key) {
    if (!key.match(/^\d+$/)) {
      output.push(formatProperty(ctx, value, recurseTimes, visibleKeys, key, true));
    }
  });
  return output;
}
function formatProperty(ctx, value, recurseTimes, visibleKeys, key, array) {
  let name, str, desc;
  desc = Object.getOwnPropertyDescriptor(value, key) || { value: value[key] };
  if (desc.get) {
    if (desc.set) {
      str = ctx.stylize("[Getter/Setter]", "special");
    } else {
      str = ctx.stylize("[Getter]", "special");
    }
  } else {
    if (desc.set) {
      str = ctx.stylize("[Setter]", "special");
    }
  }
  if (!hasOwnProperty(visibleKeys, key)) {
    name = "[" + key + "]";
  }
  if (!str) {
    if (ctx.seen.indexOf(desc.value) < 0) {
      if (isNull(recurseTimes)) {
        str = formatValue(ctx, desc.value, null);
      } else {
        str = formatValue(ctx, desc.value, recurseTimes - 1);
      }
      if (str.indexOf("\n") > -1) {
        if (array) {
          str = str.split("\n").map(function(line) {
            return "  " + line;
          }).join("\n").substr(2);
        } else {
          str = "\n" + str.split("\n").map(function(line) {
            return "   " + line;
          }).join("\n");
        }
      }
    } else {
      str = ctx.stylize("[Circular]", "special");
    }
  }
  if (isUndefined(name)) {
    if (array && key.match(/^\d+$/)) {
      return str;
    }
    name = JSON.stringify("" + key);
    if (name.match(/^"([a-zA-Z_][a-zA-Z_0-9]*)"$/)) {
      name = name.substr(1, name.length - 2);
      name = ctx.stylize(name, "name");
    } else {
      name = name.replace(/'/g, "\\'").replace(/\\"/g, '"').replace(/(^"|"$)/g, "'");
      name = ctx.stylize(name, "string");
    }
  }
  return name + ": " + str;
}
function hasOwnProperty(obj, prop) {
  return Object.prototype.hasOwnProperty.call(obj, prop);
}
function arrayToHash(array) {
  const hash = {};
  array.forEach(function(val, idx) {
    hash[val] = true;
  });
  return hash;
}
function _extend(origin, add) {
  if (!add || !isObject(add))
    return origin;
  const keys = Object.keys(add);
  let i = keys.length;
  while (i--) {
    origin[keys[i]] = add[keys[i]];
  }
  return origin;
}
function objectToString(o) {
  return Object.prototype.toString.call(o);
}
function stylizeWithColor(str, styleType) {
  const style = inspect.styles[styleType];
  if (style) {
    return "[" + inspect.colors[style][0] + "m" + str + "[" + inspect.colors[style][1] + "m";
  } else {
    return str;
  }
}
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
  moreInfo;
  constructor(name, options) {
    this.name = name;
    if (options)
      this.applyOptions(options);
    this.log = this.log.bind(this);
    this.warn = this.warn.bind(this);
    this.error = this.error.bind(this);
    this.moreInfo = alt.isServer ? this.moreInfoServer.bind(this) : this.moreInfoClient.bind(this);
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
  moreInfoServer(...args) {
    const date = new Date();
    const hour = date.getHours();
    const minute = date.getMinutes();
    const second = date.getSeconds();
    console.log(`[${formatDateUnit(hour)}:${formatDateUnit(minute)}:${formatDateUnit(second)}]`, `${_Logger.nodeCyanColor}[${this.name}]${_Logger.nodeWhiteColor}`, ...args);
    function formatDateUnit(unit) {
      return unit >= 10 ? unit : `0${unit}`;
    }
  }
  moreInfoClient(...args) {
    alt.log(`${_Logger.startLogColor}[${this.name}]~w~`, ...args.map((a) => format(a)));
  }
};
var Logger = _Logger;
__publicField2(Logger, "startLogColor", "~cl~");
__publicField2(Logger, "nodeCyanColor", "[36m");
__publicField2(Logger, "nodeWhiteColor", "[37m");
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
__decorate([
  checkEnabled(LogLevel.Info),
  __metadata("design:type", Function),
  __metadata("design:paramtypes", [Object]),
  __metadata("design:returntype", void 0)
], Logger.prototype, "moreInfoServer", null);
__decorate([
  checkEnabled(LogLevel.Info),
  __metadata("design:type", Function),
  __metadata("design:paramtypes", [Object]),
  __metadata("design:returntype", void 0)
], Logger.prototype, "moreInfoClient", null);
function create_default(name, options = {}) {
  const { enabled = true, logLevel = alt2.debug ? LogLevel.Info : LogLevel.Warn } = options;
  return Logger.create(name, { enabled, logLevel });
}
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
var ClientOnServerEvents;
(function(ClientOnServerEvents2) {
  ClientOnServerEvents2["AddPlayer"] = "xsyncEntity:addPlayer";
})(ClientOnServerEvents || (ClientOnServerEvents = {}));
var WSClientOnServerEvents;
(function(WSClientOnServerEvents2) {
  WSClientOnServerEvents2[WSClientOnServerEvents2["EntitiesStreamIn"] = 0] = "EntitiesStreamIn";
  WSClientOnServerEvents2[WSClientOnServerEvents2["EntitiesStreamOut"] = 1] = "EntitiesStreamOut";
  WSClientOnServerEvents2[WSClientOnServerEvents2["EntityDestroy"] = 2] = "EntityDestroy";
})(WSClientOnServerEvents || (WSClientOnServerEvents = {}));
var WSVectors = class {
  static altToWS({ x, y, z }) {
    return [
      +x.toFixed(3),
      +y.toFixed(3),
      +z.toFixed(3)
    ];
  }
  static WStoAlt([x, y, z]) {
    return { x, y, z };
  }
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
(function(LogLevel3) {
  LogLevel3[LogLevel3["Info"] = 0] = "Info";
  LogLevel3[LogLevel3["Warn"] = 1] = "Warn";
  LogLevel3[LogLevel3["Error"] = 2] = "Error";
})(LogLevel2 || (LogLevel2 = {}));
var formatRegExp2 = /%[sdj%]/g;
var format2 = function(f) {
  if (!isString2(f)) {
    const objects = [];
    for (let i2 = 0; i2 < arguments.length; i2++) {
      objects.push(inspect2(arguments[i2]));
    }
    return objects.join(" ");
  }
  let i = 1;
  const args = arguments;
  const len = args.length;
  let str = String(f).replace(formatRegExp2, function(x) {
    if (x === "%%")
      return "%";
    if (i >= len)
      return x;
    switch (x) {
      case "%s":
        return String(args[i++]);
      case "%d":
        return Number(args[i++]);
      case "%j":
        try {
          return JSON.stringify(args[i++]);
        } catch (_) {
          return "[Circular]";
        }
      default:
        return x;
    }
  });
  for (let x = args[i]; i < len; x = args[++i]) {
    if (isNull2(x) || !isObject2(x)) {
      str += " " + x;
    } else {
      str += " " + inspect2(x);
    }
  }
  return str;
};
function isArray2(ar) {
  return Array.isArray(ar);
}
function isBoolean2(arg) {
  return typeof arg === "boolean";
}
function isNull2(arg) {
  return arg === null;
}
function isNumber2(arg) {
  return typeof arg === "number";
}
function isString2(arg) {
  return typeof arg === "string";
}
function isUndefined2(arg) {
  return arg === void 0;
}
function isRegExp2(re) {
  return isObject2(re) && objectToString2(re) === "[object RegExp]";
}
function isObject2(arg) {
  return typeof arg === "object" && arg !== null;
}
function isDate2(d) {
  return isObject2(d) && objectToString2(d) === "[object Date]";
}
function isError2(e) {
  return isObject2(e) && (objectToString2(e) === "[object Error]" || e instanceof Error);
}
function isFunction2(arg) {
  return typeof arg === "function";
}
function inspect2(obj, opts) {
  const ctx = {
    seen: [],
    stylize: stylizeNoColor2
  };
  if (arguments.length >= 3)
    ctx.depth = arguments[2];
  if (arguments.length >= 4)
    ctx.colors = arguments[3];
  if (isBoolean2(opts)) {
    ctx.showHidden = opts;
  } else if (opts) {
    _extend2(ctx, opts);
  }
  if (isUndefined2(ctx.showHidden))
    ctx.showHidden = false;
  if (isUndefined2(ctx.depth))
    ctx.depth = 2;
  if (isUndefined2(ctx.colors))
    ctx.colors = false;
  if (isUndefined2(ctx.customInspect))
    ctx.customInspect = true;
  if (ctx.colors)
    ctx.stylize = stylizeWithColor2;
  return formatValue2(ctx, obj, ctx.depth);
}
function stylizeNoColor2(str, styleType) {
  return str;
}
function formatValue2(ctx, value, recurseTimes) {
  if (ctx.customInspect && value && isFunction2(value.inspect) && value.inspect !== inspect2 && !(value.constructor && value.constructor.prototype === value)) {
    let ret = value.inspect(recurseTimes, ctx);
    if (!isString2(ret)) {
      ret = formatValue2(ctx, ret, recurseTimes);
    }
    return ret;
  }
  const primitive = formatPrimitive2(ctx, value);
  if (primitive) {
    return primitive;
  }
  let keys = Object.keys(value);
  const visibleKeys = arrayToHash2(keys);
  if (ctx.showHidden) {
    keys = Object.getOwnPropertyNames(value);
  }
  if (isError2(value) && (keys.indexOf("message") >= 0 || keys.indexOf("description") >= 0)) {
    return formatError2(value);
  }
  if (keys.length === 0) {
    if (isFunction2(value)) {
      const name = value.name ? ": " + value.name : "";
      return ctx.stylize("[Function" + name + "]", "special");
    }
    if (isRegExp2(value)) {
      return ctx.stylize(RegExp.prototype.toString.call(value), "regexp");
    }
    if (isDate2(value)) {
      return ctx.stylize(Date.prototype.toString.call(value), "date");
    }
    if (isError2(value)) {
      return formatError2(value);
    }
  }
  let base = "", array = false, braces = ["{", "}"];
  if (isArray2(value)) {
    array = true;
    braces = ["[", "]"];
  }
  if (isFunction2(value)) {
    const n = value.name ? ": " + value.name : "";
    base = " [Function" + n + "]";
  }
  if (isRegExp2(value)) {
    base = " " + RegExp.prototype.toString.call(value);
  }
  if (isDate2(value)) {
    base = " " + Date.prototype.toUTCString.call(value);
  }
  if (isError2(value)) {
    base = " " + formatError2(value);
  }
  if (keys.length === 0 && (!array || value.length == 0)) {
    return braces[0] + base + braces[1];
  }
  if (recurseTimes < 0) {
    if (isRegExp2(value)) {
      return ctx.stylize(RegExp.prototype.toString.call(value), "regexp");
    } else {
      return ctx.stylize("[Object]", "special");
    }
  }
  ctx.seen.push(value);
  let output;
  if (array) {
    output = formatArray2(ctx, value, recurseTimes, visibleKeys, keys);
  } else {
    output = keys.map(function(key) {
      return formatProperty2(ctx, value, recurseTimes, visibleKeys, key, array);
    });
  }
  ctx.seen.pop();
  return reduceToSingleString2(output, base, braces);
}
function reduceToSingleString2(output, base, braces) {
  let numLinesEst = 0;
  const length = output.reduce(function(prev, cur) {
    numLinesEst++;
    if (cur.indexOf("\n") >= 0)
      numLinesEst++;
    return prev + cur.replace(/\u001b\[\d\d?m/g, "").length + 1;
  }, 0);
  if (length > 60) {
    return braces[0] + (base === "" ? "" : base + "\n ") + " " + output.join(",\n  ") + " " + braces[1];
  }
  return braces[0] + base + " " + output.join(", ") + " " + braces[1];
}
function formatPrimitive2(ctx, value) {
  if (isUndefined2(value))
    return ctx.stylize("undefined", "undefined");
  if (isString2(value)) {
    const simple = "'" + JSON.stringify(value).replace(/^"|"$/g, "").replace(/'/g, "\\'").replace(/\\"/g, '"') + "'";
    return ctx.stylize(simple, "string");
  }
  if (isNumber2(value))
    return ctx.stylize("" + value, "number");
  if (isBoolean2(value))
    return ctx.stylize("" + value, "boolean");
  if (isNull2(value))
    return ctx.stylize("null", "null");
}
function formatError2(value) {
  return "[" + Error.prototype.toString.call(value) + "]";
}
function formatArray2(ctx, value, recurseTimes, visibleKeys, keys) {
  const output = [];
  for (let i = 0, l = value.length; i < l; ++i) {
    if (hasOwnProperty2(value, String(i))) {
      output.push(formatProperty2(ctx, value, recurseTimes, visibleKeys, String(i), true));
    } else {
      output.push("");
    }
  }
  keys.forEach(function(key) {
    if (!key.match(/^\d+$/)) {
      output.push(formatProperty2(ctx, value, recurseTimes, visibleKeys, key, true));
    }
  });
  return output;
}
function formatProperty2(ctx, value, recurseTimes, visibleKeys, key, array) {
  let name, str, desc;
  desc = Object.getOwnPropertyDescriptor(value, key) || { value: value[key] };
  if (desc.get) {
    if (desc.set) {
      str = ctx.stylize("[Getter/Setter]", "special");
    } else {
      str = ctx.stylize("[Getter]", "special");
    }
  } else {
    if (desc.set) {
      str = ctx.stylize("[Setter]", "special");
    }
  }
  if (!hasOwnProperty2(visibleKeys, key)) {
    name = "[" + key + "]";
  }
  if (!str) {
    if (ctx.seen.indexOf(desc.value) < 0) {
      if (isNull2(recurseTimes)) {
        str = formatValue2(ctx, desc.value, null);
      } else {
        str = formatValue2(ctx, desc.value, recurseTimes - 1);
      }
      if (str.indexOf("\n") > -1) {
        if (array) {
          str = str.split("\n").map(function(line) {
            return "  " + line;
          }).join("\n").substr(2);
        } else {
          str = "\n" + str.split("\n").map(function(line) {
            return "   " + line;
          }).join("\n");
        }
      }
    } else {
      str = ctx.stylize("[Circular]", "special");
    }
  }
  if (isUndefined2(name)) {
    if (array && key.match(/^\d+$/)) {
      return str;
    }
    name = JSON.stringify("" + key);
    if (name.match(/^"([a-zA-Z_][a-zA-Z_0-9]*)"$/)) {
      name = name.substr(1, name.length - 2);
      name = ctx.stylize(name, "name");
    } else {
      name = name.replace(/'/g, "\\'").replace(/\\"/g, '"').replace(/(^"|"$)/g, "'");
      name = ctx.stylize(name, "string");
    }
  }
  return name + ": " + str;
}
function hasOwnProperty2(obj, prop) {
  return Object.prototype.hasOwnProperty.call(obj, prop);
}
function arrayToHash2(array) {
  const hash = {};
  array.forEach(function(val, idx) {
    hash[val] = true;
  });
  return hash;
}
function _extend2(origin, add) {
  if (!add || !isObject2(add))
    return origin;
  const keys = Object.keys(add);
  let i = keys.length;
  while (i--) {
    origin[keys[i]] = add[keys[i]];
  }
  return origin;
}
function objectToString2(o) {
  return Object.prototype.toString.call(o);
}
function stylizeWithColor2(str, styleType) {
  const style = inspect2.styles[styleType];
  if (style) {
    return "[" + inspect2.colors[style][0] + "m" + str + "[" + inspect2.colors[style][1] + "m";
  } else {
    return str;
  }
}
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
  moreInfo;
  constructor(name, options) {
    this.name = name;
    if (options)
      this.applyOptions(options);
    this.log = this.log.bind(this);
    this.warn = this.warn.bind(this);
    this.error = this.error.bind(this);
    this.moreInfo = alt3.isServer ? this.moreInfoServer.bind(this) : this.moreInfoClient.bind(this);
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
  moreInfoServer(...args) {
    const date = new Date();
    const hour = date.getHours();
    const minute = date.getMinutes();
    const second = date.getSeconds();
    console.log(`[${formatDateUnit(hour)}:${formatDateUnit(minute)}:${formatDateUnit(second)}]`, `${_Logger2.nodeCyanColor}[${this.name}]${_Logger2.nodeWhiteColor}`, ...args);
    function formatDateUnit(unit) {
      return unit >= 10 ? unit : `0${unit}`;
    }
  }
  moreInfoClient(...args) {
    alt3.log(`${_Logger2.startLogColor}[${this.name}]~w~`, ...args.map((a) => format2(a)));
  }
};
var Logger2 = _Logger2;
__publicField(Logger2, "startLogColor", "~cl~");
__publicField(Logger2, "nodeCyanColor", "[36m");
__publicField(Logger2, "nodeWhiteColor", "[37m");
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
__decorate2([
  checkEnabled2(LogLevel2.Info),
  __metadata2("design:type", Function),
  __metadata2("design:paramtypes", [Object]),
  __metadata2("design:returntype", void 0)
], Logger2.prototype, "moreInfoServer", null);
__decorate2([
  checkEnabled2(LogLevel2.Info),
  __metadata2("design:type", Function),
  __metadata2("design:paramtypes", [Object]),
  __metadata2("design:returntype", void 0)
], Logger2.prototype, "moreInfoClient", null);
function create_default2(name, options = {}) {
  const { enabled = true, logLevel = alt4.debug ? LogLevel2.Info : LogLevel2.Warn } = options;
  return Logger2.create(name, { enabled, logLevel });
}
var WSClient = class {
  log = create_default2("WSClient");
  player = Player.local;
  messageHandlers = /* @__PURE__ */ new Set();
  eventsManager;
  waitConnectPromise;
  client;
  socketCloseHandler;
  connected = false;
  constructor(url, authCode, options) {
    this.log.log(`connect url: ${url}`);
    this.client = this.initClient(authCode, url);
    this.waitConnectPromise = this.initWaitConnectPromise();
    this.eventsManager = this.initUserEvents(options);
    this.socketCloseHandler = options.close;
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
    client.pingInterval = 15;
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
    this.socketCloseHandler();
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
  initUserEvents({ events }) {
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
var _InternalEntityPool = class {
  constructor(id, EntityClass) {
    this.id = id;
    this.EntityClass = EntityClass;
    this.log = create_default2(`EntityPool ${EntityClass.name} (id: ${this.id})`);
    InternalXSyncEntity.instance.addEntityPool(this);
  }
  static streamOutEntity(id) {
    const entity = this.entities[id];
    if (!entity) {
      this.log.error(`[streamOutEntity] unknown entity id: ${id}`);
      return;
    }
    entity.streamOut();
    delete this.entities[id];
  }
  log;
  streamInEntity(entity) {
    _InternalEntityPool.entities[entity.id] = entity;
    entity.streamIn(entity.pos, entity.data);
  }
};
var InternalEntityPool = _InternalEntityPool;
__publicField(InternalEntityPool, "entities", {});
__publicField(InternalEntityPool, "log", create_default2("InternalEntityPool"));
var getServerIp2 = () => {
  const rawIp = getServerIp();
  return rawIp.slice(7);
};
var _InternalXSyncEntity = class {
  static get instance() {
    const { _instance } = this;
    if (!_instance) {
      throw new Error("InternalXSyncEntity has not been initialized yet");
    }
    return _instance;
  }
  log = create_default2("XSyncEntity", {
    logLevel: true ? LogLevel2.Info : LogLevel2.Warn
  });
  entityPools = {};
  WSEventHandlers = {
    [WSClientOnServerEvents.EntitiesStreamIn]: (entities) => {
      this.log.log(`stream in: ${entities.length}`);
      for (let i = 0; i < entities.length; i++) {
        const [poolId, entityId, pos, data] = entities[i];
        const entityPool = this.entityPools[poolId];
        if (!entityPool) {
          throw new Error(`[WSClientOnServerEvents.EntitiesStreamIn] unknown pool id: ${poolId}`);
        }
        const posVector3 = WSVectors.WStoAlt(pos);
        const entity = new entityPool.EntityClass(entityId, posVector3, data);
        entityPool.streamInEntity(entity);
      }
    },
    [WSClientOnServerEvents.EntitiesStreamOut]: (entityIds) => {
      this.log.log(`stream out: ${entityIds.length}`);
      for (let i = 0; i < entityIds.length; i++) {
        InternalEntityPool.streamOutEntity(entityIds[i]);
      }
    },
    [WSClientOnServerEvents.EntityDestroy]: (entityId) => {
      InternalEntityPool.streamOutEntity(entityId);
    }
  };
  ws = null;
  constructor() {
    if (_InternalXSyncEntity._instance) {
      throw new Error("InternalXSyncEntity already initialized");
    }
    _InternalXSyncEntity._instance = this;
    this.setupAltvEvents();
  }
  addEntityPool(pool) {
    if (this.entityPools[pool.id]) {
      throw new Error(`[addEntityPool] already exist pool id: ${pool.id}`);
    }
    this.entityPools[pool.id] = pool;
  }
  setupAltvEvents() {
    onServer(ClientOnServerEvents.AddPlayer, this.onAddPlayer.bind(this));
  }
  onAddPlayer(authCode, serverUrl, serverPort) {
    let fullServerUrl;
    if (serverUrl.startsWith("localhost")) {
      const port = serverUrl.slice(serverUrl.indexOf(":") + 1);
      fullServerUrl = `ws://${getServerIp2()}:${port}`;
    } else {
      fullServerUrl = `${serverUrl}`;
    }
    this.log.log("onAddPlayer", authCode, serverUrl, fullServerUrl);
    const ws = new WSClient(fullServerUrl, authCode, {
      events: this.WSEventHandlers,
      close: this.onWSClose.bind(this)
    });
    this.ws = ws;
  }
  onWSClose() {
    this.log.log("on ws close destroy entities");
    for (const entityId in InternalEntityPool.entities) {
      try {
        InternalEntityPool.entities[entityId]?.streamOut();
      } catch (e) {
        this.log.error(e);
      }
    }
  }
};
var InternalXSyncEntity = _InternalXSyncEntity;
__publicField(InternalXSyncEntity, "_instance", null);
var XSyncEntity = class {
  internal;
  constructor() {
    this.internal = new InternalXSyncEntity();
  }
};
var Entity = class {
  constructor(id, pos, data) {
    this.id = id;
    this.pos = pos;
    this.data = data;
  }
};
var EntityPool = class {
  constructor(id, EntityClass) {
    this.id = id;
    this.EntityClass = EntityClass;
    this.internal = new InternalEntityPool(id, EntityClass);
  }
  internal;
};

// shared.ts
var EntityPools = /* @__PURE__ */ ((EntityPools2) => {
  EntityPools2[EntityPools2["Marker"] = 0] = "Marker";
  return EntityPools2;
})(EntityPools || {});

// client.ts
new XSyncEntity();
new EntityPool(EntityPools.Marker, class Marker extends Entity {
  render = 0;
  streamIn(pos, { type }) {
    this.render = alt5.everyTick(() => {
      native.drawMarker(type, pos.x, pos.y, pos.z, 0, 0, 0, 0, 0, 0, 0.5, 0.5, 0.5, 100, 170, 255, 200, false, false, 2, true, void 0, void 0, false);
    });
  }
  streamOut() {
    alt5.clearEveryTick(this.render);
  }
});
