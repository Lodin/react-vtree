import {
  NodeComponentProps,
  NodeData,
  NodeRecord,
  TreeCreatorOptions,
  TreeState,
  UpdateOptions,
} from './Tree';

export type DefaultTreeCreatorOptions = TreeCreatorOptions<
  NodeComponentProps<NodeData>,
  NodeRecord<NodeData>,
  UpdateOptions,
  NodeData,
  TreeState<
    NodeComponentProps<NodeData>,
    NodeRecord<NodeData>,
    UpdateOptions,
    NodeData
  >
>;

export const identity = <T>(value: T): T => value;

export const createRecord: DefaultTreeCreatorOptions['createRecord'] = (
  data,
  {recomputeTree},
) => {
  const record = {
    data,
    isOpen: data.isOpenByDefault,
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

export const updateRecordOnWalk: DefaultTreeCreatorOptions['updateRecordOnWalk'] = (
  record,
  {useDefaultOpenness = false},
) => {
  if (useDefaultOpenness) {
    record.isOpen = record.data.isOpenByDefault;
  }
};
