export class InternalEntity {
  constructor (
    public readonly id: number,
    public readonly pos: number,
    public readonly dimension = 0,
    public readonly streamRange = 300,
    public readonly migrationRange = streamRange / 2,
  ) {
  }
}