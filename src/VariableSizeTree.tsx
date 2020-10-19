import React, {ReactNode} from 'react';
import {VariableSizeList, VariableSizeListProps} from 'react-window';
import Tree, {
  createTreeComputer,
  NodeData,
  NodePublicState,
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

export type VariableSizeNodePublicState<
  T extends VariableSizeNodeData
> = NodePublicState<T> & {
  height: number;
  readonly resize: (height: number, shouldForceUpdate?: boolean) => void;
};

export type VariableSizeTreeProps<
  TData extends VariableSizeNodeData
> = TreeProps<TData, VariableSizeNodePublicState<TData>> &
  Readonly<{
    itemSize?: VariableSizeListProps['itemSize'];
  }>;

export type VariableSizeTreeState<T extends VariableSizeNodeData> = TreeState<
  T,
  VariableSizeNodePublicState<T>
> &
  Readonly<{
    resetAfterId: (id: string | symbol, shouldForceUpdate?: boolean) => void;
  }>;

const computeTree = createTreeComputer<
  VariableSizeNodeData,
  VariableSizeNodePublicState<VariableSizeNodeData>,
  VariableSizeTreeProps<VariableSizeNodeData>,
  VariableSizeTreeState<VariableSizeNodeData>
>({
  createRecord: (
    data,
    {recomputeTree, resetAfterId},
    parent,
    previousRecord,
  ) => {
    const record = createBasicRecord(
      {
        data,
        height: previousRecord
          ? previousRecord.public.height
          : data.defaultHeight,
        isOpen: previousRecord
          ? previousRecord.public.isOpen
          : data.isOpenByDefault,
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
  VariableSizeNodePublicState<TData>,
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
    state: OpennessState<TData, VariableSizeNodePublicState<TData>>,
  ): Promise<void> {
    return super.recomputeTree(state).then(() => {
      this.list.current?.resetAfterIndex(0, true);
    });
  }

  public render(): ReactNode {
    const {
      children,
      placeholder,
      itemSize,
      rowComponent,
      treeWalker,
      ...rest
    } = this.props;
    const {order} = this.state;

    return placeholder && order!.length === 0 ? (
      placeholder
    ) : (
      <VariableSizeList
        {...rest}
        itemCount={order!.length}
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
