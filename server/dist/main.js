var __defProp = Object.defineProperty;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __publicField = (obj, key, value) => {
  __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);
  return value;
};

// server/src/id-provider/class.ts
var IdProvider = class {
  freeIds = [];
  currentId = 0;
  getNext() {
    const freeId = this.freeIds.pop();
    if (freeId != null)
      return freeId;
    const next = this.currentId++;
    if (next >= Number.MAX_SAFE_INTEGER) {
      throw new Error(`[IdProvider] failed get next id: next >= ${Number.MAX_SAFE_INTEGER}`);
    }
    return next;
  }
  freeId(id) {
    this.freeIds.push(id);
  }
};

// server/src/ws-server/class.ts
import {
  Player,
  on
} from "alt-server";

// node_modules/ws-esm/ws-esm/lib/websocket.js
import EventEmitter from "events";
import https from "https";
import http from "http";
import net2 from "net";
import tls2 from "tls";
import { randomBytes, createHash } from "crypto";
import stream2 from "stream";
import { URL as URL2 } from "url";

// node_modules/ws-esm/ws-esm/lib/permessage-deflate.js
import zlib from "zlib";

// node_modules/ws-esm/ws-esm/lib/constants.js
"use strict";
var BINARY_TYPES = ["nodebuffer", "arraybuffer", "fragments"];
var EMPTY_BUFFER = Buffer.alloc(0);
var GUID = "258EAFA5-E914-47DA-95CA-C5AB0DC85B11";
var kForOnEventAttribute = Symbol("kIsForOnEventAttribute");
var kListener = Symbol("kListener");
var kStatusCode = Symbol("status-code");
var kWebSocket = Symbol("websocket");
var NOOP = () => {
};

// node_modules/ws-esm/ws-esm/lib/buffer-util.js
function concat(list, totalLength) {
  if (list.length === 0)
    return EMPTY_BUFFER;
  if (list.length === 1)
    return list[0];
  const target = Buffer.allocUnsafe(totalLength);
  let offset = 0;
  for (let i = 0; i < list.length; i++) {
    const buf = list[i];
    target.set(buf, offset);
    offset += buf.length;
  }
  if (offset < totalLength)
    return target.slice(0, offset);
  return target;
}
function _mask(source, mask2, output, offset, length) {
  for (let i = 0; i < length; i++) {
    output[offset + i] = source[i] ^ mask2[i & 3];
  }
}
function _unmask(buffer, mask2) {
  for (let i = 0; i < buffer.length; i++) {
    buffer[i] ^= mask2[i & 3];
  }
}
function toArrayBuffer(buf) {
  if (buf.byteLength === buf.buffer.byteLength) {
    return buf.buffer;
  }
  return buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength);
}
function toBuffer(data) {
  toBuffer.readOnly = true;
  if (Buffer.isBuffer(data))
    return data;
  let buf;
  if (data instanceof ArrayBuffer) {
    buf = Buffer.from(data);
  } else if (ArrayBuffer.isView(data)) {
    buf = Buffer.from(data.buffer, data.byteOffset, data.byteLength);
  } else {
    buf = Buffer.from(data);
    toBuffer.readOnly = false;
  }
  return buf;
}
var buffer_util_default = {
  concat,
  mask: _mask,
  toArrayBuffer,
  toBuffer,
  unmask: _unmask
};

// node_modules/ws-esm/ws-esm/lib/limiter.js
"use strict";
var kDone = Symbol("kDone");
var kRun = Symbol("kRun");
var Limiter = class {
  constructor(concurrency) {
    this[kDone] = () => {
      this.pending--;
      this[kRun]();
    };
    this.concurrency = concurrency || Infinity;
    this.jobs = [];
    this.pending = 0;
  }
  add(job) {
    this.jobs.push(job);
    this[kRun]();
  }
  [kRun]() {
    if (this.pending === this.concurrency)
      return;
    if (this.jobs.length) {
      const job = this.jobs.shift();
      this.pending++;
      job(this[kDone]);
    }
  }
};
var limiter_default = Limiter;

// node_modules/ws-esm/ws-esm/lib/permessage-deflate.js
var TRAILER = Buffer.from([0, 0, 255, 255]);
var kPerMessageDeflate = Symbol("permessage-deflate");
var kTotalLength = Symbol("total-length");
var kCallback = Symbol("callback");
var kBuffers = Symbol("buffers");
var kError = Symbol("error");
var zlibLimiter;
var PerMessageDeflate = class {
  constructor(options, isServer, maxPayload) {
    this._maxPayload = maxPayload | 0;
    this._options = options || {};
    this._threshold = this._options.threshold !== void 0 ? this._options.threshold : 1024;
    this._isServer = !!isServer;
    this._deflate = null;
    this._inflate = null;
    this.params = null;
    if (!zlibLimiter) {
      const concurrency = this._options.concurrencyLimit !== void 0 ? this._options.concurrencyLimit : 10;
      zlibLimiter = new limiter_default(concurrency);
    }
  }
  static get extensionName() {
    return "permessage-deflate";
  }
  offer() {
    const params = {};
    if (this._options.serverNoContextTakeover) {
      params.server_no_context_takeover = true;
    }
    if (this._options.clientNoContextTakeover) {
      params.client_no_context_takeover = true;
    }
    if (this._options.serverMaxWindowBits) {
      params.server_max_window_bits = this._options.serverMaxWindowBits;
    }
    if (this._options.clientMaxWindowBits) {
      params.client_max_window_bits = this._options.clientMaxWindowBits;
    } else if (this._options.clientMaxWindowBits == null) {
      params.client_max_window_bits = true;
    }
    return params;
  }
  accept(configurations) {
    configurations = this.normalizeParams(configurations);
    this.params = this._isServer ? this.acceptAsServer(configurations) : this.acceptAsClient(configurations);
    return this.params;
  }
  cleanup() {
    if (this._inflate) {
      this._inflate.close();
      this._inflate = null;
    }
    if (this._deflate) {
      const callback = this._deflate[kCallback];
      this._deflate.close();
      this._deflate = null;
      if (callback) {
        callback(new Error("The deflate stream was closed while data was being processed"));
      }
    }
  }
  acceptAsServer(offers) {
    const opts = this._options;
    const accepted = offers.find((params) => {
      if (opts.serverNoContextTakeover === false && params.server_no_context_takeover || params.server_max_window_bits && (opts.serverMaxWindowBits === false || typeof opts.serverMaxWindowBits === "number" && opts.serverMaxWindowBits > params.server_max_window_bits) || typeof opts.clientMaxWindowBits === "number" && !params.client_max_window_bits) {
        return false;
      }
      return true;
    });
    if (!accepted) {
      throw new Error("None of the extension offers can be accepted");
    }
    if (opts.serverNoContextTakeover) {
      accepted.server_no_context_takeover = true;
    }
    if (opts.clientNoContextTakeover) {
      accepted.client_no_context_takeover = true;
    }
    if (typeof opts.serverMaxWindowBits === "number") {
      accepted.server_max_window_bits = opts.serverMaxWindowBits;
    }
    if (typeof opts.clientMaxWindowBits === "number") {
      accepted.client_max_window_bits = opts.clientMaxWindowBits;
    } else if (accepted.client_max_window_bits === true || opts.clientMaxWindowBits === false) {
      delete accepted.client_max_window_bits;
    }
    return accepted;
  }
  acceptAsClient(response) {
    const params = response[0];
    if (this._options.clientNoContextTakeover === false && params.client_no_context_takeover) {
      throw new Error('Unexpected parameter "client_no_context_takeover"');
    }
    if (!params.client_max_window_bits) {
      if (typeof this._options.clientMaxWindowBits === "number") {
        params.client_max_window_bits = this._options.clientMaxWindowBits;
      }
    } else if (this._options.clientMaxWindowBits === false || typeof this._options.clientMaxWindowBits === "number" && params.client_max_window_bits > this._options.clientMaxWindowBits) {
      throw new Error('Unexpected or invalid parameter "client_max_window_bits"');
    }
    return params;
  }
  normalizeParams(configurations) {
    configurations.forEach((params) => {
      Object.keys(params).forEach((key) => {
        let value = params[key];
        if (value.length > 1) {
          throw new Error(`Parameter "${key}" must have only a single value`);
        }
        value = value[0];
        if (key === "client_max_window_bits") {
          if (value !== true) {
            const num = +value;
            if (!Number.isInteger(num) || num < 8 || num > 15) {
              throw new TypeError(`Invalid value for parameter "${key}": ${value}`);
            }
            value = num;
          } else if (!this._isServer) {
            throw new TypeError(`Invalid value for parameter "${key}": ${value}`);
          }
        } else if (key === "server_max_window_bits") {
          const num = +value;
          if (!Number.isInteger(num) || num < 8 || num > 15) {
            throw new TypeError(`Invalid value for parameter "${key}": ${value}`);
          }
          value = num;
        } else if (key === "client_no_context_takeover" || key === "server_no_context_takeover") {
          if (value !== true) {
            throw new TypeError(`Invalid value for parameter "${key}": ${value}`);
          }
        } else {
          throw new Error(`Unknown parameter "${key}"`);
        }
        params[key] = value;
      });
    });
    return configurations;
  }
  decompress(data, fin, callback) {
    zlibLimiter.add((done) => {
      this._decompress(data, fin, (err, result) => {
        done();
        callback(err, result);
      });
    });
  }
  compress(data, fin, callback) {
    zlibLimiter.add((done) => {
      this._compress(data, fin, (err, result) => {
        done();
        callback(err, result);
      });
    });
  }
  _decompress(data, fin, callback) {
    const endpoint = this._isServer ? "client" : "server";
    if (!this._inflate) {
      const key = `${endpoint}_max_window_bits`;
      const windowBits = typeof this.params[key] !== "number" ? zlib.Z_DEFAULT_WINDOWBITS : this.params[key];
      this._inflate = zlib.createInflateRaw({
        ...this._options.zlibInflateOptions,
        windowBits
      });
      this._inflate[kPerMessageDeflate] = this;
      this._inflate[kTotalLength] = 0;
      this._inflate[kBuffers] = [];
      this._inflate.on("error", inflateOnError);
      this._inflate.on("data", inflateOnData);
    }
    this._inflate[kCallback] = callback;
    this._inflate.write(data);
    if (fin)
      this._inflate.write(TRAILER);
    this._inflate.flush(() => {
      const err = this._inflate[kError];
      if (err) {
        this._inflate.close();
        this._inflate = null;
        callback(err);
        return;
      }
      const data2 = buffer_util_default.concat(this._inflate[kBuffers], this._inflate[kTotalLength]);
      if (this._inflate._readableState.endEmitted) {
        this._inflate.close();
        this._inflate = null;
      } else {
        this._inflate[kTotalLength] = 0;
        this._inflate[kBuffers] = [];
        if (fin && this.params[`${endpoint}_no_context_takeover`]) {
          this._inflate.reset();
        }
      }
      callback(null, data2);
    });
  }
  _compress(data, fin, callback) {
    const endpoint = this._isServer ? "server" : "client";
    if (!this._deflate) {
      const key = `${endpoint}_max_window_bits`;
      const windowBits = typeof this.params[key] !== "number" ? zlib.Z_DEFAULT_WINDOWBITS : this.params[key];
      this._deflate = zlib.createDeflateRaw({
        ...this._options.zlibDeflateOptions,
        windowBits
      });
      this._deflate[kTotalLength] = 0;
      this._deflate[kBuffers] = [];
      this._deflate.on("data", deflateOnData);
    }
    this._deflate[kCallback] = callback;
    this._deflate.write(data);
    this._deflate.flush(zlib.Z_SYNC_FLUSH, () => {
      if (!this._deflate) {
        return;
      }
      let data2 = buffer_util_default.concat(this._deflate[kBuffers], this._deflate[kTotalLength]);
      if (fin)
        data2 = data2.slice(0, data2.length - 4);
      this._deflate[kCallback] = null;
      this._deflate[kTotalLength] = 0;
      this._deflate[kBuffers] = [];
      if (fin && this.params[`${endpoint}_no_context_takeover`]) {
        this._deflate.reset();
      }
      callback(null, data2);
    });
  }
};
function deflateOnData(chunk) {
  this[kBuffers].push(chunk);
  this[kTotalLength] += chunk.length;
}
function inflateOnData(chunk) {
  this[kTotalLength] += chunk.length;
  if (this[kPerMessageDeflate]._maxPayload < 1 || this[kTotalLength] <= this[kPerMessageDeflate]._maxPayload) {
    this[kBuffers].push(chunk);
    return;
  }
  this[kError] = new RangeError("Max payload size exceeded");
  this[kError].code = "WS_ERR_UNSUPPORTED_MESSAGE_LENGTH";
  this[kError][kStatusCode] = 1009;
  this.removeListener("data", inflateOnData);
  this.reset();
}
function inflateOnError(err) {
  this[kPerMessageDeflate]._inflate = null;
  err[kStatusCode] = 1007;
  this[kCallback](err);
}
var permessage_deflate_default = PerMessageDeflate;

