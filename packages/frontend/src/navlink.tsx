import * as React from 'react';
import { Location } from 'history';
import { HistoryContext } from './router';
import { LinkProps, Link } from './link';
import { matchPath } from './utils';

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
export class NavLink extends React.Component<NavLinkProps, any> {
  joinClassnames = (...classnames: (string | undefined)[]) => {
    return classnames.filter(i => i).join(' ');
  };

  render() {
    const { innerRef, replace, to, ...rest } = this.props; // eslint-disable-line no-unused-vars

    return (
      <HistoryContext.Consumer>
        {context => {
          if (!context) {
            throw new Error('You should not use <NavLink> outside a <HistoryContext>');
          }

          const path = typeof to === 'object' ? to.pathname : to;
          const escapedPath = path && path.replace(/([.+*?=^!:${}()[\]|/\\])/g, '\\$1');
          const isActive = escapedPath ? matchPath(context.location.pathname, escapedPath) : false;

          const className = isActive
            ? this.joinClassnames(this.props.className, this.props.activeClassName)
            : this.props.className;
          const style = isActive ? { ...this.props.style, ...this.props.activeStyle } : this.props.style;

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
  }
}
