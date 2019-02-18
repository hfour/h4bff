import * as React from 'react';
import { Location, LocationDescriptor, History, createLocation } from 'history';
import { HistoryContext } from './router';
import { matchPath } from './utils';
import { observer } from 'mobx-react';

export interface LinkProps extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
  to: LocationDescriptor;
  activeClassName?: string;
  activeStyle?: React.CSSProperties;
  exact?: boolean;
  strict?: boolean;
  location?: Location;
  replace?: boolean;
  innerRef?: (node: HTMLAnchorElement | null) => void;
}

/**
 * Link that is aware of the history and current path.
 */
@observer
export class Link extends React.Component<LinkProps, {}> {
  joinClassnames = (...classnames: (string | undefined)[]) => {
    return classnames.filter(i => i).join(' ');
  };

  isModifiedEvent(event: any) {
    return !!(event.metaKey || event.altKey || event.ctrlKey || event.shiftKey);
  }

  handleClick(event: any, history: History) {
    if (this.props.onClick) this.props.onClick(event);

    if (
      !event.defaultPrevented && // onClick prevented default
      event.button === 0 && // ignore everything but left clicks
      (!this.props.target || this.props.target === '_self') && // let browser handle "target=_blank" etc.
      !this.isModifiedEvent(event) // ignore clicks with modifier keys
    ) {
      event.preventDefault();

      const method = this.props.replace ? history.replace : history.push;

      method(this.props.to as any); //todo emil find way not to cast to any?
    }
  }

  render() {
    return (
      <HistoryContext.Consumer>
        {context => {
          if (!context) {
            throw new Error('You should not use <Link> outside a <HistoryContext>');
          }

          const currentPath = context.path;
          const { innerRef, replace, to, activeClassName, ...rest } = this.props; // eslint-disable-line no-unused-vars
          const path = typeof to === 'object' ? to.pathname : to;
          const escapedPath = path && path.replace(/([.+*?=^!:${}()[\]|/\\])/g, '\\$1');
          const isActive = !!activeClassName && !!escapedPath ? matchPath(currentPath, escapedPath) : false;

          const className = isActive
            ? this.joinClassnames(this.props.className, activeClassName)
            : this.props.className;
          const style = isActive ? { ...this.props.style, ...this.props.activeStyle } : this.props.style;

          const history = context.history;
          const location = typeof to === 'string' ? createLocation(to, null, undefined, history.location) : to;
          const href = location ? history.createHref(location) : '';

          return (
            <a
              aria-current={(isActive && 'page') || undefined}
              className={className}
              style={style}
              onClick={event => this.handleClick(event, history)}
              href={href}
              ref={innerRef}
              {...rest}
            />
          );
        }}
      </HistoryContext.Consumer>
    );
  }
}