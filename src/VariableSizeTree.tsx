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
import {
  shouldUpdateRecords,
  updateRecord,
  updateRecordOnNewData,
} from './utils';

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
  createRecord: (data, {opennessState}, {recomputeTree, resetAfterId}) => {
    const record = {
      data,
      height: data.defaultHeight,
      isOpen: opennessState?.[data.id as string] ?? data.isOpenByDefault,
      resize(height: number, shouldForceUpdate?: boolean): void {
        record.height = height;
        resetAfterId(record.data.id, shouldForceUpdate);
      },
      toggle(): Promise<void> {
        record.isOpen = !record.isOpen;

        return recomputeTree({
          refreshNodes: record.isOpen,
          useDefaultHeight: true,
        });
      },
    };

    return record;
  },
  shouldUpdateRecords: (options) =>
    shouldUpdateRecords(options) || (options.useDefaultHeight ?? false),
  updateRecord: (record, recordId, options) => {
    if (options.useDefaultHeight) {
      record.height = record.data.defaultHeight;
    }

    updateRecord(record, recordId, options);
  },

  updateRecordOnNewData: (record, options) => {
    updateRecordOnNewData(record, options);

    if (options.useDefaultHeight) {
      record.height = record.data.defaultHeight;
    }
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

    return records[order![index] as string]!.height;
  }
}
