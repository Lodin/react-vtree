import React, {ReactNode} from 'react';
import {FixedSizeList, FixedSizeListProps} from 'react-window';
import Tree, {
  createTreeComputer,
  NodeData,
  TreeProps,
  TreeState,
  NodePublicState,
} from './Tree';
import {createBasicRecord, getIdByIndex} from './utils';

export type FixedSizeNodeData = NodeData;

export type FixedSizeNodePublicState<
  TData extends FixedSizeNodeData
> = NodePublicState<TData>;

export type FixedSizeTreeProps<TData extends FixedSizeNodeData> = TreeProps<
  TData,
  FixedSizeNodePublicState<TData>
> &
  Readonly<Pick<FixedSizeListProps, 'itemSize'>>;

export type FixedSizeTreeState<TData extends FixedSizeNodeData> = TreeState<
  TData,
  FixedSizeNodePublicState<TData>
>;

const computeTree = createTreeComputer<
  FixedSizeNodeData,
  FixedSizeNodePublicState<FixedSizeNodeData>,
  FixedSizeTreeProps<FixedSizeNodeData>,
  FixedSizeTreeState<FixedSizeNodeData>
>({
  createRecord: (data, {recomputeTree}, parent, previousRecord) =>
    createBasicRecord(
      {
        data,
        isOpen: previousRecord
          ? previousRecord.public.isOpen
          : data.isOpenByDefault,
        setOpen: (state): Promise<void> =>
          recomputeTree({
            [data.id]: state,
          }),
      },
      parent,
    ),
});

export class FixedSizeTree<
  TData extends FixedSizeNodeData = FixedSizeNodeData
> extends Tree<
  TData,
  FixedSizeNodePublicState<TData>,
  FixedSizeTreeProps<TData>,
  FixedSizeTreeState<TData>,
  FixedSizeList
> {
  public constructor(props: FixedSizeTreeProps<TData>, context: any) {
    super(props, context);

    this.state = {
      ...this.state,
      computeTree,
    };
  }

  public render(): ReactNode {
    const {
      children,
      placeholder,
      treeWalker,
      rowComponent,
      ...rest
    } = this.props;

    const {order} = this.state;

    return placeholder && order!.length === 0 ? (
      placeholder
    ) : (
      <FixedSizeList
        {...rest}
        itemCount={order!.length}
        itemData={this.getItemData()}
        ref={this.list}
        // eslint-disable-next-line @typescript-eslint/unbound-method
        itemKey={getIdByIndex}
      >
        {rowComponent!}
      </FixedSizeList>
    );
  }
}
