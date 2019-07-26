import { App, BaseTransient, AppSingleton } from '.';

class TestTransient extends BaseTransient {}
class TestSingleton extends AppSingleton {}

class MainTransient extends BaseTransient {
  override = this.createTransient(TestTransient);
}

describe('transient', () => {
  it('instantiates once per creation request', () => {
    let app = new App();
    let t1 = app.createTransient(TestTransient);
    let t2 = app.createTransient(TestTransient);
    expect(t1).not.toBe(t2);
  });

  it('can get access to the same singletons', () => {
    let app = new App();
    let t1 = app.createTransient(TestTransient);
    let t2 = app.createTransient(TestTransient);

    let s1 = t1.getSingleton(TestSingleton);
    let s2 = t2.getSingleton(TestSingleton);
    expect(s1).toBe(s2);
  });

  it('can be overriden', () => {
    class Replacement extends BaseTransient {}
    let app = new App();
    app.overrideTransient(TestTransient, Replacement);
    let main = app.createTransient(MainTransient);
    expect(main.override).toBeInstanceOf(Replacement);
  });
});
