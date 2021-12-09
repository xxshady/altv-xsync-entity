import type * as alt from "alt-server"

export class Players {
  public readonly dict: Record<alt.Player["id"], alt.Player> = {}
  public readonly array: alt.Player[] = []

  public add (player: alt.Player): void {
    this.dict[player.id] = player
    this.array.push(player)
  }

  public remove (player: alt.Player): void {
    const idx = this.array.indexOf(player)

    if (idx === -1) return

    this.array.splice(idx, 1)
    delete this.dict[player.id]
  }

  public has (player: alt.Player): boolean {
    return !!this.dict[player.id]
  }
}