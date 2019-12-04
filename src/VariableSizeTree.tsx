import * as React from 'react';
import {Align, VariableSizeList, VariableSizeListProps} from 'react-window';
import {
  CommonNodeComponentProps,
  CommonNodeData,
  CommonNodeRecord,
  CommonUpdateOptions,
  Row,
  TreeProps,
  TreeState,
} from './utils';

export type VariableSizeUpdateOptions = CommonUpdateOptions & {
  readonly useDefaultHeight?: boolean;
};

export type VariableSizeNodeData<T> = {
  /** Default node height. Can be used only with VariableSizeTree */
  readonly defaultHeight: number;
} & CommonNodeData<T>;

export type VariableSizeNodeComponentProps<T> = CommonNodeComponentProps<
  VariableSizeNodeData<T>,
  T
> & {
  readonly height: number;
  readonly resize: (height: number, shouldForceUpdate?: boolean) => void;
};

export type VariableSizeNodeRecord<T> = CommonNodeRecord<
  VariableSizeNodeData<T>,
  T
> & {
  height: number;
  data: VariableSizeNodeData<T>;
  readonly resize: (height: number, shouldForceUpdate?: boolean) => void;
};

export type VariableSizeTreeProps<T> = TreeProps<VariableSizeNodeData<T>, T> &
  Omit<VariableSizeListProps, 'children' | 'itemCount' | 'itemSize'> & {
    readonly children: React.ComponentType<VariableSizeNodeComponentProps<T>>;
    readonly itemSize?: VariableSizeListProps['itemSize'];
  };

export type VariableSizeTreeState<T> = TreeState<
  VariableSizeNodeComponentProps<T>,
  VariableSizeNodeRecord<T>,
  VariableSizeNodeData<T>,
  T
>;

export default class VariableSizeTree<T> extends React.PureComponent<
  VariableSizeTreeProps<T>,
  VariableSizeTreeState<T>
> {
  public static defaultProps: Partial<VariableSizeTreeProps<{}>> = {
    rowComponent: Row,
  };

  public static getDerivedStateFromProps({
    children: component,
    itemData: treeData,
  }: VariableSizeTreeProps<{}>): Partial<VariableSizeTreeState<{}>> {
    return {
      component,
      treeData,
    };
  }

  private readonly list: React.RefObject<VariableSizeList> = React.createRef();

  public constructor(props: VariableSizeTreeProps<T>, context: any) {
    super(props, context);

    this.getItemSize = this.getItemSize.bind(this);

    const initialState: VariableSizeTreeState<T> = {
      component: props.children,
      order: [],
      records: {},
    };

    this.state = {
      ...initialState,
      ...this.computeTree({refreshNodes: true}, props, initialState),
    };
  }

  public async recomputeTree(
    options?: VariableSizeUpdateOptions,
  ): Promise<void> {
    return new Promise(resolve => {
      this.setState<never>(
        prevState => this.computeTree(options, this.props, prevState),
        () => {
          if (options?.useDefaultHeight) {
            this.list.current?.resetAfterIndex(0, true);
          }

          resolve();
        },
      );
    });
  }

  public resetAfterId(
    id: string | symbol,
    shouldForceUpdate: boolean = false,
  ): void {
    this.list.current?.resetAfterIndex(
      this.state.order.indexOf(id),
      shouldForceUpdate,
    );
  }

  public scrollTo(scrollOffset: number): void {
    this.list.current?.scrollTo(scrollOffset);
  }

  public scrollToItem(id: string | symbol, align?: Align): void {
    this.list.current?.scrollToItem(this.state.order.indexOf(id) || 0, align);
  }

  public render(): React.ReactNode {
    const {children, itemSize, rowComponent, treeWalker, ...rest} = this.props;

    return (
      <VariableSizeList
        {...rest}
        itemData={this.state}
        itemCount={this.state.order.length}
        // tslint:disable-next-line:no-unbound-method
        itemSize={itemSize || this.getItemSize}
        ref={this.list}
      >
        {rowComponent!}
      </VariableSizeList>
    );
  }

  private computeTree(
    {
      refreshNodes = false,
      useDefaultHeight = false,
      useDefaultOpenness = false,
    }: VariableSizeUpdateOptions = {},
    {treeWalker}: VariableSizeTreeProps<T>,
    {records: prevRecords}: VariableSizeTreeState<T>,
  ): Pick<VariableSizeTreeState<T>, 'order' | 'records'> {
    const order: Array<string | symbol> = [];
    const records = {...prevRecords};
    const iter = treeWalker(refreshNodes);

    if (useDefaultHeight || useDefaultOpenness) {
      for (const id in records) {
        if (useDefaultHeight) {
          records[id].height = records[id].data.defaultHeight;
        }

        if (useDefaultOpenness) {
          records[id].isOpen = records[id].data.isOpenByDefault;
        }
      }
    }

    let isPreviousOpened = false;

    while (true) {
      const {done, value} = iter.next(isPreviousOpened);

      if (done || !value) {
        break;
      }

      let id: string | symbol;

      if (typeof value === 'string' || typeof value === 'symbol') {
        id = value;

        if (useDefaultOpenness) {
          records[id as string].isOpen =
            records[id as string].data.isOpenByDefault;
        }

        if (useDefaultHeight) {
          records[id as string].height =
            records[id as string].data.defaultHeight;
        }
      } else {
        ({id} = value);
        const {defaultHeight, isOpenByDefault} = value;
        const record = records[id as string];

        if (!record) {
          records[id as string] = this.createNodeRecord(value);
        } else {
          record.data = value;

          if (useDefaultOpenness) {
            record.isOpen = isOpenByDefault;
          }

          if (useDefaultHeight) {
            record.height = defaultHeight;
          }
        }
      }

      order.push(id);
      isPreviousOpened = records[id as string].isOpen;
    }

    return {
      order,
      records,
    };
  }

  private createNodeRecord(
    data: VariableSizeNodeData<T>,
  ): VariableSizeNodeRecord<T> {
    const record: VariableSizeNodeRecord<T> = {
      data,
      height: data.defaultHeight,
      isOpen: data.isOpenByDefault,
      resize: (height: number, shouldForceUpdate?: boolean) => {
        record.height = height;
        this.resetAfterId(record.data.id, shouldForceUpdate);
      },
      toggle: async () => {
        record.isOpen = !record.isOpen;
        await this.recomputeTree({
          refreshNodes: record.isOpen,
          useDefaultHeight: true,
        });
      },
    };

    return record;
  }

  private getItemSize(index: number): number {
    const {order, records} = this.state;

    return records[order[index] as string].height;
  }
}
