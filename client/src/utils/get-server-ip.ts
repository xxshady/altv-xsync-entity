import * as alt from "alt-client"

export const getServerIp = (): string => {
  /**
   * alt.getServerIp() returns ip in ipv6 format
   * e.x. "::ffff:127.0.0.1"
   * but we need only 127.0.0.1
   */
  const rawIp = alt.getServerIp()

  return rawIp.slice(7)
}