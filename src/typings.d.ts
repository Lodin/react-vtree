declare module '*.css' {
  const content: {[key: string]: string};
  export = content;
}

declare module 'fbjs/lib/shallowEqual' {
  function shallowEqual<T extends object, U extends object>(objA: T, objB: U): boolean;
  export = shallowEqual;
}
