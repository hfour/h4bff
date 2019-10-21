import * as React from 'react';
import { Location, LocationDescriptor, History, createLocation } from 'history';
import { HistoryContext } from './router';
import { matchPath } from './router-utils';
import classNames from 'classnames';
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
 * Link that is aware of the history and current location.
 */
@observer
export class Link extends React.Component<LinkProps, {}> {
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
      const to = this.props.to;
      // we have to do this because typescript cannot handle properly 2 different methods with the same name, but different argument.
      if (typeof to === 'string') {
        method(to);
      } else {
        method(to);
      }
    }
  }

  render() {
    return (
      <HistoryContext.Consumer>
        {context => {
          if (!context) {
            throw new Error('You should not use <Link> outside a <HistoryContext>');
          }

          const currentLocation = context.location;
          const { innerRef, replace, to, activeClassName, exact, strict, ...rest } = this.props; // eslint-disable-line no-unused-vars
          const path = typeof to === 'string' ? to : to.pathname;
          const escapedPath = path && path.replace(/([.+*?=^!:${}()[\]|/\\])/g, '\\$1');
          const isActive = matchPath(currentLocation, escapedPath, { exact, strict });

          let className;
          if (isActive) {
            className = classNames(this.props.className, activeClassName);
          } else {
            className = this.props.className;
          }
          const style = isActive
            ? { ...this.props.style, ...this.props.activeStyle }
            : this.props.style;

          const history = context.history;
          const location =
            typeof to === 'string' ? createLocation(to, null, undefined, history.location) : to;
          const href = location ? history.createHref(location) : '';

          return (
            <a
              {...rest}
              aria-current={(isActive && 'page') || undefined}
              className={className}
              style={style}
              onClick={event => this.handleClick(event, history)}
              href={href}
              ref={innerRef}
            />
          );
        }}
      </HistoryContext.Consumer>
    );
  }
}
