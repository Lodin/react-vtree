// oxlint-disable typescript/consistent-type-imports
import { render, screen } from '@testing-library/react';
import { createRef, type FC, type Ref, forwardRef } from 'react';
import { VariableSizeList, type VariableSizeListProps } from 'react-window';
import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
  type Mock,
} from 'vitest';
import type {
  NodeComponentProps,
  TypedListChildComponentData,
} from '../src/Tree.tsx';
import { type TreeWalker, type TreeWalkerValue, Row } from '../src/Tree.tsx';
import {
  type VariableSizeNodeData,
  type VariableSizeNodePublicState,
  VariableSizeTree,
} from '../src/VariableSizeTree.tsx';
import { defaultTree, type TreeNode } from './utils/misc.ts';
import {
  applyComponentUpdate,
  getLastListProps,
  getLastRecords,
  MockRequestIdleCallbackController,
  type VariableSizeListMock,
} from './utils/misc.ts';

type VariableSizeListRef = Readonly<{
  resetAfterIndex: Mock;
  scrollTo: Mock;
  scrollToItem: Mock;
}>;

type ExtendedData = VariableSizeNodeData &
  Readonly<{
    name: string;
    nestingLevel: number;
  }>;

type NodeMeta = Readonly<{
  nestingLevel: number;
  node: TreeNode;
}>;

type VariableSizeListData = TypedListChildComponentData<
  ExtendedData,
  VariableSizeNodePublicState<ExtendedData>
>;

const variableSizeListMock: VariableSizeListMock<VariableSizeListData> =
  vi.hoisted(() => vi.fn());

const variableSizeListRef: VariableSizeListRef = vi.hoisted(() => ({
  resetAfterIndex: vi.fn(),
  scrollTo: vi.fn(),
  scrollToItem: vi.fn(),
}));

vi.mock('react-window', async () => {
  const actual =
    await vi.importActual<typeof import('react-window')>('react-window');

  const { createElement, forwardRef, useImperativeHandle } =
    await import('react');

  variableSizeListMock.mockImplementation(
    (
      _: VariableSizeListProps<VariableSizeListData>,
      ref: Ref<Partial<VariableSizeList>>,
    ) => {
      useImperativeHandle(ref, () => variableSizeListRef);

      return createElement('div', {
        'data-testid': 'variable-size-list',
      });
    },
  );

  const VariableSizeListMock = forwardRef(variableSizeListMock);

  VariableSizeListMock.displayName = 'VariableSizeListMock';

  return {
    ...actual,
    VariableSizeList: VariableSizeListMock,
  };
});

