import { strValidator, validator, validate } from './experiment';

class C {
  @validator(strValidator) id: string | undefined;
}

class Test {
  @validate
  myMethod(params: C) {
    console.log('Got params', params);
  }
}

it('works', () => {
  console.log('Experiment');
  let t = new Test();
  t.myMethod({ id: '1' });
  expect(() => {
    t.myMethod({ id: 1 as any });
  }).toThrowError('Invalid property id : not a string');
});
