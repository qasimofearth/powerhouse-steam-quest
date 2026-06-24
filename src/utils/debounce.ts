// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const debounceLeading = <T extends (...args: any[]) => any>(func: T, timeout: number) => {
  let timer: NodeJS.Timeout | undefined;
  return function (this: ThisParameterType<T>, ...args: Parameters<T>) {
    if (!timer) {
      func.apply(this, args);
    }
    clearTimeout(timer);
    timer = setTimeout(() => {
      timer = undefined;
    }, timeout);
  };
};
