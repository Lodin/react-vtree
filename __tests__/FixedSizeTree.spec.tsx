import {mount, ReactWrapper} from 'enzyme';
import React, {createRef, FC} from 'react';
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
import {NodeComponentProps, NodePublicState} from '../src/Tree';
import {
  defaultTree,
  treeWithLargeNode,
  extractReceivedRecords,
  mockRequestIdleCallback,
  sleep,
} from './utils/misc';

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
    FixedSizeNodePublicState<ExtendedData>
  >> = jest.fn(() => null);

  let component: ReactWrapper<
    FixedSizeTreeProps<ExtendedData>,
    FixedSizeTreeState<ExtendedData>,
    FixedSizeTree<ExtendedData>
  >;
  let tree: TreeNode;
  let treeWalkerSpy: jest.Mock;
  let isOpenByDefault: (node: TreeNode) => boolean;

  const getNodeData = (
    node: TreeNode,
    nestingLevel: number,
  ): TreeWalkerValue<ExtendedData, NodeMeta> => ({
    data: {
      id: node.id.toString(),
      isOpenByDefault: isOpenByDefault(node),
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
    tree = defaultTree;

    isOpenByDefault = () => true;

    treeWalkerSpy = jest.fn(treeWalker);

    component = mountComponent();
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
        setOpen: expect.any(Function),
      },
      {
        data: {
          id: 'foo-2',
          isOpenByDefault: true,
          name: 'Foo #2',
          nestingLevel: 1,
        },
        isOpen: true,
        setOpen: expect.any(Function),
      },
      {
        data: {
          id: 'foo-3',
          isOpenByDefault: true,
          name: 'Foo #3',
          nestingLevel: 2,
        },
        isOpen: true,
        setOpen: expect.any(Function),
      },
      {
        data: {
          id: 'foo-4',
          isOpenByDefault: true,
          name: 'Foo #4',
          nestingLevel: 2,
        },
        isOpen: true,
        setOpen: expect.any(Function),
      },
      {
        data: {
          id: 'foo-5',
          isOpenByDefault: true,
          name: 'Foo #5',
          nestingLevel: 1,
        },
        isOpen: true,
        setOpen: expect.any(Function),
      },
      {
        data: {
          id: 'foo-6',
          isOpenByDefault: true,
          name: 'Foo #6',
          nestingLevel: 2,
        },
        isOpen: true,
        setOpen: expect.any(Function),
      },
      {
        data: {
          id: 'foo-7',
          isOpenByDefault: true,
          name: 'Foo #7',
          nestingLevel: 2,
        },
        isOpen: true,
        setOpen: expect.any(Function),
      },
    ]);
  });

  it('allows providing custom row component', () => {
    const rowComponent = () => null;
    component = mountComponent({rowComponent});

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

  it('remembers a new treeWalker to avoid further re-computation if treeWalker is the same', () => {
    treeWalkerSpy = jest.fn(treeWalker);

    component.setProps({
      treeWalker: treeWalkerSpy,
    });

    component.setProps({
      treeWalker: treeWalkerSpy,
    });

    expect(treeWalkerSpy).toHaveBeenCalledTimes(1);
  });

  it('allows preserving previous state on the new tree building', async () => {
    const [, {setOpen}]: ReadonlyArray<FixedSizeNodePublicState<
      ExtendedData
    >> = extractReceivedRecords(component.find(FixedSizeList));

    await setOpen(false);
    component.update();

    expect(
      extractReceivedRecords(component.find(FixedSizeList)).map(
        ({data: {id}}) => id,
      ),
    ).toEqual(['foo-1', 'foo-2', 'foo-5', 'foo-6', 'foo-7']);

    treeWalkerSpy = jest.fn(treeWalker);

    component.setProps({
      async: true,
      treeWalker: treeWalkerSpy,
    });

    expect(
      extractReceivedRecords(component.find(FixedSizeList)).map(
        ({data: {id}}) => id,
      ),
    ).toEqual(['foo-1', 'foo-2', 'foo-5', 'foo-6', 'foo-7']);
  });

  it('provides a itemKey function to FixedSizeList', () => {
    const itemKey = component.find(FixedSizeList).prop('itemKey');
    expect(itemKey).not.toBeUndefined();

    expect(component.find(Row).map((node) => node.key())).toEqual([
      'foo-1',
      'foo-2',
      'foo-3',
      'foo-4',
      'foo-5',
      'foo-6',
      'foo-7',
    ]);
  });

  it('allows providing a listRef prop', () => {
    const refObject = createRef<FixedSizeList>();
    const refCallback = jest.fn();

    const instance = component.find(FixedSizeList).instance();

    component.setProps({listRef: refObject});

    expect(refObject.current).toBe(instance);

    component.setProps({
      listRef: refCallback,
    });

    expect(refCallback).toHaveBeenCalledWith(instance);
  });

  describe('placeholder', () => {
    const testRICTimeout = 16;
    let unmockRIC: () => void;

    beforeEach(() => {
      unmockRIC = mockRequestIdleCallback(testRICTimeout);
      component.unmount();
      (Node as jest.Mock).mockClear();
    });

    afterEach(() => {
      unmockRIC();
    });

    it('uses requestIdleCallback if placeholder prop is set', async () => {
      const placeholder = 'Waiting...';
      component = mountComponent({
        placeholder,
      });

      expect(component.text()).toBe(placeholder);

      await sleep(testRICTimeout);
      component.update();

      expect(component.find(FixedSizeTree)).toHaveLength(1);
      expect(window.requestIdleCallback).toHaveBeenCalledTimes(2);
    });

    it('allows setting timeout for requestIdleCallback', async () => {
      const timeout = 16;
      component = mountComponent({
        buildingTaskTimeout: timeout,
        placeholder: 'Waiting...',
      });

      await sleep(testRICTimeout);

      expect(window.requestIdleCallback).toHaveBeenCalledWith(
        expect.any(Function),
        {timeout},
      );
    });

    it('allows skipping first render but enable requestIdleCallback after', async () => {
      component = mountComponent({
        placeholder: null,
      });

      expect(window.requestIdleCallback).not.toHaveBeenCalled();

      treeWalkerSpy = jest.fn(treeWalker);

      component.setProps({
        treeWalker: treeWalkerSpy,
      });

      await sleep(testRICTimeout);

      expect(window.requestIdleCallback).toHaveBeenCalled();
    });
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
            setOpen: expect.any(Function),
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
          // This action means nothing because "foo-6" is leaf and has no
          // children. But it sill will set `isOpen` to true.
          'foo-6': true,
        });
        component.update(); // Update the wrapper to get the latest changes

        const receivedRecords = extractReceivedRecords(
          component.find(FixedSizeList),
        );
        expect(
          receivedRecords.reduce<Record<string, boolean>>(
            (acc, {data: {id}, isOpen}) => {
              acc[id] = isOpen;

              return acc;
            },
            {},
          ),
        ).toEqual({
          'foo-1': true,
          // Since `foo-2` is closed, `foo-3` and `foo-4` do not even appear in
          // the list of received records.
          'foo-2': false,
          // The `foo-5` and `foo-6` nodes are opened manually in recomputeTree
          'foo-5': true,
          'foo-6': true,
          'foo-7': false,
        });
      });

      it('does nothing if opennessState is not an object', async () => {
        const originalRecords = extractReceivedRecords(
          component.find(FixedSizeList),
        );

        // @ts-expect-error: Test for non-typescript code.
        await treeInstance.recomputeTree('4');
        component.update(); // Update the wrapper to get the latest changes

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
        component.update(); // Update the wrapper to get the latest changes

        expect(extractReceivedRecords(component.find(FixedSizeList))).toEqual(
          originalRecords,
        );
      });
    });

    it('provides a setOpen function that changes openness state of the specific node', async () => {
      const [{setOpen}] = extractReceivedRecords(component.find(FixedSizeList));

      await setOpen(false);
      component.update(); // Update the wrapper to get the latest changes

      let list = component.find(FixedSizeList);
      expect(list.prop('itemCount')).toBe(1);
      expect(extractReceivedRecords(list).map(({data: {id}}) => id)).toEqual([
        'foo-1',
      ]);

      await setOpen(true);
      component.update(); // Update the wrapper to get the latest changes

      list = component.find(FixedSizeList);
      expect(list.prop('itemCount')).toBe(7);
    });

    it('correctly collapses node with 100.000 children', async () => {
      tree = treeWithLargeNode;
      component = mountComponent();

      const records = extractReceivedRecords(component.find(FixedSizeList));
      const {setOpen} = records.find(
        (record) => record.data.id === 'largeNode-1',
      ) as NodePublicState<ExtendedData>;

      await setOpen(false);
      component.update(); // Update the wrapper to get the latest changes

      const updatedRecords = extractReceivedRecords(
        component.find(FixedSizeList),
      );
      expect(updatedRecords).toEqual([
        expect.objectContaining({
          data: expect.objectContaining({
            id: 'root-1',
          }),
        }),
        expect.objectContaining({
          data: expect.objectContaining({
            id: 'smallNode-1',
          }),
        }),
        expect.objectContaining({
          data: expect.objectContaining({
            id: 'smallNodeChild-1',
          }),
        }),
        expect.objectContaining({
          data: expect.objectContaining({
            id: 'smallNodeChild-2',
          }),
        }),
        expect.objectContaining({
          data: expect.objectContaining({
            id: 'largeNode-1',
          }),
        }),
        expect.objectContaining({
          data: expect.objectContaining({
            id: 'smallNode-2',
          }),
        }),
        expect.objectContaining({
          data: expect.objectContaining({
            id: 'smallNodeChild-3',
          }),
        }),
        expect.objectContaining({
          data: expect.objectContaining({
            id: 'smallNodeChild-4',
          }),
        }),
      ]);
    });

    it('correctly expands node with 100.000 children', async () => {
      tree = treeWithLargeNode;
      isOpenByDefault = (node) => {
        if (node.id === 'largeNode-1') {
          return false;
        }
        return true;
      };
      component = mountComponent();

      const records = extractReceivedRecords(component.find(FixedSizeList));
      const {setOpen} = records.find(
        (record) => record.data.id === 'largeNode-1',
      ) as NodePublicState<ExtendedData>;

      await setOpen(true);
      component.update(); // Update the wrapper to get the latest changes

      const updatedRecords = extractReceivedRecords(
        component.find(FixedSizeList),
      );

      expect(updatedRecords.slice(-5)).toEqual([
        expect.objectContaining({
          data: expect.objectContaining({
            id: 'largeNodeChild-99999',
          }),
        }),
        expect.objectContaining({
          data: expect.objectContaining({
            id: 'largeNodeChild-100000',
          }),
        }),
        expect.objectContaining({
          data: expect.objectContaining({
            id: 'smallNode-2',
          }),
        }),
        expect.objectContaining({
          data: expect.objectContaining({
            id: 'smallNodeChild-3',
          }),
        }),
        expect.objectContaining({
          data: expect.objectContaining({
            id: 'smallNodeChild-4',
          }),
        }),
      ]);
    });
  });
});
