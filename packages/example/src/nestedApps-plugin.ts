import { App, AppSingleton, BaseService } from '@h4bff/core';
import { RPCServiceRegistry } from '@h4bff/backend';
import { AppRouter } from './router';

export class TestSingleton extends AppSingleton {
  printMessage(app: string) {
    return `hello from app ${app}`;
  }
}

export class TestService extends BaseService {
  printMesage(params: { message: string }) {
    return Promise.resolve(`The secret message is: ${params.message}`);
  }
}

export let NestedAppsPlugin = (app: App) => {
  // Root
  const ctxRouter = app.getSingleton(AppRouter);
  ctxRouter.get('/app/root', (_req, res) => {
    res.end('root app');
  });

  // Child 1
  let child1 = app.createChildApp();
  const child1TestSingleton = child1.getSingleton(TestSingleton);
  child1.getSingleton(AppRouter).get('/app/child1', (_req, res) => {
    res.end('child 1 app says: ' + child1TestSingleton.printMessage('1'));
  });
  // Register RPC for child 1
  child1.getSingleton(RPCServiceRegistry).add('test1', TestService);

  // Child 2
  let child2 = app.createChildApp();
  const child2TestSingleton = child2.getSingleton(TestSingleton);
  child2.getSingleton(AppRouter).get('/app/child2', (_req, res) => {
    res.end('child 2 app says: ' + child2TestSingleton.printMessage('2'));
  });
  // Register RPC for child 1
  child2.getSingleton(RPCServiceRegistry).add('test2', TestService);

  // Register RPC for root app
  app.getSingleton(RPCServiceRegistry).add('testRoot', TestService);
};
