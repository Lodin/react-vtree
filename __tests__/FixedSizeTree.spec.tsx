// oxlint-disable typescript/consistent-type-imports
import { createRef, type FC, type Ref, forwardRef } from 'react';
import { render, screen } from '@testing-library/react';
import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
  type Mock,
} from 'vitest';
import type { FixedSizeList, FixedSizeListProps } from 'react-window';
import {
  type FixedSizeNodeData,
  type FixedSizeNodePublicState,
  FixedSizeTree,
  Row,
  type TreeWalker,
  type TreeWalkerValue,
} from '../src';
import type {
  NodeComponentProps,
  TypedListChildComponentData,
} from '../src/Tree.tsx';
import { defaultTree, treeWithLargeNode, type TreeNode } from './utils/misc.ts';
import {
  applyComponentUpdate,
  getLastListProps,
  getLastRecords,
  MockRequestIdleCallbackController,
  type FixedSizeListMock,
} from './utils/misc.ts';

type FixedSizeListRef = Readonly<{
  scrollTo: Mock;
  scrollToItem: Mock;
}>;

type ExtendedData = FixedSizeNodeData &
  Readonly<{
    name: string;
    nestingLevel: number;
  }>;

type NodeMeta = Readonly<{
  nestingLevel: number;
  node: TreeNode;
}>;

type FixedSizeListData = TypedListChildComponentData<
  ExtendedData,
  FixedSizeNodePublicState<ExtendedData>
>;

const fixedSizeListMock: FixedSizeListMock<FixedSizeListData> = vi.hoisted(() =>
  vi.fn(),
);

const fixedSizeListRef: FixedSizeListRef = vi.hoisted(() => ({
  scrollTo: vi.fn(),
  scrollToItem: vi.fn(),
}));

vi.mock('react-window', async () => {
  const actual =
    await vi.importActual<typeof import('react-window')>('react-window');

  const { useImperativeHandle, forwardRef, createElement } =
    await import('react');

  fixedSizeListMock.mockImplementation(
    (
      _: FixedSizeListProps<FixedSizeListData>,
      ref: Ref<Partial<FixedSizeList>>,
    ) => {
      useImperativeHandle(ref, () => fixedSizeListRef);

      return createElement('div', {
        'data-testid': 'fixed-size-list',
      });
    },
  );

  const FixedSizeListMock = forwardRef(fixedSizeListMock);

  FixedSizeListMock.displayName = 'FixedSizeListMock';

  return {
    ...actual,
    FixedSizeList: FixedSizeListMock,
  };
});

