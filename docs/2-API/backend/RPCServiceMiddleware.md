[Home](/) &gt; [@h4bff/backend](../backend.md) &gt; [RPCServiceMiddleware](RPCServiceMiddleware.md)

## RPCServiceMiddleware type

RPC service middleware.

<b>Signature:</b>

```typescript
export declare type RPCServiceMiddleware = (sCtx: ServiceContext, next: () => PromiseLike<void>) => PromiseLike<void>;
```
