import {mount, ReactWrapper} from 'enzyme';
import React, {FC} from 'react';
import {FixedSizeList} from 'react-window';
import {
  FixedSizeNodeData,
  FixedSizeNodePublicState,
  FixedSizeTree,
  FixedSizeTreeProps,
  FixedSizeTreeState,
  Row,
  TreeWalker,
  TreeWalkerValue,
} from '../src';
import {NodeComponentProps} from '../src/Tree';
import {defaultTree, extractReceivedRecords} from './utils/misc';

type TreeNode = Readonly<{
  children?: TreeNode[];
  id: string;
  name: string;
}>;

type NodeMeta = Readonly<{
  nestingLevel: number;
  node: TreeNode;
}>;

type ExtendedData = FixedSizeNodeData &
  Readonly<{
    name: string;
    nestingLevel: number;
  }>;

describe('Multiroot tree', () => {
  const Node: FC<NodeComponentProps<
    ExtendedData,
    FixedSizeNodePublicState<ExtendedData>
  >> = jest.fn(() => null);

  let component: ReactWrapper<
    FixedSizeTreeProps<ExtendedData>,
    FixedSizeTreeState<ExtendedData>,
    FixedSizeTree<ExtendedData>
  >;
  let treeRoots: readonly TreeNode[];
  let treeWalkerSpy: jest.Mock;
  let isOpenByDefault: boolean;

  const getNodeData = (
    node: TreeNode,
    nestingLevel: number,
  ): TreeWalkerValue<ExtendedData, NodeMeta> => ({
    data: {
      id: node.id.toString(),
      isOpenByDefault,
      name: node.name,
      nestingLevel,
    },
    nestingLevel,
    node,
  });

  function* treeWalker(): ReturnType<TreeWalker<ExtendedData, NodeMeta>> {
    for (let i = 0; i < treeRoots.length; i++) {
      yield getNodeData(treeRoots[i], 0);
    }

    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    while (true) {
      const parentMeta = yield;

      // eslint-disable-next-line @typescript-eslint/prefer-for-of
      if (parentMeta.node.children) {
        // eslint-disable-next-line @typescript-eslint/prefer-for-of
        for (let i = 0; i < parentMeta.node.children.length; i++) {
          yield getNodeData(
            parentMeta.node.children[i],
            parentMeta.nestingLevel + 1,
          );
        }
      }
    }
  }

  const mountComponent = (
    overriddenProps: Partial<FixedSizeTreeProps<ExtendedData>> = {},
  ): typeof component =>
    mount(
      <FixedSizeTree<ExtendedData>
        itemSize={30}
        treeWalker={treeWalkerSpy}
        height={500}
        width={500}
        {...overriddenProps}
      >
        {Node}
      </FixedSizeTree>,
    );

  beforeEach(() => {
    treeRoots = defaultTree.children;

    isOpenByDefault = true;

    treeWalkerSpy = jest.fn(treeWalker);

    component = mountComponent();
  });

  it('renders a component', () => {
    expect(component).not.toBeUndefined();
  });

  it('contains a list component', () => {
    const list = component.find(FixedSizeList);
    expect(list).toHaveLength(1);
    expect(list.props()).toMatchObject({
      children: Row,
      itemCount: 6,
      itemData: expect.any(Object),
      itemSize: 30,
    });

    expect(list.prop('itemData')).toMatchObject({
      component: Node,
      getRecordData: expect.any(Function),
    });

    expect(extractReceivedRecords(list)).toEqual([
      {
        data: {
          id: 'foo-2',
          isOpenByDefault: true,
          name: 'Foo #2',
          nestingLevel: 0,
        },
        isOpen: true,
        setOpen: expect.any(Function),
      },
      {
        data: {
          id: 'foo-3',
          isOpenByDefault: true,
          name: 'Foo #3',
          nestingLevel: 1,
        },
        isOpen: true,
        setOpen: expect.any(Function),
      },
      {
        data: {
          id: 'foo-4',
          isOpenByDefault: true,
          name: 'Foo #4',
          nestingLevel: 1,
        },
        isOpen: true,
        setOpen: expect.any(Function),
      },
      {
        data: {
          id: 'foo-5',
          isOpenByDefault: true,
          name: 'Foo #5',
          nestingLevel: 0,
        },
        isOpen: true,
        setOpen: expect.any(Function),
      },
      {
        data: {
          id: 'foo-6',
          isOpenByDefault: true,
          name: 'Foo #6',
          nestingLevel: 1,
        },
        isOpen: true,
        setOpen: expect.any(Function),
      },
      {
        data: {
          id: 'foo-7',
          isOpenByDefault: true,
          name: 'Foo #7',
          nestingLevel: 1,
        },
        isOpen: true,
        setOpen: expect.any(Function),
      },
    ]);
  });
});
