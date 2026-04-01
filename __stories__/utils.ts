export type AsyncTaskSchedulerFinalizeCallback<T> = (ids: readonly T[]) => void;

export class AsyncTaskScheduler<T> {
  readonly #aborters = new Set<() => void>();
  readonly #finalizeCallback: AsyncTaskSchedulerFinalizeCallback<T>;
  readonly #tasks = new Map<T, () => void>();

  constructor(finalizeCallback: AsyncTaskSchedulerFinalizeCallback<T>) {
    this.#finalizeCallback = finalizeCallback;
  }

  add(id: T, task: () => void, aborter: () => void): void {
    this.#tasks.set(id, task);
    this.#dropOthers();
    this.#aborters.add(aborter);
  }

  finalize(): void {
    this.#tasks.forEach((task) => task());

    this.#finalizeCallback(Array.from(this.#tasks.keys()));
  }

  #dropOthers(): void {
    this.#aborters.forEach((aborter) => aborter());
    this.#aborters.clear();
  }
}
