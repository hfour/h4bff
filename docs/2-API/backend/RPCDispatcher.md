[Home](/) &gt; [@h4bff/backend](../backend.md) &gt; [RPCDispatcher](RPCDispatcher.md)

## RPCDispatcher class

Responsible for finding and executing the right RPC method based on the RPC mapping found in the [RPCServiceRegistry](RPCServiceRegistry.md)<!-- -->.

<b>Signature:</b>

```typescript
export declare class RPCDispatcher extends BaseService 
```

## Properties

|  Property | Type | Description |
|  --- | --- | --- |
|  [call](RPCDispatcher.md#call) | <code>() =&gt; Promise&lt;void &#124; import(&quot;express-serve-static-core&quot;).Response&gt;</code> | Executes the RPC middleware chain including the genuine RPC call. Handles both, success and error cases. |
|  [req](RPCDispatcher.md#req) | <code>import(&quot;express&quot;).Request</code> |  |
|  [res](RPCDispatcher.md#res) | <code>import(&quot;express&quot;).Response</code> |  |
|  [rpcPath](RPCDispatcher.md#rpcpath) | <code>string</code> |  |
|  [rpcRegistry](RPCDispatcher.md#rpcregistry) | <code>RPCServiceRegistry</code> |  |
|  [serviceClass](RPCDispatcher.md#serviceclass) | <code>typeof BaseService</code> |  |
|  [serviceInstance](RPCDispatcher.md#serviceinstance) | <code>BaseService</code> |  |
|  [serviceMethod](RPCDispatcher.md#servicemethod) | <code>Function</code> |  |
|  [serviceNameMethod](RPCDispatcher.md#servicenamemethod) | <code>string[]</code> | When given 'serviceAlias.method' string, it splits it to \['serviceAlias', 'method'\].<!-- -->If the string has more than one dot, the serviceAlias consumes all parts of the name except for the last one:<!-- -->'path.with.more.dots' =<!-- -->&gt; \['path.with.more', 'dots'\] |

### call

Executes the RPC middleware chain including the genuine RPC call. Handles both, success and error cases.

<b>Signature:</b>

```typescript
call: () => Promise<void | import("express-serve-static-core").Response>;
```

### req

<b>Signature:</b>

```typescript
readonly req: import("express").Request;
```

### res

<b>Signature:</b>

```typescript
readonly res: import("express").Response;
```

### rpcPath

<b>Signature:</b>

```typescript
readonly rpcPath: string;
```

### rpcRegistry

<b>Signature:</b>

```typescript
readonly rpcRegistry: RPCServiceRegistry;
```

### serviceClass

<b>Signature:</b>

```typescript
readonly serviceClass: typeof BaseService;
```

### serviceInstance

<b>Signature:</b>

```typescript
readonly serviceInstance: BaseService;
```

### serviceMethod

<b>Signature:</b>

```typescript
readonly serviceMethod: Function;
```

### serviceNameMethod

When given 'serviceAlias.method' string, it splits it to \['serviceAlias', 'method'\].

If the string has more than one dot, the serviceAlias consumes all parts of the name except for the last one:

'path.with.more.dots' =<!-- -->&gt; \['path.with.more', 'dots'\]

<b>Signature:</b>

```typescript
readonly serviceNameMethod: string[];
```

## Methods

|  Method | Description |
|  --- | --- |
|  [handleRequest()](RPCDispatcher.md#handlerequest) | Executes the genuine RPC method. |

### handleRequest

Executes the genuine RPC method.

<b>Signature:</b>

```typescript
handleRequest(): import("express-serve-static-core").Response | Promise<any>;
```
<b>Returns:</b>

`import("express-serve-static-core").Response | Promise<any>`

