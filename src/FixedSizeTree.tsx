import React, {ReactNode} from 'react';
import {FixedSizeList, FixedSizeListProps} from 'react-window';
import Tree, {
  createTreeComputer,
  NodeComponentProps,
  NodeData,
  NodeRecord,
  TreeProps,
  TreeState,
  UpdateOptions,
} from './Tree';
import {createRecord, updateRecord} from './utils';

export type FixedSizeNodeData = NodeData;

export type FixedSizeNodeComponentProps<
  T extends FixedSizeNodeData
> = NodeComponentProps<T>;

export type FixedSizeNodeRecord<T extends FixedSizeNodeData> = NodeRecord<T>;

export type FixedSizeUpdateOptions = UpdateOptions;

export type FixedSizeTreeProps<T extends FixedSizeNodeData> = TreeProps<
  FixedSizeNodeComponentProps<T>,
  T
> &
  Readonly<Pick<FixedSizeListProps, 'itemSize'>>;

export type FixedSizeTreeState<T extends FixedSizeNodeData> = TreeState<
  FixedSizeNodeComponentProps<T>,
  FixedSizeNodeRecord<T>,
  FixedSizeUpdateOptions,
  T
>;

const computeTree = createTreeComputer<
  FixedSizeNodeComponentProps<FixedSizeNodeData>,
  FixedSizeNodeRecord<FixedSizeNodeData>,
  FixedSizeUpdateOptions,
  FixedSizeNodeData,
  FixedSizeTreeProps<FixedSizeNodeData>,
  FixedSizeTreeState<FixedSizeNodeData>
>({
  createRecord,
  updateRecord,
});

export class FixedSizeTree<T extends FixedSizeNodeData = NodeData> extends Tree<
  FixedSizeNodeComponentProps<T>,
  FixedSizeNodeRecord<T>,
  FixedSizeUpdateOptions,
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
        itemData={this.state}
        ref={this.list}
      >
        {rowComponent!}
      </FixedSizeList>
    );
  }
}
