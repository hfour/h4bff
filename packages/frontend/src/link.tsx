import * as React from 'react';
import { createLocation, LocationDescriptor, History } from 'history';
import { HistoryContext } from './router';

export interface LinkProps extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
  to: LocationDescriptor;
  replace?: boolean;
  innerRef?: (node: HTMLAnchorElement | null) => void;
}

function isModifiedEvent(event: any) {
  return !!(event.metaKey || event.altKey || event.ctrlKey || event.shiftKey);
}

/**
 * The public API for rendering a history-aware <a>.
 */
export class Link extends React.Component<LinkProps, any> {
  handleClick(event: any, history: History) {
    if (this.props.onClick) this.props.onClick(event);

    if (
      !event.defaultPrevented && // onClick prevented default
      event.button === 0 && // ignore everything but left clicks
      (!this.props.target || this.props.target === '_self') && // let browser handle "target=_blank" etc.
      !isModifiedEvent(event) // ignore clicks with modifier keys
    ) {
      event.preventDefault();

      const method = this.props.replace ? history.replace : history.push;

      method(this.props.to as any); //todo emil find way not to cast to any?
    }
  }

  render() {
    const { innerRef, replace, to, ...rest } = this.props; // eslint-disable-line no-unused-vars

    return (
      <HistoryContext.Consumer>
        {context => {
          if (!context) {
            throw new Error('You should not use <Link> outside a <HistoryContext>');
          }

          const location = typeof to === 'string' ? createLocation(to, null, undefined, context.location) : to;
          const href = location ? context.createHref(location) : '';

          return <a {...rest} onClick={event => this.handleClick(event, context)} href={href} ref={innerRef} />;
        }}
      </HistoryContext.Consumer>
    );
  }
}
