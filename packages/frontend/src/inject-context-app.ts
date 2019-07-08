import { AppContext } from './app-context';
import { App } from '@h4bff/core';

/**
 * Inject AppContext to component and defines the context type.
 */
export function injectContextApp(componentClass: Function) {
  Object.defineProperty(componentClass, 'contextType', {
    value: AppContext,
  });

  const target = componentClass.prototype;

  Object.defineProperty(target, 'app', {
    get: function() {
      const context = this.context;

      if (!context.app) {
        throw new Error('App is not defined in this component context.');
      }

      if (!(context.app instanceof App)) {
        throw new Error('The App instance in the context is not the right type.');
      }

      return this.context.app;
    },
  });
}
