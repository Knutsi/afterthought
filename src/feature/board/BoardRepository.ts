export class BoardRepository {
  private boardCount: number = 1;

  public getBoardCount(): number {
    return this.boardCount;
  }

  public incrementBoardCount(): void {
    this.boardCount += 1;
  }
}
