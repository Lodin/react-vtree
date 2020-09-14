import {
  NodeComponentProps,
  NodeData,
  NodeRecord,
  NodeRecordConnections,
  TreeCreatorOptions,
  TreeProps,
  TreeState,
  UpdateOptions,
} from './Tree';

export type DefaultTreeProps = TreeProps<
  NodeComponentProps<NodeData>,
  NodeData
>;

export type DefaultTreeState = TreeState<
  NodeComponentProps<NodeData>,
  NodeRecord<NodeData>,
  UpdateOptions,
  NodeData
>;

export type DefaultTreeCreatorOptions = TreeCreatorOptions<
  NodeComponentProps<NodeData>,
  NodeRecord<NodeData>,
  UpdateOptions,
  NodeData,
  DefaultTreeState
>;

export const identity = <T>(value: T): T => value;

export const createConnections = <T extends NodeRecord<any>>(
  parent: T | null = null,
): NodeRecordConnections<T> => ({
  child: null,
  parent,
  sibling: null,
  visited: false,
});

export const createRecord: DefaultTreeCreatorOptions['createRecord'] = (
  {data, node},
  {recomputeTree},
  parent,
) => {
  const record = {
    connections: createConnections(parent),
    data,
    isOpen: data.isOpenByDefault,
    isShown: parent ? parent.isOpen : true,
    node,
    toggle(): Promise<void> {
      record.isOpen = !record.isOpen;

      return recomputeTree();
    },
  };

  return record;
};

export const updateRecord: DefaultTreeCreatorOptions['updateRecord'] = (
  record,
  {opennessState, useDefaultOpenness = false},
) => {
  record.isOpen = useDefaultOpenness
    ? record.data.isOpenByDefault
    : opennessState?.[record.data.id as string] ?? record.isOpen;

  const {parent} = record.connections;

  record.isShown = (parent?.isOpen && parent.isShown) ?? true;
};

export const NODE_PROCESSING_END = {msg: 'NODE_PROCESSING_END'} as const;

export const visitRecord = <T extends NodeRecord<any>>(record: T): T | null => {
  record.connections.visited = !!record.connections.child;

  return (record.connections.child ??
    record.connections.sibling ??
    record.connections.parent) as T | null;
};

export const revisitRecord = <T extends NodeRecord<any>>(
  record: T,
): T | null => {
  record.connections.visited = false;

  return (record.connections.sibling ?? record.connections.parent) as T | null;
};
