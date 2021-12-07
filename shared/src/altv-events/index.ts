export enum ClientOnServerEvents {
  AddPlayer = "xsyncEntity:addPlayer",
}

export interface IClientOnServerEvent {
  [ClientOnServerEvents.AddPlayer]: (authCode: string, serverUrl: string, serverPort: number) => void
}