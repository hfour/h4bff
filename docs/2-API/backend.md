[Home](/) &gt; [@h4bff/backend](backend.md)

## backend package

## Classes

|  Class | Description |
|  --- | --- |
|  [Database](backend/Database.md) | Serves as kind of a database driver. Creates and exposes anydb-sql instance of the database, which provides API for database operations. Additionally, it stores the db migration tasks and provides API for migrations. |
|  [ErrorLikeResult](backend/ErrorLikeResult.md) | Used to return an error to callers, but doesn't actually result in error semantics on the backend. |
|  [RequestContextProvider](backend/RequestContextProvider.md) | Keeps a map of request / response pairs tied to their given service context. |
|  [RequestInfo](backend/RequestInfo.md) | Stores the current express Request and Response objects. |
|  [Router](backend/Router.md) |  |
|  [RPCDispatcher](backend/RPCDispatcher.md) | Responsible for finding and executing the right RPC method based on the RPC mapping found in the [RPCServiceRegistry](backend/RPCServiceRegistry.md)<!-- -->. |
|  [RPCFileResult](backend/RPCFileResult.md) | Used for describing RPC calls which return a file (for example, DownloadDocx, DownloadPDF) |
|  [RPCMiddlewareContainer](backend/RPCMiddlewareContainer.md) | Container for RPC middlewares. |
|  [RPCServiceRegistry](backend/RPCServiceRegistry.md) | Responsible for holding the RPC service mapping. |
|  [TransactionProvider](backend/TransactionProvider.md) | Provides transaction instance to support transactional behavior within service context. It there is no existing transaction present in the current service context, it creates it. Can be used within a service implementation or where there is a [ServiceContext](core/ServiceContext.md) instance available. |

## Functions

|  Function | Description |
|  --- | --- |
|  [isCustomResponse(data)](backend/isCustomResponse.md) | Checks if a given response implements the [CustomResponse](backend/CustomResponse.md) interface. |

## Interfaces

|  Interface | Description |
|  --- | --- |
|  [CustomResponse](backend/CustomResponse.md) | Represents custom response. |
|  [IRPCErrorLikeResult](backend/IRPCErrorLikeResult.md) |  |
|  [IRPCFileResult](backend/IRPCFileResult.md) |  |

## Type Aliases

|  Type Alias | Description |
|  --- | --- |
|  [RPCMiddleware](backend/RPCMiddleware.md) |  |
|  [RPCServiceMiddleware](backend/RPCServiceMiddleware.md) | RPC service middleware. |

