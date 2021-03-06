import { App, AppSingleton, BaseService } from '@h4bff/core';
import { RPCServiceRegistry } from '@h4bff/backend';
import { HttpRouter } from './router';

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
  const ctxRouter = app.getSingleton(HttpRouter);
  ctxRouter.get('/app/root', (_req, res) => {
    res.end('root app');
  });

  // Child 1
  let child1 = app.createChildApp();
  const child1TestSingleton = child1.getSingleton(TestSingleton);
  child1.getSingleton(HttpRouter).get('/app/child1', (_req, res) => {
    res.end('child 1 app says: ' + child1TestSingleton.printMessage('1'));
  });
  // Register RPC for child 1
  child1.getSingleton(RPCServiceRegistry).add('test1', TestService);
  ctxRouter.post('/child1-api/rpc', child1.getSingleton(RPCServiceRegistry).routeHandler);

  // Child 2
  let child2 = app.createChildApp();
  const child2TestSingleton = child2.getSingleton(TestSingleton);
  child2.getSingleton(HttpRouter).get('/app/child2', (_req, res) => {
    res.end('child 2 app says: ' + child2TestSingleton.printMessage('2'));
  });
  // Register RPC for child 2
  child2.getSingleton(RPCServiceRegistry).add('test2', TestService);
  ctxRouter.post('/child2-api/rpc', child2.getSingleton(RPCServiceRegistry).routeHandler);

  // Register RPC for root app
  app.getSingleton(RPCServiceRegistry).add('testRoot', TestService);
  ctxRouter.post('/root-api/rpc', app.getSingleton(RPCServiceRegistry).routeHandler);

  console.log(
    `Child: testSingleton before test (load plugins):`,
    child1.getSingleton(testSingleton),
  );
  console.log(`Mock singleton for tests`);
  app.overrideSingleton(testSingleton, (_app: App) => {
    return 0;
  });
  console.log(`Child: testSingleton in test:`, child1.getSingleton(testSingleton));
};

export let testSingleton = (_app: App) => {
  return new Date().getTime();
};