describe('FixedSizeTree', () => {
  let tree: TreeNode;
  let isOpenByDefault: boolean;

  const Node: FC<
    NodeComponentProps<ExtendedData, FixedSizeNodePublicState<ExtendedData>>
  > = vi.fn(
    ({
      data: { id },
    }: NodeComponentProps<
      ExtendedData,
      FixedSizeNodePublicState<ExtendedData>
    >) => <div data-testid={`node-${id}`} />,
  );

  const getNodeData = vi.fn(
    (
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
    }),
  );

  const treeWalker = vi.fn(function* (): ReturnType<
    TreeWalker<ExtendedData, NodeMeta>
  > {
    yield getNodeData(tree, 0);

    // oxlint-disable-next-line typescript/no-unnecessary-condition
    while (true) {
      const parentMeta = yield;

      if (parentMeta.node.children) {
        for (let i = 0; i < parentMeta.node.children.length; i++) {
          yield getNodeData(
            parentMeta.node.children[i]!,
            parentMeta.nestingLevel + 1,
          );
        }
      }
    }
  });

  const FixedSizeTreeRenderer = forwardRef(
    (
      props: Partial<React.ComponentProps<typeof FixedSizeTree<ExtendedData>>>,
      treeRef: Ref<FixedSizeTree<ExtendedData>>,
    ) => {
      return (
        <FixedSizeTree<ExtendedData>
          ref={treeRef}
          itemSize={30}
          treeWalker={treeWalker}
          height={500}
          width={500}
          {...props}
        >
          {Node}
        </FixedSizeTree>
      );
    },
  );

  function renderComponent(
    overriddenProps: Partial<
      React.ComponentProps<typeof FixedSizeTree<ExtendedData>>
    > = {},
  ) {
    const treeRef = createRef<FixedSizeTree<ExtendedData>>();
    let currentProps = overriddenProps;

    const renderResult = render(
      <FixedSizeTreeRenderer ref={treeRef} {...currentProps} />,
    );

    return {
      ...renderResult,
      rerenderComponent(
        nextProps: Partial<
          React.ComponentProps<typeof FixedSizeTree<ExtendedData>>
        > = {},
      ) {
        currentProps = {
          ...currentProps,
          ...nextProps,
        };

        renderResult.rerender(
          <FixedSizeTreeRenderer ref={treeRef} {...currentProps} />,
        );
      },
      treeRef,
    };
  }

  beforeEach(() => {
    tree = defaultTree;
    isOpenByDefault = true;
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should render a component', () => {
    const { getByTestId } = render(<FixedSizeTreeRenderer />);

    expect(getByTestId('fixed-size-list')).not.toBeUndefined();
  });

  it('should contain a FixedSizeList component', () => {
    render(<FixedSizeTreeRenderer />);

    expect(fixedSizeListMock).toHaveBeenCalledWith(
      expect.objectContaining({
        children: Row,
        itemCount: 7,
        itemData: expect.objectContaining({
          component: Node,
          getRecordData: expect.any(Function),
        }),
        itemSize: 30,
      }),
      expect.any(Function),
    );

    expect(fixedSizeListMock).toHaveBeenLastCalledWithRecords([
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

  it('should allow providing custom row component', () => {
    const rowComponent = () => null;

    render(<FixedSizeTreeRenderer rowComponent={rowComponent} />);

    expect(getLastListProps(fixedSizeListMock)!.children).toBe(rowComponent);
  });

  it('should recompute on new treeWalker', () => {
    const renderResult = render(<FixedSizeTreeRenderer />);
    const nextTreeWalker = vi.fn(treeWalker.getMockImplementation());

    renderResult.rerender(
      <FixedSizeTreeRenderer treeWalker={nextTreeWalker} />,
    );

    expect(nextTreeWalker).toHaveBeenCalledWith();
  });

  it('should not recompute if treeWalker is the same', () => {
    const renderResult = render(<FixedSizeTreeRenderer />);

    treeWalker.mockClear();

    renderResult.rerender(<FixedSizeTreeRenderer />);

    expect(treeWalker).not.toHaveBeenCalled();
  });

  it('should remember a new treeWalker to avoid further re-computation if treeWalker is the same', () => {
    const renderResult = render(<FixedSizeTreeRenderer />);
    const nextTreeWalker = vi.fn(treeWalker.getMockImplementation());

    renderResult.rerender(
      <FixedSizeTreeRenderer treeWalker={nextTreeWalker} />,
    );
    renderResult.rerender(
      <FixedSizeTreeRenderer treeWalker={nextTreeWalker} />,
    );

    expect(nextTreeWalker).toHaveBeenCalledTimes(1);
  });

  it('should allow preserving previous state on the new tree building', async () => {
    const renderResult = render(<FixedSizeTreeRenderer />);
    const { setOpen } = getLastRecords(fixedSizeListMock)![1]!;

    const collapsedRecords = [
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
        isOpen: false,
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
    ] satisfies ReadonlyArray<FixedSizeNodePublicState<ExtendedData>>;

    await applyComponentUpdate(async () => await setOpen(false));

    expect(fixedSizeListMock).toHaveBeenLastCalledWithRecords(collapsedRecords);

    const nextTreeWalker = vi.fn(treeWalker.getMockImplementation());

    renderResult.rerender(
      <FixedSizeTreeRenderer async={true} treeWalker={nextTreeWalker} />,
    );

    expect(fixedSizeListMock).toHaveBeenLastCalledWithRecords(collapsedRecords);
  });

  it('should provide a itemKey function to FixedSizeList', () => {
    render(<FixedSizeTreeRenderer />);

    expect(fixedSizeListMock).toHaveBeenLastCalledWithItemKeys([
      'foo-1',
      'foo-2',
      'foo-3',
      'foo-4',
      'foo-5',
      'foo-6',
      'foo-7',
    ]);
  });

  it('should allow providing a listRef prop', () => {
    const renderResult = render(<FixedSizeTreeRenderer />);
    const refObject = createRef<FixedSizeList>();
    const refCallback = vi.fn();

    renderResult.rerender(<FixedSizeTreeRenderer listRef={refObject} />);

    expect(refObject.current).toBe(fixedSizeListRef);

    renderResult.rerender(<FixedSizeTreeRenderer listRef={refCallback} />);

    expect(refCallback).toHaveBeenCalledWith(fixedSizeListRef);
  });

  describe('placeholder', () => {
    let idle: MockRequestIdleCallbackController;

    beforeEach(() => {
      idle = MockRequestIdleCallbackController.install();
    });

    afterEach(() => {
      idle.restore();
    });

    it('should use requestIdleCallback if placeholder prop is set', async () => {
      const placeholder = 'Waiting...';

      render(<FixedSizeTreeRenderer placeholder={placeholder} />);

      expect(screen.getByText(placeholder)).toBeInTheDocument();
      expect(idle.pendingCount()).toBe(1);

      await idle.drain();

      expect(screen.getByTestId('fixed-size-list')).toBeInTheDocument();
      expect(idle.requestIdleCallback).toHaveBeenCalledTimes(2);
    });

    it('should allow setting timeout for requestIdleCallback', () => {
      const timeout = 16;

      render(
        <FixedSizeTreeRenderer
          buildingTaskTimeout={timeout}
          placeholder="Waiting..."
        />,
      );

      expect(idle.requestIdleCallback).toHaveBeenCalledWith(
        expect.any(Function),
        { timeout },
      );
    });

    it('should allow skipping first render but enable requestIdleCallback after', async () => {
      const renderResult = render(<FixedSizeTreeRenderer placeholder={null} />);

      expect(idle.requestIdleCallback).not.toHaveBeenCalled();

      const nextTreeWalker = vi.fn(treeWalker.getMockImplementation());

      renderResult.rerender(
        <FixedSizeTreeRenderer
          treeWalker={nextTreeWalker}
          placeholder={null}
        />,
      );

      expect(idle.requestIdleCallback).toHaveBeenCalled();
      expect(idle.pendingCount()).toBe(1);

      await idle.next();

      expect(idle.requestIdleCallback).toHaveBeenCalled();
    });
  });

  describe('component instance', () => {
    let treeInstance: FixedSizeTree<ExtendedData>;

    beforeEach(() => {
      const component = renderComponent();

      expect(component.treeRef.current).not.toBeNull();

      treeInstance = component.treeRef.current!;
    });

    describe('scrollTo', () => {
      it('can scroll to a specific offset', () => {
        treeInstance.scrollTo(200);

        expect(fixedSizeListRef.scrollTo).toHaveBeenCalledWith(200);
      });

      it('can scroll to an item', () => {
        treeInstance.scrollToItem('foo-3', 'auto');

        expect(fixedSizeListRef.scrollToItem).toHaveBeenCalledWith(2, 'auto');
      });
    });

    describe('recomputeTree', () => {
      it('changes the node openness state', async () => {
        await applyComponentUpdate(
          async () => await treeInstance.recomputeTree({ 'foo-1': false }),
        );

        expect(getLastRecords(fixedSizeListMock)!).toEqual([
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
        await applyComponentUpdate(
          async () => await treeInstance.recomputeTree({ 'foo-5': false }),
        );

        expect(
          getLastRecords(fixedSizeListMock)!.map(({ data: { id } }) => id),
        ).toEqual(['foo-1', 'foo-2', 'foo-3', 'foo-4', 'foo-5']);
      });

      it("changes several nodes at once regardless of parent's openness", async () => {
        await applyComponentUpdate(
          async () =>
            await treeInstance.recomputeTree({
              'foo-1': false,
              'foo-2': false,
              'foo-5': false,
            }),
        );

        expect(
          getLastRecords(fixedSizeListMock)!.map(({ data: { id } }) => id),
        ).toEqual(['foo-1']);

        await applyComponentUpdate(
          async () =>
            await treeInstance.recomputeTree({
              'foo-1': true,
              'foo-5': true,
            }),
        );

        expect(
          getLastRecords(fixedSizeListMock)!.map(({ data: { id } }) => id),
        ).toEqual(['foo-1', 'foo-2', 'foo-5', 'foo-6', 'foo-7']);
      });

      it('applies subtreeCallback for each element in the recomputed subtree', async () => {
        await applyComponentUpdate(
          async () =>
            await treeInstance.recomputeTree({
              'foo-5': {
                open: true,
                subtreeCallback(node, root) {
                  if (node !== root) {
                    node.isOpen = false;
                  }
                },
              },
            }),
        );

        expect(
          getLastRecords(fixedSizeListMock)!.map(({ isOpen }) => isOpen),
        ).toEqual([true, true, true, true, true, false, false]);
      });

      it('allows overriding in definition order', async () => {
        await applyComponentUpdate(
          async () =>
            await treeInstance.recomputeTree({
              'foo-7': true,
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
            }),
        );

        expect(
          getLastRecords(fixedSizeListMock)!.reduce<Record<string, boolean>>(
            (acc, { data: { id }, isOpen }) => {
              acc[id] = isOpen;

              return acc;
            },
            {},
          ),
        ).toEqual({
          'foo-1': true,
          'foo-2': false,
          'foo-5': true,
          'foo-6': true,
          'foo-7': false,
        });
      });

      it('does nothing if opennessState is not an object', async () => {
        const originalRecords = getLastRecords(fixedSizeListMock)!;

        await applyComponentUpdate(
          // @ts-expect-error Test for non-typescript code.
          async () => await treeInstance.recomputeTree('4'),
        );

        expect(getLastRecords(fixedSizeListMock)!).toEqual(originalRecords);
      });

      it('does nothing if record ID does not exist', async () => {
        const originalRecords = getLastRecords(fixedSizeListMock)!;

        await applyComponentUpdate(
          async () =>
            await treeInstance.recomputeTree({
              'foo-42': false,
            }),
        );

        expect(getLastRecords(fixedSizeListMock)!).toEqual(originalRecords);
      });
    });

    it('provides a setOpen function that changes openness state of the specific node', async () => {
      const firstRecord = getLastRecords(fixedSizeListMock)![0]!;

      await applyComponentUpdate(async () => await firstRecord.setOpen(false));

      expect(
        getLastRecords(fixedSizeListMock)!.map(({ data: { id } }) => id),
      ).toEqual(['foo-1']);

      await applyComponentUpdate(async () => await firstRecord.setOpen(true));

      expect(getLastRecords(fixedSizeListMock)!).toHaveLength(7);
    });

    it('correctly collapses node with 100.000 children', async () => {
      tree = treeWithLargeNode;
      const component = renderComponent();

      expect(component.treeRef.current).not.toBeNull();
      treeInstance = component.treeRef.current!;

      const largeNode = getLastRecords(fixedSizeListMock)!.find(
        (record) => record.data.id === 'largeNode-1',
      )!;

      await applyComponentUpdate(async () => await largeNode.setOpen(false));

      expect(
        getLastRecords(fixedSizeListMock)!.map(({ data: { id } }) => id),
      ).toEqual([
        'root-1',
        'smallNode-1',
        'smallNodeChild-1',
        'smallNodeChild-2',
        'largeNode-1',
        'smallNode-2',
        'smallNodeChild-3',
        'smallNodeChild-4',
      ]);
    });

    it('correctly expands node with 100.000 children', async () => {
      getNodeData.mockImplementation(
        (
          node: TreeNode,
          nestingLevel: number,
        ): TreeWalkerValue<ExtendedData, NodeMeta> => ({
          data: {
            id: node.id.toString(),
            isOpenByDefault: node.id !== 'largeNode-1',
            name: node.name,
            nestingLevel,
          },
          nestingLevel,
          node,
        }),
      );
      tree = treeWithLargeNode;
      const component = renderComponent();

      expect(component.treeRef.current).not.toBeNull();
      treeInstance = component.treeRef.current!;

      const largeNode = getLastRecords(fixedSizeListMock)!.find(
        (record) => record.data.id === 'largeNode-1',
      )!;

      await applyComponentUpdate(async () => await largeNode.setOpen(true));

      expect(
        getLastRecords(fixedSizeListMock)!
          .map(({ data: { id } }) => id)
          .slice(-5),
      ).toEqual([
        'largeNodeChild-99999',
        'largeNodeChild-100000',
        'smallNode-2',
        'smallNodeChild-3',
        'smallNodeChild-4',
      ]);
    });
  });
});
