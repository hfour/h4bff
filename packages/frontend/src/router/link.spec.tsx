import { App } from '@h4bff/core';
import * as React from 'react';
import { createMemoryHistory } from 'history';
import * as TestRenderer from 'react-test-renderer';
import { RouteProvider, HistoryProvider } from './routeProvider';
import { Router } from './router';
import { Link } from './link';

describe('link', () => {
  let app: App;
  let router: Router;
  let renderer: TestRenderer.ReactTestRenderer;

  /**
   * Creates a <Link> component with the text "link" so it can be easily found by the test renderer.
   * Has 2 optional parameters, exact and strict, that are directly sent as props to the Link component.
   */
  function createLink(to: string, exact?: boolean, strict?: boolean) {
    return jest.fn(_p1 => (
      <Link activeClassName="active" exact={exact} strict={strict} to={to}>
        link
      </Link>
    ));
  }

  /**
   * Helper function that checks whether the link present in the renderer has the "active" classname.
   */
  function isLinkActive() {
    const rendererInstance = renderer.root;

    const link = rendererInstance.find(
      element => element.children && element.children[0] == 'link',
    );

    return link.props.className == 'active';
  }

  function visitUrl(path: string) {
    TestRenderer.act(() => {
      const routeProvider = app.getSingleton(RouteProvider);
      routeProvider.browserHistory.push(path);
    });
  }

  beforeEach(() => {
    jest.clearAllMocks();
    app = new App();
    app.overrideSingleton(HistoryProvider, () => createMemoryHistory());
    router = app.getSingleton(Router);

    TestRenderer.act(() => {
      renderer = TestRenderer.create(<router.RenderInstance />);
    });
  });

  afterEach(() => {
    renderer.unmount();
  });

  describe('link being active', () => {
    describe('with default params', () => {
      it('should be active when pointing to the current location', () => {
        //given
        const link = createLink('/example/lala');
        router.addRoute('/example/lala', link);

        //when
        visitUrl('/example/lala');

        //then
        expect(isLinkActive()).toEqual(true);
      });

      it('should be active when pointing to a partial match of the current location', () => {
        //given
        const link = createLink('/example');
        router.addRoute('/example/lala', link);

        //when
        visitUrl('/example/lala');

        //then
        expect(isLinkActive()).toEqual(true);
      });

      it('should NOT be active when pointing to route longer than the current location', () => {
        //given
        const link = createLink('/example/lala');
        router.addRoute('/example', link);

        //when
        visitUrl('/example');

        //then
        expect(isLinkActive()).toEqual(false);
      });
    });

    describe('with "exact" param', () => {
      it('should be active when pointing to the current location', () => {
        //given
        const link = createLink('/example/lala', true);
        router.addRoute('/example/lala', link);

        //when
        visitUrl('/example/lala');

        //then
        expect(isLinkActive()).toEqual(true);
      });

      it('should NOT be active when pointing to a partial match of the current location', () => {
        //given
        const link = createLink('/example', true);
        router.addRoute('/example/lala', link);

        //when
        visitUrl('/example/lala');

        //then
        expect(isLinkActive()).toEqual(false);
      });
    });
  });
});