// node_modules/ws-esm/ws-esm/lib/receiver.js
import stream from "stream";

// node_modules/ws-esm/ws-esm/lib/validation.js
var tokenChars = [
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  1,
  0,
  1,
  1,
  1,
  1,
  1,
  0,
  0,
  1,
  1,
  0,
  1,
  1,
  0,
  1,
  1,
  1,
  1,
  1,
  1,
  1,
  1,
  1,
  1,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  1,
  1,
  1,
  1,
  1,
  1,
  1,
  1,
  1,
  1,
  1,
  1,
  1,
  1,
  1,
  1,
  1,
  1,
  1,
  1,
  1,
  1,
  1,
  1,
  1,
  1,
  0,
  0,
  0,
  1,
  1,
  1,
  1,
  1,
  1,
  1,
  1,
  1,
  1,
  1,
  1,
  1,
  1,
  1,
  1,
  1,
  1,
  1,
  1,
  1,
  1,
  1,
  1,
  1,
  1,
  1,
  1,
  1,
  0,
  1,
  0,
  1,
  0
];
function isValidStatusCode(code) {
  return code >= 1e3 && code <= 1014 && code !== 1004 && code !== 1005 && code !== 1006 || code >= 3e3 && code <= 4999;
}
function _isValidUTF8(buf) {
  const len = buf.length;
  let i = 0;
  while (i < len) {
    if ((buf[i] & 128) === 0) {
      i++;
    } else if ((buf[i] & 224) === 192) {
      if (i + 1 === len || (buf[i + 1] & 192) !== 128 || (buf[i] & 254) === 192) {
        return false;
      }
      i += 2;
    } else if ((buf[i] & 240) === 224) {
      if (i + 2 >= len || (buf[i + 1] & 192) !== 128 || (buf[i + 2] & 192) !== 128 || buf[i] === 224 && (buf[i + 1] & 224) === 128 || buf[i] === 237 && (buf[i + 1] & 224) === 160) {
        return false;
      }
      i += 3;
    } else if ((buf[i] & 248) === 240) {
      if (i + 3 >= len || (buf[i + 1] & 192) !== 128 || (buf[i + 2] & 192) !== 128 || (buf[i + 3] & 192) !== 128 || buf[i] === 240 && (buf[i + 1] & 240) === 128 || buf[i] === 244 && buf[i + 1] > 143 || buf[i] > 244) {
        return false;
      }
      i += 4;
    } else {
      return false;
    }
  }
  return true;
}

