[Home](/) &gt; [@h4bff/backend](../backend.md) &gt; [RPCMiddlewareContainer](RPCMiddlewareContainer.md)

## RPCMiddlewareContainer class

Container for RPC middlewares.

<b>Signature:</b>

```typescript
export declare class RPCMiddlewareContainer extends AppSingleton 
```

## Properties

|  Property | Type | Description |
|  --- | --- | --- |
|  [call](RPCMiddlewareContainer.md#call) | <code>(dispatcher: RPCDispatcher) =&gt; Promise&lt;any&gt;</code> |  |

### call

<b>Signature:</b>

```typescript
call: (dispatcher: RPCDispatcher) => Promise<any>;
```

## Methods

|  Method | Description |
|  --- | --- |
|  [addMiddleware(middleware)](RPCMiddlewareContainer.md#addmiddleware) | Adds new middleware to the RPC layer. Make sure that a middleware always returns a result. It might be a result that the middleware generates or modifies from the previos middleware, or it could be the result of the "next()" middleware. This way the result will be cascaded to the end of the middleware chain to achieve consistent success and error handling. |

### addMiddleware

Adds new middleware to the RPC layer. Make sure that a middleware always returns a result. It might be a result that the middleware generates or modifies from the previos middleware, or it could be the result of the "next()" middleware. This way the result will be cascaded to the end of the middleware chain to achieve consistent success and error handling.

<b>Signature:</b>

```typescript
addMiddleware(middleware: RPCMiddleware): void;
```

#### Parameters

|  Parameter | Type | Description |
|  --- | --- | --- |
|  middleware | <code>RPCMiddleware</code> |  |

<b>Returns:</b>

`void`

