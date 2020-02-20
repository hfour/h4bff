[Home](/) &gt; [@h4bff/backend](../backend.md) &gt; [RPCServiceRegistry](RPCServiceRegistry.md)

## RPCServiceRegistry class

Responsible for holding the RPC service mapping.

<b>Signature:</b>

```typescript
export declare class RPCServiceRegistry extends AppSingleton 
```

## Properties

|  Property | Type | Description |
|  --- | --- | --- |
|  [routeHandler](RPCServiceRegistry.md#routehandler) | <code>(req: Request, res: Response) =&gt; PromiseLike&lt;void &#124; import(&quot;express-serve-static-core&quot;).Response&gt;</code> | Middleware that adds RPC handling for given request and response. It binds the request and response to a service context and forwards the request to the [RPCDispatcher](RPCDispatcher.md)<!-- -->. |
|  [services](RPCServiceRegistry.md#services) | <code>{`<p/>`        [key: string]: typeof BaseService;`<p/>`    }</code> |  |

### routeHandler

Middleware that adds RPC handling for given request and response. It binds the request and response to a service context and forwards the request to the [RPCDispatcher](RPCDispatcher.md)<!-- -->.

<b>Signature:</b>

```typescript
routeHandler: (req: Request, res: Response) => PromiseLike<void | import("express-serve-static-core").Response>;
```

### services

<b>Signature:</b>

```typescript
services: {
        [key: string]: typeof BaseService;
    };
```

## Methods

|  Method | Description |
|  --- | --- |
|  [add(alias, service)](RPCServiceRegistry.md#add) | Adds new RPC service mapping. |
|  [get(serviceAlias)](RPCServiceRegistry.md#get) | Returns service for given alias. |

### add

Adds new RPC service mapping.

<b>Signature:</b>

```typescript
add(alias: string, service: typeof BaseService): void;
```

#### Parameters

|  Parameter | Type | Description |
|  --- | --- | --- |
|  alias | <code>string</code> | service alias |
|  service | <code>typeof BaseService</code> | service constructor |

<b>Returns:</b>

`void`

### get

Returns service for given alias.

<b>Signature:</b>

```typescript
get(serviceAlias: string): typeof BaseService | undefined;
```

#### Parameters

|  Parameter | Type | Description |
|  --- | --- | --- |
|  serviceAlias | <code>string</code> |  |

<b>Returns:</b>

`typeof BaseService | undefined`
