import * as React from 'react';
import { AppContext } from './app-context';
import { App } from '@h4bff/core';

const getAppFromContext = (context: any) => {
  if (!context.app) {
    throw new Error('App is not defined in this component context.');
  }

  if (!(context.app instanceof App)) {
    throw new Error('The App instance in the context is not the right type.');
  }

  return context.app;
};

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

      return getAppFromContext(context);
    },
  });
}

/**
 * React hook for accessing App instance. The App is an instance of h4bff/core App. It contains all
 * necessary methods for services to instantiate or get other needed services.
 */
export const useContextApp = () => {
  const context = React.useContext(AppContext);

  return getAppFromContext(context);
};
