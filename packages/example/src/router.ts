import * as express from 'express';
import { AppContainer } from '@h4bff/core';
/**
 * Router.
 */
export function HttpRouter(_app: AppContainer) {
  return express();
}
