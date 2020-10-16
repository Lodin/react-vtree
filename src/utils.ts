import type {
  NodeData,
  NodeRecord,
  TreeCreatorOptions,
  TreeProps,
  TreeState,
  NodePublicState,
} from './Tree';

export type Mutable<T> = {
  -readonly [P in keyof T]: T[P];
};

export type DefaultTreeProps = TreeProps<NodeData, NodePublicState<NodeData>>;

export type DefaultTreeState = TreeState<NodeData, NodePublicState<NodeData>>;

export type DefaultTreeCreatorOptions = TreeCreatorOptions<
  NodeData,
  NodePublicState<NodeData>,
  DefaultTreeState
>;

// eslint-disable-next-line @typescript-eslint/no-empty-function
export const noop = (): void => {};

export const identity = <T>(value: T): T => value;

export const createBasicRecord = <
  TData extends NodeData,
  TNodePublicState extends NodePublicState<TData>
>(
  pub: TNodePublicState,
  parent: NodeRecord<TNodePublicState> | null = null,
): NodeRecord<TNodePublicState> => ({
  child: null,
  isShown: parent ? parent.public.isOpen : true,
  parent,
  public: pub,
  sibling: null,
  visited: false,
});

export const visitRecord = <T extends NodeRecord<any>>(record: T): T | null => {
  record.visited = record.child !== null;

  // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
  return (record.child !== null
    ? record.child
    : record.sibling !== null
    ? record.sibling
    : record.parent) as T | null;
};

export const revisitRecord = <T extends NodeRecord<any>>(
  record: T,
): T | null => {
  record.visited = false;

  // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
  return (record.sibling !== null ? record.sibling : record.parent) as T | null;
};

export type RequestIdleCallbackHandle = any;

export type RequestIdleCallbackOptions = {
  timeout: number;
};

export type RequestIdleCallbackDeadline = {
  readonly didTimeout: boolean;
  timeRemaining: () => number;
};

declare global {
  const requestIdleCallback: (
    callback: (deadline: RequestIdleCallbackDeadline) => void,
    opts?: RequestIdleCallbackOptions,
  ) => RequestIdleCallbackHandle;
  const cancelIdleCallback: (handle: RequestIdleCallbackHandle) => void;
}
