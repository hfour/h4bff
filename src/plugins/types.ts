import { Transaction } from 'anydb-sql-2';
import { Request } from 'express';
import * as po from 'promise-observer';
import { Observer } from 'promise-observer';

export interface Context {
    tx?: Transaction;
    request?: Request
}

export class BaseService {
    ctx: Context;
    on?: { [key: string]: Observer<any> };
    emit?: { [key: string]: (t: any) => any; };

    constructor() {
        this.ctx = null;
        this.on = {};
        this.emit = {};
    }

    setContext(ctx: Context) {
        this.ctx = ctx;
        return this;
    }

    events(names: string[]) {
        names.forEach(ev => {
            this.on[ev] = po.create(emit => (this.emit[ev] = emit));
        });
    }
}

type AnyConstrutor<T> = { new(...args: any[]): T };

export class App {
    instances: Map<Function, any> = new Map();

    get<T>(f: () => T): T {
        if (!this.instances.has(f)) {
            this.instances.set(f, f());
        }
        return this.instances.get(f) as T;
    }

    set<T>(f: () => T): T {
        if (this.instances.has(f)) throw new Error('Singleton is already set');
        this.instances.set(f, f());
        return this.instances.get(f);
    }

    setClass<T>(Klass: AnyConstrutor<T>, instance: T): T {
        if (!this.instances.has(Klass)) {
            this.instances.set(Klass, instance)
        }
        return this.instances.get(Klass);
    }

    getClass<T>(Klass: AnyConstrutor<T>): T {
        return this.instances.get(Klass);
    }

    getInContext<T>(Klass: AnyConstrutor<T>, ctx: Context) {
        const service = this.instances.get(Klass);
        service.setContext(ctx);
        return service as T;
    }
}