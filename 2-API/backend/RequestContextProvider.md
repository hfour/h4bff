[Home](/) &gt; [@h4bff/backend](../backend.md) &gt; [RequestContextProvider](RequestContextProvider.md)

## RequestContextProvider class

Use this class to open up a new service context from an express middleware. The service context will provide unique instances of all service classes for that particular request.

Also see [App.withServiceContext](../core/App.md#withservicecontext) which is the more generic, non-backend-specific service context.

<b>Signature:</b>

```typescript
export declare class RequestContextProvider extends AppSingleton 
```

## Methods

|  Method | Description |
|  --- | --- |
|  [withRequestContext(req, res, f)](RequestContextProvider.md#withrequestcontext) | Creates a service context for the provided Express request / response pair. automatically disposes of it when the promise finishes or throws.<!-- -->Use this method to get a fresh new context directly from express middleware. You don't need this method from within RPC methods in services, as a context is automatically created for them. |

### withRequestContext

Creates a service context for the provided Express request / response pair. automatically disposes of it when the promise finishes or throws.

Use this method to get a fresh new context directly from express middleware. You don't need this method from within RPC methods in services, as a context is automatically created for them.

<b>Signature:</b>

```typescript
withRequestContext<T>(req: Express.Request, res: Express.Response, f: ServiceContextFn<T>): PromiseLike<T>;
```

#### Parameters

|  Parameter | Type | Description |
|  --- | --- | --- |
|  req | <code>Express.Request</code> | An Express Request |
|  res | <code>Express.Response</code> | An Express Response |
|  f | <code>ServiceContextFn&lt;T&gt;</code> | A function that receives the service context as an argument. This function will be called when the context is allocated. When the returned promise gets fulfilled or rejected, the context will be automatically disposed, closing any services that allocate resources, such as for example database transactions. The result of the outer promise (a value or an error) will be the same as the result of the inner promise. |

<b>Returns:</b>

`PromiseLike<T>`

#### Example


```typescript
router.get('/db-healthcheck', (req, res) => {
  app.getSingleton(RequestContextProvider).withRequestContext(req, res, ctx => {
    return ctx.getService(TransactionProvider).queryAsync('SELECT 1')
     .then(() => res.end('OK'), err => res.end('ERROR'))
  })
})

```

