export interface IWaitConnectPromise {
  promise: Promise<void>
  resolve: () => void
  reject: (error: Error) => void
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type EventsTypeAny = Record<any, any>

export interface IWebSocketOptions<TEvents extends EventsTypeAny> {
  events: TEvents
}

export type EventsType = Record<string, (...args: unknown[]) => void>