[Home](/) &gt; [@h4bff/backend](../backend.md) &gt; [RequestContextProvider](RequestContextProvider.md)

## RequestContextProvider class

Keeps a map of request / response pairs tied to their given service context.

<b>Signature:</b>

```typescript
export declare class RequestContextProvider extends AppSingleton 
```

## Methods

|  Method | Description |
|  --- | --- |
|  [getContext(req, res)](RequestContextProvider.md#getcontext) | Creates a new service context and sets the req / res pair, unless there's already one, in which case it's returned instead. |
|  [withRequestContext(req, res, f)](RequestContextProvider.md#withrequestcontext) | Creates a service context for the provided request / response pair and automatically disposes of it when the promise finishes or throws. |

### getContext

Creates a new service context and sets the req / res pair, unless there's already one, in which case it's returned instead.

<b>Signature:</b>

```typescript
getContext(req: Express.Request, res: Express.Response): ServiceContext;
```

#### Parameters

|  Parameter | Type | Description |
|  --- | --- | --- |
|  req | <code>Express.Request</code> |  |
|  res | <code>Express.Response</code> |  |

<b>Returns:</b>

`ServiceContext`

### withRequestContext

Creates a service context for the provided request / response pair and automatically disposes of it when the promise finishes or throws.

<b>Signature:</b>

```typescript
withRequestContext<T>(req: Express.Request, res: Express.Response, f: (createdContext: ServiceContext) => PromiseLike<T>): PromiseLike<T>;
```

#### Parameters

|  Parameter | Type | Description |
|  --- | --- | --- |
|  req | <code>Express.Request</code> |  |
|  res | <code>Express.Response</code> |  |
|  f | <code>(createdContext: ServiceContext) =&gt; PromiseLike&lt;T&gt;</code> |  |

<b>Returns:</b>

`PromiseLike<T>`

