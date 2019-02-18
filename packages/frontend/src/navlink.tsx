import * as React from 'react';
import { Location } from 'history';
import { HistoryContext } from './router';
import { LinkProps, Link } from './link';
import { matchPath } from './utils';
import { Router } from './router';
import { RouteProvider } from './routeProvider';

export interface NavLinkProps extends LinkProps {
  activeClassName?: string;
  activeStyle?: React.CSSProperties;
  exact?: boolean;
  strict?: boolean;
  location?: Location;
}

/**
 * A <Link> wrapper that knows if it's "active" or not.
 */
export class NavLink extends React.Component<NavLinkProps, {}> {
  joinClassnames = (...classnames: (string | undefined)[]) => {
    return classnames.filter(i => i).join(' ');
  };

  navLinkFunction = (props: NavLinkProps) => {
    console.log('navLink function RERENDER');
    return (
      <HistoryContext.Consumer>
        {context => {
          const currentPath = context.app.getSingleton(RouteProvider).location.pathname;
          const { innerRef, replace, to, activeClassName, ...rest } = props; // eslint-disable-line no-unused-vars
          const path = typeof to === 'object' ? to.pathname : to;
          const escapedPath = path && path.replace(/([.+*?=^!:${}()[\]|/\\])/g, '\\$1');
          const isActive = escapedPath ? matchPath(currentPath, escapedPath) : false;

          const className = isActive ? this.joinClassnames(this.props.className, activeClassName) : props.className;
          const style = isActive ? { ...props.style, ...props.activeStyle } : props.style;

          return (
            <Link
              aria-current={(isActive && 'page') || undefined}
              className={className}
              style={style}
              to={to}
              {...rest}
            />
          );
        }}
      </HistoryContext.Consumer>
    );
  };

  render() {
    return (
      <HistoryContext.Consumer>
        {context => {
          if (!context) {
            throw new Error('You should not use <NavLink> outside a <HistoryContext>');
          }

          //todo vidi pak so observer na location dali raboti

          const router = new Router(context.app);
          router.addRoute('/:param*', () => this.navLinkFunction(this.props));

          return <router.Instance />;
        }}
      </HistoryContext.Consumer>
    );
  }
}
