import type * as alt from "alt-server"

export class Players {
  private readonly all: Set<alt.Player> = new Set()
  public readonly array: alt.Player[] = []

  public add (player: alt.Player): void {
    this.all.add(player)
    this.array.push(player)
  }

  public remove (player: alt.Player): void {
    const idx = this.array.indexOf(player)

    if (idx === -1) return

    this.array.splice(idx, 1)
    this.all.delete(player)
  }
}