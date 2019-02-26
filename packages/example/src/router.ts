import * as express from 'express';
import { Container } from '@h4bff/core';
/**
 * Router.
 */
export function AppRouter(_app: Container) {
  return express();
}
