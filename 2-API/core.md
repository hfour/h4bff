[Home](/) &gt; [@h4bff/core](core.md)

## core package

## Classes

|  Class | Description |
|  --- | --- |
|  [App](core/App.md) | Represents an H4BFF application, the central hub of h4bff. Its the class that loads and initializes all the plugins, storing instances of their singletons in the singleton locator, as well as creating new service contexts which keep per-request service locators. |
|  [AppSingleton](core/AppSingleton.md) |  |
|  [BaseService](core/BaseService.md) |  |
|  [Locator](core/Locator.md) |  |
|  [ServiceContext](core/ServiceContext.md) | Represents a transient context. On the backend that's usually created for every individual HTTP request. On the frontend a transient request is created when the router route changes - when the user navigates to a different page. |
|  [ServiceContextEvents](core/ServiceContextEvents.md) | Handles events related to context creation, destruction etc.<!-- -->See [onContextDisposed](core/ServiceContextEvents.md#oncontextdisposed) for more details. |

## Type Aliases

|  Type Alias | Description |
|  --- | --- |
|  [ConstructorOrFactory](core/ConstructorOrFactory.md) |  |
|  [ContextListener](core/ContextListener.md) |  |
|  [PublicInterface](core/PublicInterface.md) |  |

