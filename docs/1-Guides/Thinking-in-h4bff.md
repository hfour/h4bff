# Thinking in h4bff

While h4bff gives you the tools to write plugins, it doesn't specify how you might achieve a plugin friendly design. In this article we'll implement an example comments plugin to demonstrate how we
can think about modularity in terms of plugins when writing a new feature.

If you haven't checked out the two core elements of h4bff (Services and Singletons) yet, or you'd
like a refresher, check out the [Introduction](Introduction.md) article first.

# Designing a comments plugin

Our task is to design a comments plugin. As a plugin writing team, our customers are other teams that work on the main products.

### Step 1: Consider the use cases

When designing a plugin, its helpful to think of at least two use cases for it that are somewhat different. In our example, we know of two products need the commenting functionality:

1. a blog, and they want to implement comments for the blog posts.
2. a document review tool for a document management product, where feedback on a document's content can be given.

Both of these use cases are very different. Lets see if we can come up with a single solution that can be integrated into both applications.

TODO: explain access requirements, add uncertainty (product is thinking about using new ACL systen). Explain how it would be a mistake to design for all known use cases and instead look into how you can provide pluggability of your own, especially given uncertainty.

When designing a plugin, its helpful to think of it as any other node library / package and
approach it as a user. If I were to use a ready-made comments module, what would I look for? I
would look at the README to see what it does, check out if it has an example, and see what
configuration options it offers.


```markdown

# comments-plugin

A h4bff plugin that implements commenting functionality

```

WIP