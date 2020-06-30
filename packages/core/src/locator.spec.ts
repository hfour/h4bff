import { App } from '.';
import { Locator, OverrideInterceptor } from './locator';

describe('Locator', () => {
  class TestInterceptor<C> {
    constructor(private l: Locator<C>, private mockF: jest.Mock<any, any>) {}
    get = (i: any) => (f: any) => {
      this.mockF();
      return i(f);
    };
    inherit() {
      return new TestInterceptor(this.l, this.mockF);
    }
  }

  it('override a function using the override method', () => {
    let original = () => 'original';
    let override = () => 'override';

    let app = new App();
    let loc = new Locator(app, s => '__appSingleton' in s);
    loc.addInterceptor(new OverrideInterceptor());
    loc.override(original, override);

    expect(loc.get(original)).toBe('override');
  });

  it('addInterceptor should add an interceptor', () => {
    const mock = jest.fn();

    let app = new App();
    let loc = new Locator(app, s => '__appSingleton' in s);
    const testInterceptor = new TestInterceptor(loc, mock);
    loc.addInterceptor(testInterceptor);
    loc.get(() => {});

    expect(mock).toHaveBeenCalledTimes(1);
  });

  it('when intercepting, the outermost interceptor should have the last transform', () => {
    let original = () => 'original';

    let app = new App();
    let loc = new Locator(app, s => '__appSingleton' in s);

    const o1 = new OverrideInterceptor<App>();
    o1.override(original, () => 'override 1');
    const o2 = new OverrideInterceptor<App>();
    o2.override(original, () => 'override 2');

    loc.addInterceptor(o1);
    loc.addInterceptor(o2);

    expect(loc.get(original)).toBe('override 2');
  });

  // TODO: Not sure if this is the correct behaviour. Investigate
  it.skip('withNewContext should not share the overrides', () => {
    let original = () => 'original';
    let fstOverride = () => 'override 1';
    let sndOverride = () => 'override 2';

    let fstApp = new App();
    let loc = new Locator(fstApp, s => '__appSingleton' in s);
    loc.addInterceptor(new OverrideInterceptor());
    loc.override(original, fstOverride);

    const sndApp = new App();
    const clonedLoc = loc.withNewContext(sndApp);
    clonedLoc.override(original, sndOverride);

    expect(loc.get(original)).toBe('override 1');
    expect(clonedLoc.get(original)).toBe('override 2');
  });

  it('withNewContext should add the interceptors', () => {
    const mock = jest.fn();

    let fstApp = new App();
    let loc = new Locator(fstApp, s => '__appSingleton' in s);
    const testInterceptor = new TestInterceptor(loc, mock);
    loc.addInterceptor(testInterceptor);

    const sndApp = new App();
    const clonedLoc = loc.withNewContext(sndApp);
    clonedLoc.get(() => {});

    expect(mock).toHaveBeenCalledTimes(1);
  });
});
