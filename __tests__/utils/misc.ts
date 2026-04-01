import { act } from '@testing-library/react';
import type { ReactElement, Ref } from 'react';
import { flushSync } from 'react-dom';
import type {
  FixedSizeList,
  FixedSizeListProps,
  VariableSizeList,
  VariableSizeListProps,
} from 'react-window';
import { vi, type Mock } from 'vitest';
import type {
  NodeData,
  NodePublicState,
  TypedListChildComponentData,
} from '../../src/Tree';
import type {
  RequestIdleCallbackDeadline,
  RequestIdleCallbackHandle,
  RequestIdleCallbackOptions,
} from '../../src/utils';

type DeadlineConfig = Readonly<{
  didTimeout?: boolean;
  timeRemaining?: readonly number[] | (() => number);
}>;

type MockIdleTask = Readonly<{
  callback: IdleRequestCallback;
  id: RequestIdleCallbackHandle;
  options?: RequestIdleCallbackOptions;
}>;

export type MockIdleTick = Readonly<{
  id: RequestIdleCallbackHandle;
  options?: RequestIdleCallbackOptions;
}>;

type InstallMockRequestIdleCallbackOptions = Readonly<{
  defaultDeadline?: DeadlineConfig;
}>;

const DEFAULT_TIME_REMAINING = [1, 0] as const;

const createTimeRemaining = (
  source: DeadlineConfig['timeRemaining'] = DEFAULT_TIME_REMAINING,
): RequestIdleCallbackDeadline['timeRemaining'] => {
  if (typeof source === 'function') {
    return source;
  }

  const values = [...source];
  let index = 0;

  return () => {
    const value = values[index] ?? values[0] ?? 0;
    index += 1;

    return value;
  };
};

const createDeadline = (
  config: DeadlineConfig = {},
): RequestIdleCallbackDeadline => ({
  didTimeout: config.didTimeout ?? false,
  timeRemaining: createTimeRemaining(config.timeRemaining),
});

export type RequestIdleCallback = typeof window.requestIdleCallback;
export type CancelIdleCallback = typeof window.cancelIdleCallback;
export type FixedSizeListMock<TData> = Mock<
  (
    _: FixedSizeListProps<TData>,
    ref: Ref<Partial<FixedSizeList>>,
  ) => ReactElement
>;
export type VariableSizeListMock<TData> = Mock<
  (
    _: VariableSizeListProps<TData>,
    ref: Ref<Partial<VariableSizeList>>,
  ) => ReactElement
>;
export type ListMock<TData> =
  | FixedSizeListMock<TData>
  | VariableSizeListMock<TData>;

export const getLastListProps = <TData>(
  mock: ListMock<TData>,
): FixedSizeListProps<TData> | VariableSizeListProps<TData> | undefined =>
  mock.mock.lastCall?.[0];

export const getLastRecords = <
  TData extends NodeData,
  TNodePublicState extends NodePublicState<TData>,
>(
  mock: ListMock<TypedListChildComponentData<TData, TNodePublicState>>,
): readonly TNodePublicState[] | undefined => {
  const { itemData, itemCount } = getLastListProps(mock) ?? {};

  if (!itemData) {
    return undefined;
  }

  return Array.from({ length: itemCount ?? 0 }, (_, i) =>
    itemData.getRecordData(i),
  );
};

export const getLastItemKeys = <TData>(
  mock: ListMock<TData>,
): readonly string[] | undefined => {
  const { itemKey, itemData, itemCount } = getLastListProps(mock) ?? {};

  if (!itemKey || itemData === undefined) {
    return undefined;
  }

  return Array.from(
    { length: itemCount ?? 0 },
    // oxlint-disable-next-line typescript/no-unsafe-type-assertion
    (_, i) => itemKey(i, itemData) as string,
  );
};

export async function applyComponentUpdate(
  update: () => Promise<void>,
): Promise<void> {
  let result!: Promise<void>;

  flushSync(() => {
    result = update();
  });

  await result;
}

export class MockRequestIdleCallbackController implements AsyncIterableIterator<MockIdleTick> {
  static install({
    defaultDeadline = {},
  }: InstallMockRequestIdleCallbackOptions = {}): MockRequestIdleCallbackController {
    const controller = new MockRequestIdleCallbackController(defaultDeadline);

    vi.stubGlobal('requestIdleCallback', controller.requestIdleCallback);
    vi.stubGlobal('cancelIdleCallback', controller.cancelIdleCallback);

    return controller;
  }

