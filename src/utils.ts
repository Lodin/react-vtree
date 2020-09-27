import type {
  NodeData,
  NodeRecord,
  TreeCreatorOptions,
  TreeProps,
  TreeState,
  NodeRecordPublic,
} from './Tree';

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

export const createRecord: DefaultTreeCreatorOptions['createRecord'] = (
  data,
  {recomputeTree},
  parent = null,
) => {
  const record = {
    child: null,
    isShown: parent ? parent.public.isOpen : true,
    parent,
    public: {
      data,
      isOpen: data.isOpenByDefault,
      toggle: (): Promise<void> =>
        recomputeTree({
          [data.id]: !record.public.isOpen,
        }),
    },
    sibling: null,
    visited: false,
  };

  return record;
};

export const visitRecord = <T extends NodeRecord<any>>(record: T): T | null => {
  record.visited = !!record.child;

  return (record.child ?? record.sibling ?? record.parent) as T | null;
};

export const revisitRecord = <T extends NodeRecord<any>>(
  record: T,
): T | null => {
  record.visited = false;

  return (record.sibling ?? record.parent) as T | null;
};
