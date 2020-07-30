/* eslint-disable react/no-unused-state */
import React from 'react';
import {FixedSizeList, FixedSizeListProps} from 'react-window';
import Tree, {
  NodeComponentProps,
  NodeData,
  NodeRecord,
  TreeProps,
  TreeState,
  UpdateOptions,
} from './Tree';

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

export class FixedSizeTree<T extends FixedSizeNodeData = NodeData> extends Tree<
  FixedSizeNodeComponentProps<T>,
  FixedSizeNodeRecord<T>,
  FixedSizeUpdateOptions,
  T,
  FixedSizeTreeProps<T>,
  FixedSizeTreeState<T>,
  FixedSizeList
> {
  public render(): React.ReactNode {
    const {children, treeWalker, rowComponent, ...rest} = this.props;

    return (
      <FixedSizeList
        {...rest}
        itemData={this.state}
        itemCount={this.state.order!.length}
        ref={this.list}
      >
        {rowComponent!}
      </FixedSizeList>
    );
  }

  // eslint-disable-next-line class-methods-use-this
  protected constructState(
    state: FixedSizeTreeState<T>,
  ): FixedSizeTreeState<T> {
    return state;
  }
}
