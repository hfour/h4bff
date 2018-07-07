import 'reflect-metadata';

let meta = new WeakMap<any, { [k: string]: { [k: string]: any } }>();

type Validator = { key: string; validator: (o: any) => string };

export function updateMeta<T, Key extends keyof T>(o: T, field: Key, obj: { [key: string]: any }) {
  let m = meta.get(o);
  if (m == null) {
    m = {};
    meta.set(o, m);
  }
  m[field as string] = m[field as string] || {};
  Object.assign(m[field as string], obj);
}

export function getMeta<T>(o: T) {
  return meta.get(o);
}

let defaultValidators = new Map<any, (o: any) => string | undefined>();
defaultValidators.set(String, (s: any) => (typeof s === 'string' ? undefined : 'not a string'));
defaultValidators.set(Number, (s: any) => (typeof s === 'number' ? undefined : 'not a number'));
defaultValidators.set(Boolean, (s: any) => (typeof s === 'boolean' ? undefined : 'not a boolean'));

function getValidators(o: any): Validator[] {
  let fields = Reflect.getMetadata('validated', o) || new Set();
  return Array.from(fields).map(f => ({
    key: f as string,
    validator: Reflect.getMetadata('validator', o, f as any)
  }));
}

function applyValidators(o: any, validators: Validator[]): string | undefined {
  for (let v of validators) {
    let err = v.validator(o[v.key]);
    if (err) return 'Invalid property ' + v.key + ' : ' + err;
  }
  return undefined;
}

export function validator(validatorFn?: (t: any) => string | undefined) {
  return function setValidator<T, P extends keyof T>(o: T, p: P) {
    if (!validatorFn) {
      let propType = Reflect.getMetadata('design:type', o, p as any);
      validatorFn = defaultValidators.get(propType);

      if (!validatorFn) {
        let validators = getValidators(propType.prototype);
        validatorFn = (o: any) => applyValidators(o, validators);
      }
    }
    let validated: Set<P> = Reflect.getMetadata('validated', o) || new Set<P>();
    validated.add(p);
    Reflect.defineMetadata('validated', validated, o);
    Reflect.defineMetadata('validator', validatorFn, o, p as string);
  };
}

export function validate<T, K extends keyof T>(o: T, k: K, prop: PropertyDescriptor) {
  let types = Reflect.getMetadata('design:paramtypes', o, k as string);
  let validators = Array.from(types).map((t: any) => getValidators(t.prototype));
  let oldValue = prop.value;
  prop.value = function(...args: any[]) {
    validators.forEach((v, ix) => {
      let arg = args[ix];
      let err = applyValidators(arg, v);
      if (err) throw new Error(err);
    });
    oldValue.call(this, ...args);
  };
}

export function strValidator(s: any) {
  if (typeof s !== 'string') return 'not a string';
}
