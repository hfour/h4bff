[Home](/) &gt; [@h4bff/core](core.md)

## core package

## Classes

|  Class | Description |
|  --- | --- |
|  [App](core/App.md) | Represents an H4BFF application, the central hub of h4bff. Its the class that loads and initializes all the plugins, storing instances of their singletons in the singleton locator, as well as creating new service contexts which keep per-request service locators. |
|  [AppSingleton](core/AppSingleton.md) | Derive from this class to create application singletons.<!-- -->Singletons are initialized only once per application, although you can initialize different singletons of the same type in child applications. |
|  [BaseService](core/BaseService.md) | Derive from this class to create H4BFF services.<!-- -->Services are classes that are instantiated and operate within an "isolated" service context, and are instantiated separately within each context, as opposed to singletons which have only one instance within an App. |
|  [BaseTransient](core/BaseTransient.md) | Derive from this class to create H4BFF transients.<!-- -->Transients are classes that are instantiated every time its requested, unlike services / singletons which are instantiated, respectively, once per service context / app |
|  [ServiceContext](core/ServiceContext.md) | Represents a transient context. On the backend that's usually created for every individual HTTP request. On the frontend a transient request is created when the router route changes - when the user navigates to a different page. |
|  [ServiceContextEvents](core/ServiceContextEvents.md) | Handles events related to context creation, destruction etc.<!-- -->See [onContextDisposed](core/ServiceContextEvents.md#oncontextdisposed) for more details. |

