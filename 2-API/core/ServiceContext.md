[Home](/) &gt; [@h4bff/core](../core.md) &gt; [ServiceContext](ServiceContext.md)

## ServiceContext class

Represents a transient context. On the backend that's usually created for every individual HTTP request. On the frontend a transient request is created when the router route changes - when the user navigates to a different page.

#### Remarks

A service context is typically only provided via the safe APIs, for example [App.withServiceContext](App.md#withservicecontext)<!-- -->. Once the async function passed to this method finishes, the context is fully disposed automatically

If your service context initializes resources, see [ServiceContextEvents](ServiceContextEvents.md) for more info on doing cleanup when a context goes away.

<b>Signature:</b>

```typescript
export declare class ServiceContext 
```

## Properties

|  Property | Type | Description |
|  --- | --- | --- |
|  [locator](ServiceContext.md#locator) | <code>Locator&lt;ServiceContext&gt;</code> |  |

### locator

<b>Signature:</b>

```typescript
readonly locator: Locator<ServiceContext>;
```

## Methods

|  Method | Description |
|  --- | --- |
|  [getService(SvcClass)](ServiceContext.md#getservice) | Initializes the class within the service context (itself.)<!-- -->If the service is already initialized, it returns the instance. |
|  [getSingleton(SingletonClass)](ServiceContext.md#getsingleton) | A proxy for <code>app.getSingleton(Klass)</code>. |

### getService

Initializes the class within the service context (itself.)

If the service is already initialized, it returns the instance.

<b>Signature:</b>

```typescript
getService<T extends BaseService>(SvcClass: ConstructorOrFactory<ServiceContext, T>): T;
```

#### Parameters

|  Parameter | Type | Description |
|  --- | --- | --- |
|  SvcClass | <code>ConstructorOrFactory&lt;ServiceContext, T&gt;</code> |  |

<b>Returns:</b>

`T`

### getSingleton

A proxy for `app.getSingleton(Klass)`<!-- -->.

<b>Signature:</b>

```typescript
getSingleton<T>(SingletonClass: ConstructorOrFactory<App, T>): T;
```

#### Parameters

|  Parameter | Type | Description |
|  --- | --- | --- |
|  SingletonClass | <code>ConstructorOrFactory&lt;App, T&gt;</code> |  |

<b>Returns:</b>

`T`

