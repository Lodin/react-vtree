import 'jest-enzyme';

import {ReactWrapper} from 'enzyme';
import * as React from 'react';
import {IndexRange, OverscanIndexRange, ScrollEventData} from 'react-virtualized';
import Tree, {defaultRowRenderer, TreeProps} from '../src';
import {RowRendererParams} from '../src/types';
import {Update} from '../src/utils';
import {
  createNodeCreator,
  createNodeGetter,
  createTreeRenderer, NodeGetterMock,
  overscanIndicesGetter, SpecNode, TreeRenderer,
} from './helpers';

const NODE_COUNT = 156;

describe('Tree', () => {
  const renderTree = createTreeRenderer({
    nodeGetter: createNodeGetter(),
  });

  const renderClosedTree = createTreeRenderer({
    nodeGetter: createNodeGetter({
      isOpenedByDefault: false,
    }),
  });

  describe('number of rendered children', () => {
    it('should render enough children to fill the view', () => {
      const rendered = renderTree();
      expect(rendered.find('.treeNode').length)
        .toBe(10);
    });

    it('should not render more children than available if the list is not filled', () => {
      const rendered = renderClosedTree();
      expect(rendered.find('.treeNode').length)
        .toBe(1);
    });
  });

  describe('scrollToPosition', () => {
    it('should scroll to the top', () => {
      const rendered = renderTree();
      const instance = rendered.instance() as Tree;

      instance.scrollToPosition(100);

      expect(rendered)
        .toIncludeText('Name 10');
      expect(rendered)
        .toIncludeText('Name 19');
    });
  });

  describe('toggleNodes', () => {
    // @ts-ignore
    it('should change nodes states', async () => {
      const rendered = renderClosedTree();
      const instance = rendered.instance() as Tree;

      expect(rendered.find('.treeNode').length)
        .toBe(1);

      await instance.toggleNodes({0: true});
      rendered.update(); // TODO: remove when https://github.com/airbnb/enzyme/issues/1229 is resolved
      expect(rendered.find('.treeNode').length)
        .toBe(6);

      await instance.toggleNodes({0: false});
      rendered.update(); // TODO: remove when https://github.com/airbnb/enzyme/issues/1229 is resolved
      expect(rendered.find('.treeNode').length)
        .toBe(1);
    });
  });

  describe('scrollToIndex', () => {
    it('should scroll to the top', () => {
      const rendered = renderTree({scrollToIndex: 0});
      expect(rendered)
        .toIncludeText('Name 0');
    });

    it('should scroll down to the middle', () => {
      const rendered = renderTree({scrollToIndex: 49});
      // 100 items * 10 item height = 1,000 total item height
      // 10 items can be visible at a time and :scrollTop is initially 0,
      // So the minimum amount of scrolling leaves the 50th item at the bottom (just scrolled into view).
      expect(rendered)
        .toIncludeText('Name 49');
    });

    it('should scroll to the bottom', () => {
      const rendered = renderTree({scrollToIndex: 99});
      // 100 height - 10 header = 90 available scroll space.
      // 100 items * 10 item height = 1,000 total item height
      // Target height for the last item then is 1000 - 90
      expect(rendered)
        .toIncludeText('Name 99');
    });

    it('should scroll to the correct position for :scrollToAlignment "start"', () => {
      const rendered = renderTree({
        scrollToAlignment: 'start',
        scrollToIndex: 49,
      });

      // 100 items * 10 item height = 1,000 total item height; 10 items can be visible at a time.
      expect(rendered)
        .toIncludeText('Name 49');
      expect(rendered)
        .toIncludeText('Name 58');
    });

    it('should scroll to the correct position for :scrollToAlignment "end"', () => {
      const rendered = renderTree({
        scrollToIndex: 99,
      });

      rendered.setProps({
        scrollToAlignment: 'end',
        scrollToIndex: 49,
      });

      // 100 items * 10 item height = 1,000 total item height; 10 items can be visible at a time.
      expect(rendered)
        .toIncludeText('Name 40');
      expect(rendered)
        .toIncludeText('Name 49');
    });

    it('should scroll to the correct position for :scrollToAlignment "center"', () => {
      const rendered = renderTree({
        scrollToIndex: 99,
      });

      rendered.setProps({
        scrollToAlignment: 'center',
        scrollToIndex: 49,
      });

      // 100 items * 10 item height = 1,000 total item height; 11 items can be visible at a time (the first and last
      // item are only partially visible)
      expect(rendered)
        .toIncludeText('Name 44');
      expect(rendered)
        .toIncludeText('Name 54');
    });
  });

  describe('property updates', () => {
    it('should update :scrollToIndex position when :rowHeight changes', () => {
      const rendered = renderTree({scrollToIndex: 50});
      expect(rendered).toIncludeText('Name 50');
      // Making rows taller pushes name off/beyond the scrolled area
      rendered.setProps({scrollToIndex: 50, rowHeight: 20});
      expect(rendered).toIncludeText('Name 50');
    });

    it('should update :scrollToIndex position when :height changes', () => {
      const rendered = renderTree({scrollToIndex: 50});
      expect(rendered).toIncludeText('Name 50');

      // Making the tree shorter leaves only room for 1 item
      rendered.setProps({scrollToIndex: 50, height: 20});
      expect(rendered).toIncludeText('Name 50');
    });

    it('should update :scrollToIndex position when :scrollToIndex changes', () => {
      const rendered = renderTree();
      expect(rendered).not.toIncludeText('Name 50');

      rendered.setProps({scrollToIndex: 50});
      expect(rendered).toIncludeText('Name 50');
    });

    it('should update scroll position if size shrinks smaller than the current scroll', async () => {
      const rendered = renderTree({scrollToIndex: 500});
      const instance = rendered.instance() as Tree;

      await instance.toggleNodes({0: false});

      expect(rendered).toIncludeText('Name 0');
    });
  });

  describe('noRowsRenderer', () => {
    it('should call :noRowsRenderer if :rowCount is 0', () => {
      const rendered = renderTree({
        *nodeGetter(): IterableIterator<null> {
          return null;
        },
        noRowsRenderer(): React.ReactNode {
          return <div>No rows!</div>;
        },
      });

      expect(rendered).toIncludeText('No rows!');
    });

    it('should render an empty body if :rowCount is 0 and there is no :noRowsRenderer', () => {
      const rendered = renderTree({
        *nodeGetter(): IterableIterator<null> {
          return null;
        },
      });

      expect(rendered).toHaveText('');
    });
  });

  describe('onRowsRendered', () => {
    let startIndex: number | undefined;
    let stopIndex: number | undefined;

    afterEach(() => {
      startIndex = undefined;
      stopIndex = undefined;
    });

    it('should call :onRowsRendered if at least one row is rendered', () => {
      renderTree({
        onRowsRendered(params: IndexRange & OverscanIndexRange): void {
          ({startIndex, stopIndex} = params);
        },
      });

      expect(startIndex).toBe(0);
      expect(stopIndex).toBe(9);
    });

    it('should not call :onRowsRendered unless the start or stop indices have changed', () => {
      let numCalls = 0;

      const onRowsRendered = (params: IndexRange & OverscanIndexRange) => {
        ({startIndex, stopIndex} = params);
        numCalls += 1;
      };

      const rendered = renderTree({onRowsRendered});

      expect(numCalls).toBe(1);
      expect(startIndex).toBe(0);
      expect(stopIndex).toBe(9);

      rendered.setProps(onRowsRendered);

      expect(numCalls).toBe(1);
      expect(startIndex).toBe(0);
      expect(stopIndex).toBe(9);
    });

    it('should call :onRowsRendered if the start or stop indices have changed', () => {
      let numCalls = 0;

      const onRowsRendered = (params: IndexRange & OverscanIndexRange) => {
        ({startIndex, stopIndex} = params);
        numCalls += 1;
      };

      const rendered = renderTree({onRowsRendered});

      expect(numCalls).toBe(1);
      expect(startIndex).toBe(0);
      expect(stopIndex).toBe(9);

      rendered.setProps({
        height: 50,
        onRowsRendered,
      });

      expect(numCalls).toBe(2);
      expect(startIndex).toBe(0);
      expect(stopIndex).toBe(4);
    });

    it('should not call :onRowsRendered if no rows are rendered', () => {
      renderTree({
        height: 0,
        onRowsRendered(params: IndexRange & OverscanIndexRange): void {
          ({startIndex, stopIndex} = params);
        },
      });

      expect(startIndex).toBeUndefined();
      expect(stopIndex).toBeUndefined();
    });
  });

  describe(':scrollTop property', () => {
    const onRowsRendered = (params: IndexRange & OverscanIndexRange): void => {
      ({startIndex, stopIndex} = params);
    };

    let startIndex: number;
    let stopIndex: number;

    it('should render correctly when an initial :scrollTop property is specified', () => {
      renderTree({
        onRowsRendered,
        scrollTop: 100,
      });

      expect(startIndex).toBe(10);
      expect(stopIndex).toBe(19);
    });

    it('should render correctly when :scrollTop property is updated', () => {
      const rendered = renderTree({
        onRowsRendered,
      });

      expect(startIndex).toBe(0);
      expect(stopIndex).toBe(9);

      rendered.setProps({
        scrollTop: 100,
      });

      expect(startIndex).toBe(10);
      expect(stopIndex).toBe(19);
    });
  });

  describe('styles, classNames, and ids', () => {
    it('should use the expected global CSS classNames', () => {
      const rendered = renderTree();
      expect(rendered.children()).toHaveClassName('ReactVirtualized__Tree');
    });

    it('should use a custom :className as well if specified', () => {
      const rendered = renderTree({className: 'foo'});
      const children = rendered.children();

      expect(children).toHaveClassName('ReactVirtualized__Tree');
      expect(children).toHaveClassName('foo');
    });

    it('should use a custom :id if specified', () => {
      const rendered = renderTree({id: 'bar'});
      expect(rendered.prop('id')).toEqual('bar');
    });

    it('should use a custom :style if specified', () => {
      const style = {backgroundColor: 'red'};
      const rendered = renderTree({style});

      expect(rendered).toHaveStyle('backgroundColor', 'red');
    });

    it('should set the width of a row to be 100% by default', () => {
      const rendered = renderTree();
      const cell = rendered.find('.treeNode').at(0);
      expect(cell).toHaveStyle('width', '100%');
    });
  });

  describe('overscanRowCount', () => {
    let mock: jest.Mock<any>;

    beforeEach(() => {
      mock = jest.fn(overscanIndicesGetter);
    });

    it('should not overscan by default', () => {
      renderTree({
        overscanIndicesGetter: mock,
      });

      expect(mock.mock.calls[0][0].overscanCellsCount).toEqual(0);
      expect(mock.mock.calls[1][0].overscanCellsCount).toEqual(0);
    });

    it('should overscan the specified amount', () => {
      renderTree({
        overscanIndicesGetter: mock,
        overscanRowCount: 10,
      });

      expect(mock.mock.calls[0][0].overscanCellsCount).toEqual(0);
      expect(mock.mock.calls[1][0].overscanCellsCount).toEqual(10);
    });
  });

  describe('onScroll', () => {
    let onScrollCalls: ScrollEventData[];
    let rendered: ReactWrapper<TreeProps, any>;

    beforeEach(() => {
      onScrollCalls = [];

      rendered = renderTree({
        onScroll(params: ScrollEventData): void {
          onScrollCalls.push(params);
        },
      });
    });

    it('should trigger callback when component initially mounts', () => {
      expect(onScrollCalls).toEqual([
        {
          clientHeight: 100,
          scrollHeight: NODE_COUNT * 10,
          scrollTop: 0,
        },
      ]);
    });

    it('should trigger callback when component scrolls', () => {
      const instance = rendered.instance() as Tree;

      const target = {
        scrollLeft: 0,
        scrollTop: 100,
      };

      // @ts-ignore (HACK to work around _onScroll target check)
      instance.grid._scrollingContainer = target;

      rendered.simulate('scroll', {target});

      expect(onScrollCalls[onScrollCalls.length - 1]).toEqual({
        clientHeight: 100,
        scrollHeight: NODE_COUNT * 10,
        scrollTop: 100,
      });
    });
  });

  // TODO: Add tests for "measureAllRows"

  describe('forceUpdateGrid', () => {
    it('should refresh inner Grid content when called', () => {
      let marker = 'a';

      const rowRenderer = ({index, key, style}: RowRendererParams): React.ReactElement<any> => (
        <div key={key} style={style}>
          {index}
          {marker}
        </div>
      );

      const rendered = renderTree({rowRenderer});
      const instance = rendered.instance() as Tree;

      expect(rendered).toIncludeText('1a');
      marker = 'b';
      instance.forceUpdateGrid();
      expect(rendered).toIncludeText('1b');
    });
  });

  describe('tabIndex', () => {
    it('should be focusable by default', () => {
      const rendered = renderTree();
      expect(rendered.children()).toHaveProp('tabIndex', 0);
    });

    it('should allow tabIndex to be overridden', () => {
      const rendered = renderTree({
        tabIndex: -1,
      });
      expect(rendered.children()).toHaveProp('tabIndex', -1);
    });
  });

  describe('pure', () => {
    it('should not re-render unless props have changed', () => {
      let rowRendererCalled = false;

      const rowRenderer = (params: RowRendererParams): React.ReactElement<any> => {
        rowRendererCalled = true;

        return defaultRowRenderer(params);
      };

      const rendered = renderTree({rowRenderer});
      expect(rowRendererCalled).toBeTruthy();

      rowRendererCalled = false;

      rendered.update();
      expect(rowRendererCalled).not.toBeTruthy();
    });
  });

  it('should set the width of the single-column inner Grid to auto', () => {
    const rendered = renderTree();
    const cls = '.ReactVirtualized__Grid__innerScrollContainer';
    expect(rendered.find(cls)).toHaveStyle('width', 'auto');
  });

  it('should handle click on toggle button', () => {
    const rendered = renderClosedTree();
    expect(rendered.find('.treeNode').length).toBe(1);

    const button = rendered.find('.treeNode button');
    button.simulate('click');

    expect(rendered.find('.treeNode').length).toBe(6);
  });

  describe('update', () => {
    let marker: string;

    const rowRenderer = ({index, key, style}: RowRendererParams): React.ReactElement<any> => (
      <div key={key} style={style}>
        {index}
        {marker}
      </div>
    );

    beforeEach(() => {
      marker = 'a';
    });

    it('should re-render component every time if :update prop is set to Update.Nodes', () => {
      const props = {
        rowRenderer,
        update: Update.Nodes,
      };
      const rendered = renderTree(props);
      expect(rendered).toIncludeText('1a');

      marker = 'b';

      rendered.setProps(props);
      expect(rendered).toIncludeText('1b');

      marker = 'c';

      rendered.setProps(props);
      expect(rendered).toIncludeText('1c');
    });

    it('should stop re-rendering if :update prop is set to Update.None and other props are the same', () => {
      const props = {rowRenderer};
      const rendered = renderTree(props);
      expect(rendered).toIncludeText('1a');

      marker = 'b';

      rendered.setProps({
        ...props,
        update: Update.Nodes,
      });
      expect(rendered).toIncludeText('1b');

      marker = 'c';

      rendered.setProps({
        ...props,
        update: Update.None,
      });
      expect(rendered).toIncludeText('1b');
    });
  });

  describe('recomputeTree', () => {
    let root: SpecNode;
    let nodeGetter: NodeGetterMock;
    let renderCustomTree: TreeRenderer;

    beforeEach(() => {
      root = createNodeCreator(2)();

      nodeGetter = jest.fn(createNodeGetter({
        root,
      }));

      renderCustomTree = createTreeRenderer({
        nodeGetter,
      });
    });

    it('should change only tree elements order if :update is Update.Order', async () => {
      const rendered = renderCustomTree();
      const instance = rendered.instance() as Tree;

      root.children.sort((a, b) => {
        const aId = parseInt(a.id, 10);
        const bId = parseInt(b.id, 10);

        if (aId < bId) {
          return 1;
        } else if (aId > bId) {
          return -1;
        }

        return 0;
      });

      root.children = root.children.map(n => ({
        ...n,
        name: `ChangedName ${n.id}`,
      }));

      await instance.recomputeTree(Update.Order);

      expect(rendered.find('.treeNode').at(1)).toIncludeText('25');
      expect(rendered.find('.treeNode').at(1)).not.toIncludeText('ChangedName');
    });

    it('should change nodes data if :update is Update.Nodes', async () => {
      const rendered = renderCustomTree();
      const instance = rendered.instance() as Tree;

      root.children = root.children.map(n => ({
        ...n,
        name: `ChangedName ${n.id}`,
      }));

      await instance.recomputeTree(Update.Nodes);

      expect(rendered.find('.treeNode').at(1)).toIncludeText('ChangedName');
    });

    it('should ignore inner component openness state if :update is Update.NodesAndOpenness', async () => {
      const rendered = renderCustomTree();

      const closedNodeGetter = createNodeGetter({
        isOpenedByDefault: false,
      });

      rendered.setProps({
        nodeGetter: closedNodeGetter,
      });

      expect(rendered.find('.treeNode').length).toBe(10);

      const instance = rendered.instance() as Tree;

      await instance.recomputeTree(Update.NodesAndOpenness);
      rendered.update(); // TODO: remove when https://github.com/airbnb/enzyme/issues/1229 is resolved

      expect(rendered.find('.treeNode').length).toBe(1);
    });
  });
});
