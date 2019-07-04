import { AppContext } from './router';

/**
 * Inject AppContext to component and defines the context type.
 */
// TODO: GP - 20190704 add proper types and checks
export function injectApp(componentClass: any): any {
  Object.defineProperty(componentClass, 'contextType', {
    value: AppContext,
  });

  const target = componentClass.prototype;

  Object.defineProperty(target, 'app', {
    get: function() {
      return this.context.app;
    },
  });
}
