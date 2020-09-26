import React, {ReactNode} from 'react';
import {FixedSizeList, FixedSizeListProps} from 'react-window';
import Tree, {
  createTreeComputer,
  NodeData,
  TreeProps,
  TreeState,
  NodeRecordPublic,
} from './Tree';
import {createRecord} from './utils';

export type FixedSizeNodeData = NodeData;

export type FixedSizeNodeRecordPublic<
  TData extends FixedSizeNodeData
> = NodeRecordPublic<TData>;

export type FixedSizeTreeProps<TData extends FixedSizeNodeData> = TreeProps<
  TData,
  FixedSizeNodeRecordPublic<TData>
> &
  Readonly<Pick<FixedSizeListProps, 'itemSize'>>;

export type FixedSizeTreeState<TData extends FixedSizeNodeData> = TreeState<
  TData,
  FixedSizeNodeRecordPublic<TData>
>;

const computeTree = createTreeComputer<
  FixedSizeNodeData,
  FixedSizeNodeRecordPublic<FixedSizeNodeData>,
  FixedSizeTreeProps<FixedSizeNodeData>,
  FixedSizeTreeState<FixedSizeNodeData>
>({
  createRecord,
});

export class FixedSizeTree<
  TData extends FixedSizeNodeData = FixedSizeNodeData
> extends Tree<
  TData,
  FixedSizeNodeRecordPublic<TData>,
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
    const {children, treeWalker, rowComponent, ...rest} = this.props;

    return (
      <FixedSizeList
        {...rest}
        itemCount={this.state.order!.length}
        itemData={this.getItemData()}
        ref={this.list}
      >
        {rowComponent!}
      </FixedSizeList>
    );
  }
}
