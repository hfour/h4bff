import { App, BaseService } from '@h4bff/core';
import { RPCServiceRegistry } from './serviceRegistry';

describe('RPCServiceRegistry', () => {
  describe('Registration', () => {
    it(`should register new RPC service`, () => {
      let app = new App();
      let rpcServiceRegistry = app.getSingleton(RPCServiceRegistry);
      class TestService extends BaseService {}
      rpcServiceRegistry.add('test', TestService);
      let testServiceResult = rpcServiceRegistry.get('test');
      expect(testServiceResult).toEqual(TestService);
    });

    it(`should not allow to register a service under existing alias`, () => {
      let app = new App();
      let rpcServiceRegistry = app.getSingleton(RPCServiceRegistry);
      class TestService extends BaseService {}
      rpcServiceRegistry.add('test', TestService);
      expect(() => rpcServiceRegistry.add('test', TestService)).toThrowError('Namespace test already in use!');
    });
  });
});
