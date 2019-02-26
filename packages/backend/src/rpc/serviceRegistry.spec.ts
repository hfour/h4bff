import { Container, BaseService } from '@h4bff/core';
import { RPCServiceRegistry } from './serviceRegistry';
import { RPCDispatcher } from './dispatcher';
import { Request, Response } from 'express';

describe('RPCServiceRegistry', () => {
  describe('Registration', () => {
    it(`should register new RPC service`, () => {
      let container = new Container();
      let rpcServiceRegistry = container.getSingleton(RPCServiceRegistry);
      class TestService extends BaseService {}
      rpcServiceRegistry.add('test', TestService);
      let testServiceResult = rpcServiceRegistry.get('test');
      expect(testServiceResult).toEqual(TestService);
    });

    it(`should not allow to register a service under existing alias`, () => {
      let container = new Container();
      let rpcServiceRegistry = container.getSingleton(RPCServiceRegistry);
      class TestService extends BaseService {}
      rpcServiceRegistry.add('test', TestService);
      expect(() => rpcServiceRegistry.add('test', TestService)).toThrowError('Namespace test already in use!');
    });
  });

  describe('Exist', () => {
    it(`should assert that a given method exists on a registered service`, () => {
      let container = new Container();
      let rpcServiceRegistry = container.getSingleton(RPCServiceRegistry);
      class TestService extends BaseService {
        test() {
          return Promise.resolve();
        }
      }
      rpcServiceRegistry.add('test', TestService);
      expect(rpcServiceRegistry.exists('test', 'test')).toBeTruthy();
    });

    it(`should assert that a given method does not exists on a registered service`, () => {
      let container = new Container();
      let rpcServiceRegistry = container.getSingleton(RPCServiceRegistry);
      class TestService extends BaseService {
        test() {
          return Promise.resolve();
        }
      }
      rpcServiceRegistry.add('test', TestService);
      expect(rpcServiceRegistry.exists('test', 'none')).toBeFalsy();
    });
  });

  describe('Route handling', () => {
    it('should forward to RPCDispatcher', () => {
      let container = new Container();
      container.overrideService(
        RPCDispatcher,
        class MockRPCDispatcher extends RPCDispatcher {
          call = jest.fn().mockResolvedValue('test');
        },
      );
      let rpcServiceRegistry = container.getSingleton(RPCServiceRegistry);
      rpcServiceRegistry.routeHandler({} as Request, {} as Response).then(result => {
        expect(result).toEqual('test');
      });
    });
  });
});
