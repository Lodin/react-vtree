import '@testing-library/jest-dom/vitest';
import { expect } from 'vitest';
import type {
  NodeData,
  NodePublicState,
  TypedListChildComponentData,
} from '../src/Tree.tsx';
import {
  getLastItemKeys,
  getLastListProps,
  getLastRecords,
  type ListMock,
} from './utils/misc.ts';

expect.extend({
  toHaveBeenLastCalledWithRecords<
    TData extends NodeData,
    TNodePublicState extends NodePublicState<TData>,
  >(
    mock: ListMock<TypedListChildComponentData<TData, TNodePublicState>>,
    expected: readonly TNodePublicState[],
  ) {
    const received = getLastRecords<TData, TNodePublicState>(mock);

    if (!received) {
      return {
        message: () =>
          'expected FixedSizeList/VariableSizeList to have been last called with "itemData"',
        pass: false,
      };
    }

    const pass = this.equals(received, expected);

    return {
      pass,
      message: () =>
        `expected ${this.utils.printReceived(received)} to equal ${this.utils.printExpected(expected)}`,
    };
  },
  toHaveBeenLastCalledWithItemKeys<TData>(
    mock: ListMock<TData>,
    expected: readonly string[],
  ) {
    const props = getLastListProps(mock);
    const received = getLastItemKeys(mock);

    if (!props) {
      return {
        message: () =>
          'expected FixedSizeList/VariableSizeList to have been called',
        pass: false,
      };
    }

    if (received === undefined) {
      return {
        message: () =>
          'expected FixedSizeList/VariableSizeList to have been last called with "itemKey" and "itemData"',
        pass: false,
      };
    }

    const pass = this.equals(received, expected);

    return {
      pass,
      message: () =>
        `expected ${this.utils.printReceived(received)} to equal ${this.utils.printExpected(expected)}`,
    };
  },
});

interface CustomMatchers<R = unknown> {
  toHaveBeenLastCalledWithItemKeys(expected: readonly string[]): R;
  toHaveBeenLastCalledWithRecords<
    TData extends NodeData,
    TNodePublicState extends NodePublicState<TData>,
  >(
    expected: readonly TNodePublicState[],
  ): R;
}

declare module 'vitest' {
  interface Assertion<T = any> extends CustomMatchers<T> {}
  interface AsymmetricMatchersContaining extends CustomMatchers {}
}
