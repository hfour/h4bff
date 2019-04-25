[Home](/) &gt; [@h4bff/core](../core.md) &gt; [ServiceContextEvents](ServiceContextEvents.md)

## ServiceContextEvents class

Handles events related to context creation, destruction etc.

See [onContextDisposed](ServiceContextEvents.md#oncontextdisposed) for more details.

<b>Signature:</b>

```typescript
export declare class ServiceContextEvents extends AppSingleton 
```

## Methods

|  Method | Description |
|  --- | --- |
|  [onContextDisposed(listener)](ServiceContextEvents.md#oncontextdisposed) | Registers a function that will be called every time a service context is getting destroyed.<!-- -->Use this when you want to react to the destruction of any service context. |

### onContextDisposed

Registers a function that will be called every time a service context is getting destroyed.

Use this when you want to react to the destruction of any service context.

<b>Signature:</b>

```typescript
onContextDisposed(listener: ContextListener): void;
```

#### Parameters

|  Parameter | Type | Description |
|  --- | --- | --- |
|  listener | <code>ContextListener</code> | A function that receives the context and returns a promise when the event completes. |

<b>Returns:</b>

`void`

#### Example

Let's say we create a context on the backend each time a request comes in. Before we return a response, we want to close the DB transaction. What we can do is:

```typescript
app.getSingleton(ServiceContextEvents).onContextDisposed(ctx => {
  ctx.getService(Txn).dispose()
})

```

