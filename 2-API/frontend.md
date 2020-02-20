[Home](/) &gt; [@h4bff/frontend](frontend.md)

## frontend package

## Classes

|  Class | Description |
|  --- | --- |
|  [Link](frontend/Link.md) | Link that is aware of the history and current location. |
|  [MobxStateTransient](frontend/MobxStateTransient.md) | Use a MobX state transient as a substitute for observable properties embedded within a component class when using react hooks. You can migrate all properties and methods to the mobx state transient, keeping only the render function as a react component. |
|  [RouteProvider](frontend/RouteProvider.md) | Frontend route provider. Listens to change of the location and updates it. |
|  [Router](frontend/Router.md) | Wrapper for the topmost router. It is singleton, which makes it accessible from throught the app, and is rendered within a history context provider. |

## Functions

|  Function | Description |
|  --- | --- |
|  [injectContextApp(componentClass)](frontend/injectContextApp.md) | Use this decorator to inject the app into a component by means of React Context. Once used on a component, the app is available as a property on the component class i.e. <code>this.app</code>. You will need to declare the existence property separately - the decorator cannot modify the properties of the class.<!-- -->Once the app is available, you can access any singletons or transients. |
|  [useContextApp()](frontend/useContextApp.md) | React hook for accessing the App instance. You can use the app instance's locator methods to get the required singletons or transients. |
|  [useStateTransient(Klass, props)](frontend/useStateTransient.md) | Use a state transient - a substitute for observable properties embedded within a component class. Think of this as a react component class that has everything but the render method. |

## Interfaces

|  Interface | Description |
|  --- | --- |
|  [AppContextProps](frontend/AppContextProps.md) |  |
|  [HistoryContextProps](frontend/HistoryContextProps.md) |  |
|  [LinkProps](frontend/LinkProps.md) |  |
|  [Redirect](frontend/Redirect.md) |  |

## Variables

|  Variable | Description |
|  --- | --- |
|  [AppContext](frontend/AppContext.md) | Use the AppContext.Consumer to get the application within a component. This enables the use of app.getSingleton within e.g. page layouts |
|  [HistoryContext](frontend/HistoryContext.md) |  |
|  [HistoryProvider](frontend/HistoryProvider.md) |  |

## Type Aliases

|  Type Alias | Description |
|  --- | --- |
|  [MobxStateTransientConstructor](frontend/MobxStateTransientConstructor.md) | A class constructor of a [mobx state transient](frontend/MobxStateTransient.md) |
|  [Params](frontend/Params.md) |  |
|  [RouteParameters](frontend/RouteParameters.md) |  |

