import { ConstructorOrFactory, App } from './internal';

/**
 * Derive from this class to create application singletons.
 *
 * Singletons are initialized only once per application, although
 * you can initialize different singletons of the same type in
 * child applications.
 *
 * @public
 */
export class AppSingleton {
  protected static __appSingleton = true;

  constructor(protected app: App) {}

  /**
   * A proxy for {@link App.getSingleton | `app.getSingleton(Klass)`}
   */
  getSingleton<T>(Klass: ConstructorOrFactory<App, T>): T {
    return this.app.getSingleton(Klass);
  }
}
