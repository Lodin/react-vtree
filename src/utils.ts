import {
  NodeComponentProps,
  NodeData,
  NodeRecord,
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

export const createRecord: DefaultTreeCreatorOptions['createRecord'] = (
  data,
  {opennessState},
  {recomputeTree},
) => {
  const record = {
    data,
    isOpen: opennessState?.[data.id as string] ?? data.isOpenByDefault,
    toggle(): Promise<void> {
      record.isOpen = !record.isOpen;

      return recomputeTree({refreshNodes: record.isOpen});
    },
  };

  return record;
};

export const shouldUpdateRecords: DefaultTreeCreatorOptions['shouldUpdateRecords'] = ({
  opennessState,
  useDefaultOpenness = false,
}) => !!opennessState || useDefaultOpenness;

export const updateRecord: DefaultTreeCreatorOptions['updateRecord'] = (
  record,
  recordId,
  {opennessState, useDefaultOpenness = false},
) => {
  record.isOpen = useDefaultOpenness
    ? record.data.isOpenByDefault
    : opennessState?.[recordId as string] ?? record.isOpen;
};

export const updateRecordOnNewData: DefaultTreeCreatorOptions['updateRecordOnNewData'] = (
  record,
  {useDefaultOpenness = false},
) => {
  if (useDefaultOpenness) {
    record.isOpen = record.data.isOpenByDefault;
  }
};
