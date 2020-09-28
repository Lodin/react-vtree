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
