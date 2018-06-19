import { AnydbSql, Transaction } from 'anydb-sql-2';
import { Request, Express } from 'express';
import * as po from 'promise-observer';
import { Observer } from 'promise-observer';

export interface AppParts {
    db: AnydbSql;
    router: Express;
}

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

export class App {
    parts: AppParts;
    instances: { [key: string]: BaseService }

    constructor(parts: AppParts) {
        this.instances = {};
        this.parts = parts;
    }

    registerService<T extends BaseService>(name: string, Service: T) {
        this.instances[name] = Service;
    }

    getService(name: string) {
        if (!this.instances[name]) throw new Error(`Service ${name} not found`)
        return this.instances[name];
    }

    getInContext(name: string, ctx: Context) {
        const service = this.instances[name];
        return service.setContext(ctx);
    }
}