import { debounce } from '@homecode/ui';

export const reportEvent = (event: string) => {
  // @ts-ignore
  window.statsSDK?.report({ event });
};

export const createDebouncedReported = (event: string) =>
  debounce(() => reportEvent(event), 1000);
