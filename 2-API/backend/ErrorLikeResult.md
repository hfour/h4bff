[Home](/) &gt; [@h4bff/backend](../backend.md) &gt; [ErrorLikeResult](ErrorLikeResult.md)

## ErrorLikeResult class

Used to return an error to callers, but doesn't actually result in error semantics on the backend.

<b>Signature:</b>

```typescript
export declare class ErrorLikeResult implements CustomResponse, IRPCErrorLikeResult 
```

## Properties

|  Property | Type | Description |
|  --- | --- | --- |
|  [code](ErrorLikeResult.md#code) | <code>number</code> |  |
|  [message](ErrorLikeResult.md#message) | <code>string</code> |  |
|  [result](ErrorLikeResult.md#result) | <code>any</code> |  |

### code

<b>Signature:</b>

```typescript
code: number;
```

### message

<b>Signature:</b>

```typescript
message: string;
```

### result

<b>Signature:</b>

```typescript
result: any;
```

## Methods

|  Method | Description |
|  --- | --- |
|  [sendToHTTPResponse(res, \_code)](ErrorLikeResult.md#sendtohttpresponse) |  |

### sendToHTTPResponse

<b>Signature:</b>

```typescript
sendToHTTPResponse(res: Response, _code: number): import("express-serve-static-core").Response;
```

#### Parameters

|  Parameter | Type | Description |
|  --- | --- | --- |
|  res | <code>Response</code> |  |
|  \_code | <code>number</code> |  |

<b>Returns:</b>

`import("express-serve-static-core").Response`

