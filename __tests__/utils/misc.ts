import {ReactWrapper} from 'enzyme';
import {
  NodeData,
  NodeRecordPublic,
  TypedListChildComponentData,
} from '../../src/Tree';

export const extractReceivedRecords = <
  TListProps,
  TData extends NodeData,
  TNodeRecordPublic extends NodeRecordPublic<TData>
>(
  cmp: ReactWrapper<TListProps>,
): readonly TNodeRecordPublic[] => {
  const itemData: TypedListChildComponentData<
    TData,
    TNodeRecordPublic
  > = cmp.prop('itemData');

  const itemCount: number = cmp.prop('itemCount');

  const {getRecordData} = itemData;
  const records = new Array(itemCount);

  for (let i = 0; i < itemCount; i++) {
    records[i] = getRecordData(i);
  }

  return records;
};

export const defaultTree = {
  children: [
    {
      children: [
        {id: 'foo-3', name: 'Foo #3'},
        {id: 'foo-4', name: 'Foo #4'},
      ],
      id: 'foo-2',
      name: 'Foo #2',
    },
    {
      children: [
        {id: 'foo-6', name: 'Foo #6'},
        {id: 'foo-7', name: 'Foo #7'},
      ],
      id: 'foo-5',
      name: 'Foo #5',
    },
  ],
  id: 'foo-1',
  name: 'Foo #1',
};