// node_modules/ws-esm/ws-esm/lib/receiver.js
var { Writable } = stream;
var GET_INFO = 0;
var GET_PAYLOAD_LENGTH_16 = 1;
var GET_PAYLOAD_LENGTH_64 = 2;
var GET_MASK = 3;
var GET_DATA = 4;
var INFLATING = 5;
var Receiver = class extends Writable {
  constructor(options = {}) {
    super();
    this._binaryType = options.binaryType || BINARY_TYPES[0];
    this._extensions = options.extensions || {};
    this._isServer = !!options.isServer;
    this._maxPayload = options.maxPayload | 0;
    this._skipUTF8Validation = !!options.skipUTF8Validation;
    this[kWebSocket] = void 0;
    this._bufferedBytes = 0;
    this._buffers = [];
    this._compressed = false;
    this._payloadLength = 0;
    this._mask = void 0;
    this._fragmented = 0;
    this._masked = false;
    this._fin = false;
    this._opcode = 0;
    this._totalPayloadLength = 0;
    this._messageLength = 0;
    this._fragments = [];
    this._state = GET_INFO;
    this._loop = false;
  }
  _write(chunk, encoding, cb) {
    if (this._opcode === 8 && this._state == GET_INFO)
      return cb();
    this._bufferedBytes += chunk.length;
    this._buffers.push(chunk);
    this.startLoop(cb);
  }
  consume(n) {
    this._bufferedBytes -= n;
    if (n === this._buffers[0].length)
      return this._buffers.shift();
    if (n < this._buffers[0].length) {
      const buf = this._buffers[0];
      this._buffers[0] = buf.slice(n);
      return buf.slice(0, n);
    }
    const dst = Buffer.allocUnsafe(n);
    do {
      const buf = this._buffers[0];
      const offset = dst.length - n;
      if (n >= buf.length) {
        dst.set(this._buffers.shift(), offset);
      } else {
        dst.set(new Uint8Array(buf.buffer, buf.byteOffset, n), offset);
        this._buffers[0] = buf.slice(n);
      }
      n -= buf.length;
    } while (n > 0);
    return dst;
  }
  startLoop(cb) {
    let err;
    this._loop = true;
    do {
      switch (this._state) {
        case GET_INFO:
          err = this.getInfo();
          break;
        case GET_PAYLOAD_LENGTH_16:
          err = this.getPayloadLength16();
          break;
        case GET_PAYLOAD_LENGTH_64:
          err = this.getPayloadLength64();
          break;
        case GET_MASK:
          this.getMask();
          break;
        case GET_DATA:
          err = this.getData(cb);
          break;
        default:
          this._loop = false;
          return;
      }
    } while (this._loop);
    cb(err);
  }
  getInfo() {
    if (this._bufferedBytes < 2) {
      this._loop = false;
      return;
    }
    const buf = this.consume(2);
    if ((buf[0] & 48) !== 0) {
      this._loop = false;
      return error(RangeError, "RSV2 and RSV3 must be clear", true, 1002, "WS_ERR_UNEXPECTED_RSV_2_3");
    }
    const compressed = (buf[0] & 64) === 64;
    if (compressed && !this._extensions[permessage_deflate_default.extensionName]) {
      this._loop = false;
      return error(RangeError, "RSV1 must be clear", true, 1002, "WS_ERR_UNEXPECTED_RSV_1");
    }
    this._fin = (buf[0] & 128) === 128;
    this._opcode = buf[0] & 15;
    this._payloadLength = buf[1] & 127;
    if (this._opcode === 0) {
      if (compressed) {
        this._loop = false;
        return error(RangeError, "RSV1 must be clear", true, 1002, "WS_ERR_UNEXPECTED_RSV_1");
      }
      if (!this._fragmented) {
        this._loop = false;
        return error(RangeError, "invalid opcode 0", true, 1002, "WS_ERR_INVALID_OPCODE");
      }
      this._opcode = this._fragmented;
    } else if (this._opcode === 1 || this._opcode === 2) {
      if (this._fragmented) {
        this._loop = false;
        return error(RangeError, `invalid opcode ${this._opcode}`, true, 1002, "WS_ERR_INVALID_OPCODE");
      }
      this._compressed = compressed;
    } else if (this._opcode > 7 && this._opcode < 11) {
      if (!this._fin) {
        this._loop = false;
        return error(RangeError, "FIN must be set", true, 1002, "WS_ERR_EXPECTED_FIN");
      }
      if (compressed) {
        this._loop = false;
        return error(RangeError, "RSV1 must be clear", true, 1002, "WS_ERR_UNEXPECTED_RSV_1");
      }
      if (this._payloadLength > 125) {
        this._loop = false;
        return error(RangeError, `invalid payload length ${this._payloadLength}`, true, 1002, "WS_ERR_INVALID_CONTROL_PAYLOAD_LENGTH");
      }
    } else {
      this._loop = false;
      return error(RangeError, `invalid opcode ${this._opcode}`, true, 1002, "WS_ERR_INVALID_OPCODE");
    }
    if (!this._fin && !this._fragmented)
      this._fragmented = this._opcode;
    this._masked = (buf[1] & 128) === 128;
    if (this._isServer) {
      if (!this._masked) {
        this._loop = false;
        return error(RangeError, "MASK must be set", true, 1002, "WS_ERR_EXPECTED_MASK");
      }
    } else if (this._masked) {
      this._loop = false;
      return error(RangeError, "MASK must be clear", true, 1002, "WS_ERR_UNEXPECTED_MASK");
    }
    if (this._payloadLength === 126)
      this._state = GET_PAYLOAD_LENGTH_16;
    else if (this._payloadLength === 127)
      this._state = GET_PAYLOAD_LENGTH_64;
    else
      return this.haveLength();
  }
  getPayloadLength16() {
    if (this._bufferedBytes < 2) {
      this._loop = false;
      return;
    }
    this._payloadLength = this.consume(2).readUInt16BE(0);
    return this.haveLength();
  }
  getPayloadLength64() {
    if (this._bufferedBytes < 8) {
      this._loop = false;
      return;
    }
    const buf = this.consume(8);
    const num = buf.readUInt32BE(0);
    if (num > Math.pow(2, 53 - 32) - 1) {
      this._loop = false;
      return error(RangeError, "Unsupported WebSocket frame: payload length > 2^53 - 1", false, 1009, "WS_ERR_UNSUPPORTED_DATA_PAYLOAD_LENGTH");
    }
    this._payloadLength = num * Math.pow(2, 32) + buf.readUInt32BE(4);
    return this.haveLength();
  }
  haveLength() {
    if (this._payloadLength && this._opcode < 8) {
      this._totalPayloadLength += this._payloadLength;
      if (this._totalPayloadLength > this._maxPayload && this._maxPayload > 0) {
        this._loop = false;
        return error(RangeError, "Max payload size exceeded", false, 1009, "WS_ERR_UNSUPPORTED_MESSAGE_LENGTH");
      }
    }
    if (this._masked)
      this._state = GET_MASK;
    else
      this._state = GET_DATA;
  }
  getMask() {
    if (this._bufferedBytes < 4) {
      this._loop = false;
      return;
    }
    this._mask = this.consume(4);
    this._state = GET_DATA;
  }
  getData(cb) {
    let data = EMPTY_BUFFER;
    if (this._payloadLength) {
      if (this._bufferedBytes < this._payloadLength) {
        this._loop = false;
        return;
      }
      data = this.consume(this._payloadLength);
      if (this._masked)
        _unmask(data, this._mask);
    }
    if (this._opcode > 7)
      return this.controlMessage(data);
    if (this._compressed) {
      this._state = INFLATING;
      this.decompress(data, cb);
      return;
    }
    if (data.length) {
      this._messageLength = this._totalPayloadLength;
      this._fragments.push(data);
    }
    return this.dataMessage();
  }
  decompress(data, cb) {
    const perMessageDeflate = this._extensions[permessage_deflate_default.extensionName];
    perMessageDeflate.decompress(data, this._fin, (err, buf) => {
      if (err)
        return cb(err);
      if (buf.length) {
        this._messageLength += buf.length;
        if (this._messageLength > this._maxPayload && this._maxPayload > 0) {
          return cb(error(RangeError, "Max payload size exceeded", false, 1009, "WS_ERR_UNSUPPORTED_MESSAGE_LENGTH"));
        }
        this._fragments.push(buf);
      }
      const er = this.dataMessage();
      if (er)
        return cb(er);
      this.startLoop(cb);
    });
  }
  dataMessage() {
    if (this._fin) {
      const messageLength = this._messageLength;
      const fragments = this._fragments;
      this._totalPayloadLength = 0;
      this._messageLength = 0;
      this._fragmented = 0;
      this._fragments = [];
      if (this._opcode === 2) {
        let data;
        if (this._binaryType === "nodebuffer") {
          data = concat(fragments, messageLength);
        } else if (this._binaryType === "arraybuffer") {
          data = toArrayBuffer(concat(fragments, messageLength));
        } else {
          data = fragments;
        }
        this.emit("message", data, true);
      } else {
        const buf = concat(fragments, messageLength);
        if (!this._skipUTF8Validation && !_isValidUTF8(buf)) {
          this._loop = false;
          return error(Error, "invalid UTF-8 sequence", true, 1007, "WS_ERR_INVALID_UTF8");
        }
        this.emit("message", buf, false);
      }
    }
    this._state = GET_INFO;
  }
  controlMessage(data) {
    if (this._opcode === 8) {
      this._loop = false;
      if (data.length === 0) {
        this.emit("conclude", 1005, EMPTY_BUFFER);
        this.end();
      } else if (data.length === 1) {
        return error(RangeError, "invalid payload length 1", true, 1002, "WS_ERR_INVALID_CONTROL_PAYLOAD_LENGTH");
      } else {
        const code = data.readUInt16BE(0);
        if (!isValidStatusCode(code)) {
          return error(RangeError, `invalid status code ${code}`, true, 1002, "WS_ERR_INVALID_CLOSE_CODE");
        }
        const buf = data.slice(2);
        if (!this._skipUTF8Validation && !_isValidUTF8(buf)) {
          return error(Error, "invalid UTF-8 sequence", true, 1007, "WS_ERR_INVALID_UTF8");
        }
        this.emit("conclude", code, buf);
        this.end();
      }
    } else if (this._opcode === 9) {
      this.emit("ping", data);
    } else {
      this.emit("pong", data);
    }
    this._state = GET_INFO;
  }
};
function error(ErrorCtor, message, prefix, statusCode, errorCode) {
  const err = new ErrorCtor(prefix ? `Invalid WebSocket frame: ${message}` : message);
  Error.captureStackTrace(err, error);
  err.code = errorCode;
  err[kStatusCode] = statusCode;
  return err;
}
var receiver_default = Receiver;

// node_modules/ws-esm/ws-esm/lib/sender.js
import net from "net";
import tls from "tls";
import { randomFillSync } from "crypto";
var mask = Buffer.alloc(4);
var Sender = class {
  constructor(socket, extensions) {
    this._extensions = extensions || {};
    this._socket = socket;
    this._firstFragment = true;
    this._compress = false;
    this._bufferedBytes = 0;
    this._deflating = false;
    this._queue = [];
  }
  static frame(data, options) {
    const merge = options.mask && options.readOnly;
    let offset = options.mask ? 6 : 2;
    let payloadLength = data.length;
    if (data.length >= 65536) {
      offset += 8;
      payloadLength = 127;
    } else if (data.length > 125) {
      offset += 2;
      payloadLength = 126;
    }
    const target = Buffer.allocUnsafe(merge ? data.length + offset : offset);
    target[0] = options.fin ? options.opcode | 128 : options.opcode;
    if (options.rsv1)
      target[0] |= 64;
    target[1] = payloadLength;
    if (payloadLength === 126) {
      target.writeUInt16BE(data.length, 2);
    } else if (payloadLength === 127) {
      target.writeUInt32BE(0, 2);
      target.writeUInt32BE(data.length, 6);
    }
    if (!options.mask)
      return [target, data];
    randomFillSync(mask, 0, 4);
    target[1] |= 128;
    target[offset - 4] = mask[0];
    target[offset - 3] = mask[1];
    target[offset - 2] = mask[2];
    target[offset - 1] = mask[3];
    if (merge) {
      _mask(data, mask, target, offset, data.length);
      return [target];
    }
    _mask(data, mask, data, 0, data.length);
    return [target, data];
  }
  close(code, data, mask2, cb) {
    let buf;
    if (code === void 0) {
      buf = EMPTY_BUFFER;
    } else if (typeof code !== "number" || !isValidStatusCode(code)) {
      throw new TypeError("First argument must be a valid error code number");
    } else if (data === void 0 || !data.length) {
      buf = Buffer.allocUnsafe(2);
      buf.writeUInt16BE(code, 0);
    } else {
      const length = Buffer.byteLength(data);
      if (length > 123) {
        throw new RangeError("The message must not be greater than 123 bytes");
      }
      buf = Buffer.allocUnsafe(2 + length);
      buf.writeUInt16BE(code, 0);
      if (typeof data === "string") {
        buf.write(data, 2);
      } else {
        buf.set(data, 2);
      }
    }
    if (this._deflating) {
      this.enqueue([this.doClose, buf, mask2, cb]);
    } else {
      this.doClose(buf, mask2, cb);
    }
  }
  doClose(data, mask2, cb) {
    this.sendFrame(Sender.frame(data, {
      fin: true,
      rsv1: false,
      opcode: 8,
      mask: mask2,
      readOnly: false
    }), cb);
  }
  ping(data, mask2, cb) {
    const buf = toBuffer(data);
    if (buf.length > 125) {
      throw new RangeError("The data size must not be greater than 125 bytes");
    }
    if (this._deflating) {
      this.enqueue([this.doPing, buf, mask2, toBuffer.readOnly, cb]);
    } else {
      this.doPing(buf, mask2, toBuffer.readOnly, cb);
    }
  }
  doPing(data, mask2, readOnly, cb) {
    this.sendFrame(Sender.frame(data, {
      fin: true,
      rsv1: false,
      opcode: 9,
      mask: mask2,
      readOnly
    }), cb);
  }
  pong(data, mask2, cb) {
    const buf = toBuffer(data);
    if (buf.length > 125) {
      throw new RangeError("The data size must not be greater than 125 bytes");
    }
    if (this._deflating) {
      this.enqueue([this.doPong, buf, mask2, toBuffer.readOnly, cb]);
    } else {
      this.doPong(buf, mask2, toBuffer.readOnly, cb);
    }
  }
  doPong(data, mask2, readOnly, cb) {
    this.sendFrame(Sender.frame(data, {
      fin: true,
      rsv1: false,
      opcode: 10,
      mask: mask2,
      readOnly
    }), cb);
  }
  send(data, options, cb) {
    const buf = toBuffer(data);
    const perMessageDeflate = this._extensions[permessage_deflate_default.extensionName];
    let opcode = options.binary ? 2 : 1;
    let rsv1 = options.compress;
    if (this._firstFragment) {
      this._firstFragment = false;
      if (rsv1 && perMessageDeflate && perMessageDeflate.params[perMessageDeflate._isServer ? "server_no_context_takeover" : "client_no_context_takeover"]) {
        rsv1 = buf.length >= perMessageDeflate._threshold;
      }
      this._compress = rsv1;
    } else {
      rsv1 = false;
      opcode = 0;
    }
    if (options.fin)
      this._firstFragment = true;
    if (perMessageDeflate) {
      const opts = {
        fin: options.fin,
        rsv1,
        opcode,
        mask: options.mask,
        readOnly: toBuffer.readOnly
      };
      if (this._deflating) {
        this.enqueue([this.dispatch, buf, this._compress, opts, cb]);
      } else {
        this.dispatch(buf, this._compress, opts, cb);
      }
    } else {
      this.sendFrame(Sender.frame(buf, {
        fin: options.fin,
        rsv1: false,
        opcode,
        mask: options.mask,
        readOnly: toBuffer.readOnly
      }), cb);
    }
  }
  dispatch(data, compress, options, cb) {
    if (!compress) {
      this.sendFrame(Sender.frame(data, options), cb);
      return;
    }
    const perMessageDeflate = this._extensions[permessage_deflate_default.extensionName];
    this._bufferedBytes += data.length;
    this._deflating = true;
    perMessageDeflate.compress(data, options.fin, (_, buf) => {
      if (this._socket.destroyed) {
        const err = new Error("The socket was closed while data was being compressed");
        if (typeof cb === "function")
          cb(err);
        for (let i = 0; i < this._queue.length; i++) {
          const callback = this._queue[i][4];
          if (typeof callback === "function")
            callback(err);
        }
        return;
      }
      this._bufferedBytes -= data.length;
      this._deflating = false;
      options.readOnly = false;
      this.sendFrame(Sender.frame(buf, options), cb);
      this.dequeue();
    });
  }
  dequeue() {
    while (!this._deflating && this._queue.length) {
      const params = this._queue.shift();
      this._bufferedBytes -= params[1].length;
      Reflect.apply(params[0], this, params.slice(1));
    }
  }
  enqueue(params) {
    this._bufferedBytes += params[1].length;
    this._queue.push(params);
  }
  sendFrame(list, cb) {
    if (list.length === 2) {
      this._socket.cork();
      this._socket.write(list[0]);
      this._socket.write(list[1], cb);
      this._socket.uncork();
    } else {
      this._socket.write(list[0], cb);
    }
  }
};
var sender_default = Sender;

