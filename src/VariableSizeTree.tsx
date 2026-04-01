import type { ReactNode } from 'react';
import { VariableSizeList, type VariableSizeListProps } from 'react-window';
import Tree, {
  createTreeComputer,
  type NodeData,
  type NodePublicState,
  type OpennessState,
  type TreeProps,
  type TreeState,
} from './Tree.tsx';
import { createBasicRecord, getIdByIndex } from './utils.ts';

export type VariableSizeNodeData = Readonly<{
  /** Default node height. Can be used only with VariableSizeTree */
  defaultHeight: number;
}> &
  NodeData;

export type VariableSizeNodePublicState<T extends VariableSizeNodeData> =
  NodePublicState<T> & {
    height: number;
    resize(height: number, shouldForceUpdate?: boolean): void;
  };

export type VariableSizeTreeProps<TData extends VariableSizeNodeData> =
  TreeProps<TData, VariableSizeNodePublicState<TData>, VariableSizeList> &
    Readonly<{
      itemSize?: VariableSizeListProps['itemSize'];
    }>;

export type VariableSizeTreeState<T extends VariableSizeNodeData> = TreeState<
  T,
  VariableSizeNodePublicState<T>,
  VariableSizeList
> &
  Readonly<{
    resetAfterId(id: string, shouldForceUpdate?: boolean): void;
  }>;

const computeTree = createTreeComputer<
  VariableSizeNodeData,
  VariableSizeNodePublicState<VariableSizeNodeData>,
  VariableSizeTreeProps<VariableSizeNodeData>,
  VariableSizeTreeState<VariableSizeNodeData>
>({
  createRecord: (
    data,
    { recomputeTree, resetAfterId },
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
        setOpen: async (state): Promise<void> =>
          await recomputeTree({
            [data.id]: state,
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
  constructor(props: VariableSizeTreeProps<TData>, context: any) {
    super(props, context);
    this.getItemSize = this.getItemSize.bind(this);
    this.state = {
      ...this.state,
      computeTree,
      resetAfterId: this.resetAfterId.bind(this),
    };
  }

  resetAfterId(id: string, shouldForceUpdate: boolean = false): void {
    const { list, order = [] } = this.state;
    list.current?.resetAfterIndex(order.indexOf(id), shouldForceUpdate);
  }

  override async recomputeTree(
    state: OpennessState<TData, VariableSizeNodePublicState<TData>>,
  ): Promise<void> {
    return await super.recomputeTree(state).then(() => {
      this.state.list.current?.resetAfterIndex(0, true);
    });
  }

  override render(): ReactNode {
    const {
      children: _c,
      placeholder,
      itemSize,
      rowComponent = () => null,
      treeWalker: _t,
      ...rest
    } = this.props;
    const { attachRefs, order = [] } = this.state;

    return placeholder && order.length === 0 ? (
      placeholder
    ) : (
      <VariableSizeList
        {...rest}
        itemCount={order.length}
        itemData={this.getItemData()}
        itemKey={getIdByIndex}
        itemSize={itemSize ?? this.getItemSize}
        ref={attachRefs}
      >
        {rowComponent}
      </VariableSizeList>
    );
  }

  private getItemSize(index: number): number {
    return this.getRecordData(index).height;
  }
}
