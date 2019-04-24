[Home](/) &gt; [@h4bff/backend](../backend.md) &gt; [RPCFileResult](RPCFileResult.md)

## RPCFileResult class

Used for describing RPC calls which return a file (for example, DownloadDocx, DownloadPDF)

<b>Signature:</b>

```typescript
export declare class RPCFileResult implements CustomResponse, IRPCFileResult 
```

## Properties

|  Property | Type | Description |
|  --- | --- | --- |
|  [buffer](RPCFileResult.md#buffer) | <code>Buffer</code> |  |
|  [fileName](RPCFileResult.md#filename) | <code>string</code> |  |

### buffer

<b>Signature:</b>

```typescript
buffer: Buffer;
```

### fileName

<b>Signature:</b>

```typescript
fileName: string;
```

## Methods

|  Method | Description |
|  --- | --- |
|  [sendToHTTPResponse(res, code)](RPCFileResult.md#sendtohttpresponse) |  |

### sendToHTTPResponse

<b>Signature:</b>

```typescript
sendToHTTPResponse(res: Response, code: number): Response;
```

#### Parameters

|  Parameter | Type | Description |
|  --- | --- | --- |
|  res | <code>Response</code> |  |
|  code | <code>number</code> |  |

<b>Returns:</b>

`Response`

