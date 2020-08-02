import {shallow, ShallowWrapper} from 'enzyme';
import React, {FC} from 'react';
import {ListChildComponentProps} from 'react-window';
import {FixedSizeNodeRecord, Row} from '../src';
import {NodeComponentProps, NodeData} from '../src/Tree';

describe('Row component', () => {
  let component: FC<NodeComponentProps<NodeData>>;
  let data: NodeData;
  let treeData: object;
  let order: readonly string[];
  let records: Record<string, FixedSizeNodeRecord<NodeData>>;
  let row: ShallowWrapper<ListChildComponentProps>;

  beforeEach(() => {
    component = () => null;
    data = {} as any;
    treeData = {foo: 1};
    order = ['foo-1', 'foo-2', 'foo-3'];
    records = {
      'foo-1': {
        data,
        isOpen: true,
        toggle: jest.fn(),
      },
      'foo-2': {
        data,
        isOpen: true,
        toggle: jest.fn(),
      },
      'foo-3': {
        data,
        isOpen: true,
        toggle: jest.fn(),
      },
    };

    row = shallow(
      <Row
        data={{
          component,
          order,
          records,
          treeData,
        }}
        index={2}
        isScrolling
        style={{marginLeft: 10}}
      />,
    );
  });

  it('renders Node component', () => {
    const node = row.find(component);
    expect(node.props()).toMatchObject({
      data,
      isOpen: true,
      isScrolling: true,
      style: {marginLeft: 10},
      toggle: records['foo-3'].toggle,
      treeData,
    });
  });
});
