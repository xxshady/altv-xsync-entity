import type * as alt from "alt-server"
import { Logger } from "altv-xsync-entity-shared"

export class Players {
  public readonly dict: Record<alt.Player["id"], alt.Player> = {}
  public readonly array: alt.Player[] = []

  private readonly log = new Logger("xsync:players")

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

  public removeInvalidBitch (invalidBitch: alt.Player) {
    const idx = this.array.indexOf(invalidBitch)
    if (idx === -1) return

    this.array.splice(idx, 1)

    for (const [idOfBitch, currentBitch] of Object.entries(this.dict)) {
      if (currentBitch !== invalidBitch) continue

      delete this.dict[+idOfBitch]
      this.log.error("removed invalid bitch under id:", idOfBitch)     
      break
    }
  }
}
