import cn from 'classnames';
import React from 'react';
import {RowRendererParams} from './types';

export default function defaultNodeRenderer({
  controlClassName,
  controlStyle,
  childrenCount,
  className,
  isOpened,
  key,
  nodeData,
  onNodeToggle,
  onRowClick,
  onRowDoubleClick,
  onRowMouseOut,
  onRowMouseOver,
  onRowRightClick,
  style,
}: RowRendererParams): React.ReactElement<any> {
  const a11yProps: any = {};

  if (
    onRowClick ||
    onRowDoubleClick ||
    onRowMouseOver ||
    onRowMouseOut ||
    onRowRightClick
  ) {
    a11yProps['aria-label'] = 'tree-node';
    a11yProps.tabIndex = 0;

    if (onRowClick) {
      a11yProps.onClick = (event: Event) => {
        onRowClick({event, nodeData});
      };
    }

    if (onRowDoubleClick) {
      a11yProps.onDoubleClick = (event: Event) => {
        onRowDoubleClick({event, nodeData});
      };
    }

    if (onRowMouseOver) {
      a11yProps.onMouseOut = (event: Event) => {
        onRowMouseOver({event, nodeData});
      };
    }

    if (onRowMouseOut) {
      a11yProps.onMouseOver = (event: Event) => {
        onRowMouseOut({event, nodeData});
      };
    }

    if (onRowRightClick) {
      a11yProps.onContextMenu = (event: Event) => {
        onRowRightClick({event, nodeData});
      };
    }
  }

  const isLeaf = childrenCount === 0;

  return (
    <div
      {...a11yProps}
      className={cn('ReactVirtualized__Tree__node', className)}
      key={key}
      style={style}>
      <div
        className={controlClassName}
        style={controlStyle}
      >
        {!isLeaf && (
          <button
            type="button"
            onClick={onNodeToggle}
          >
            {isOpened ? '-' : '+'}
          </button>
        )}
      </div>
      <div>{String(nodeData)}</div>
    </div>
  );
}
