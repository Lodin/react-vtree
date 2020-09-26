import {mount, ReactWrapper} from 'enzyme';
import React, {FC} from 'react';
import {VariableSizeList} from 'react-window';
import {
  Row,
  TreeWalker,
  TreeWalkerYieldingValue,
  VariableSizeNodeData,
  VariableSizeNodeRecordPublic,
  VariableSizeTree,
  VariableSizeTreeProps,
  VariableSizeTreeState,
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

type ExtendedData = VariableSizeNodeData &
  Readonly<{
    name: string;
    nestingLevel: number;
  }>;

describe('VariableSizeTree', () => {
  const Node: FC<NodeComponentProps<
    ExtendedData,
    VariableSizeNodeRecordPublic<ExtendedData>
  >> = () => null;

  let component: ReactWrapper<
    VariableSizeTreeProps<ExtendedData>,
    VariableSizeTreeState<ExtendedData>,
    VariableSizeTree<ExtendedData>
  >;
  let tree: TreeNode;
  let treeWalkerSpy: jest.Mock;
  let defaultHeight: number;
  let isOpenByDefault: boolean;

  const getNodeData = (
    node: TreeNode,
    nestingLevel: number,
  ): TreeWalkerYieldingValue<ExtendedData, NodeMeta> => ({
    data: {
      defaultHeight,
      id: node.id.toString(),
      isOpenByDefault,
      name: node.name,
      nestingLevel,
    },
    meta: {nestingLevel, node},
  });

  function* treeWalker(): ReturnType<TreeWalker<ExtendedData, NodeMeta>> {
    yield getNodeData(tree, 0);

    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    while (true) {
      const parentMeta = yield;

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

    defaultHeight = 30;
    isOpenByDefault = true;

    treeWalkerSpy = jest.fn(treeWalker);

    component = mount(
      <VariableSizeTree<ExtendedData>
        treeWalker={treeWalkerSpy}
        height={500}
        width={500}
      >
        {Node}
      </VariableSizeTree>,
    );
  });

  it('renders a component', () => {
    expect(component).not.toBeUndefined();
  });

  it('contains a VariableSizeList component', () => {
    const list = component.find(VariableSizeList);
    expect(list).toHaveLength(1);
    expect(list.props()).toMatchObject({
      children: Row,
      itemCount: 7,
      itemData: expect.any(Object),
      itemSize: expect.any(Function),
    });

    const receivedRecords = extractReceivedRecords(list);

    expect(receivedRecords).toEqual([
      {
        data: {
          defaultHeight: 30,
          id: 'foo-1',
          isOpenByDefault: true,
          name: 'Foo #1',
          nestingLevel: 0,
        },
        height: 30,
        isOpen: true,
        resize: expect.any(Function),
        toggle: expect.any(Function),
      },
      {
        data: {
          defaultHeight: 30,
          id: 'foo-2',
          isOpenByDefault: true,
          name: 'Foo #2',
          nestingLevel: 1,
        },
        height: 30,
        isOpen: true,
        resize: expect.any(Function),
        toggle: expect.any(Function),
      },
      {
        data: {
          defaultHeight: 30,
          id: 'foo-3',
          isOpenByDefault: true,
          name: 'Foo #3',
          nestingLevel: 2,
        },
        height: 30,
        isOpen: true,
        resize: expect.any(Function),
        toggle: expect.any(Function),
      },
      {
        data: {
          defaultHeight: 30,
          id: 'foo-4',
          isOpenByDefault: true,
          name: 'Foo #4',
          nestingLevel: 2,
        },
        height: 30,
        isOpen: true,
        resize: expect.any(Function),
        toggle: expect.any(Function),
      },
      {
        data: {
          defaultHeight: 30,
          id: 'foo-5',
          isOpenByDefault: true,
          name: 'Foo #5',
          nestingLevel: 1,
        },
        height: 30,
        isOpen: true,
        resize: expect.any(Function),
        toggle: expect.any(Function),
      },
      {
        data: {
          defaultHeight: 30,
          id: 'foo-6',
          isOpenByDefault: true,
          name: 'Foo #6',
          nestingLevel: 2,
        },
        height: 30,
        isOpen: true,
        resize: expect.any(Function),
        toggle: expect.any(Function),
      },
      {
        data: {
          defaultHeight: 30,
          id: 'foo-7',
          isOpenByDefault: true,
          name: 'Foo #7',
          nestingLevel: 2,
        },
        height: 30,
        isOpen: true,
        resize: expect.any(Function),
        toggle: expect.any(Function),
      },
    ]);
  });

  it('allows providing custom row component', () => {
    const rowComponent = () => null;
    component = mount(
      <VariableSizeTree {...component.props()} rowComponent={rowComponent} />,
    );

    expect(component.find(VariableSizeList).prop('children')).toBe(
      rowComponent,
    );
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
    let treeInstance: VariableSizeTree<ExtendedData>;

    beforeEach(() => {
      treeInstance = component.instance();
    });

    describe('scrollTo', () => {
      let listInstance: VariableSizeList;

      beforeEach(() => {
        listInstance = component
          .find(VariableSizeList)
          .instance() as VariableSizeList;
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

      it('re-renders nodes after specific index', () => {
        const resetAfterIndexSpy = jest.spyOn(listInstance, 'resetAfterIndex');
        treeInstance.resetAfterId('foo-3', true);
        expect(resetAfterIndexSpy).toHaveBeenCalledWith(2, true);
      });
    });

    describe('recomputeTree', () => {
      it('changes the node openness state', async () => {
        await treeInstance.recomputeTree({'foo-1': false});
        component.update(); // Update the wrapper to get the latest changes

        expect(component.find(VariableSizeList).prop('itemCount')).toBe(1);

        const receivedRecords = extractReceivedRecords(
          component.find(VariableSizeList),
        );

        expect(receivedRecords).toEqual([
          {
            data: {
              defaultHeight: 30,
              id: 'foo-1',
              isOpenByDefault: true,
              name: 'Foo #1',
              nestingLevel: 0,
            },
            height: 30,
            isOpen: false,
            resize: expect.any(Function),
            toggle: expect.any(Function),
          },
        ]);
      });

      it('changes the nested node openness state', async () => {
        await treeInstance.recomputeTree({'foo-5': false});
        component.update(); // Update the wrapper to get the latest changes

        expect(component.find(VariableSizeList).prop('itemCount')).toBe(5);

        const receivedRecords = extractReceivedRecords(
          component.find(VariableSizeList),
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

        expect(component.find(VariableSizeList).prop('itemCount')).toBe(1);

        await treeInstance.recomputeTree({
          'foo-1': true,
          'foo-5': true,
        });
        component.update(); // Update the wrapper to get the latest changes

        expect(component.find(VariableSizeList).prop('itemCount')).toBe(5);

        const receivedRecords = extractReceivedRecords(
          component.find(VariableSizeList),
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
          component.find(VariableSizeList),
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
          component.find(VariableSizeList),
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
          component.find(VariableSizeList),
        );

        // @ts-expect-error: Test for non-typescript code.
        await treeInstance.recomputeTree('4');

        expect(
          extractReceivedRecords(component.find(VariableSizeList)),
        ).toEqual(originalRecords);
      });

      it('does nothing if record ID does not exist', async () => {
        const originalRecords = extractReceivedRecords(
          component.find(VariableSizeList),
        );

        await treeInstance.recomputeTree({
          'foo-42': false,
        });

        expect(
          extractReceivedRecords(component.find(VariableSizeList)),
        ).toEqual(originalRecords);
      });
    });

    it('provides a toggle function that changes openness state of the specific node', async () => {
      const [{toggle}] = extractReceivedRecords(
        component.find(VariableSizeList),
      );

      await toggle();
      component.update(); // Update the wrapper to get the latest changes

      const list = component.find(VariableSizeList);
      expect(list.prop('itemCount')).toBe(1);
      expect(extractReceivedRecords(list).map(({data: {id}}) => id)).toEqual([
        'foo-1',
      ]);
    });

    it('provides a resize function that changes height of the specific node', () => {
      const listInstance: VariableSizeList = component
        .find(VariableSizeList)
        .instance() as VariableSizeList;

      const resetAfterIndexSpy = jest.spyOn(listInstance, 'resetAfterIndex');
      const [, , foo3]: ReadonlyArray<VariableSizeNodeRecordPublic<
        ExtendedData
      >> = extractReceivedRecords(component.find(VariableSizeList));

      foo3.resize(100, true);

      expect(resetAfterIndexSpy).toHaveBeenCalledWith(2, true);
      expect(foo3.height).toBe(100);
    });
  });
});
