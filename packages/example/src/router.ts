import * as express from 'express';
import { AppContainer } from '@h4bff/core';
/**
 * Router.
 */
export function AppRouter(_app: AppContainer) {
  return express();
}
