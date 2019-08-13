import {shallow, ShallowWrapper} from 'enzyme';
import * as React from 'react';
import {ListChildComponentProps} from 'react-window';
import {FixedSizeNodeRecord, Row} from '../src';
import {CommonNodeData} from '../src/utils';

describe('Row component', () => {
  let data: CommonNodeData<{}>;
  let treeData: object;
  let order: readonly string[];
  let records: Record<string, FixedSizeNodeRecord<{}>>;
  let row: ShallowWrapper<ListChildComponentProps>;

  beforeEach(() => {
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

    // tslint:disable-next-line:naming-convention
    row = shallow(
      <Row
        data={{
          component: Node,
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
    const node = row.find(Node);
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
