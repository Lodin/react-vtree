export type AsyncTaskSchedulerFinalizeCallback<T> = (ids: readonly T[]) => void;

export class AsyncTaskScheduler<T> {
  private readonly aborters: Set<() => void> = new Set();
  private readonly finalizeCallback: AsyncTaskSchedulerFinalizeCallback<T>;
  private readonly tasks: Map<T, () => void> = new Map();

  public constructor(finalizeCallback: AsyncTaskSchedulerFinalizeCallback<T>) {
    this.finalizeCallback = finalizeCallback;
  }

  public add(id: T, task: () => void, aborter: () => void): void {
    this.tasks.set(id, task);
    this.dropOthers();
    this.aborters.add(aborter);
  }

  public finalize(): void {
    this.tasks.forEach((task) => task());
    this.finalizeCallback([...this.tasks.keys()]);
  }

  private dropOthers(): void {
    this.aborters.forEach((aborter) => aborter());
    this.aborters.clear();
  }
}
