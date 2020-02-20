[Home](/) &gt; [@h4bff/frontend](../frontend.md) &gt; [AppContext](AppContext.md)

## AppContext variable

Use the AppContext.Consumer to get the application within a component. This enables the use of app.getSingleton within e.g. page layouts

<b>Signature:</b>

```typescript
AppContext: React.Context<AppContextProps>
```

#### Example


```
<AppContext.Consumer>
  {context => context.app.getSingleton(NameSingleton).appName}
</AppContext.Consumer>

```

