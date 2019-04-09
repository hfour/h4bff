import { Envaridator } from 'envaridator';
import { App } from '@h4bff/core';

/**
 * Registers and validates auth env variables.
 */
export const EnvConfig = (_app: App) => {
  return new Envaridator();
};
