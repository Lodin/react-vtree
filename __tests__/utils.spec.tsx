import {shallow, ShallowWrapper} from 'enzyme';
import * as React from 'react';
import {ListChildComponentProps} from 'react-window';
import {FixedSizeNodeRecord, Row} from '../src';
import {CommonNodeMetadata} from '../src/utils';

describe('Row component', () => {
  let metadata: CommonNodeMetadata;
  let dataMock: object;
  let order: readonly string[];
  let records: Record<string, FixedSizeNodeRecord>;
  let row: ShallowWrapper<ListChildComponentProps>;

  beforeEach(() => {
    metadata = {} as any;
    dataMock = {foo: 1};
    order = ['foo-1', 'foo-2', 'foo-3'];
    records = {
      'foo-1': {
        isOpen: true,
        metadata,
        toggle: jest.fn(),
      },
      'foo-2': {
        isOpen: true,
        metadata,
        toggle: jest.fn(),
      },
      'foo-3': {
        isOpen: true,
        metadata,
        toggle: jest.fn(),
      },
    };

    // tslint:disable-next-line:naming-convention
    row = shallow(
      <Row
        data={{
          component: Node,
          data: dataMock,
          order,
          records,
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
      data: dataMock,
      isOpen: true,
      isScrolling: true,
      metadata,
      style: {marginLeft: 10},
      toggle: records['foo-3'].toggle,
    });
  });
});
