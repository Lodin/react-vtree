import type { ReactNode } from 'react';
import { FixedSizeList, type FixedSizeListProps } from 'react-window';
import Tree, {
  createTreeComputer,
  type NodeData,
  type NodePublicState,
  type TreeProps,
  type TreeState,
} from './Tree.tsx';
import { createBasicRecord, getIdByIndex } from './utils.ts';

export type FixedSizeNodeData = NodeData;

export type FixedSizeNodePublicState<TData extends FixedSizeNodeData> =
  NodePublicState<TData>;

export type FixedSizeTreeProps<TData extends FixedSizeNodeData> = TreeProps<
  TData,
  FixedSizeNodePublicState<TData>,
  FixedSizeList
> &
  Readonly<Pick<FixedSizeListProps, 'itemSize'>>;

export type FixedSizeTreeState<TData extends FixedSizeNodeData> = TreeState<
  TData,
  FixedSizeNodePublicState<TData>,
  FixedSizeList
>;

const computeTree = createTreeComputer<
  FixedSizeNodeData,
  FixedSizeNodePublicState<FixedSizeNodeData>,
  FixedSizeTreeProps<FixedSizeNodeData>,
  FixedSizeTreeState<FixedSizeNodeData>
>({
  createRecord: (data, { recomputeTree }, parent, previousRecord) =>
    createBasicRecord(
      {
        data,
        isOpen: previousRecord
          ? previousRecord.public.isOpen
          : data.isOpenByDefault,
        setOpen: async (state): Promise<void> =>
          await recomputeTree({
            [data.id]: state,
          }),
      },
      parent,
    ),
});

export class FixedSizeTree<
  TData extends FixedSizeNodeData = FixedSizeNodeData,
> extends Tree<
  TData,
  FixedSizeNodePublicState<TData>,
  FixedSizeTreeProps<TData>,
  FixedSizeTreeState<TData>,
  FixedSizeList
> {
  constructor(props: FixedSizeTreeProps<TData>, context: any) {
    super(props, context);

    this.state = {
      ...this.state,
      computeTree,
    };
  }

  override render(): ReactNode {
    const {
      children: _c,
      listRef: _l,
      placeholder,
      treeWalker: _t,
      rowComponent,
      ...rest
    } = this.props;

    const { attachRefs, order } = this.state;

    return placeholder && order!.length === 0 ? (
      placeholder
    ) : (
      <FixedSizeList
        {...rest}
        itemCount={order!.length}
        itemData={this.getItemData()}
         
        itemKey={getIdByIndex}
         
        ref={attachRefs}
      >
        {rowComponent!}
      </FixedSizeList>
    );
  }
}
