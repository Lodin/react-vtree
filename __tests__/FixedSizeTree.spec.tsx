import {mount, ReactWrapper} from 'enzyme';
import * as React from 'react';
import {FixedSizeList} from 'react-window';
import {Row} from '../src';
import FixedSizeTree, {
  FixedSizeNodeComponentProps,
  FixedSizeNodeMetadata,
  FixedSizeTreeProps,
  FixedSizeTreeState,
} from '../src/FixedSizeTree';

interface DataNode {
  children?: DataNode[];
  id: string;
  name: string;
}

interface StackElement {
  nestingLevel: number;
  node: DataNode;
}

describe('FixedSizeTree', () => {
  const Node: React.FunctionComponent<FixedSizeNodeComponentProps> = () => null;

  let component: ReactWrapper<
    FixedSizeTreeProps,
    FixedSizeTreeState,
    FixedSizeTree
  >;
  let tree: DataNode;
  let treeWalkerSpy: jest.Mock;
  let isOpenByDefault: boolean;

  beforeEach(() => {
    tree = {
      children: [{id: 'foo-2', name: 'Foo #2'}, {id: 'foo-3', name: 'Foo #3'}],
      id: 'foo-1',
      name: 'Foo #1',
    };

    isOpenByDefault = true;

    treeWalkerSpy = jest.fn(function*(
      refresh: boolean,
    ): IterableIterator<FixedSizeNodeMetadata | string | symbol> {
      const stack: StackElement[] = [];

      stack.push({
        nestingLevel: 0,
        node: tree,
      });

      while (stack.length !== 0) {
        const {node, nestingLevel} = stack.pop()!;
        const id = node.id.toString();

        const childrenCount = node.children ? node.children.length : 0;

        const isOpened = yield refresh
          ? {
              childrenCount,
              data: node.name,
              id,
              isOpenByDefault,
              nestingLevel,
            }
          : id;

        if (childrenCount && isOpened) {
          // tslint:disable-next-line:increment-decrement
          for (let i = childrenCount - 1; i >= 0; i--) {
            stack.push({
              nestingLevel: nestingLevel + 1,
              node: node.children![i],
            });
          }
        }
      }
    });

    component = mount(
      <FixedSizeTree
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
      itemCount: 3,
      itemData: {
        component: Node,
        order: ['foo-1', 'foo-2', 'foo-3'],
        records: {
          'foo-1': {
            isOpen: true,
            metadata: {
              childrenCount: 2,
              data: 'Foo #1',
              id: 'foo-1',
              isOpenByDefault: true,
              nestingLevel: 0,
            },
            toggle: expect.any(Function),
          },
          'foo-2': {
            isOpen: true,
            metadata: {
              childrenCount: 0,
              data: 'Foo #2',
              id: 'foo-2',
              isOpenByDefault: true,
              nestingLevel: 1,
            },
            toggle: expect.any(Function),
          },
          'foo-3': {
            isOpen: true,
            metadata: {
              childrenCount: 0,
              data: 'Foo #3',
              id: 'foo-3',
              isOpenByDefault: true,
              nestingLevel: 1,
            },
            toggle: expect.any(Function),
          },
        },
      },
      itemSize: 30,
    });
  });

  it('allows providing custom row component', () => {
    const rowComponent = () => null;
    component = mount(
      <FixedSizeTree {...component.props()} rowComponent={rowComponent} />,
    );

    expect(component.find(FixedSizeList).prop('children')).toBe(rowComponent);
  });

  describe('component instance', () => {
    let treeInstance: FixedSizeTree;

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
        const scrollToSpy = spyOn(listInstance, 'scrollTo');
        treeInstance.scrollTo(200);
        expect(scrollToSpy).toHaveBeenCalledWith(200);
      });

      it('can scroll to an item', () => {
        const scrollToItemSpy = spyOn(listInstance, 'scrollToItem');
        treeInstance.scrollToItem('foo-3', 'auto');
        expect(scrollToItemSpy).toHaveBeenCalledWith(2, 'auto');
      });
    });

    describe('recomputeTree', () => {
      it('updates tree order', async () => {
        tree = {
          children: [
            {id: 'foo-3', name: 'Foo #3'},
            {id: 'foo-2', name: 'Foo #2'},
          ],
          id: 'foo-1',
          name: 'Foo #1',
        };

        await treeInstance.recomputeTree({refreshNodes: false});
        component.update(); // update the wrapper to get the latest changes

        expect(component.find(FixedSizeList).prop('itemData')).toMatchObject({
          component: Node,
          data: undefined,
          order: ['foo-1', 'foo-3', 'foo-2'],
          records: {
            'foo-1': {
              isOpen: true,
              metadata: {
                childrenCount: 2,
                data: 'Foo #1',
                id: 'foo-1',
                isOpenByDefault: true,
                nestingLevel: 0,
              },
              toggle: expect.any(Function),
            },
            'foo-2': {
              isOpen: true,
              metadata: {
                childrenCount: 0,
                data: 'Foo #2',
                id: 'foo-2',
                isOpenByDefault: true,
                nestingLevel: 1,
              },
              toggle: expect.any(Function),
            },
            'foo-3': {
              isOpen: true,
              metadata: {
                childrenCount: 0,
                data: 'Foo #3',
                id: 'foo-3',
                isOpenByDefault: true,
                nestingLevel: 1,
              },
              toggle: expect.any(Function),
            },
          },
        });
      });

      it('updates tree nodes metadata', async () => {
        tree = {
          children: [
            {id: 'foo-3', name: 'Foo #3 Bar'},
            {id: 'foo-2', name: 'Foo #2 Bar'},
          ],
          id: 'foo-1',
          name: 'Foo #1 Bar',
        };

        await treeInstance.recomputeTree({refreshNodes: true});
        component.update(); // update the wrapper to get the latest changes

        expect(component.find(FixedSizeList).prop('itemData')).toMatchObject({
          component: Node,
          data: undefined,
          order: ['foo-1', 'foo-3', 'foo-2'],
          records: {
            'foo-1': {
              isOpen: true,
              metadata: {
                childrenCount: 2,
                data: 'Foo #1 Bar',
                id: 'foo-1',
                isOpenByDefault: true,
                nestingLevel: 0,
              },
              toggle: expect.any(Function),
            },
            'foo-2': {
              isOpen: true,
              metadata: {
                childrenCount: 0,
                data: 'Foo #2 Bar',
                id: 'foo-2',
                isOpenByDefault: true,
                nestingLevel: 1,
              },
              toggle: expect.any(Function),
            },
            'foo-3': {
              isOpen: true,
              metadata: {
                childrenCount: 0,
                data: 'Foo #3 Bar',
                id: 'foo-3',
                isOpenByDefault: true,
                nestingLevel: 1,
              },
              toggle: expect.any(Function),
            },
          },
        });
      });

      it('resets current openness to default', async () => {
        // Imitate closing the foo-1 node
        component.setState({
          order: ['foo-1'],
          records: {
            ...component.state().records,
            'foo-1': {
              ...component.state().records['foo-1'],
              isOpen: false,
            },
          },
        });

        await treeInstance.recomputeTree({useDefaultOpenness: true});
        component.update(); // update the wrapper to get the latest changes

        // foo-1 node is open again
        expect(component.find(FixedSizeList).prop('itemData')).toMatchObject({
          component: Node,
          data: undefined,
          order: ['foo-1', 'foo-2', 'foo-3'],
          records: {
            'foo-1': {
              isOpen: true,
              metadata: {
                childrenCount: 2,
                data: 'Foo #1',
                id: 'foo-1',
                isOpenByDefault: true,
                nestingLevel: 0,
              },
              toggle: expect.any(Function),
            },
            'foo-2': {
              isOpen: true,
              metadata: {
                childrenCount: 0,
                data: 'Foo #2',
                id: 'foo-2',
                isOpenByDefault: true,
                nestingLevel: 1,
              },
              toggle: expect.any(Function),
            },
            'foo-3': {
              isOpen: true,
              metadata: {
                childrenCount: 0,
                data: 'Foo #3',
                id: 'foo-3',
                isOpenByDefault: true,
                nestingLevel: 1,
              },
              toggle: expect.any(Function),
            },
          },
        });
      });

      it('resets current openness to the new default provided by the node refreshing', async () => {
        isOpenByDefault = false;

        await treeInstance.recomputeTree({
          refreshNodes: true,
          useDefaultOpenness: true,
        });
        component.update(); // update the wrapper to get the latest changes

        expect(component.find(FixedSizeList).prop('itemData')).toMatchObject({
          component: Node,
          data: undefined,
          order: ['foo-1'],
          records: {
            'foo-1': {
              isOpen: false,
              metadata: {
                childrenCount: 2,
                data: 'Foo #1',
                id: 'foo-1',
                isOpenByDefault: false,
                nestingLevel: 0,
              },
              toggle: expect.any(Function),
            },
            // Child nodes of the closed one are omitted
            'foo-2': {
              isOpen: true,
              metadata: {
                childrenCount: 0,
                data: 'Foo #2',
                id: 'foo-2',
                isOpenByDefault: true,
                nestingLevel: 1,
              },
              toggle: expect.any(Function),
            },
            'foo-3': {
              isOpen: true,
              metadata: {
                childrenCount: 0,
                data: 'Foo #3',
                id: 'foo-3',
                isOpenByDefault: true,
                nestingLevel: 1,
              },
              toggle: expect.any(Function),
            },
          },
        });
      });

      it('provides a toggle function that changes openness state of the specific node', async () => {
        const recomputeTreeSpy = spyOn(treeInstance, 'recomputeTree');
        const foo1 = component.state().records['foo-1'];

        await foo1.toggle();

        expect(recomputeTreeSpy).toHaveBeenCalledWith({refreshNodes: false});
        expect(foo1.isOpen).toBeFalsy();
      });
    });
  });
});
