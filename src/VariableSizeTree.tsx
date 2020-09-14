import React, {ReactNode} from 'react';
import {VariableSizeList, VariableSizeListProps} from 'react-window';
import Tree, {
  createTreeComputer,
  NodeComponentProps,
  NodeData,
  NodeRecord,
  TreeProps,
  TreeState,
  UpdateOptions,
} from './Tree';
import {createConnections, updateRecord} from './utils';

export type VariableSizeNodeData = Readonly<{
  /** Default node height. Can be used only with VariableSizeTree */
  defaultHeight: number;
}> &
  NodeData;

export type VariableSizeNodeComponentProps<
  T extends VariableSizeNodeData
> = NodeComponentProps<T> &
  Readonly<{
    height: number;
    resize: (height: number, shouldForceUpdate?: boolean) => void;
  }>;

export type VariableSizeNodeRecord<T extends VariableSizeNodeData> = NodeRecord<
  T
> & {
  height: number;
  readonly resize: (height: number, shouldForceUpdate?: boolean) => void;
};

export type VariableSizeUpdateOptions = UpdateOptions &
  Readonly<{
    useDefaultHeight?: boolean;
  }>;

export type VariableSizeTreeProps<T extends VariableSizeNodeData> = TreeProps<
  VariableSizeNodeComponentProps<T>,
  T
> &
  Readonly<{
    itemSize?: VariableSizeListProps['itemSize'];
  }>;

export type VariableSizeTreeState<T extends VariableSizeNodeData> = TreeState<
  VariableSizeNodeComponentProps<T>,
  VariableSizeNodeRecord<T>,
  VariableSizeUpdateOptions,
  T
> &
  Readonly<{
    resetAfterId: (id: string | symbol, shouldForceUpdate?: boolean) => void;
  }>;

const computeTree = createTreeComputer<
  VariableSizeNodeComponentProps<VariableSizeNodeData>,
  VariableSizeNodeRecord<VariableSizeNodeData>,
  VariableSizeUpdateOptions,
  VariableSizeNodeData,
  VariableSizeTreeProps<VariableSizeNodeData>,
  VariableSizeTreeState<VariableSizeNodeData>
>({
  createRecord: ({data, node}, {recomputeTree, resetAfterId}, parent) => {
    const record = {
      connections: createConnections(parent),
      data,
      height: data.defaultHeight,
      isOpen: data.isOpenByDefault,
      isShown: parent ? parent.isOpen : true,
      node,
      resize(height: number, shouldForceUpdate?: boolean): void {
        record.height = height;
        resetAfterId(record.data.id, shouldForceUpdate);
      },
      toggle: (): Promise<void> =>
        recomputeTree({
          opennessState: {
            [data.id]: !record.isOpen,
          },
          useDefaultHeight: true,
        }),
    };

    return record;
  },
  updateRecord: (record, options) => {
    if (options.useDefaultHeight) {
      record.height = record.data.defaultHeight;
    }

    updateRecord(record, options);
  },
});

export class VariableSizeTree<T extends VariableSizeNodeData> extends Tree<
  VariableSizeNodeComponentProps<T>,
  VariableSizeNodeRecord<T>,
  VariableSizeUpdateOptions,
  T,
  VariableSizeTreeProps<T>,
  VariableSizeTreeState<T>,
  VariableSizeList
> {
  public constructor(props: VariableSizeTreeProps<T>, context: any) {
    super(props, context);
    this.getItemSize = this.getItemSize.bind(this);
    this.state = {
      ...this.state,
      computeTree,
      resetAfterId: this.resetAfterId.bind(this),
    };
  }

  public resetAfterId(
    id: string | symbol,
    shouldForceUpdate: boolean = false,
  ): void {
    this.list.current?.resetAfterIndex(
      this.state.order!.indexOf(id),
      shouldForceUpdate,
    );
  }

  public recomputeTree(options?: VariableSizeUpdateOptions): Promise<void> {
    return super.recomputeTree(options).then(() => {
      this.list.current?.resetAfterIndex(0, true);
    });
  }

  public render(): ReactNode {
    const {children, itemSize, rowComponent, treeWalker, ...rest} = this.props;

    return (
      <VariableSizeList
        {...rest}
        itemCount={this.state.order!.length}
        itemData={this.state}
        // eslint-disable-next-line @typescript-eslint/unbound-method
        itemSize={itemSize ?? this.getItemSize}
        ref={this.list}
      >
        {rowComponent!}
      </VariableSizeList>
    );
  }

  private getItemSize(index: number): number {
    const {order, records} = this.state;

    return records.get(order![index])!.height;
  }
}
