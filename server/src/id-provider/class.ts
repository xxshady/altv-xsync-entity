export class IdProvider {
  // will be used as stack
  private readonly freeIds: number[] = []
  private currentId = 0

  public getNext (): number {
    const freeId = this.freeIds.pop()

    if (freeId != null) return freeId

    return this.currentId++
  }

  public freeId (id: number): void {
    this.freeIds.push(id)
  }
}