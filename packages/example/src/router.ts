import * as express from 'express';
import { App } from '@h4bff/core';
/**
 * Router.
 */
export function HttpRouter(_app: App) {
  return express();
}
