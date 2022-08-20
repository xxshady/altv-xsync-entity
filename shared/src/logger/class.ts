import { Logger as XLogger } from "altv-xlogger"

export class Logger extends XLogger {
  constructor (name: string) {
    super(name, {
      logLevel: ___DEV_MODE ? "info" : "warn",
    })
  }
}
