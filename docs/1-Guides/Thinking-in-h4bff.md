# Thinking in h4bff

While h4bff gives you the tools to write plugins, it doesn't specify how you might achieve a plugin friendly design. In this article we'll implement an example comments plugin to demonstrate how engineers can think about their design in terms of plugins when writing a new feature.

If you haven't checked out the two core elements of h4bff (Services and Singletons) yet, or you'd
like a refresher, check out the [Introduction](Introduction.md) article first.

# Designing a comments plugin

When designing a plugin, its helpful to think of it as any other node library / package and
approach it as a user. If I were to use a ready-made comments module, what would I look for? I
would look at the README to see what it does, check out if it has an example, and see what
configuration options it offers. So lets try and write a simple README for this plugin

```markdown

# comments-plugin

A h4bff plugin that lets you imple

```

WIP