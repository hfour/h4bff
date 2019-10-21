import * as pathToRegexp from 'path-to-regexp';

export function matchPath(
  currentPath: string,
  regexPathToMatch: string | undefined,
  { exact = false, strict = false },
) {
  if (!regexPathToMatch) {
    return null;
  }
  const keys: pathToRegexp.Key[] = [];
  const options = {
    end: exact,
    strict,
    sensitive: false,
  };
  const regexp = pathToRegexp(regexPathToMatch, keys, options);
  return regexp.exec(currentPath) != null;
}

/**
 * Currently just validates whether the path starts with "/",
 * and throws error if it doesnt.
 */
export function validatePath(path: string) {
  if (path.substring(0, 1) !== '/') {
    throw new Error('Path has to start with "/"');
  }
}
