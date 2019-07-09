import * as React from 'react';
import * as TestRenderer from 'react-test-renderer';
import { App } from '@h4bff/core';
import { AppContext } from './app-context';
import { injectContextApp } from './react-context-app';

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