// node_modules/ws-esm/ws-esm/lib/event-target.js
var kCode = Symbol("kCode");
var kData = Symbol("kData");
var kError2 = Symbol("kError");
var kMessage = Symbol("kMessage");
var kReason = Symbol("kReason");
var kTarget = Symbol("kTarget");
var kType = Symbol("kType");
var kWasClean = Symbol("kWasClean");
var Event = class {
  constructor(type) {
    this[kTarget] = null;
    this[kType] = type;
  }
  get target() {
    return this[kTarget];
  }
  get type() {
    return this[kType];
  }
};
Object.defineProperty(Event.prototype, "target", { enumerable: true });
Object.defineProperty(Event.prototype, "type", { enumerable: true });
var CloseEvent = class extends Event {
  constructor(type, options = {}) {
    super(type);
    this[kCode] = options.code === void 0 ? 0 : options.code;
    this[kReason] = options.reason === void 0 ? "" : options.reason;
    this[kWasClean] = options.wasClean === void 0 ? false : options.wasClean;
  }
  get code() {
    return this[kCode];
  }
  get reason() {
    return this[kReason];
  }
  get wasClean() {
    return this[kWasClean];
  }
};
Object.defineProperty(CloseEvent.prototype, "code", { enumerable: true });
Object.defineProperty(CloseEvent.prototype, "reason", { enumerable: true });
Object.defineProperty(CloseEvent.prototype, "wasClean", { enumerable: true });
var ErrorEvent = class extends Event {
  constructor(type, options = {}) {
    super(type);
    this[kError2] = options.error === void 0 ? null : options.error;
    this[kMessage] = options.message === void 0 ? "" : options.message;
  }
  get error() {
    return this[kError2];
  }
  get message() {
    return this[kMessage];
  }
};
Object.defineProperty(ErrorEvent.prototype, "error", { enumerable: true });
Object.defineProperty(ErrorEvent.prototype, "message", { enumerable: true });
var MessageEvent = class extends Event {
  constructor(type, options = {}) {
    super(type);
    this[kData] = options.data === void 0 ? null : options.data;
  }
  get data() {
    return this[kData];
  }
};
Object.defineProperty(MessageEvent.prototype, "data", { enumerable: true });
var EventTarget = {
  addEventListener(type, listener, options = {}) {
    let wrapper;
    if (type === "message") {
      wrapper = function onMessage(data, isBinary) {
        const event = new MessageEvent("message", {
          data: isBinary ? data : data.toString()
        });
        event[kTarget] = this;
        listener.call(this, event);
      };
    } else if (type === "close") {
      wrapper = function onClose(code, message) {
        const event = new CloseEvent("close", {
          code,
          reason: message.toString(),
          wasClean: this._closeFrameReceived && this._closeFrameSent
        });
        event[kTarget] = this;
        listener.call(this, event);
      };
    } else if (type === "error") {
      wrapper = function onError(error2) {
        const event = new ErrorEvent("error", {
          error: error2,
          message: error2.message
        });
        event[kTarget] = this;
        listener.call(this, event);
      };
    } else if (type === "open") {
      wrapper = function onOpen() {
        const event = new Event("open");
        event[kTarget] = this;
        listener.call(this, event);
      };
    } else {
      return;
    }
    wrapper[kForOnEventAttribute] = !!options[kForOnEventAttribute];
    wrapper[kListener] = listener;
    if (options.once) {
      this.once(type, wrapper);
    } else {
      this.on(type, wrapper);
    }
  },
  removeEventListener(type, handler) {
    for (const listener of this.listeners(type)) {
      if (listener[kListener] === handler && !listener[kForOnEventAttribute]) {
        this.removeListener(type, listener);
        break;
      }
    }
  }
};

// node_modules/ws-esm/ws-esm/lib/extension.js
function push(dest, name, elem) {
  if (dest[name] === void 0)
    dest[name] = [elem];
  else
    dest[name].push(elem);
}
function parse(header) {
  const offers = Object.create(null);
  let params = Object.create(null);
  let mustUnescape = false;
  let isEscaping = false;
  let inQuotes = false;
  let extensionName;
  let paramName;
  let start = -1;
  let code = -1;
  let end = -1;
  let i = 0;
  for (; i < header.length; i++) {
    code = header.charCodeAt(i);
    if (extensionName === void 0) {
      if (end === -1 && tokenChars[code] === 1) {
        if (start === -1)
          start = i;
      } else if (i !== 0 && (code === 32 || code === 9)) {
        if (end === -1 && start !== -1)
          end = i;
      } else if (code === 59 || code === 44) {
        if (start === -1) {
          throw new SyntaxError(`Unexpected character at index ${i}`);
        }
        if (end === -1)
          end = i;
        const name = header.slice(start, end);
        if (code === 44) {
          push(offers, name, params);
          params = Object.create(null);
        } else {
          extensionName = name;
        }
        start = end = -1;
      } else {
        throw new SyntaxError(`Unexpected character at index ${i}`);
      }
    } else if (paramName === void 0) {
      if (end === -1 && tokenChars[code] === 1) {
        if (start === -1)
          start = i;
      } else if (code === 32 || code === 9) {
        if (end === -1 && start !== -1)
          end = i;
      } else if (code === 59 || code === 44) {
        if (start === -1) {
          throw new SyntaxError(`Unexpected character at index ${i}`);
        }
        if (end === -1)
          end = i;
        push(params, header.slice(start, end), true);
        if (code === 44) {
          push(offers, extensionName, params);
          params = Object.create(null);
          extensionName = void 0;
        }
        start = end = -1;
      } else if (code === 61 && start !== -1 && end === -1) {
        paramName = header.slice(start, i);
        start = end = -1;
      } else {
        throw new SyntaxError(`Unexpected character at index ${i}`);
      }
    } else {
      if (isEscaping) {
        if (tokenChars[code] !== 1) {
          throw new SyntaxError(`Unexpected character at index ${i}`);
        }
        if (start === -1)
          start = i;
        else if (!mustUnescape)
          mustUnescape = true;
        isEscaping = false;
      } else if (inQuotes) {
        if (tokenChars[code] === 1) {
          if (start === -1)
            start = i;
        } else if (code === 34 && start !== -1) {
          inQuotes = false;
          end = i;
        } else if (code === 92) {
          isEscaping = true;
        } else {
          throw new SyntaxError(`Unexpected character at index ${i}`);
        }
      } else if (code === 34 && header.charCodeAt(i - 1) === 61) {
        inQuotes = true;
      } else if (end === -1 && tokenChars[code] === 1) {
        if (start === -1)
          start = i;
      } else if (start !== -1 && (code === 32 || code === 9)) {
        if (end === -1)
          end = i;
      } else if (code === 59 || code === 44) {
        if (start === -1) {
          throw new SyntaxError(`Unexpected character at index ${i}`);
        }
        if (end === -1)
          end = i;
        let value = header.slice(start, end);
        if (mustUnescape) {
          value = value.replace(/\\/g, "");
          mustUnescape = false;
        }
        push(params, paramName, value);
        if (code === 44) {
          push(offers, extensionName, params);
          params = Object.create(null);
          extensionName = void 0;
        }
        paramName = void 0;
        start = end = -1;
      } else {
        throw new SyntaxError(`Unexpected character at index ${i}`);
      }
    }
  }
  if (start === -1 || inQuotes || code === 32 || code === 9) {
    throw new SyntaxError("Unexpected end of input");
  }
  if (end === -1)
    end = i;
  const token = header.slice(start, end);
  if (extensionName === void 0) {
    push(offers, token, params);
  } else {
    if (paramName === void 0) {
      push(params, token, true);
    } else if (mustUnescape) {
      push(params, paramName, token.replace(/\\/g, ""));
    } else {
      push(params, paramName, token);
    }
    push(offers, extensionName, params);
  }
  return offers;
}
function format(extensions) {
  return Object.keys(extensions).map((extension) => {
    let configurations = extensions[extension];
    if (!Array.isArray(configurations))
      configurations = [configurations];
    return configurations.map((params) => {
      return [extension].concat(Object.keys(params).map((k) => {
        let values = params[k];
        if (!Array.isArray(values))
          values = [values];
        return values.map((v) => v === true ? k : `${k}=${v}`).join("; ");
      })).join("; ");
    }).join(", ");
  }).join(", ");
}
var extension_default = {
  format,
  parse
};

