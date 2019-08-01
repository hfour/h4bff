import * as React from 'react';
import { App } from '@h4bff/core';

export interface AppContextProps {
  app: App;
}
/**
 * Use the AppContext.Consumer to get the application within a component. This enables the use
 * of app.getSingleton within e.g. page layouts
 *
 * @example
 * ```
 * <AppContext.Consumer>
 *   {context => context.app.getSingleton(NameSingleton).appName}
 * </AppContext.Consumer>
 * ```
 *
 * @public
 */
export const AppContext = React.createContext({} as AppContextProps);

function getAppFromContext(context: any) {
  if (!context.app) {
    throw new Error('App is not defined in this component context.');
  }

  if (!(context.app instanceof App)) {
    throw new Error('The App instance in the context is not the right type.');
  }

  return context.app as App;
}

/**
 * Use this decorator to inject the app into a component by means of React Context. Once used on
 * a component, the app is available as a property on the component class i.e. `this.app`. You will
 * need to declare the existence property separately - the decorator cannot modify the properties
 * of the class.
 *
 * Once the app is available, you can access any singletons or transients.
 *
 * @example
 *
 * ```typescript
 * @injectContextApp
 * class MyComponent extends React.Component {
 *   private app!: App;
 * }
 * ```
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
 * React hook for accessing the App instance. You can use the app instance's locator methods to get
 * the required singletons or transients.
 */
export function useContextApp() {
  const context = React.useContext(AppContext);

  return getAppFromContext(context);
}
