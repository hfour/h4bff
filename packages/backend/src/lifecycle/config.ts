import { Envaridator } from 'envaridator';
import { AppSingleton } from '@h4bff/core';

/**
 * Registers and validates auth env variables.
 */
export abstract class EnvConfig extends AppSingleton {
  protected env = this.getSingleton(Envaridator); 
}
