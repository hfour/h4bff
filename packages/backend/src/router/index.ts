/**
 * Http router, based on Express.
 */

import { AppSingleton } from '@h4bff/core';
import * as express from 'express';

export class Router extends AppSingleton {
  public router = express();
}