describe('VariableSizeTree', () => {
  let defaultHeight: number;
  let isOpenByDefault: boolean;
  let tree: TreeNode;

  const Node: FC<
    NodeComponentProps<ExtendedData, VariableSizeNodePublicState<ExtendedData>>
  > = vi.fn(
    ({
      data: { id },
    }: NodeComponentProps<
      ExtendedData,
      VariableSizeNodePublicState<ExtendedData>
    >) => <div data-testid={`node-${id}`} />,
  );

  const getNodeData = vi.fn(
    (
      node: TreeNode,
      nestingLevel: number,
    ): TreeWalkerValue<ExtendedData, NodeMeta> => ({
      data: {
        defaultHeight,
        id: node.id,
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

  const VariableSizeTreeRenderer = forwardRef(
    (
      props: Partial<
        React.ComponentProps<typeof VariableSizeTree<ExtendedData>>
      >,
      treeRef: Ref<VariableSizeTree<ExtendedData>>,
    ) => {
      return (
        <VariableSizeTree<ExtendedData>
          ref={treeRef}
          treeWalker={treeWalker}
          height={500}
          width={500}
          {...props}
        >
          {Node}
        </VariableSizeTree>
      );
    },
  );

  function renderComponent(
    overriddenProps: Partial<
      React.ComponentProps<typeof VariableSizeTree<ExtendedData>>
    > = {},
  ) {
    const treeRef = createRef<VariableSizeTree<ExtendedData>>();
    let currentProps = overriddenProps;

    const renderResult = render(
      <VariableSizeTreeRenderer ref={treeRef} {...currentProps} />,
    );

    return {
      ...renderResult,
      rerenderComponent(
        nextProps: Partial<
          React.ComponentProps<typeof VariableSizeTree<ExtendedData>>
        > = {},
      ) {
        currentProps = {
          ...currentProps,
          ...nextProps,
        };

        renderResult.rerender(
          <VariableSizeTreeRenderer ref={treeRef} {...currentProps} />,
        );
      },
      treeRef,
    };
  }

  beforeEach(() => {
    tree = defaultTree;
    defaultHeight = 30;
    isOpenByDefault = true;
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should render a component', () => {
    render(<VariableSizeTreeRenderer />);

    expect(screen.getByTestId('variable-size-list')).toBeInTheDocument();
  });

  it('should contain a VariableSizeList component', () => {
    render(<VariableSizeTreeRenderer />);

    expect(variableSizeListMock).toHaveBeenCalledWith(
      expect.objectContaining({
        children: Row,
        itemCount: 7,
        itemData: expect.objectContaining({
          component: Node,
          getRecordData: expect.any(Function),
        }),
        itemSize: expect.any(Function),
      }),
      expect.any(Function),
    );

    expect(variableSizeListMock).toHaveBeenLastCalledWithRecords([
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
        setOpen: expect.any(Function),
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
        setOpen: expect.any(Function),
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
        setOpen: expect.any(Function),
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
        setOpen: expect.any(Function),
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
        setOpen: expect.any(Function),
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
        setOpen: expect.any(Function),
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
        setOpen: expect.any(Function),
      },
    ]);
  });

  it('should allow providing custom row component', () => {
    const rowComponent = () => null;

    render(<VariableSizeTreeRenderer rowComponent={rowComponent} />);

    expect(getLastListProps(variableSizeListMock)!.children).toBe(rowComponent);
  });

  it('should recompute on new treeWalker', () => {
    const renderResult = render(<VariableSizeTreeRenderer />);
    const nextTreeWalker = vi.fn(treeWalker.getMockImplementation());

    renderResult.rerender(
      <VariableSizeTreeRenderer treeWalker={nextTreeWalker} />,
    );

    expect(nextTreeWalker).toHaveBeenCalledWith();
  });

  it('should not recompute if treeWalker is the same', () => {
    const renderResult = render(<VariableSizeTreeRenderer />);

    treeWalker.mockClear();

    renderResult.rerender(<VariableSizeTreeRenderer />);

    expect(treeWalker).not.toHaveBeenCalled();
  });

  it('should remember a new treeWalker to avoid further re-computation if treeWalker is the same', () => {
    const renderResult = render(<VariableSizeTreeRenderer />);
    const nextTreeWalker = vi.fn(treeWalker.getMockImplementation());

    renderResult.rerender(
      <VariableSizeTreeRenderer treeWalker={nextTreeWalker} />,
    );
    renderResult.rerender(
      <VariableSizeTreeRenderer treeWalker={nextTreeWalker} />,
    );

    expect(nextTreeWalker).toHaveBeenCalledTimes(1);
  });

  it('should allow preserving previous state on the new tree building', async () => {
    const renderResult = render(<VariableSizeTreeRenderer />);
    const { setOpen } = getLastRecords(variableSizeListMock)![1]!;

    const collapsedRecords = [
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
        setOpen: expect.any(Function),
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
        isOpen: false,
        resize: expect.any(Function),
        setOpen: expect.any(Function),
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
        setOpen: expect.any(Function),
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
        setOpen: expect.any(Function),
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
        setOpen: expect.any(Function),
      },
    ] satisfies ReadonlyArray<VariableSizeNodePublicState<ExtendedData>>;

    await applyComponentUpdate(async () => await setOpen(false));

    expect(variableSizeListMock).toHaveBeenLastCalledWithRecords(
      collapsedRecords,
    );

    const nextTreeWalker = vi.fn(treeWalker.getMockImplementation());

    renderResult.rerender(
      <VariableSizeTreeRenderer async={true} treeWalker={nextTreeWalker} />,
    );

    expect(variableSizeListMock).toHaveBeenLastCalledWithRecords(
      collapsedRecords,
    );
  });

  it('should provide a itemKey function to VariableSizeList', () => {
    render(<VariableSizeTreeRenderer />);

    expect(variableSizeListMock).toHaveBeenLastCalledWithItemKeys([
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
    const renderResult = render(<VariableSizeTreeRenderer />);
    const refObject = createRef<VariableSizeList>();
    const refCallback = vi.fn();

    renderResult.rerender(<VariableSizeTreeRenderer listRef={refObject} />);

    expect(refObject.current).toBe(variableSizeListRef);

    renderResult.rerender(<VariableSizeTreeRenderer listRef={refCallback} />);

    expect(refCallback).toHaveBeenCalledWith(variableSizeListRef);
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

      render(<VariableSizeTreeRenderer placeholder={placeholder} />);

      expect(screen.getByText(placeholder)).toBeInTheDocument();
      expect(idle.pendingCount()).toBe(1);

      await idle.drain();

      expect(screen.getByTestId('variable-size-list')).toBeInTheDocument();
      expect(idle.requestIdleCallback).toHaveBeenCalledTimes(2);
    });

    it('should allow setting timeout for requestIdleCallback', () => {
      const timeout = 16;

      render(
        <VariableSizeTreeRenderer
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
      const renderResult = render(
        <VariableSizeTreeRenderer placeholder={null} />,
      );

      expect(idle.requestIdleCallback).not.toHaveBeenCalled();

      const nextTreeWalker = vi.fn(treeWalker.getMockImplementation());

      renderResult.rerender(
        <VariableSizeTreeRenderer
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
    let treeInstance: VariableSizeTree<ExtendedData>;

    beforeEach(() => {
      const component = renderComponent();

      expect(component.treeRef.current).not.toBeNull();

      treeInstance = component.treeRef.current!;
    });

    describe('scrollTo', () => {
      it('can scroll to a specific offset', () => {
        variableSizeListRef.scrollTo.mockClear();

        treeInstance.scrollTo(200);

        expect(variableSizeListRef.scrollTo).toHaveBeenCalledWith(200);
      });

      it('can scroll to an item', () => {
        variableSizeListRef.scrollToItem.mockClear();

        treeInstance.scrollToItem('foo-3', 'auto');

        expect(variableSizeListRef.scrollToItem).toHaveBeenCalledWith(
          2,
          'auto',
        );
      });

      it('re-renders nodes after specific index', () => {
        variableSizeListRef.resetAfterIndex.mockClear();

        treeInstance.resetAfterId('foo-3', true);

        expect(variableSizeListRef.resetAfterIndex).toHaveBeenCalledWith(
          2,
          true,
        );
      });
    });

    describe('recomputeTree', () => {
      it('changes the node openness state', async () => {
        await applyComponentUpdate(
          async () => await treeInstance.recomputeTree({ 'foo-1': false }),
        );

        expect(getLastListProps(variableSizeListMock)!.itemCount).toBe(1);
        expect(getLastRecords(variableSizeListMock)!).toEqual([
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
            setOpen: expect.any(Function),
          },
        ]);
      });

      it('changes the nested node openness state', async () => {
        await applyComponentUpdate(
          async () => await treeInstance.recomputeTree({ 'foo-5': false }),
        );

        expect(getLastListProps(variableSizeListMock)!.itemCount).toBe(5);
        expect(
          getLastRecords(variableSizeListMock)!.map(({ data: { id } }) => id),
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

        expect(getLastListProps(variableSizeListMock)!.itemCount).toBe(1);

        await applyComponentUpdate(
          async () =>
            await treeInstance.recomputeTree({
              'foo-1': true,
              'foo-5': true,
            }),
        );

        expect(getLastListProps(variableSizeListMock)!.itemCount).toBe(5);
        expect(
          getLastRecords(variableSizeListMock)!.map(({ data: { id } }) => id),
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

        expect(getLastRecords(variableSizeListMock)!).toHaveLength(7);
        expect(
          getLastRecords(variableSizeListMock)!.map(({ isOpen }) => isOpen),
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
          getLastRecords(variableSizeListMock)!.reduce<Record<string, boolean>>(
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
        const originalRecords = getLastRecords(variableSizeListMock)!;

        await applyComponentUpdate(
          // @ts-expect-error Test for non-typescript code.
          async () => await treeInstance.recomputeTree('4'),
        );

        expect(getLastRecords(variableSizeListMock)!).toEqual(originalRecords);
      });

      it('does nothing if record ID does not exist', async () => {
        const originalRecords = getLastRecords(variableSizeListMock)!;

        await applyComponentUpdate(
          async () =>
            await treeInstance.recomputeTree({
              'foo-42': false,
            }),
        );

        expect(getLastRecords(variableSizeListMock)!).toEqual(originalRecords);
      });
    });

    it('provides a setOpen function that changes openness state of the specific node', async () => {
      const firstRecord = getLastRecords(variableSizeListMock)![0]!;

      await applyComponentUpdate(async () => await firstRecord.setOpen(false));

      expect(getLastListProps(variableSizeListMock)!.itemCount).toBe(1);
      expect(
        getLastRecords(variableSizeListMock)!.map(({ data: { id } }) => id),
      ).toEqual(['foo-1']);

      await applyComponentUpdate(async () => await firstRecord.setOpen(true));

      expect(getLastListProps(variableSizeListMock)!.itemCount).toBe(7);
    });

    it('provides a resize function that changes height of the specific node', () => {
      variableSizeListRef.resetAfterIndex.mockClear();

      const foo3 = getLastRecords(variableSizeListMock)![2]!;

      foo3.resize(100, true);

      expect(variableSizeListRef.resetAfterIndex).toHaveBeenCalledWith(2, true);
      expect(foo3.height).toBe(100);
    });
  });
});
