import React, {ReactNode} from 'react';
import {VariableSizeList, VariableSizeListProps} from 'react-window';
import Tree, {
  createTreeComputer,
  NodeComponentProps,
  NodeData,
  NodeRecord,
  TreeProps,
  TreeState,
  NodeRecordPublic,
  OpennessStateOptions,
  OpennessState,
} from './Tree';
import {createRecord, updateRecord} from './utils';

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

export type VariableSizeNodeRecordPublic<
  T extends VariableSizeNodeData
> = NodeRecordPublic<T> & {
  height: number;
  readonly resize: (height: number, shouldForceUpdate?: boolean) => void;
};

export type VariableSizeOpennessStateOptions = OpennessStateOptions &
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
  VariableSizeNodeRecordPublic<T>,
  VariableSizeOpennessStateOptions,
  T
> &
  Readonly<{
    resetAfterId: (id: string | symbol, shouldForceUpdate?: boolean) => void;
  }>;

const computeTree = createTreeComputer<
  VariableSizeNodeComponentProps<VariableSizeNodeData>,
  VariableSizeNodeRecordPublic<VariableSizeNodeData>,
  VariableSizeOpennessStateOptions,
  VariableSizeNodeData,
  VariableSizeTreeProps<VariableSizeNodeData>,
  VariableSizeTreeState<VariableSizeNodeData>
>({
  createRecord: (value, state, parent) => {
    const {data} = value;
    const {recomputeTree, resetAfterId} = state;

    const record = createRecord(value, state, parent) as NodeRecord<
      VariableSizeNodeRecordPublic<VariableSizeNodeData>
    >;

    Object.assign(record.public, {
      height: data.defaultHeight,
      resize(height: number, shouldForceUpdate?: boolean): void {
        record.public.height = height;
        resetAfterId(record.public.data.id, shouldForceUpdate);
      },
      toggle: (): Promise<void> =>
        recomputeTree({
          [data.id]: {
            open: !record.public.isOpen,
            useDefaultHeight: true,
          },
        }),
    });

    return record;
  },
  updateRecord: (record, id, options) => {
    if (options.useDefaultHeight) {
      record.public.height = record.public.data.defaultHeight;
    }

    updateRecord(record, id, options);
  },
});

export class VariableSizeTree<T extends VariableSizeNodeData> extends Tree<
  VariableSizeNodeComponentProps<T>,
  VariableSizeNodeRecordPublic<T>,
  VariableSizeOpennessStateOptions,
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

  public recomputeTree(
    options: OpennessState<VariableSizeOpennessStateOptions>,
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
