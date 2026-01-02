export class BoardRepository {
  private boardCount: number = 0;

  public getBoardCount(): number {
    return this.boardCount;
  }

  public incrementBoardCount(): void {
    this.boardCount++;
  }
}
