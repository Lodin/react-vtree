import {FixedSizeList} from 'react-window';
import type {
  NodeData,
  NodePublicState,
  NodeRecord,
  TreeCreatorOptions,
  TreeProps,
  TreeState,
  TypedListChildComponentData,
} from './Tree';

export type Mutable<T> = {
  -readonly [P in keyof T]: T[P];
};

export type RequestIdleCallbackHandle = any;

export type RequestIdleCallbackOptions = Readonly<{
  timeout: number;
}>;

export type RequestIdleCallbackDeadline = Readonly<{
  didTimeout: boolean;
  timeRemaining: () => number;
}>;

declare global {
  const requestIdleCallback: (
    callback: (deadline: RequestIdleCallbackDeadline) => void,
    opts?: RequestIdleCallbackOptions,
  ) => RequestIdleCallbackHandle;
  const cancelIdleCallback: (handle: RequestIdleCallbackHandle) => void;

  // eslint-disable-next-line @typescript-eslint/consistent-type-definitions
  interface Window {
    requestIdleCallback: typeof requestIdleCallback;
    cancelIdleCallback: typeof cancelIdleCallback;
  }
}

export type DefaultTreeProps = TreeProps<
  NodeData,
  NodePublicState<NodeData>,
  FixedSizeList
>;

export type DefaultTreeState = TreeState<
  NodeData,
  NodePublicState<NodeData>,
  FixedSizeList
>;

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
  isShown: parent ? parent.public.isOpen && parent.isShown : true,
  parent,
  public: pub,
  sibling: null,
  visited: false,
});

export const getIdByIndex = <
  TData extends NodeData,
  TNodePublicState extends NodePublicState<TData>
>(
  index: number,
  {getRecordData}: TypedListChildComponentData<TData, TNodePublicState>,
): string => {
  const {
    data: {id},
  } = getRecordData(index);

  return id;
};
