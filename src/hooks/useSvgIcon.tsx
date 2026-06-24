import { lazy, Suspense, useEffect, forwardRef, useMemo } from 'react';
import { SvgModule } from '../types/interfaces';
import { ICONS } from '../constants/constants';

const iconCache: Record<string, Promise<SvgModule>> = {};

const preloadIcon = async (path: string) => {
  if (!iconCache[path]) {
    iconCache[path] = import(`../assets/icons/${path}.svg?react`);
  }
  return iconCache[path];
};

export const preloadIcons = async (paths: string[]) => {
  return Promise.all(paths.map((path) => preloadIcon(path)));
};

export const useSvgIcon = (path: keyof typeof ICONS) => {
  useEffect(() => {
    preloadIcon(path);
  }, [path]);

  const Icon = useMemo(() => {
    const LazyIcon = lazy(() => preloadIcon(path));

    return forwardRef((props: React.SVGProps<SVGSVGElement>, ref: React.Ref<SVGSVGElement>) => (
      <Suspense>
        <LazyIcon {...props} ref={ref} />
      </Suspense>
    ));
  }, [path]);
  return Icon;
};
