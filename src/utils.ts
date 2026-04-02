import type { FixedSizeList } from 'react-window';
import type {
  NodeData,
  NodePublicState,
  NodeRecord,
  TreeCreatorOptions,
  TreeProps,
  TreeState,
  TypedListChildComponentData,
} from './Tree.tsx';

export type Mutable<T> = {
  -readonly [P in keyof T]: T[P];
};

export type RequestIdleCallbackHandle = number;

export type RequestIdleCallbackOptions = IdleRequestOptions;

export type RequestIdleCallbackDeadline = IdleDeadline;

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

export const noop = (): void => {};

export const identity = <T>(value: T): T => value;

export const createBasicRecord = <
  TData extends NodeData,
  TNodePublicState extends NodePublicState<TData>,
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
  TNodePublicState extends NodePublicState<TData>,
>(
  index: number,
  { getRecordData }: TypedListChildComponentData<TData, TNodePublicState>,
): string => {
  const {
    data: { id },
  } = getRecordData(index);

  return id;
};