// node_modules/ws-esm/ws-esm/lib/websocket.js
var { EventTarget: { addEventListener, removeEventListener } } = { EventTarget };
var readyStates = ["CONNECTING", "OPEN", "CLOSING", "CLOSED"];
var subprotocolRegex = /^[!#$%&'*+\-.0-9A-Z^_`|a-z~]+$/;
var protocolVersions = [8, 13];
var closeTimeout = 30 * 1e3;
var WebSocket = class extends EventEmitter {
  constructor(address, protocols, options) {
    super();
    this._binaryType = BINARY_TYPES[0];
    this._closeCode = 1006;
    this._closeFrameReceived = false;
    this._closeFrameSent = false;
    this._closeMessage = EMPTY_BUFFER;
    this._closeTimer = null;
    this._extensions = {};
    this._protocol = "";
    this._readyState = WebSocket.CONNECTING;
    this._receiver = null;
    this._sender = null;
    this._socket = null;
    if (address !== null) {
      this._bufferedAmount = 0;
      this._isServer = false;
      this._redirects = 0;
      if (protocols === void 0) {
        protocols = [];
      } else if (!Array.isArray(protocols)) {
        if (typeof protocols === "object" && protocols !== null) {
          options = protocols;
          protocols = [];
        } else {
          protocols = [protocols];
        }
      }
      initAsClient(this, address, protocols, options);
    } else {
      this._isServer = true;
    }
  }
  get binaryType() {
    return this._binaryType;
  }
  set binaryType(type) {
    if (!BINARY_TYPES.includes(type))
      return;
    this._binaryType = type;
    if (this._receiver)
      this._receiver._binaryType = type;
  }
  get bufferedAmount() {
    if (!this._socket)
      return this._bufferedAmount;
    return this._socket._writableState.length + this._sender._bufferedBytes;
  }
  get extensions() {
    return Object.keys(this._extensions).join();
  }
  get onclose() {
    return null;
  }
  get onerror() {
    return null;
  }
  get onopen() {
    return null;
  }
  get onmessage() {
    return null;
  }
  get protocol() {
    return this._protocol;
  }
  get readyState() {
    return this._readyState;
  }
  get url() {
    return this._url;
  }
  setSocket(socket, head, options) {
    const receiver = new receiver_default({
      binaryType: this.binaryType,
      extensions: this._extensions,
      isServer: this._isServer,
      maxPayload: options.maxPayload,
      skipUTF8Validation: options.skipUTF8Validation
    });
    this._sender = new sender_default(socket, this._extensions);
    this._receiver = receiver;
    this._socket = socket;
    receiver[kWebSocket] = this;
    socket[kWebSocket] = this;
    receiver.on("conclude", receiverOnConclude);
    receiver.on("drain", receiverOnDrain);
    receiver.on("error", receiverOnError);
    receiver.on("message", receiverOnMessage);
    receiver.on("ping", receiverOnPing);
    receiver.on("pong", receiverOnPong);
    socket.setTimeout(0);
    socket.setNoDelay();
    if (head.length > 0)
      socket.unshift(head);
    socket.on("close", socketOnClose);
    socket.on("data", socketOnData);
    socket.on("end", socketOnEnd);
    socket.on("error", socketOnError);
    this._readyState = WebSocket.OPEN;
    this.emit("open");
  }
  emitClose() {
    if (!this._socket) {
      this._readyState = WebSocket.CLOSED;
      this.emit("close", this._closeCode, this._closeMessage);
      return;
    }
    if (this._extensions[permessage_deflate_default.extensionName]) {
      this._extensions[permessage_deflate_default.extensionName].cleanup();
    }
    this._receiver.removeAllListeners();
    this._readyState = WebSocket.CLOSED;
    this.emit("close", this._closeCode, this._closeMessage);
  }
  close(code, data) {
    if (this.readyState === WebSocket.CLOSED)
      return;
    if (this.readyState === WebSocket.CONNECTING) {
      const msg = "WebSocket was closed before the connection was established";
      return abortHandshake(this, this._req, msg);
    }
    if (this.readyState === WebSocket.CLOSING) {
      if (this._closeFrameSent && (this._closeFrameReceived || this._receiver._writableState.errorEmitted)) {
        this._socket.end();
      }
      return;
    }
    this._readyState = WebSocket.CLOSING;
    this._sender.close(code, data, !this._isServer, (err) => {
      if (err)
        return;
      this._closeFrameSent = true;
      if (this._closeFrameReceived || this._receiver._writableState.errorEmitted) {
        this._socket.end();
      }
    });
    this._closeTimer = setTimeout(this._socket.destroy.bind(this._socket), closeTimeout);
  }
  ping(data, mask2, cb) {
    if (this.readyState === WebSocket.CONNECTING) {
      throw new Error("WebSocket is not open: readyState 0 (CONNECTING)");
    }
    if (typeof data === "function") {
      cb = data;
      data = mask2 = void 0;
    } else if (typeof mask2 === "function") {
      cb = mask2;
      mask2 = void 0;
    }
    if (typeof data === "number")
      data = data.toString();
    if (this.readyState !== WebSocket.OPEN) {
      sendAfterClose(this, data, cb);
      return;
    }
    if (mask2 === void 0)
      mask2 = !this._isServer;
    this._sender.ping(data || EMPTY_BUFFER, mask2, cb);
  }
  pong(data, mask2, cb) {
    if (this.readyState === WebSocket.CONNECTING) {
      throw new Error("WebSocket is not open: readyState 0 (CONNECTING)");
    }
    if (typeof data === "function") {
      cb = data;
      data = mask2 = void 0;
    } else if (typeof mask2 === "function") {
      cb = mask2;
      mask2 = void 0;
    }
    if (typeof data === "number")
      data = data.toString();
    if (this.readyState !== WebSocket.OPEN) {
      sendAfterClose(this, data, cb);
      return;
    }
    if (mask2 === void 0)
      mask2 = !this._isServer;
    this._sender.pong(data || EMPTY_BUFFER, mask2, cb);
  }
  send(data, options, cb) {
    if (this.readyState === WebSocket.CONNECTING) {
      throw new Error("WebSocket is not open: readyState 0 (CONNECTING)");
    }
    if (typeof options === "function") {
      cb = options;
      options = {};
    }
    if (typeof data === "number")
      data = data.toString();
    if (this.readyState !== WebSocket.OPEN) {
      sendAfterClose(this, data, cb);
      return;
    }
    const opts = {
      binary: typeof data !== "string",
      mask: !this._isServer,
      compress: true,
      fin: true,
      ...options
    };
    if (!this._extensions[permessage_deflate_default.extensionName]) {
      opts.compress = false;
    }
    this._sender.send(data || EMPTY_BUFFER, opts, cb);
  }
  terminate() {
    if (this.readyState === WebSocket.CLOSED)
      return;
    if (this.readyState === WebSocket.CONNECTING) {
      const msg = "WebSocket was closed before the connection was established";
      return abortHandshake(this, this._req, msg);
    }
    if (this._socket) {
      this._readyState = WebSocket.CLOSING;
      this._socket.destroy();
    }
  }
};
Object.defineProperty(WebSocket, "CONNECTING", {
  enumerable: true,
  value: readyStates.indexOf("CONNECTING")
});
Object.defineProperty(WebSocket.prototype, "CONNECTING", {
  enumerable: true,
  value: readyStates.indexOf("CONNECTING")
});
Object.defineProperty(WebSocket, "OPEN", {
  enumerable: true,
  value: readyStates.indexOf("OPEN")
});
Object.defineProperty(WebSocket.prototype, "OPEN", {
  enumerable: true,
  value: readyStates.indexOf("OPEN")
});
Object.defineProperty(WebSocket, "CLOSING", {
  enumerable: true,
  value: readyStates.indexOf("CLOSING")
});
Object.defineProperty(WebSocket.prototype, "CLOSING", {
  enumerable: true,
  value: readyStates.indexOf("CLOSING")
});
Object.defineProperty(WebSocket, "CLOSED", {
  enumerable: true,
  value: readyStates.indexOf("CLOSED")
});
Object.defineProperty(WebSocket.prototype, "CLOSED", {
  enumerable: true,
  value: readyStates.indexOf("CLOSED")
});
[
  "binaryType",
  "bufferedAmount",
  "extensions",
  "protocol",
  "readyState",
  "url"
].forEach((property) => {
  Object.defineProperty(WebSocket.prototype, property, { enumerable: true });
});
["open", "error", "close", "message"].forEach((method) => {
  Object.defineProperty(WebSocket.prototype, `on${method}`, {
    enumerable: true,
    get() {
      for (const listener of this.listeners(method)) {
        if (listener[kForOnEventAttribute])
          return listener[kListener];
      }
      return null;
    },
    set(handler) {
      for (const listener of this.listeners(method)) {
        if (listener[kForOnEventAttribute]) {
          this.removeListener(method, listener);
          break;
        }
      }
      if (typeof handler !== "function")
        return;
      this.addEventListener(method, handler, {
        [kForOnEventAttribute]: true
      });
    }
  });
});
WebSocket.prototype.addEventListener = addEventListener;
WebSocket.prototype.removeEventListener = removeEventListener;
function initAsClient(websocket, address, protocols, options) {
  const opts = {
    protocolVersion: protocolVersions[1],
    maxPayload: 100 * 1024 * 1024,
    skipUTF8Validation: false,
    perMessageDeflate: true,
    followRedirects: false,
    maxRedirects: 10,
    ...options,
    createConnection: void 0,
    socketPath: void 0,
    hostname: void 0,
    protocol: void 0,
    timeout: void 0,
    method: void 0,
    host: void 0,
    path: void 0,
    port: void 0
  };
  if (!protocolVersions.includes(opts.protocolVersion)) {
    throw new RangeError(`Unsupported protocol version: ${opts.protocolVersion} (supported versions: ${protocolVersions.join(", ")})`);
  }
  let parsedUrl;
  if (address instanceof URL2) {
    parsedUrl = address;
    websocket._url = address.href;
  } else {
    try {
      parsedUrl = new URL2(address);
    } catch (e) {
      throw new SyntaxError(`Invalid URL: ${address}`);
    }
    websocket._url = address;
  }
  const isSecure = parsedUrl.protocol === "wss:";
  const isUnixSocket = parsedUrl.protocol === "ws+unix:";
  if (parsedUrl.protocol !== "ws:" && !isSecure && !isUnixSocket) {
    throw new SyntaxError(`The URL's protocol must be one of "ws:", "wss:", or "ws+unix:"`);
  }
  if (isUnixSocket && !parsedUrl.pathname) {
    throw new SyntaxError("The URL's pathname is empty");
  }
  if (parsedUrl.hash) {
    throw new SyntaxError("The URL contains a fragment identifier");
  }
  const defaultPort = isSecure ? 443 : 80;
  const key = randomBytes(16).toString("base64");
  const get = isSecure ? https.get : http.get;
  const protocolSet = new Set();
  let perMessageDeflate;
  opts.createConnection = isSecure ? tlsConnect : netConnect;
  opts.defaultPort = opts.defaultPort || defaultPort;
  opts.port = parsedUrl.port || defaultPort;
  opts.host = parsedUrl.hostname.startsWith("[") ? parsedUrl.hostname.slice(1, -1) : parsedUrl.hostname;
  opts.headers = {
    "Sec-WebSocket-Version": opts.protocolVersion,
    "Sec-WebSocket-Key": key,
    Connection: "Upgrade",
    Upgrade: "websocket",
    ...opts.headers
  };
  opts.path = parsedUrl.pathname + parsedUrl.search;
  opts.timeout = opts.handshakeTimeout;
  if (opts.perMessageDeflate) {
    perMessageDeflate = new permessage_deflate_default(opts.perMessageDeflate !== true ? opts.perMessageDeflate : {}, false, opts.maxPayload);
    opts.headers["Sec-WebSocket-Extensions"] = format({
      [permessage_deflate_default.extensionName]: perMessageDeflate.offer()
    });
  }
  if (protocols.length) {
    for (const protocol of protocols) {
      if (typeof protocol !== "string" || !subprotocolRegex.test(protocol) || protocolSet.has(protocol)) {
        throw new SyntaxError("An invalid or duplicated subprotocol was specified");
      }
      protocolSet.add(protocol);
    }
    opts.headers["Sec-WebSocket-Protocol"] = protocols.join(",");
  }
  if (opts.origin) {
    if (opts.protocolVersion < 13) {
      opts.headers["Sec-WebSocket-Origin"] = opts.origin;
    } else {
      opts.headers.Origin = opts.origin;
    }
  }
  if (parsedUrl.username || parsedUrl.password) {
    opts.auth = `${parsedUrl.username}:${parsedUrl.password}`;
  }
  if (isUnixSocket) {
    const parts = opts.path.split(":");
    opts.socketPath = parts[0];
    opts.path = parts[1];
  }
  let req = websocket._req = get(opts);
  if (opts.timeout) {
    req.on("timeout", () => {
      abortHandshake(websocket, req, "Opening handshake has timed out");
    });
  }
  req.on("error", (err) => {
    if (req === null || req.aborted)
      return;
    req = websocket._req = null;
    websocket._readyState = WebSocket.CLOSING;
    websocket.emit("error", err);
    websocket.emitClose();
  });
  req.on("response", (res) => {
    const location = res.headers.location;
    const statusCode = res.statusCode;
    if (location && opts.followRedirects && statusCode >= 300 && statusCode < 400) {
      if (++websocket._redirects > opts.maxRedirects) {
        abortHandshake(websocket, req, "Maximum redirects exceeded");
        return;
      }
      req.abort();
      const addr = new URL2(location, address);
      initAsClient(websocket, addr, protocols, options);
    } else if (!websocket.emit("unexpected-response", req, res)) {
      abortHandshake(websocket, req, `Unexpected server response: ${res.statusCode}`);
    }
  });
  req.on("upgrade", (res, socket, head) => {
    websocket.emit("upgrade", res);
    if (websocket.readyState !== WebSocket.CONNECTING)
      return;
    req = websocket._req = null;
    const digest = createHash("sha1").update(key + GUID).digest("base64");
    if (res.headers["sec-websocket-accept"] !== digest) {
      abortHandshake(websocket, socket, "Invalid Sec-WebSocket-Accept header");
      return;
    }
    const serverProt = res.headers["sec-websocket-protocol"];
    let protError;
    if (serverProt !== void 0) {
      if (!protocolSet.size) {
        protError = "Server sent a subprotocol but none was requested";
      } else if (!protocolSet.has(serverProt)) {
        protError = "Server sent an invalid subprotocol";
      }
    } else if (protocolSet.size) {
      protError = "Server sent no subprotocol";
    }
    if (protError) {
      abortHandshake(websocket, socket, protError);
      return;
    }
    if (serverProt)
      websocket._protocol = serverProt;
    const secWebSocketExtensions = res.headers["sec-websocket-extensions"];
    if (secWebSocketExtensions !== void 0) {
      if (!perMessageDeflate) {
        const message = "Server sent a Sec-WebSocket-Extensions header but no extension was requested";
        abortHandshake(websocket, socket, message);
        return;
      }
      let extensions;
      try {
        extensions = parse(secWebSocketExtensions);
      } catch (err) {
        const message = "Invalid Sec-WebSocket-Extensions header";
        abortHandshake(websocket, socket, message);
        return;
      }
      const extensionNames = Object.keys(extensions);
      if (extensionNames.length !== 1 || extensionNames[0] !== permessage_deflate_default.extensionName) {
        const message = "Server indicated an extension that was not requested";
        abortHandshake(websocket, socket, message);
        return;
      }
      try {
        perMessageDeflate.accept(extensions[permessage_deflate_default.extensionName]);
      } catch (err) {
        const message = "Invalid Sec-WebSocket-Extensions header";
        abortHandshake(websocket, socket, message);
        return;
      }
      websocket._extensions[permessage_deflate_default.extensionName] = perMessageDeflate;
    }
    websocket.setSocket(socket, head, {
      maxPayload: opts.maxPayload,
      skipUTF8Validation: opts.skipUTF8Validation
    });
  });
}
function netConnect(options) {
  options.path = options.socketPath;
  return net2.connect(options);
}
function tlsConnect(options) {
  options.path = void 0;
  if (!options.servername && options.servername !== "") {
    options.servername = net2.isIP(options.host) ? "" : options.host;
  }
  return tls2.connect(options);
}
function abortHandshake(websocket, stream4, message) {
  websocket._readyState = WebSocket.CLOSING;
  const err = new Error(message);
  Error.captureStackTrace(err, abortHandshake);
  if (stream4.setHeader) {
    stream4.abort();
    if (stream4.socket && !stream4.socket.destroyed) {
      stream4.socket.destroy();
    }
    stream4.once("abort", websocket.emitClose.bind(websocket));
    websocket.emit("error", err);
  } else {
    stream4.destroy(err);
    stream4.once("error", websocket.emit.bind(websocket, "error"));
    stream4.once("close", websocket.emitClose.bind(websocket));
  }
}
function sendAfterClose(websocket, data, cb) {
  if (data) {
    const length = toBuffer(data).length;
    if (websocket._socket)
      websocket._sender._bufferedBytes += length;
    else
      websocket._bufferedAmount += length;
  }
  if (cb) {
    const err = new Error(`WebSocket is not open: readyState ${websocket.readyState} (${readyStates[websocket.readyState]})`);
    cb(err);
  }
}
function receiverOnConclude(code, reason) {
  const websocket = this[kWebSocket];
  websocket._closeFrameReceived = true;
  websocket._closeMessage = reason;
  websocket._closeCode = code;
  if (websocket._socket[kWebSocket] === void 0)
    return;
  websocket._socket.removeListener("data", socketOnData);
  process.nextTick(resume, websocket._socket);
  if (code === 1005)
    websocket.close();
  else
    websocket.close(code, reason);
}
function receiverOnDrain() {
  this[kWebSocket]._socket.resume();
}
function receiverOnError(err) {
  const websocket = this[kWebSocket];
  if (websocket._socket[kWebSocket] !== void 0) {
    websocket._socket.removeListener("data", socketOnData);
    process.nextTick(resume, websocket._socket);
    websocket.close(err[kStatusCode]);
  }
  websocket.emit("error", err);
}
function receiverOnFinish() {
  this[kWebSocket].emitClose();
}
function receiverOnMessage(data, isBinary) {
  this[kWebSocket].emit("message", data, isBinary);
}
function receiverOnPing(data) {
  const websocket = this[kWebSocket];
  websocket.pong(data, !websocket._isServer, NOOP);
  websocket.emit("ping", data);
}
function receiverOnPong(data) {
  this[kWebSocket].emit("pong", data);
}
function resume(stream4) {
  stream4.resume();
}
function socketOnClose() {
  const websocket = this[kWebSocket];
  this.removeListener("close", socketOnClose);
  this.removeListener("data", socketOnData);
  this.removeListener("end", socketOnEnd);
  websocket._readyState = WebSocket.CLOSING;
  let chunk;
  if (!this._readableState.endEmitted && !websocket._closeFrameReceived && !websocket._receiver._writableState.errorEmitted && (chunk = websocket._socket.read()) !== null) {
    websocket._receiver.write(chunk);
  }
  websocket._receiver.end();
  this[kWebSocket] = void 0;
  clearTimeout(websocket._closeTimer);
  if (websocket._receiver._writableState.finished || websocket._receiver._writableState.errorEmitted) {
    websocket.emitClose();
  } else {
    websocket._receiver.on("error", receiverOnFinish);
    websocket._receiver.on("finish", receiverOnFinish);
  }
}
function socketOnData(chunk) {
  if (!this[kWebSocket]._receiver.write(chunk)) {
    this.pause();
  }
}
function socketOnEnd() {
  const websocket = this[kWebSocket];
  websocket._readyState = WebSocket.CLOSING;
  websocket._receiver.end();
  this.end();
}
function socketOnError() {
  const websocket = this[kWebSocket];
  this.removeListener("error", socketOnError);
  this.on("error", NOOP);
  if (websocket) {
    websocket._readyState = WebSocket.CLOSING;
    this.destroy();
  }
}
var websocket_default = WebSocket;

// node_modules/ws-esm/ws-esm/lib/websocket-server.js
import EventEmitter2 from "events";
import http2 from "http";
import https2 from "https";
import net3 from "net";
import tls3 from "tls";
import { createHash as createHash2 } from "crypto";

// node_modules/ws-esm/ws-esm/lib/subprotocol.js
function parse2(header) {
  const protocols = new Set();
  let start = -1;
  let end = -1;
  let i = 0;
  for (i; i < header.length; i++) {
    const code = header.charCodeAt(i);
    if (end === -1 && tokenChars[code] === 1) {
      if (start === -1)
        start = i;
    } else if (i !== 0 && (code === 32 || code === 9)) {
      if (end === -1 && start !== -1)
        end = i;
    } else if (code === 44) {
      if (start === -1) {
        throw new SyntaxError(`Unexpected character at index ${i}`);
      }
      if (end === -1)
        end = i;
      const protocol2 = header.slice(start, end);
      if (protocols.has(protocol2)) {
        throw new SyntaxError(`The "${protocol2}" subprotocol is duplicated`);
      }
      protocols.add(protocol2);
      start = end = -1;
    } else {
      throw new SyntaxError(`Unexpected character at index ${i}`);
    }
  }
  if (start === -1 || end !== -1) {
    throw new SyntaxError("Unexpected end of input");
  }
  const protocol = header.slice(start, i);
  if (protocols.has(protocol)) {
    throw new SyntaxError(`The "${protocol}" subprotocol is duplicated`);
  }
  protocols.add(protocol);
  return protocols;
}
var subprotocol_default = {
  parse: parse2
};

// node_modules/ws-esm/ws-esm/lib/websocket-server.js
var keyRegex = /^[+/0-9A-Za-z]{22}==$/;
var RUNNING = 0;
var CLOSING = 1;
var CLOSED = 2;
var WebSocketServer = class extends EventEmitter2 {
  constructor(options, callback) {
    super();
    options = {
      maxPayload: 100 * 1024 * 1024,
      skipUTF8Validation: false,
      perMessageDeflate: false,
      handleProtocols: null,
      clientTracking: true,
      verifyClient: null,
      noServer: false,
      backlog: null,
      server: null,
      host: null,
      path: null,
      port: null,
      ...options
    };
    if (options.port == null && !options.server && !options.noServer || options.port != null && (options.server || options.noServer) || options.server && options.noServer) {
      throw new TypeError('One and only one of the "port", "server", or "noServer" options must be specified');
    }
    if (options.port != null) {
      this._server = http2.createServer((req, res) => {
        const body = http2.STATUS_CODES[426];
        res.writeHead(426, {
          "Content-Length": body.length,
          "Content-Type": "text/plain"
        });
        res.end(body);
      });
      this._server.listen(options.port, options.host, options.backlog, callback);
    } else if (options.server) {
      this._server = options.server;
    }
    if (this._server) {
      const emitConnection = this.emit.bind(this, "connection");
      this._removeListeners = addListeners(this._server, {
        listening: this.emit.bind(this, "listening"),
        error: this.emit.bind(this, "error"),
        upgrade: (req, socket, head) => {
          this.handleUpgrade(req, socket, head, emitConnection);
        }
      });
    }
    if (options.perMessageDeflate === true)
      options.perMessageDeflate = {};
    if (options.clientTracking) {
      this.clients = new Set();
      this._shouldEmitClose = false;
    }
    this.options = options;
    this._state = RUNNING;
  }
  address() {
    if (this.options.noServer) {
      throw new Error('The server is operating in "noServer" mode');
    }
    if (!this._server)
      return null;
    return this._server.address();
  }
  close(cb) {
    if (this._state === CLOSED) {
      if (cb) {
        this.once("close", () => {
          cb(new Error("The server is not running"));
        });
      }
      process.nextTick(emitClose, this);
      return;
    }
    if (cb)
      this.once("close", cb);
    if (this._state === CLOSING)
      return;
    this._state = CLOSING;
    if (this.options.noServer || this.options.server) {
      if (this._server) {
        this._removeListeners();
        this._removeListeners = this._server = null;
      }
      if (this.clients) {
        if (!this.clients.size) {
          process.nextTick(emitClose, this);
        } else {
          this._shouldEmitClose = true;
        }
      } else {
        process.nextTick(emitClose, this);
      }
    } else {
      const server = this._server;
      this._removeListeners();
      this._removeListeners = this._server = null;
      server.close(() => {
        emitClose(this);
      });
    }
  }
  shouldHandle(req) {
    if (this.options.path) {
      const index = req.url.indexOf("?");
      const pathname = index !== -1 ? req.url.slice(0, index) : req.url;
      if (pathname !== this.options.path)
        return false;
    }
    return true;
  }
  handleUpgrade(req, socket, head, cb) {
    socket.on("error", socketOnError2);
    const key = req.headers["sec-websocket-key"] !== void 0 ? req.headers["sec-websocket-key"] : false;
    const version = +req.headers["sec-websocket-version"];
    if (req.method !== "GET" || req.headers.upgrade.toLowerCase() !== "websocket" || !key || !keyRegex.test(key) || version !== 8 && version !== 13 || !this.shouldHandle(req)) {
      return abortHandshake2(socket, 400);
    }
    const secWebSocketProtocol = req.headers["sec-websocket-protocol"];
    let protocols = new Set();
    if (secWebSocketProtocol !== void 0) {
      try {
        protocols = subprotocol_default.parse(secWebSocketProtocol);
      } catch (err) {
        return abortHandshake2(socket, 400);
      }
    }
    const secWebSocketExtensions = req.headers["sec-websocket-extensions"];
    const extensions = {};
    if (this.options.perMessageDeflate && secWebSocketExtensions !== void 0) {
      const perMessageDeflate = new permessage_deflate_default(this.options.perMessageDeflate, true, this.options.maxPayload);
      try {
        const offers = extension_default.parse(secWebSocketExtensions);
        if (offers[permessage_deflate_default.extensionName]) {
          perMessageDeflate.accept(offers[permessage_deflate_default.extensionName]);
          extensions[permessage_deflate_default.extensionName] = perMessageDeflate;
        }
      } catch (err) {
        return abortHandshake2(socket, 400);
      }
    }
    if (this.options.verifyClient) {
      const info = {
        origin: req.headers[`${version === 8 ? "sec-websocket-origin" : "origin"}`],
        secure: !!(req.socket.authorized || req.socket.encrypted),
        req
      };
      if (this.options.verifyClient.length === 2) {
        this.options.verifyClient(info, (verified, code, message, headers) => {
          if (!verified) {
            return abortHandshake2(socket, code || 401, message, headers);
          }
          this.completeUpgrade(extensions, key, protocols, req, socket, head, cb);
        });
        return;
      }
      if (!this.options.verifyClient(info))
        return abortHandshake2(socket, 401);
    }
    this.completeUpgrade(extensions, key, protocols, req, socket, head, cb);
  }
  completeUpgrade(extensions, key, protocols, req, socket, head, cb) {
    if (!socket.readable || !socket.writable)
      return socket.destroy();
    if (socket[kWebSocket]) {
      throw new Error("server.handleUpgrade() was called more than once with the same socket, possibly due to a misconfiguration");
    }
    if (this._state > RUNNING)
      return abortHandshake2(socket, 503);
    const digest = createHash2("sha1").update(key + GUID).digest("base64");
    const headers = [
      "HTTP/1.1 101 Switching Protocols",
      "Upgrade: websocket",
      "Connection: Upgrade",
      `Sec-WebSocket-Accept: ${digest}`
    ];
    const ws2 = new websocket_default(null);
    if (protocols.size) {
      const protocol = this.options.handleProtocols ? this.options.handleProtocols(protocols, req) : protocols.values().next().value;
      if (protocol) {
        headers.push(`Sec-WebSocket-Protocol: ${protocol}`);
        ws2._protocol = protocol;
      }
    }
    if (extensions[permessage_deflate_default.extensionName]) {
      const params = extensions[permessage_deflate_default.extensionName].params;
      const value = extension_default.format({
        [permessage_deflate_default.extensionName]: [params]
      });
      headers.push(`Sec-WebSocket-Extensions: ${value}`);
      ws2._extensions = extensions;
    }
    this.emit("headers", headers, req);
    socket.write(headers.concat("\r\n").join("\r\n"));
    socket.removeListener("error", socketOnError2);
    ws2.setSocket(socket, head, {
      maxPayload: this.options.maxPayload,
      skipUTF8Validation: this.options.skipUTF8Validation
    });
    if (this.clients) {
      this.clients.add(ws2);
      ws2.on("close", () => {
        this.clients.delete(ws2);
        if (this._shouldEmitClose && !this.clients.size) {
          process.nextTick(emitClose, this);
        }
      });
    }
    cb(ws2, req);
  }
};
function addListeners(server, map) {
  for (const event of Object.keys(map))
    server.on(event, map[event]);
  return function removeListeners() {
    for (const event of Object.keys(map)) {
      server.removeListener(event, map[event]);
    }
  };
}
function emitClose(server) {
  server._state = CLOSED;
  server.emit("close");
}
function socketOnError2() {
  this.destroy();
}
function abortHandshake2(socket, code, message, headers) {
  if (socket.writable) {
    message = message || http2.STATUS_CODES[code];
    headers = {
      Connection: "close",
      "Content-Type": "text/html",
      "Content-Length": Buffer.byteLength(message),
      ...headers
    };
    socket.write(`HTTP/1.1 ${code} ${http2.STATUS_CODES[code]}\r
` + Object.keys(headers).map((h) => `${h}: ${headers[h]}`).join("\r\n") + "\r\n\r\n" + message);
  }
  socket.removeListener("error", socketOnError2);
  socket.destroy();
}
var websocket_server_default = WebSocketServer;

// node_modules/ws-esm/ws-esm/lib/stream.js
import stream3 from "stream";

// server/src/ws-server/class.ts
import http3 from "http";

// server/src/utils/uuidv4.ts
var rnds = new Array(16);
var rng = function() {
  for (let i = 0, r; i < 16; i++) {
    if ((i & 3) === 0)
      r = Math.random() * 4294967296;
    rnds[i] = r >>> ((i & 3) << 3) & 255;
  }
  return rnds;
};
var byteToHex = [];
for (let i = 0; i < 256; ++i) {
  byteToHex.push((i + 256).toString(16).substr(1));
}
function bytesToUuid(buf, offset_) {
  const offset = offset_ || 0;
  return (byteToHex[buf[offset + 0]] + byteToHex[buf[offset + 1]] + byteToHex[buf[offset + 2]] + byteToHex[buf[offset + 3]] + "-" + byteToHex[buf[offset + 4]] + byteToHex[buf[offset + 5]] + "-" + byteToHex[buf[offset + 6]] + byteToHex[buf[offset + 7]] + "-" + byteToHex[buf[offset + 8]] + byteToHex[buf[offset + 9]] + "-" + byteToHex[buf[offset + 10]] + byteToHex[buf[offset + 11]] + byteToHex[buf[offset + 12]] + byteToHex[buf[offset + 13]] + byteToHex[buf[offset + 14]] + byteToHex[buf[offset + 15]]).toLowerCase();
}
var v4 = (options, buf, offset) => {
  options = options || {};
  const rnds2 = options.random || (options.rng || rng)();
  rnds2[6] = rnds2[6] & 15 | 64;
  rnds2[8] = rnds2[8] & 63 | 128;
  if (buf) {
    offset = offset || 0;
    for (let i = 0; i < 16; ++i) {
      buf[offset + i] = rnds2[i];
    }
    return buf;
  }
  return bytesToUuid(rnds2);
};
var uuidv4_default = v4;

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

// server/src/ws-server/class.ts
var WSServer = class {
  log = create_default("WSServer");
  players = new Map();
  messageHandlers = new Set();
  wss;
  eventsManager;
  constructor(port, { events }) {
    this.log.log(`init server on port: ${port}...`);
    const server = new http3.Server();
    const wss = new websocket_server_default({
      noServer: true
    });
    this.eventsManager = this.initUserEvents(events);
    this.setupHttpEvents(server);
    this.setupWssEvents(wss);
    this.setupAltEvents();
    this.wss = wss;
    server.listen(port);
  }
  sendPlayer(player, eventName, ...args) {
    if (!player.valid)
      return;
    const message = this.eventsManager.send(eventName, args);
    const playerData = this.players.get(player.id);
    if (!playerData) {
      throw new Error("[sendPlayer] player wasnt added");
    }
    const { socket } = playerData;
    if (!socket) {
      throw new Error("[sendPlayer] player wasnt connected as ws");
    }
    socket.send(message, (err) => {
      this.log.log("[sendPlayer]", "socket.send cb err:");
      console.debug(err);
    });
  }
  addPlayer(player) {
    const { id } = player;
    if (this.players.has(id)) {
      throw new Error("player already added");
    }
    const authCode = this.generatePlayerAuthCode();
    this.players.set(id, {
      socket: null,
      authCode
    });
    this.log.log("[addPlayer]", `player id: ${player.id}`, "auth code:", authCode);
    return authCode;
  }
  addMessageHandler(handler) {
    this.messageHandlers.add(handler);
  }
  setupHttpEvents(server) {
    server.on("upgrade", this.onHttpUpgrade.bind(this));
    server.on("listening", this.onHttpListening.bind(this));
  }
  onHttpUpgrade(req, socket, head) {
    const { headers } = req;
    if (!headers)
      return this.abortHttpUpgrade(socket);
    const {
      playerid: playerId,
      authcode: authCode
    } = headers;
    this.log.log("[upgrade] headers:", "playerId:", playerId, "authCode:", authCode);
    if (!(playerId && authCode)) {
      this.log.warn("[upgrade] invalid headers");
      return this.abortHttpUpgrade(socket);
    }
    const intPlayerId = parseInt(playerId);
    if (isNaN(intPlayerId)) {
      this.log.warn("[upgrade]", `NaN player id: ${playerId}`);
      return this.abortHttpUpgrade(socket);
    }
    const playerData = this.players.get(intPlayerId);
    if (!playerData) {
      this.log.warn("[upgrade]", `invalid player id: ${playerId}`);
      return this.abortHttpUpgrade(socket);
    }
    if (playerData.authCode !== authCode) {
      this.log.warn("[upgrade]", `invalid auth code: ${authCode} (playerId: ${playerId})`);
      return this.abortHttpUpgrade(socket);
    }
    if (playerData.socket) {
      this.log.warn("[upgrade]", `socket already connected (playerId: ${playerId})`);
      return this.abortHttpUpgrade(socket);
    }
    this.acceptHttpUpgrade(req, socket, head);
  }
  abortHttpUpgrade(socket) {
    socket.destroy();
  }
  acceptHttpUpgrade(req, socket, head) {
    this.wss.handleUpgrade(req, socket, head, (ws2) => {
      this.wss.emit("connection", ws2, req);
    });
  }
  setupWssEvents(wss) {
    wss.on("connection", this.onConnection.bind(this));
    wss.on("error", this.onError.bind(this));
  }
  onHttpListening() {
    this.log.log("~gl~http server started listening");
  }
  onError(error2) {
    this.log.error(`[error] ${error2.stack}`);
  }
  onConnection(socket, { headers }) {
    const {
      playerid: playerId
    } = headers;
    if (playerId == null) {
      this.log.error("[connection]", `invalid playerId: ${playerId}`);
      return;
    }
    const intPlayerId = +playerId;
    const playerData = this.players.get(intPlayerId);
    if (!playerData) {
      this.log.error("[connection]", `invalid playerId ${playerId}: cannot get playerData`);
      return;
    }
    const player = Player.getByID(intPlayerId);
    if (!player) {
      this.log.error("[connection]", `invalid playerId: ${playerId} cannot find altv player`);
      return;
    }
    playerData.socket = socket;
    socket.on("message", this.onSocketMessage.bind(this, socket, intPlayerId, player));
    this.log.log(`~gl~successful connection~w~ player id: ${playerId}`);
  }
  onSocketMessage(socket, playerId, player, data, isBinary) {
    if (!player.valid) {
      this.log.warn("received socket message from disconnected player:", playerId);
      return;
    }
    this.log.log("[onSocketMessage]", new Date().getMilliseconds());
    this.log.log("[onSocketMessage]", `player: ${player.id}`, "type:", data?.constructor?.name ?? typeof data, "data:");
    console.debug(data, "bytes:", data.byteLength, Array.from(data), data.toString());
    for (const handler of this.messageHandlers) {
      handler(player, data);
    }
  }
  setupAltEvents() {
    on("playerDisconnect", this.onPlayerDisconnect.bind(this));
  }
  onPlayerDisconnect(player) {
    const { id } = player;
    const playerData = this.players.get(id);
    if (!playerData)
      return;
    this.players.delete(id);
    playerData.socket?.close();
  }
  initUserEvents(events) {
    const manager = new MessageEventsManager(events);
    this.addMessageHandler((player, raw) => {
      manager.receive(raw.toString(), [player]);
    });
    return manager;
  }
  generatePlayerAuthCode() {
    return uuidv4_default();
  }
};

// server/src/streamer/streamer.worker.ts
import { Worker } from "worker_threads";
function ExportedWorker() {
  return new Worker(new URL("./streamer.worker.js", import.meta.url));
}

// server/src/streamer/class.ts
var Streamer = class {
  worker = new ExportedWorker();
  entities = new Set();
  log = create_default("altv-xsync-entity:streamer");
  constructor() {
    this.worker.on("message", (value) => {
      this.log.log("worker message:");
      console.log(value);
    });
  }
};

// server/src/internal-xsync-entity/class.ts
var _InternalXSyncEntity = class {
  constructor(websocketPort) {
    this.websocketPort = websocketPort;
    this.wss = new WSServer(websocketPort, {
      events: {}
    });
    if (_InternalXSyncEntity._instance) {
      throw new Error("InternalXSyncEntity already initialized");
    }
    _InternalXSyncEntity._instance = this;
  }
  static get instance() {
    const { _instance } = this;
    if (!_instance) {
      throw new Error("InternalXSyncEntity has not been initialized yet");
    }
    return _instance;
  }
  wss;
  idProvider = new IdProvider();
  streamer = new Streamer();
};
var InternalXSyncEntity = _InternalXSyncEntity;
__publicField(InternalXSyncEntity, "_instance", null);

// server/src/xsync-entity/class.ts
var _XSyncEntity = class {
  constructor(websocketPort = 7700) {
    this.websocketPort = websocketPort;
    this.internal = new InternalXSyncEntity(websocketPort);
    if (_XSyncEntity._instance) {
      throw new Error("XSyncEntity already initialized");
    }
    _XSyncEntity._instance = this;
  }
  internal;
};
var XSyncEntity = _XSyncEntity;
__publicField(XSyncEntity, "_instance", null);

// server/src/internal-entity/class.ts
var InternalEntity = class {
  constructor(publicInstance, id, pos, dimension = 0, streamRange = 300, migrationRange = streamRange / 2) {
    this.publicInstance = publicInstance;
    this.id = id;
    this.pos = pos;
    this.dimension = dimension;
    this.streamRange = streamRange;
    this.migrationRange = migrationRange;
  }
};

// server/src/entity/class.ts
var Entity = class {
  constructor(type, pos, dimension, streamRange, migrationRange) {
    this.type = type;
    this.pos = pos;
    this.dimension = dimension;
    this.streamRange = streamRange;
    this.migrationRange = migrationRange;
    const { instance } = InternalXSyncEntity;
    this.internalInstance = new InternalEntity(this, instance.idProvider.getNext(), pos, dimension, streamRange, migrationRange);
  }
  internalInstance;
};
export {
  Entity,
  XSyncEntity
};
