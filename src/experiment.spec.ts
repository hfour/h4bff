import { validator, validate } from './experiment';

class U {
  @validator() name!: string;
}
class C {
  @validator() id!: string;
  @validator() u!: U;
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
  t.myMethod({ id: '1', u: { name: 'ok' } });
  expect(() => {
    t.myMethod({ id: '1', u: { name: (1 as any) as string } });
  }).toThrowError('Invalid property u : Invalid property name : not a string');
});
