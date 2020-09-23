import React, {ReactNode} from 'react';
import {FixedSizeList, FixedSizeListProps} from 'react-window';
import Tree, {
  createTreeComputer,
  NodeComponentProps,
  NodeData,
  TreeProps,
  TreeState,
  NodeRecordPublic,
  OpennessStateOptions,
} from './Tree';
import {createRecord, updateRecord} from './utils';

export type FixedSizeNodeData = NodeData;

export type FixedSizeNodeComponentProps<
  T extends FixedSizeNodeData
> = NodeComponentProps<T>;

export type FixedSizeNodeRecordPublic<
  T extends FixedSizeNodeData
> = NodeRecordPublic<T>;

export type FixedSizeOpennessStateOptions = OpennessStateOptions;

export type FixedSizeTreeProps<T extends FixedSizeNodeData> = TreeProps<
  FixedSizeNodeComponentProps<T>,
  T
> &
  Readonly<Pick<FixedSizeListProps, 'itemSize'>>;

export type FixedSizeTreeState<T extends FixedSizeNodeData> = TreeState<
  FixedSizeNodeComponentProps<T>,
  FixedSizeNodeRecordPublic<T>,
  FixedSizeOpennessStateOptions,
  T
>;

const computeTree = createTreeComputer<
  FixedSizeNodeComponentProps<FixedSizeNodeData>,
  FixedSizeNodeRecordPublic<FixedSizeNodeData>,
  FixedSizeOpennessStateOptions,
  FixedSizeNodeData,
  FixedSizeTreeProps<FixedSizeNodeData>,
  FixedSizeTreeState<FixedSizeNodeData>
>({
  createRecord,
  updateRecord,
});

export class FixedSizeTree<T extends FixedSizeNodeData = NodeData> extends Tree<
  FixedSizeNodeComponentProps<T>,
  FixedSizeNodeRecordPublic<T>,
  FixedSizeOpennessStateOptions,
  T,
  FixedSizeTreeProps<T>,
  FixedSizeTreeState<T>,
  FixedSizeList
> {
  public constructor(props: FixedSizeTreeProps<T>, context: any) {
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
