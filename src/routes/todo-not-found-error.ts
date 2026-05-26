export class TodoNotFoundError extends Error {
  constructor(public readonly id: string) {
    super(`Could not find todo ${id}`);
    this.name = 'TodoNotFoundError';
  }
}
