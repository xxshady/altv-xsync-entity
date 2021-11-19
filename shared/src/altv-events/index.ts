export enum ClientOnServerEvents {
  addPlayer = "xsyncEntity:addPlayer",
}

export interface IClientOnServerEvent {
  [ClientOnServerEvents.addPlayer]: (authCode: string, serverUrl: string) => void
}