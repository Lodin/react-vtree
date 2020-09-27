import React, {ReactNode} from 'react';
import {VariableSizeList, VariableSizeListProps} from 'react-window';
import Tree, {
  createTreeComputer,
  NodeData,
  NodeRecordPublic,
  OpennessState,
  TreeProps,
  TreeState,
} from './Tree';
import {createBasicRecord} from './utils';

export type VariableSizeNodeData = Readonly<{
  /** Default node height. Can be used only with VariableSizeTree */
  defaultHeight: number;
}> &
  NodeData;

export type VariableSizeNodeRecordPublic<
  T extends VariableSizeNodeData
> = NodeRecordPublic<T> & {
  height: number;
  readonly resize: (height: number, shouldForceUpdate?: boolean) => void;
};

export type VariableSizeTreeProps<
  TData extends VariableSizeNodeData
> = TreeProps<TData, VariableSizeNodeRecordPublic<TData>> &
  Readonly<{
    itemSize?: VariableSizeListProps['itemSize'];
  }>;

export type VariableSizeTreeState<T extends VariableSizeNodeData> = TreeState<
  T,
  VariableSizeNodeRecordPublic<T>
> &
  Readonly<{
    resetAfterId: (id: string | symbol, shouldForceUpdate?: boolean) => void;
  }>;

const computeTree = createTreeComputer<
  VariableSizeNodeData,
  VariableSizeNodeRecordPublic<VariableSizeNodeData>,
  VariableSizeTreeProps<VariableSizeNodeData>,
  VariableSizeTreeState<VariableSizeNodeData>
>({
  createRecord: (data, {recomputeTree, resetAfterId}, parent) => {
    const record = createBasicRecord(
      {
        data,
        height: data.defaultHeight,
        isOpen: data.isOpenByDefault,
        resize: (height: number, shouldForceUpdate?: boolean): void => {
          record.public.height = height;
          resetAfterId(record.public.data.id, shouldForceUpdate);
        },
        toggle: (): Promise<void> =>
          recomputeTree({
            [data.id]: !record.public.isOpen,
          }),
      },
      parent,
    );

    return record;
  },
});

export class VariableSizeTree<TData extends VariableSizeNodeData> extends Tree<
  TData,
  VariableSizeNodeRecordPublic<TData>,
  VariableSizeTreeProps<TData>,
  VariableSizeTreeState<TData>,
  VariableSizeList
> {
  public constructor(props: VariableSizeTreeProps<TData>, context: any) {
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

  public recomputeTree(
    options: OpennessState<TData, VariableSizeNodeRecordPublic<TData>>,
  ): Promise<void> {
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
        itemData={this.getItemData()}
        // eslint-disable-next-line @typescript-eslint/unbound-method
        itemSize={itemSize ?? this.getItemSize}
        ref={this.list}
      >
        {rowComponent!}
      </VariableSizeList>
    );
  }

  private getItemSize(index: number): number {
    return this.getRecordData(index).height;
  }
}
