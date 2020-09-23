import type {
  NodeComponentProps,
  NodeData,
  NodeRecord,
  TreeCreatorOptions,
  TreeProps,
  TreeState,
  NodeRecordPublic,
  OpennessStateOptions,
} from './Tree';

export type DefaultTreeProps = TreeProps<
  NodeComponentProps<NodeData>,
  NodeData
>;

export type DefaultTreeState = TreeState<
  NodeComponentProps<NodeData>,
  NodeRecordPublic<NodeData>,
  OpennessStateOptions,
  NodeData
>;

export type DefaultTreeCreatorOptions = TreeCreatorOptions<
  NodeComponentProps<NodeData>,
  NodeRecordPublic<NodeData>,
  OpennessStateOptions,
  NodeData,
  DefaultTreeState
>;

export const identity = <T>(value: T): T => value;

export const createRecord: DefaultTreeCreatorOptions['createRecord'] = (
  {data, meta},
  {recomputeTree},
  parent = null,
) => {
  const record = {
    child: null,
    isShown: parent ? parent.public.isOpen : true,
    meta,
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

export const updateRecord: DefaultTreeCreatorOptions['updateRecord'] = (
  record,
  id,
  {open, useDefaultOpenness = false},
) => {
  const {public: publicRecord, parent} = record;

  publicRecord.isOpen = useDefaultOpenness
    ? publicRecord.data.isOpenByDefault
    : id === publicRecord.data.id
    ? open
    : publicRecord.isOpen;

  record.isShown = parent ? parent.public.isOpen && parent.isShown : true;
};

export const NODE_PROCESSING_END = {msg: 'NODE_PROCESSING_END'} as const;

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

// eslint-disable-next-line @typescript-eslint/no-empty-function
export const noop = (): void => {};
