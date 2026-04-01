// oxlint-disable typescript/consistent-type-imports
import { render, screen } from '@testing-library/react';
import { type FC, type Ref, forwardRef } from 'react';
import type { FixedSizeList, FixedSizeListProps } from 'react-window';
import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
  type Mock,
} from 'vitest';
import {
  type FixedSizeNodeData,
  type FixedSizeNodePublicState,
  FixedSizeTree,
} from '../src/FixedSizeTree.tsx';
import type {
  NodeComponentProps,
  TypedListChildComponentData,
} from '../src/Tree.tsx';
import { Row, type TreeWalker, type TreeWalkerValue } from '../src/Tree.tsx';
import {
  defaultTree,
  getLastListProps,
  type FixedSizeListMock,
  type TreeNode,
} from './utils/misc.ts';

type FixedSizeListRef = Readonly<{
  scrollTo: Mock;
  scrollToItem: Mock;
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

  const { createElement, forwardRef, useImperativeHandle } =
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

describe('Multiroot tree', () => {
  let isOpenByDefault: boolean;
  let treeRoots: readonly TreeNode[];

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
    for (let i = 0; i < treeRoots.length; i++) {
      yield getNodeData(treeRoots[i]!, 0);
    }

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

  beforeEach(() => {
    treeRoots = defaultTree.children!;
    isOpenByDefault = true;
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('renders a component', () => {
    render(<FixedSizeTreeRenderer />);

    expect(screen.getByTestId('fixed-size-list')).toBeInTheDocument();
  });

  it('contains a list component', () => {
    render(<FixedSizeTreeRenderer />);

    expect(fixedSizeListMock).toHaveBeenCalledWith(
      expect.objectContaining({
        children: Row,
        itemCount: 6,
        itemData: expect.objectContaining({
          component: Node,
          getRecordData: expect.any(Function),
        }),
        itemSize: 30,
      }),
      expect.any(Function),
    );

    expect(getLastListProps(fixedSizeListMock)!.itemData).toMatchObject({
      component: Node,
      getRecordData: expect.any(Function),
    });

    expect(fixedSizeListMock).toHaveBeenLastCalledWithRecords([
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
