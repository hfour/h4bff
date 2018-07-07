import 'reflect-metadata';

let meta = new WeakMap<any, { [k: string]: { [k: string]: any } }>();

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

export function validator(validator: (t: any) => string | undefined) {
  return function uuid<T, P extends keyof T>(o: T, p: P) {
    let validated: Set<P> = Reflect.getMetadata('validated', o) || new Set<P>();
    validated.add(p);
    Reflect.defineMetadata('validated', validated, o);
    Reflect.defineMetadata('validator', validator, o, p as string);
  };
}

export function validate<T, K extends keyof T>(o: T, k: K, prop: PropertyDescriptor) {
  let types = Reflect.getMetadata('design:paramtypes', o, k as string);
  let validators = Array.from(types).map((t: any) => {
    let fields = Reflect.getMetadata('validated', t.prototype) || new Set();
    return Array.from(fields).map(f => ({
      key: f as string,
      validator: Reflect.getMetadata('validator', t.prototype, f as any)
    }));
  });
  let oldValue = prop.value;
  prop.value = function(...args: any[]) {
    validators.forEach((v, ix) => {
      let arg = args[ix];
      for (let field of v) {
        let err = field.validator(arg[field.key]);
        if (err) throw new Error('Invalid property ' + field.key + ' : ' + err);
      }
    });
    oldValue.call(this, ...args);
  };
}

export function strValidator(s: any) {
  if (typeof s !== 'string') return 'not a string';
}
