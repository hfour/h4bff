import { BaseTransient, App } from '@h4bff/core';
import { autorun, observable } from 'mobx';
import { useLocalStore } from 'mobx-react-lite';
import { useContextApp } from './app-context';
import { useEffect } from 'react';
import { ClassConstructor } from '@h4bff/core/build/internal';

/**
 * A class constructor of a {@link MobxStateTransient | mobx state transient}
 */
export type MobxStateTransientConstructor<T> = ClassConstructor<App, MobxStateTransient<T>>;

/**
 * Use a MobX state transient as a substitute for observable properties embedded within a component
 * class when using react hooks. You can migrate all properties and methods to the mobx state
 * transient, keeping only the render function as a react component.
 *
 * @remarks
 *
 * MobX state transients have the following additional features
 *
 *   * automatically disposable autorun - Use `this.autorun` to create an autorun which will be
 *     automatically cleared when the component that created the mobx state transient gets ummounted
 *   * child transients - Use `this.createChild(StateTransient, params)` to create a child transient
 *     Child transients will automatically be disposed of once the parent transient is disposed.
 */
export class MobxStateTransient<T> extends BaseTransient {
  @observable public props: T;

  constructor(app: App) {
    super(app);
    this.props = this.initialProps();
  }

  private initialProps(): T {
    throw new Error('Must override props setter!');
  }

  private reactionDisposers: Array<() => void> = [];

  /**
   * Crate a MobX autorun that will be automatically cancelled once the original component that
   * invoked the transient gets unmounted
   *
   * @param fn the autorun function
   */
  autorun(fn: () => any) {
    this.autoDispose(autorun(fn));
  }

  /**
   * Add a disposer to run when the original component gets unmounted
   * @param fn the disposer to run
   */
  autoDispose(fn: () => void) {
    this.reactionDisposers.push(fn);
  }

  /**
   * @internal
   */
  onDispose() {
    for (let d of this.reactionDisposers) d();
  }

  /**
   * @internal
   */
  static createWithProps<T, C extends MobxStateTransientConstructor<T>>(
    Klass: C,
    app: App,
    props: T,
  ) {
    let originalProps = Klass.prototype.initialProps;

    Klass.prototype.initialProps = () => {
      Klass.prototype.initialProps = originalProps;
      return props;
    };

    return new Klass(app) as InstanceType<C>;
  }

  /**
   * Create a new child state transient with its own props. The child will be disposed of at the
   * same time as the parent - typically when the component that created the original parent has
   * unmounted.
   *
   * @param Klass the transient class
   * @param props props to pass
   */
  public useStateTransient<U, C extends MobxStateTransientConstructor<U>>(Klass: C, props: U) {
    let t = MobxStateTransient.createWithProps(Klass, this.app, props);
    this.autoDispose(() => t.onDispose());
    return t;
  }
}

/**
 * The original useLocalStore is overly restrictive in its arguments. This one corrects the
 * issue.
 * @param initializer
 * @param t
 */
function useLocalStoreCorrected<T, U>(initializer: (t: T) => U, t: T): U {
  return useLocalStore(initializer as any, t as any);
}

/**
 * Use a state transient - a substitute for observable properties embedded within a component class.
 * Think of this as a react component class that has everything but the render method.
 *
 * @param Klass the class of the mobx state transient to use
 * @param props the initial props value
 */
export function useStateTransient<T, U extends MobxStateTransientConstructor<T>>(
  Klass: U,
  props: T,
) {
  let app = useContextApp();
  let s = useLocalStoreCorrected(
    props => MobxStateTransient.createWithProps(Klass, app, props),
    props,
  );

  useEffect(() => () => s.onDispose(), []);

  return s;
}
