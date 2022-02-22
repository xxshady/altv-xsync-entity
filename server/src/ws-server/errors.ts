export class WSConnectTimeoutError extends Error {
  constructor (
    public readonly playerInfo: string | null,
  ) {
    super(`[WSConnectTimeoutError] player: ${playerInfo}`)
  }
}