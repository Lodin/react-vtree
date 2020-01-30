import {mount, ReactWrapper} from 'enzyme';
import * as React from 'react';
import {VariableSizeList} from 'react-window';
import {Row} from '../src';
import VariableSizeTree, {
  VariableSizeNodeComponentProps,
  VariableSizeNodeData,
  VariableSizeTreeProps,
  VariableSizeTreeState,
} from '../src/VariableSizeTree';

type DataNode = {
  children?: DataNode[];
  id: string;
  name: string;
};

type StackElement = {
  nestingLevel: number;
  node: DataNode;
};

type ExtendedData = {
  readonly name: string;
  readonly nestingLevel: number;
};

describe('VariableSizeTree', () => {
  const Node: React.FunctionComponent<VariableSizeNodeComponentProps<
    ExtendedData
  >> = () => null;

  let component: ReactWrapper<
    VariableSizeTreeProps<ExtendedData>,
    VariableSizeTreeState<ExtendedData>,
    VariableSizeTree<ExtendedData>
  >;
  let tree: DataNode;
  let treeWalkerSpy: jest.Mock;
  let defaultHeight: number;
  let isOpenByDefault: boolean;

  function* treeWalker(
    refresh: boolean,
  ): Generator<
    VariableSizeNodeData<ExtendedData> | string | symbol,
    void,
    boolean
  > {
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
            defaultHeight,
            id,
            isOpenByDefault,
            name: node.name,
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
  }

  beforeEach(() => {
    tree = {
      children: [
        {id: 'foo-2', name: 'Foo #2'},
        {id: 'foo-3', name: 'Foo #3'},
      ],
      id: 'foo-1',
      name: 'Foo #1',
    };

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
      itemCount: 3,
      itemData: {
        component: Node,
        order: ['foo-1', 'foo-2', 'foo-3'],
        records: {
          'foo-1': {
            data: {
              defaultHeight: 30,
              id: 'foo-1',
              isOpenByDefault: true,
              name: 'Foo #1',
              nestingLevel: 0,
            },
            height: 30,
            isOpen: true,
            toggle: expect.any(Function),
          },
          'foo-2': {
            data: {
              defaultHeight: 30,
              id: 'foo-2',
              isOpenByDefault: true,
              name: 'Foo #2',
              nestingLevel: 1,
            },
            height: 30,
            isOpen: true,
            toggle: expect.any(Function),
          },
          'foo-3': {
            data: {
              defaultHeight: 30,
              id: 'foo-3',
              isOpenByDefault: true,
              name: 'Foo #3',
              nestingLevel: 1,
            },
            height: 30,
            isOpen: true,
            toggle: expect.any(Function),
          },
        },
      },
      itemSize: expect.any(Function),
    });
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

    expect(treeWalkerSpy).toHaveBeenCalledWith(true);
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
        const scrollToSpy = spyOn(listInstance, 'scrollTo');
        treeInstance.scrollTo(200);
        expect(scrollToSpy).toHaveBeenCalledWith(200);
      });

      it('can scroll to an item', () => {
        const scrollToItemSpy = spyOn(listInstance, 'scrollToItem');
        treeInstance.scrollToItem('foo-3', 'auto');
        expect(scrollToItemSpy).toHaveBeenCalledWith(2, 'auto');
      });

      it('re-renders nodes after specific index', () => {
        const resetAfterIndexSpy = spyOn(listInstance, 'resetAfterIndex');
        treeInstance.resetAfterId('foo-3', true);
        expect(resetAfterIndexSpy).toHaveBeenCalledWith(2, true);
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

        await treeInstance.recomputeTree();
        component.update(); // update the wrapper to get the latest changes

        expect(component.find(VariableSizeList).prop('itemData')).toMatchObject(
          {
            component: Node,
            order: ['foo-1', 'foo-3', 'foo-2'],
            records: {
              'foo-1': {
                data: {
                  defaultHeight: 30,
                  id: 'foo-1',
                  isOpenByDefault: true,
                  name: 'Foo #1',
                  nestingLevel: 0,
                },
                height: 30,
                isOpen: true,
                toggle: expect.any(Function),
              },
              'foo-2': {
                data: {
                  defaultHeight: 30,
                  id: 'foo-2',
                  isOpenByDefault: true,
                  name: 'Foo #2',
                  nestingLevel: 1,
                },
                height: 30,
                isOpen: true,
                toggle: expect.any(Function),
              },
              'foo-3': {
                data: {
                  defaultHeight: 30,
                  id: 'foo-3',
                  isOpenByDefault: true,
                  name: 'Foo #3',
                  nestingLevel: 1,
                },
                height: 30,
                isOpen: true,
                toggle: expect.any(Function),
              },
            },
            treeData: undefined,
          },
        );
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

        expect(component.find(VariableSizeList).prop('itemData')).toMatchObject(
          {
            component: Node,
            order: ['foo-1', 'foo-3', 'foo-2'],
            records: {
              'foo-1': {
                data: {
                  defaultHeight: 30,
                  id: 'foo-1',
                  isOpenByDefault: true,
                  name: 'Foo #1 Bar',
                  nestingLevel: 0,
                },
                height: 30,
                isOpen: true,
                toggle: expect.any(Function),
              },
              'foo-2': {
                data: {
                  defaultHeight: 30,
                  id: 'foo-2',
                  isOpenByDefault: true,
                  name: 'Foo #2 Bar',
                  nestingLevel: 1,
                },
                height: 30,
                isOpen: true,
                toggle: expect.any(Function),
              },
              'foo-3': {
                data: {
                  defaultHeight: 30,
                  id: 'foo-3',
                  isOpenByDefault: true,
                  name: 'Foo #3 Bar',
                  nestingLevel: 1,
                },
                height: 30,
                isOpen: true,
                toggle: expect.any(Function),
              },
            },
            treeData: undefined,
          },
        );
      });

      it('resets current openness to default', async () => {
        const {records} = component.state();

        for (const id in records) {
          records[id].isOpen = false;
        }

        // Imitate closing the foo-1 node
        component.setState({
          order: ['foo-1'],
          records,
        });

        await treeInstance.recomputeTree({useDefaultOpenness: true});
        component.update(); // update the wrapper to get the latest changes

        // foo-1 node is open again
        expect(component.find(VariableSizeList).prop('itemData')).toMatchObject(
          {
            component: Node,
            order: ['foo-1', 'foo-2', 'foo-3'],
            records: {
              'foo-1': {
                data: {
                  defaultHeight: 30,
                  id: 'foo-1',
                  isOpenByDefault: true,
                  name: 'Foo #1',
                  nestingLevel: 0,
                },
                height: 30,
                isOpen: true,
                toggle: expect.any(Function),
              },
              'foo-2': {
                data: {
                  defaultHeight: 30,
                  id: 'foo-2',
                  isOpenByDefault: true,
                  name: 'Foo #2',
                  nestingLevel: 1,
                },
                height: 30,
                isOpen: true,
                toggle: expect.any(Function),
              },
              'foo-3': {
                data: {
                  defaultHeight: 30,
                  id: 'foo-3',
                  isOpenByDefault: true,
                  name: 'Foo #3',
                  nestingLevel: 1,
                },
                height: 30,
                isOpen: true,
                toggle: expect.any(Function),
              },
            },
            treeData: undefined,
          },
        );
      });

      it('resets current openness to the new default provided by the node refreshing', async () => {
        isOpenByDefault = false;

        await treeInstance.recomputeTree({
          refreshNodes: true,
          useDefaultOpenness: true,
        });
        component.update(); // update the wrapper to get the latest changes

        expect(component.find(VariableSizeList).prop('itemData')).toMatchObject(
          {
            component: Node,
            order: ['foo-1'],
            records: {
              'foo-1': {
                data: {
                  defaultHeight: 30,
                  id: 'foo-1',
                  isOpenByDefault: false,
                  name: 'Foo #1',
                  nestingLevel: 0,
                },
                height: 30,
                isOpen: false,
                toggle: expect.any(Function),
              },
              // Child nodes of the closed one are omitted
              'foo-2': {
                data: {
                  defaultHeight: 30,
                  id: 'foo-2',
                  isOpenByDefault: true,
                  name: 'Foo #2',
                  nestingLevel: 1,
                },
                height: 30,
                isOpen: true,
                toggle: expect.any(Function),
              },
              'foo-3': {
                data: {
                  defaultHeight: 30,
                  id: 'foo-3',
                  isOpenByDefault: true,
                  name: 'Foo #3',
                  nestingLevel: 1,
                },
                height: 30,
                isOpen: true,
                toggle: expect.any(Function),
              },
            },
            treeData: undefined,
          },
        );
      });

      it('provides a toggle function that changes openness state of the specific node', async () => {
        const foo1 = component.state('records')['foo-1'];

        foo1.height = 50;

        treeWalkerSpy.mockClear();

        // Imitate the behavior of Node component where toggle is sent without
        // context
        const {toggle} = foo1;
        await toggle();

        expect(treeWalkerSpy).toHaveBeenCalledWith(false);
        expect(foo1.height).toBe(defaultHeight);
        expect(foo1.isOpen).toBeFalsy();
      });

      it('resets current height to default', async () => {
        const records = component.state('records');

        // Imitate changing height for the foo-1 node
        component.setState({
          order: ['foo-1'],
          records: {
            ...records,
            'foo-1': {
              ...records['foo-1'],
              height: 60,
            },
          },
        });

        await treeInstance.recomputeTree({useDefaultHeight: true});
        component.update(); // update the wrapper to get the latest changes

        // foo-1 node is open again
        expect(component.find(VariableSizeList).prop('itemData')).toMatchObject(
          {
            component: Node,
            order: ['foo-1', 'foo-2', 'foo-3'],
            records: {
              'foo-1': {
                data: {
                  defaultHeight: 30,
                  id: 'foo-1',
                  isOpenByDefault: true,
                  name: 'Foo #1',
                  nestingLevel: 0,
                },
                height: 30,
                isOpen: true,
                toggle: expect.any(Function),
              },
              'foo-2': {
                data: {
                  defaultHeight: 30,
                  id: 'foo-2',
                  isOpenByDefault: true,
                  name: 'Foo #2',
                  nestingLevel: 1,
                },
                height: 30,
                isOpen: true,
                toggle: expect.any(Function),
              },
              'foo-3': {
                data: {
                  defaultHeight: 30,
                  id: 'foo-3',
                  isOpenByDefault: true,
                  name: 'Foo #3',
                  nestingLevel: 1,
                },
                height: 30,
                isOpen: true,
                toggle: expect.any(Function),
              },
            },
            treeData: undefined,
          },
        );
      });

      it('resets current height to the new default provided by the node refreshing', async () => {
        defaultHeight = 60;

        await treeInstance.recomputeTree({
          refreshNodes: true,
          useDefaultHeight: true,
        });
        component.update(); // update the wrapper to get the latest changes

        expect(component.find(VariableSizeList).prop('itemData')).toMatchObject(
          {
            component: Node,
            order: ['foo-1', 'foo-2', 'foo-3'],
            records: {
              'foo-1': {
                data: {
                  defaultHeight: 60,
                  id: 'foo-1',
                  isOpenByDefault: true,
                  name: 'Foo #1',
                  nestingLevel: 0,
                },
                height: 60,
                isOpen: true,
                toggle: expect.any(Function),
              },
              // Child nodes of the closed one are omitted
              'foo-2': {
                data: {
                  defaultHeight: 60,
                  id: 'foo-2',
                  isOpenByDefault: true,
                  name: 'Foo #2',
                  nestingLevel: 1,
                },
                height: 60,
                isOpen: true,
                toggle: expect.any(Function),
              },
              'foo-3': {
                data: {
                  defaultHeight: 60,
                  id: 'foo-3',
                  isOpenByDefault: true,
                  name: 'Foo #3',
                  nestingLevel: 1,
                },
                height: 60,
                isOpen: true,
                toggle: expect.any(Function),
              },
            },
            treeData: undefined,
          },
        );
      });

      it('provides a resize function that changes height of the specific node', () => {
        const listInstance: VariableSizeList = component
          .find(VariableSizeList)
          .instance() as VariableSizeList;

        const resetAfterIndexSpy = spyOn(listInstance, 'resetAfterIndex');
        const order = component.state('order')!;
        const foo3 = component.state('records')['foo-3'];

        foo3.resize(100, true);

        expect(resetAfterIndexSpy).toHaveBeenCalledWith(
          order.indexOf('foo-3'),
          true,
        );
        expect(foo3.height).toBe(100);
      });
    });
  });
});
