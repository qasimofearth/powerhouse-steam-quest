export const useQueryParams = () => {
  const getQueryParam = (param: string): string | null => {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(param);
  };

  const setQueryParam = (param: string, value: string) => {
    const urlParams = new URLSearchParams(window.location.search);
    urlParams.set(param, value);
    window.history.replaceState({}, '', `?${urlParams.toString()}`);
  };

  return { getQueryParam, setQueryParam };
};
