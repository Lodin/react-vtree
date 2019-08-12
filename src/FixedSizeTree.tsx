import * as React from 'react';
import {Align, FixedSizeList, FixedSizeListProps} from 'react-window';
import {
  CommonNodeComponentProps,
  CommonNodeData,
  CommonNodeRecord,
  CommonUpdateOptions,
  Row,
  TreeProps,
  TreeState,
} from './utils';

export type FixedSizeUpdateOptions = CommonUpdateOptions;
export type FixedSizeNodeData<T> = CommonNodeData<T>;
export type FixedSizeNodeComponentProps<T> = CommonNodeComponentProps<
  FixedSizeNodeData<T>,
  T
>;
export type FixedSizeNodeRecord<T> = CommonNodeRecord<FixedSizeNodeData<T>, T>;

export type FixedSizeTreeProps<T> = TreeProps<FixedSizeNodeData<T>, T> &
  Omit<FixedSizeListProps, 'children' | 'itemCount'> & {
    readonly children: React.ComponentType<FixedSizeNodeComponentProps<T>>;
  };

export type FixedSizeTreeState<T> = TreeState<
  FixedSizeNodeComponentProps<T>,
  FixedSizeNodeRecord<T>,
  FixedSizeNodeData<T>,
  T
>;

export default class FixedSizeTree<T> extends React.PureComponent<
  FixedSizeTreeProps<T>,
  FixedSizeTreeState<T>
> {
  public static defaultProps: Partial<FixedSizeTreeProps<{}>> = {
    rowComponent: Row,
  };

  public static getDerivedStateFromProps({
    children: component,
    itemData: treeData,
  }: FixedSizeTreeProps<{}>): Partial<FixedSizeTreeState<{}>> {
    return {
      component,
      treeData,
    };
  }

  private readonly list: React.RefObject<FixedSizeList> = React.createRef();

  public constructor(props: FixedSizeTreeProps<T>, context: any) {
    super(props, context);

    this.createNodeRecord = this.createNodeRecord.bind(this);

    const initialState: FixedSizeTreeState<T> = {
      component: props.children,
      order: [],
      records: {},
    };

    this.state = {
      ...initialState,
      ...this.computeTree({refreshNodes: true}, props, initialState),
    };
  }

  public async recomputeTree(options: FixedSizeUpdateOptions): Promise<void> {
    return new Promise(resolve => {
      this.setState<never>(
        prevState => this.computeTree(options, this.props, prevState),
        resolve,
      );
    });
  }

  public scrollTo(scrollOffset: number): void {
    if (this.list.current) {
      this.list.current.scrollTo(scrollOffset);
    }
  }

  public scrollToItem(id: string | symbol, align?: Align): void {
    if (this.list.current) {
      this.list.current.scrollToItem(this.state.order.indexOf(id) || 0, align);
    }
  }

  public render(): React.ReactNode {
    const {children, treeWalker, rowComponent, ...rest} = this.props;

    return (
      <FixedSizeList
        {...rest}
        itemData={this.state}
        itemCount={this.state.order.length}
        ref={this.list}
      >
        {rowComponent!}
      </FixedSizeList>
    );
  }

  private computeTree(
    {refreshNodes = false, useDefaultOpenness = false}: FixedSizeUpdateOptions,
    {treeWalker}: FixedSizeTreeProps<T>,
    {records: prevRecords}: FixedSizeTreeState<T>,
  ): Pick<FixedSizeTreeState<T>, 'order' | 'records'> {
    const order: Array<string | symbol> = [];
    const records = {...prevRecords};
    const iter = treeWalker(refreshNodes);

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
      } else {
        ({id} = value);
        const {isOpenByDefault} = value;
        const record = records[id as string];

        if (!record) {
          records[id as string] = this.createNodeRecord(value);
        } else {
          record.data = value;

          if (useDefaultOpenness) {
            record.isOpen = isOpenByDefault;
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

  private createNodeRecord(data: FixedSizeNodeData<T>): FixedSizeNodeRecord<T> {
    const record: FixedSizeNodeRecord<T> = {
      data,
      isOpen: data.isOpenByDefault,
      toggle: async () => {
        record.isOpen = !record.isOpen;
        await this.recomputeTree({refreshNodes: record.isOpen});
      },
    };

    return record;
  }
}
