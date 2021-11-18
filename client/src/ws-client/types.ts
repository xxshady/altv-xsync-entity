export interface IWaitConnectPromise {
  promise: Promise<void>
  resolve: () => void
  reject: (error: Error) => void
}

export interface IWebSocketOptions {
  events: Record<string, (...args: unknown[]) => void>
}