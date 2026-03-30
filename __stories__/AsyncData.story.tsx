/* eslint-disable max-depth */
import type { Meta, StoryObj } from '@storybook/react-vite';
import { type FC, useCallback, useMemo, useRef, useState } from 'react';
import { AutoSizer } from 'react-virtualized-auto-sizer';
import {
  FixedSizeTree,
  type FixedSizeNodeData,
  type FixedSizeNodePublicState,
  type TreeWalker,
  type TreeWalkerValue,
} from '../src';
import type { NodeComponentProps } from '../src/Tree';
import { AsyncTaskScheduler } from './utils';

type TreeNode = Readonly<{
  children: TreeNode[];
  downloaded: boolean;
  id: number;
  name: string;
}>;

type TreeData = FixedSizeNodeData &
  Readonly<{
    downloaded: boolean;
    download: () => Promise<void>;
    isLeaf: boolean;
    name: string;
    nestingLevel: number;
  }>;

let nodeId = 0;

const createNode = (
  downloadedIds: readonly number[],
  depth: number = 0,
): TreeNode => {
  const id = nodeId;
  const node: TreeNode = {
    children: [],
    downloaded: downloadedIds.includes(id),
    id,
    name: `test-${nodeId}`,
  };

  nodeId += 1;

  if (depth === 5) {
    return node;
  }

  for (let i = 0; i < 10; i++) {
    node.children.push(createNode(downloadedIds, depth + 1));
  }

  return node;
};

const defaultTextStyle = { marginLeft: 10 };
const defaultButtonStyle = { fontFamily: 'Courier New' };

type NodeMeta = Readonly<{
  nestingLevel: number;
  node: TreeNode;
}>;

const getNodeData = (
  node: TreeNode,
  nestingLevel: number,
  download: () => Promise<void>,
): TreeWalkerValue<TreeData, NodeMeta> => ({
  data: {
    download,
    downloaded: node.downloaded,
    id: node.id.toString(),
    isLeaf: node.children.length === 0,
    isOpenByDefault: false,
    name: node.name,
    nestingLevel,
  },
  nestingLevel,
  node,
});

const Node: FC<
  NodeComponentProps<TreeData, FixedSizeNodePublicState<TreeData>>
> = ({
  data: { download, downloaded, isLeaf, name, nestingLevel },
  isOpen,
  style,
  setOpen,
}) => {
  const [isLoading, setLoading] = useState(false);

  return (
    <div
      style={{
        ...style,
        alignItems: 'center',
        display: 'flex',
        marginLeft: nestingLevel * 30 + (isLeaf ? 48 : 0),
      }}
    >
      {!isLeaf && (
        <div>
          <button
            type="button"
            onClick={async () => {
              if (!downloaded) {
                setLoading(true);
                await download();
                await setOpen(!isOpen);
                setLoading(false);
              } else {
                await setOpen(!isOpen);
              }
            }}
            style={defaultButtonStyle}
          >
            {isLoading ? '⌛' : isOpen ? '-' : '+'}
          </button>
        </div>
      )}
      <div style={defaultTextStyle}>{name}</div>
    </div>
  );
};

type TreePresenterProps = Readonly<{
  disableAsync: boolean;
  itemSize: number;
}>;

const TreePresenter: FC<TreePresenterProps> = ({ disableAsync, itemSize }) => {
  const [downloadedIds, setDownloadedIds] = useState<readonly number[]>([]);
  const scheduler = useRef<AsyncTaskScheduler<number>>(
    new AsyncTaskScheduler((ids) => {
      setDownloadedIds(ids);
    }),
  );
  const rootNode = useMemo(() => {
    nodeId = 0;

    return createNode(downloadedIds);
  }, [downloadedIds]);

  const createDownloader = (node: TreeNode) => async (): Promise<void> =>
    await new Promise((resolve) => {
      const timeoutId = setTimeout(() => {
        scheduler.current.finalize();
      }, 2000);

      scheduler.current.add(node.id, resolve, () => clearTimeout(timeoutId));
    });

  const treeWalker = useCallback(
    function* asyncTreeWalker(): ReturnType<TreeWalker<TreeData, NodeMeta>> {
      yield getNodeData(rootNode, 0, createDownloader(rootNode));

      // oxlint-disable-next-line typescript/no-unnecessary-condition
      while (true) {
        const parentMeta = yield;

        if (parentMeta.data.downloaded) {
          for (let i = 0; i < parentMeta.node.children.length; i++) {
            yield getNodeData(
              parentMeta.node.children[i]!,
              parentMeta.nestingLevel + 1,
              createDownloader(parentMeta.node.children[i]!),
            );
          }
        }
      }
    },
    [rootNode],
  );

  return (
    <AutoSizer
      renderProp={({ height }) => (
        <FixedSizeTree
          treeWalker={treeWalker}
          itemSize={itemSize}
          height={height ?? 0}
          async={!disableAsync}
          width="100%"
        >
          {Node}
        </FixedSizeTree>
      )}
    />
  );
};

const meta: Meta<typeof TreePresenter> = {
  args: {
    disableAsync: false,
    itemSize: 30,
  },
  component: TreePresenter,
  title: 'Tree/AsyncData',
};

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
