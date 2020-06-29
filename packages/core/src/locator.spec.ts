import { App } from '.';
import { Locator, Interceptor } from './locator';

describe('Locator', () => {
  it('override a function using the override option in constructor', () => {
    let original = () => 'original';
    let override = () => 'override';

    const overrides = new Map();
    overrides.set(original, override);
    let app = new App();
    let loc = new Locator(app, s => '__appSingleton' in s, { overrides });

    expect(loc.get(original)).toBe('override');
  });

  it('override a function using the override method', () => {
    let original = () => 'original';
    let override = () => 'override';

    let app = new App();
    let loc = new Locator(app, s => '__appSingleton' in s, {});
    loc.override(original, override);

    expect(loc.get(original)).toBe('override');
  });

  it('addInterceptor should add an interceptor', () => {
    const mock = jest.fn();
    const testInterceptor = <Context>(): Interceptor<Context> => {
      return instantiator => f => {
        mock();
        return instantiator(f);
      };
    };

    let app = new App();
    let loc = new Locator(app, s => '__appSingleton' in s);
    loc.addInterceptor(testInterceptor());
    loc.get(() => {});

    expect(mock).toHaveBeenCalledTimes(1);
  });

  it('withNewContext should not share the overrides', () => {
    let original = () => 'original';
    let fstOverride = () => 'override 1';
    let sndOverride = () => 'override 2';

    let fstApp = new App();
    let loc = new Locator(fstApp, s => '__appSingleton' in s);
    loc.override(original, fstOverride);

    const sndApp = new App();
    const clonedLoc = loc.withNewContext(sndApp);
    clonedLoc.override(original, sndOverride);

    expect(loc.get(original)).toBe('override 1');
    expect(clonedLoc.get(original)).toBe('override 2');
  });

  it('withNewContext should add the interceptors', () => {
    const mock = jest.fn();
    const testInterceptor = <Context>(): Interceptor<Context> => {
      return instantiator => f => {
        mock();
        return instantiator(f);
      };
    };

    let fstApp = new App();
    let loc = new Locator(fstApp, s => '__appSingleton' in s);
    loc.addInterceptor(testInterceptor());

    const sndApp = new App();
    const clonedLoc = loc.withNewContext(sndApp);
    clonedLoc.get(() => {});

    expect(mock).toHaveBeenCalledTimes(1);
  });
});
