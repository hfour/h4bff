import { MainRouter } from './mainRouter';
import React = require('react');
import { observer } from 'mobx-react';

export interface Props {
  mainRouter: MainRouter;
}

/**
 * Frontend route provider. Listens to change of the location and updates it.
 */
@observer
export class RootRouter extends React.Component<Props, {}> {
  render() {
    return this.props.mainRouter.currentComponentJSX;
  }
}
