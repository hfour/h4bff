import * as React from 'react';
import { App } from '@h4bff/core';

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
export const AppContext = React.createContext({} as { app: App });
export interface AppContextProps {
  app: App;
}
