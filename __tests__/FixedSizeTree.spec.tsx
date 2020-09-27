import {mount, ReactWrapper} from 'enzyme';
import React, {FC} from 'react';
import {FixedSizeList} from 'react-window';
import {
  FixedSizeNodeData,
  FixedSizeNodeRecordPublic,
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

describe('FixedSizeTree', () => {
  const Node: FC<NodeComponentProps<
    ExtendedData,
    FixedSizeNodeRecordPublic<ExtendedData>
  >> = () => null;

  let component: ReactWrapper<
    FixedSizeTreeProps<ExtendedData>,
    FixedSizeTreeState<ExtendedData>,
    FixedSizeTree<ExtendedData>
  >;
  let tree: TreeNode;
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
    yield getNodeData(tree, 0);

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

  beforeEach(() => {
    tree = defaultTree;

    isOpenByDefault = true;

    treeWalkerSpy = jest.fn(treeWalker);

    component = mount(
      <FixedSizeTree<ExtendedData>
        itemSize={30}
        treeWalker={treeWalkerSpy}
        height={500}
        width={500}
      >
        {Node}
      </FixedSizeTree>,
    );
  });

  it('renders a component', () => {
    expect(component).not.toBeUndefined();
  });

  it('contains a FixedSizeList component', () => {
    const list = component.find(FixedSizeList);
    expect(list).toHaveLength(1);
    expect(list.props()).toMatchObject({
      children: Row,
      itemCount: 7,
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
          id: 'foo-1',
          isOpenByDefault: true,
          name: 'Foo #1',
          nestingLevel: 0,
        },
        isOpen: true,
        toggle: expect.any(Function),
      },
      {
        data: {
          id: 'foo-2',
          isOpenByDefault: true,
          name: 'Foo #2',
          nestingLevel: 1,
        },
        isOpen: true,
        toggle: expect.any(Function),
      },
      {
        data: {
          id: 'foo-3',
          isOpenByDefault: true,
          name: 'Foo #3',
          nestingLevel: 2,
        },
        isOpen: true,
        toggle: expect.any(Function),
      },
      {
        data: {
          id: 'foo-4',
          isOpenByDefault: true,
          name: 'Foo #4',
          nestingLevel: 2,
        },
        isOpen: true,
        toggle: expect.any(Function),
      },
      {
        data: {
          id: 'foo-5',
          isOpenByDefault: true,
          name: 'Foo #5',
          nestingLevel: 1,
        },
        isOpen: true,
        toggle: expect.any(Function),
      },
      {
        data: {
          id: 'foo-6',
          isOpenByDefault: true,
          name: 'Foo #6',
          nestingLevel: 2,
        },
        isOpen: true,
        toggle: expect.any(Function),
      },
      {
        data: {
          id: 'foo-7',
          isOpenByDefault: true,
          name: 'Foo #7',
          nestingLevel: 2,
        },
        isOpen: true,
        toggle: expect.any(Function),
      },
    ]);
  });

  it('allows providing custom row component', () => {
    const rowComponent = () => null;
    component = mount(
      <FixedSizeTree {...component.props()} rowComponent={rowComponent} />,
    );

    expect(component.find(FixedSizeList).prop('children')).toBe(rowComponent);
  });

  it('recomputes on new treeWalker', () => {
    treeWalkerSpy = jest.fn(treeWalker);

    component.setProps({
      treeWalker: treeWalkerSpy,
    });

    expect(treeWalkerSpy).toHaveBeenCalledWith();
  });

  it('does not recompute if treeWalker is the same', () => {
    treeWalkerSpy.mockClear();

    component.setProps({
      treeWalker: treeWalkerSpy,
    });

    expect(treeWalkerSpy).not.toHaveBeenCalled();
  });

  describe('component instance', () => {
    let treeInstance: FixedSizeTree<ExtendedData>;

    beforeEach(() => {
      treeInstance = component.instance();
    });

    describe('scrollTo', () => {
      let listInstance: FixedSizeList;

      beforeEach(() => {
        listInstance = component
          .find(FixedSizeList)
          .instance() as FixedSizeList;
      });

      it('can scroll to a specific offset', () => {
        const scrollToSpy = jest.spyOn(listInstance, 'scrollTo');
        treeInstance.scrollTo(200);
        expect(scrollToSpy).toHaveBeenCalledWith(200);
      });

      it('can scroll to an item', () => {
        const scrollToItemSpy = jest.spyOn(listInstance, 'scrollToItem');
        treeInstance.scrollToItem('foo-3', 'auto');
        expect(scrollToItemSpy).toHaveBeenCalledWith(2, 'auto');
      });
    });

    describe('recomputeTree', () => {
      it('changes the node openness state', async () => {
        await treeInstance.recomputeTree({'foo-1': false});
        component.update(); // Update the wrapper to get the latest changes

        expect(component.find(FixedSizeList).prop('itemCount')).toBe(1);

        const receivedRecords = extractReceivedRecords(
          component.find(FixedSizeList),
        );

        expect(receivedRecords).toEqual([
          {
            data: {
              id: 'foo-1',
              isOpenByDefault: true,
              name: 'Foo #1',
              nestingLevel: 0,
            },
            isOpen: false,
            toggle: expect.any(Function),
          },
        ]);
      });

      it('changes the nested node openness state', async () => {
        await treeInstance.recomputeTree({'foo-5': false});
        component.update(); // Update the wrapper to get the latest changes

        expect(component.find(FixedSizeList).prop('itemCount')).toBe(5);

        const receivedRecords = extractReceivedRecords(
          component.find(FixedSizeList),
        );

        expect(receivedRecords.map(({data: {id}}) => id)).toEqual([
          'foo-1',
          'foo-2',
          'foo-3',
          'foo-4',
          'foo-5',
        ]);
      });

      it("changes several nodes at once regardless of parent's openness", async () => {
        await treeInstance.recomputeTree({
          'foo-1': false,
          'foo-2': false,
          'foo-5': false,
        });
        component.update(); // Update the wrapper to get the latest changes

        expect(component.find(FixedSizeList).prop('itemCount')).toBe(1);

        await treeInstance.recomputeTree({
          'foo-1': true,
          'foo-5': true,
        });
        component.update(); // Update the wrapper to get the latest changes

        expect(component.find(FixedSizeList).prop('itemCount')).toBe(5);

        const receivedRecords = extractReceivedRecords(
          component.find(FixedSizeList),
        );

        expect(receivedRecords.map(({data: {id}}) => id)).toEqual([
          'foo-1',
          'foo-2',
          'foo-5',
          'foo-6',
          'foo-7',
        ]);
      });

      it('applies subtreeCallback for each element in the recomputed subtree', async () => {
        await treeInstance.recomputeTree({
          'foo-5': {
            open: true,
            // This function will close all tree nodes that are descendants of
            // `foo-5`
            subtreeCallback(node, root) {
              if (node !== root) {
                node.isOpen = false;
              }
            },
          },
        });
        component.update(); // Update the wrapper to get the latest changes

        const receivedRecords = extractReceivedRecords(
          component.find(FixedSizeList),
        );

        expect(receivedRecords.length).toBe(7);
        expect(receivedRecords.map(({isOpen}) => isOpen)).toEqual([
          true,
          true,
          true,
          true,
          // `foo-5` is open by { open: true }
          true,
          // `foo-5`'s children are closed by subtreeCallback
          false,
          false,
        ]);
      });

      it('allows overriding in definition order', async () => {
        await treeInstance.recomputeTree({
          // That will be overridden by `foo-1` subtreeCallback
          'foo-7': true,
          // eslint-disable-next-line sort-keys
          'foo-1': {
            open: true,
            subtreeCallback(node, root) {
              if (node !== root) {
                node.isOpen = false;
              }
            },
          },
          'foo-5': true,
          'foo-6': true,
        });

        const receivedRecords = extractReceivedRecords(
          component.find(FixedSizeList),
        );

        expect(receivedRecords.map(({isOpen}) => isOpen)).toEqual([
          true,
          false,
          false,
          false,
          // The `foo-5` and `foo-6` nodes are opened manually in recomputeTree
          true,
          true,
          false,
        ]);
      });

      it('does nothing if opennessState is not an object', async () => {
        const originalRecords = extractReceivedRecords(
          component.find(FixedSizeList),
        );

        // @ts-expect-error: Test for non-typescript code.
        await treeInstance.recomputeTree('4');

        expect(extractReceivedRecords(component.find(FixedSizeList))).toEqual(
          originalRecords,
        );
      });

      it('does nothing if record ID does not exist', async () => {
        const originalRecords = extractReceivedRecords(
          component.find(FixedSizeList),
        );

        await treeInstance.recomputeTree({
          'foo-42': false,
        });

        expect(extractReceivedRecords(component.find(FixedSizeList))).toEqual(
          originalRecords,
        );
      });
    });

    it('provides a toggle function that changes openness state of the specific node', async () => {
      const [{toggle}] = extractReceivedRecords(component.find(FixedSizeList));

      await toggle();
      component.update(); // Update the wrapper to get the latest changes

      const list = component.find(FixedSizeList);
      expect(list.prop('itemCount')).toBe(1);
      expect(extractReceivedRecords(list).map(({data: {id}}) => id)).toEqual([
        'foo-1',
      ]);
    });
  });
});