  readonly cancelIdleCallback: Mock<CancelIdleCallback> = vi.fn((handle) => {
    this.#pendingTasks.delete(handle);
  });

  readonly requestIdleCallback: Mock<RequestIdleCallback> = vi.fn(
    (callback, options) => {
      const id = this.#nextHandle;

      this.#nextHandle += 1;
      this.#pendingTasks.set(id, {
        callback,
        id,
        options,
      });
      this.#scheduledTaskIds.push(id);

      return id;
    },
  );

  readonly #originalCancelIdleCallback = window.cancelIdleCallback;
  readonly #originalRequestIdleCallback = window.requestIdleCallback;
  readonly #pendingTasks = new Map<RequestIdleCallbackHandle, MockIdleTask>();
  readonly #scheduledTaskIds: RequestIdleCallbackHandle[] = [];
  readonly #sharedDeadline: RequestIdleCallbackDeadline;

  #nextHandle = 1;

  constructor(defaultDeadline: DeadlineConfig = {}) {
    this.#sharedDeadline = createDeadline(defaultDeadline);
  }

  [Symbol.asyncIterator](): this {
    return this;
  }

  async drain(): Promise<readonly MockIdleTick[]> {
    const ticks: MockIdleTick[] = [];

    // oxlint-disable-next-line typescript/no-unnecessary-condition
    while (true) {
      const step = await this.next();

      if (step.done) {
        return ticks;
      }

      ticks.push(step.value);
    }
  }

  pendingCount(): number {
    return this.#scheduledTaskIds.reduce(
      (count, id) => count + Number(this.#pendingTasks.has(id)),
      0,
    );
  }

  restore(): void {
    vi.stubGlobal('requestIdleCallback', this.#originalRequestIdleCallback);
    vi.stubGlobal('cancelIdleCallback', this.#originalCancelIdleCallback);
    this.#pendingTasks.clear();
    this.#scheduledTaskIds.length = 0;
  }

  async next(): Promise<IteratorResult<MockIdleTick>> {
    while (this.#scheduledTaskIds.length > 0) {
      const id = this.#scheduledTaskIds.shift()!;
      const task = this.#pendingTasks.get(id);

      if (!task) {
        continue;
      }

      this.#pendingTasks.delete(id);

      // oxlint-disable-next-line typescript/require-await
      await act(async () => {
        task.callback(this.#sharedDeadline);
      });

      return {
        done: false,
        value: {
          id,
          options: task.options,
        },
      };
    }

    return {
      done: true,
      value: undefined,
    };
  }
}

export type TreeNode = Readonly<{
  children?: TreeNode[];
  id: string;
  name: string;
}>;

export const defaultTree: TreeNode = {
  children: [
    {
      children: [
        { id: 'foo-3', name: 'Foo #3' },
        { id: 'foo-4', name: 'Foo #4' },
      ],
      id: 'foo-2',
      name: 'Foo #2',
    },
    {
      children: [
        { id: 'foo-6', name: 'Foo #6' },
        { id: 'foo-7', name: 'Foo #7' },
      ],
      id: 'foo-5',
      name: 'Foo #5',
    },
  ],
  id: 'foo-1',
  name: 'Foo #1',
} as const;

function getLargeSetOfChildren() {
  const children = [];

  for (let i = 0; i < 100000; i++) {
    children.push({
      id: `largeNodeChild-${i + 1}`,
      name: `Large Node Child #${i + 1}`,
    });
  }

  return children;
}

export const treeWithLargeNode: TreeNode = {
  children: [
    {
      children: [
        { id: 'smallNodeChild-1', name: 'Small Node Child #1' },
        { id: 'smallNodeChild-2', name: 'Small Node Child #2' },
      ],
      id: 'smallNode-1',
      name: 'Small Node #1',
    },
    {
      children: getLargeSetOfChildren(),
      id: 'largeNode-1',
      name: 'Large Node #1',
    },
    {
      children: [
        { id: 'smallNodeChild-3', name: 'Small Node Child #3' },
        { id: 'smallNodeChild-4', name: 'Small Node Child #4' },
      ],
      id: 'smallNode-2',
      name: 'Small Node #2',
    },
  ],
  id: 'root-1',
  name: 'Root #1',
};
