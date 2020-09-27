import type {
  NodeData,
  NodeRecord,
  TreeCreatorOptions,
  TreeProps,
  TreeState,
  NodeRecordPublic,
} from './Tree';

export type Mutable<T> = {
  -readonly [P in keyof T]: T[P];
};

export type DefaultTreeProps = TreeProps<NodeData, NodeRecordPublic<NodeData>>;

export type DefaultTreeState = TreeState<NodeData, NodeRecordPublic<NodeData>>;

export type DefaultTreeCreatorOptions = TreeCreatorOptions<
  NodeData,
  NodeRecordPublic<NodeData>,
  DefaultTreeState
>;

// eslint-disable-next-line @typescript-eslint/no-empty-function
export const noop = (): void => {};

export const identity = <T>(value: T): T => value;

export const createBasicRecord = <
  TData extends NodeData,
  TNodeRecordPublic extends NodeRecordPublic<TData>
>(
  pub: TNodeRecordPublic,
  parent: NodeRecord<TNodeRecordPublic> | null = null,
): NodeRecord<TNodeRecordPublic> => ({
  child: null,
  isShown: parent ? parent.public.isOpen : true,
  parent,
  public: pub,
  sibling: null,
  visited: false,
});
