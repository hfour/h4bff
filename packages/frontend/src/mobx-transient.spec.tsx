import * as TestRenderer from 'react-test-renderer';
import { App, AppSingleton } from '@h4bff/core';
import { AppContext } from './app-context';
import { MobxStateTransient, useStateTransient } from './mobx-transient';
import { observable, action } from 'mobx';
import * as React from 'react';
import { observer } from 'mobx-react-lite';

class CounterIncrementer extends AppSingleton {
  incrementValue: number = 1;

  increment(num: number) {
    return num + this.incrementValue;
  }
}

class CounterState extends MobxStateTransient<{ initialValue: number }> {
  incrementer = this.getSingleton(CounterIncrementer);

  @observable counter = this.props.initialValue;

  @observable previousState =
    this.props.initialValue > 0
      ? this.useStateTransient(CounterState, { initialValue: this.props.initialValue - 1 })
      : null;

  @action.bound
  increment() {
    this.counter = this.incrementer.increment(this.counter);
  }
}

let HookyCounter = observer((props: { initialValue: number }) => {
  let state = useStateTransient(CounterState, props);

  return (
    <div>
      <span>
        Current value: {state.counter.toString()}, initial {props.initialValue}
      </span>
      <button onClick={state.increment} />
    </div>
  );
});

describe('mobx transient', () => {
  it('works', () => {
    const INCREMENT_VALUE = 3,
      INITIAL_VALUE = 4;
    let app = new App();
    app.getSingleton(CounterIncrementer).incrementValue = INCREMENT_VALUE;

    let r = TestRenderer.create(
      <AppContext.Provider value={{ app: app }}>
        <HookyCounter initialValue={INITIAL_VALUE} />
      </AppContext.Provider>,
    );

    TestRenderer.act(() => {
      r.root.findByType('button').props.onClick();
    });

    let val = Number(r.root.findByType('span').children[1]);
    expect(val).toEqual(INCREMENT_VALUE + INITIAL_VALUE);
  });

  it('disposes after a component unmount', () => {
    let disposeCalled = false;

    class DisposerTest extends MobxStateTransient<{}> {
      _1 = this.autoDispose(() => {
        disposeCalled = true;
      });

      value = 1;
    }

    let TemporaryComponent = observer<{}>(props => {
      let state = useStateTransient(DisposerTest, props);
      return <div>Hello number {state.value}</div>;
    });

    class SwitchState extends MobxStateTransient<{}> {
      @observable isOn = true;
      @action.bound toggle() {
        this.isOn = !this.isOn;
      }
    }

    let SwitchingComponent = observer<{}>(props => {
      let switchState = useStateTransient(SwitchState, props);
      return (
        <div>
          {switchState.isOn ? <TemporaryComponent /> : <div>Other content</div>}
          <button onClick={switchState.toggle} />
        </div>
      );
    });

    let app = new App();

    let r = TestRenderer.create(
      <AppContext.Provider value={{ app: app }}>
        <SwitchingComponent />
      </AppContext.Provider>,
    );

    expect(disposeCalled).toBeFalsy();

    TestRenderer.act(() => {
      r.root.findByType('button').props.onClick();
    });

    expect(disposeCalled).toBeTruthy();
  });
});
