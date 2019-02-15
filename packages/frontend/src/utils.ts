import * as pathToRegexp from 'path-to-regexp';

export function matchPath(currentPath: string, redirectFrom: string) {
  const regexp = pathToRegexp(redirectFrom);
  return regexp.exec(currentPath) != null;
}
