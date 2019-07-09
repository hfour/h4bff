import * as React from 'react';
import * as TestRenderer from 'react-test-renderer';
import { App } from '@h4bff/core';
import { AppContext } from './app-context';
import { injectContextApp, useContextApp } from './react-context-app';

/**
 * The following tests will log to console the following error:
 * The above error occurred in the <TestComponent> component:
          in TestComponent

      Consider adding an error boundary to your tree to customize error handling behavior.

 * This is known and side offect of react-test-renderer. In real use, it will manifest as removing
 * the whole DOM tree and an error in browser console.
 */

describe('@injectContextApp', () => {
  let testApp: App | null;

  @injectContextApp
  class TestComponent extends React.Component {
    private app!: App;

    render() {
      testApp = this.app;
      return <div />;
    }
  }

  afterEach(() => {
    testApp = null;
  });

  it('should return an App instance', () => {
    let localApp = new App();
    TestRenderer.create(
      <AppContext.Provider value={{ app: localApp }}>
        <TestComponent />
      </AppContext.Provider>,
    );

    expect(testApp).toBeInstanceOf(App);
    expect(testApp).toEqual(localApp);
  });

  it('should throw if app context is not provided', () => {
    expect(() => {
      TestRenderer.create(<TestComponent />);
    }).toThrowError();
  });

  it('should throw if app context is of wrong type', () => {
    expect(() => {
      TestRenderer.create(
        <AppContext.Provider value={{ app: '' as any }}>
          <TestComponent />
        </AppContext.Provider>,
      );
    }).toThrowError();
  });
});

describe('useContextApp', () => {
  let testApp: App | null;

  const TestComponent = () => {
    testApp = useContextApp();
    return <div />;
  };

  afterEach(() => {
    testApp = null;
  });

  it('should return an App instance', () => {
    let localApp = new App();

    TestRenderer.create(
      <AppContext.Provider value={{ app: localApp }}>
        <TestComponent />
      </AppContext.Provider>,
    );

    expect(testApp).toBeInstanceOf(App);
    expect(testApp).toEqual(localApp);
  });

  it('should throw if app context is not provided', () => {
    expect(() => TestRenderer.create(<TestComponent />)).toThrowError();
  });

  it('should throw if app context is of wrong type', () => {
    expect(() => {
      TestRenderer.create(
        <AppContext.Provider value={{ app: '' as any }}>
          <TestComponent />
        </AppContext.Provider>,
      );
    }).toThrowError();
  });
});
