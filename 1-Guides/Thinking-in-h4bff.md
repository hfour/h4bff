# Thinking in h4bff

While h4bff gives you the tools to write plugins, it doesn't specify how you might achieve a plugin
friendly design. In this article we'll implement an example comments plugin to demonstrate how we
can think about modularity in terms of plugins when writing a new feature.

If you haven't checked out the two core elements of h4bff (Services and Singletons) yet, or you'd
like a refresher, check out the [Introduction](Introduction.md) article first.

## Designing a comments plugin

Our task is to design a comments plugin. As plugin writers, our customers / users are other teams
that work on the main products. (On smaller teams these could be individual contributors or ourselves)

### Step 1: Consider the use cases to identify unknowns

When designing a plugin, its helpful to think of at least two use cases for it that are somewhat
different. In our example, we know of two products need the commenting functionality:

1. a blog, and they want to implement comments for the blog posts.
2. a document review tool for a document management product, where feedback on a document's content
   can be given.

The blog product design team are thinking about moderator-approved commenting mode, where everyone
can comment but comments don't appear until blog moderators review them.

The document review team is using a custom permissions system, but are considering switching to a
more general access control plugin. We aren't quite sure when this system will be implemented.

Requirements may also include hooking up comments to the notifications system (with emailing).

These requirements have some uncertainties. When will the new ACL system be implemented? Should we
wait for that before writing the comments system? Should we try to implement a generic permission
system that can do both moderator approval and ACL? What are the notification systems like in the
two products?

### Step 2: Build only what you know

At this point we might want to try and guess what a general solution would be for things like
notifications, access control and such. Its best to resist this temptation! Instead, lets build a
simple comments plugin without any access control or notifications first.

For simplicity, we will omit some of the code of the plugin. A complete working example can be found
[in the example package][example-pkg]

The one thing we know for sure is that comments will be tied to a certain "topic". A topic can be,
anything the plugin users decide they want it to be - a selection in a document, a blog post, or
even another comment (thanks to that last one, we can keep it simple and not implement nested
comments)

Lets write our comments DB. We need two tables, one with topics, the other with comments tied to
those topics:

```typescript
class CommentsDB extends AppSingleton {
  private db = this.app.getSingleton(Database).db;
  topics = this.db.define({
    name: 'commentsTopics',
    columns: {
      id: column.uuid({primaryKey: true}),
      creatorId: column.uuid(),
      type: columns.string(),
      name: columns.string()
    }
  })
  comments = this.db.define({
    name: 'comments'
    columns: {
      id: column.uuid({primaryKey: true}),
      creatorId: column.uuid(),
      topicId: column.uuid(),
      text: column.string()
    }
  })
  constructor(app: App) {
    super(app);
    this.db.addMigrations([{
      async up(tx: Transaction): Promise<any> {
        await tx.queryAsync(`CREATE TABLE comments (...)`);
        await tx.queryAsync(`CREATE TABLE commentsTopics (...)`);
      }])
  }
}
```

We need a service to expose the commenting functionality

```typescript
export class CommentsService extends BaseService {
  get db() {
    return this.getSingleton(CommentsDB);
  }

  get currentUserId() {
    throw new Error('How do we get the current user ID in this system?');
  }

  async addTopic(params: { topicId: string }) {
    this.db.topics.insert({ topicId: params.topicId, creatorId: this.currentUserId });
  }
  async addComment(params: { topicId: string; text: string }) {
    await this.db.comments.insert({
      topicId: params.topicId,
      commentId: uuid.v4(),
      text: params.text,
      creatorId: this.currentUserId,
    });
    if (userId) {
      if (!(await this.db.usersGreeted.where({ id: userId }).get())) {
        await this.db.usersGreeted.insert({ id: userId, name: params.name }).exec();
      }
      return { greet: `Hello ${params.name}` };
    }
  }

  async listComments(params: { topicId: string }) {
    return this.db.comments.where({ topicId: params.topicId }).all();
  }
}
```

Now we can write the plugin function:

```typescript
function CommentsPlugin(app: App) {
  app.load(CommentsDB); // adds the migrations

  // Expose service to outside world!
  app.getSingleton(RPCServiceRegistry).add('comments', CommentsService);
}
```

### Step 3: Make the plugin pluggable

Our plugin is not ready yet. We hit the first blocker - how do we get the current user ID?

There are two ways we could approach this.

If our apps all have a standardized user authentication plugin, we could call upon its services to
get information about the current user.

If we don't have a standardized user system, we'll need to make things configurable.

How do we decide between the two approaches? We can decide by asking ourselves a few questions

1. Whats the scope of our plugin? If its just for use in our own apps, and we don't plan to open
   source it, there is no need to make this configurable
2. Do we expect any changes in the user authentication API? Are there plans to migrate to something
   else? If such plans exist, it might be prudent to make the user service configurable, just to
   ease the transition we know is going to happen. On the other hand, if we can reasonably expect
   for `getService(UserInfo).userId` API to always work, even if we change authentication systems,
   there is no need to make it configurable.

For this plugin, we'll assume we need to make it configurable, just to demonstrate how pluggability
works on a simple example. One way is to add a singleton called CommentsConfig which has a writable
property for the user id getter:

```typescript
class CommentsSettings extends AppSingleton {
  getUserId: (service: BaseService) => string = () => {
    throw new Error('User ID provider not configured!');
  };
}
```

Now the application can configure a provider for the user id on start:

```typescript
class MyApp extends App {
  loadPlugins() {
    this.getSingleton(CommentsSettings).getUserId = svc => svc.getService(UserInfo).user.id;
  }
}
```

And we can use this getter in the CommentsService:

```typescript
class CommentsService {
  // ...
  // We pass the current service to getUserId. That way the singleton has the same request
  // context to work with, accessible from the service.
  get currentUserId() {
    return this.getSingleton(CommentsConfig).getUserId(this);
  }
  // ...
}
```

### Step 4: Design it as a proper package / library

When designing configurability for a plugin, its helpful to think of it as any other node library /
package and approach it as a user. If I were to use a ready-made comments module, what would I look
for? I would look at the README to see what it does, check out if it has an example, and see what
configuration options it offers.

We already designed one pluggability option. Now lets think about the others

TODO: discuss filtering and authentication

TODO: write plugin README

```markdown
# comments-plugin

A h4bff plugin that implements commenting functionality
```

[example-pkg]: https://github.com/hfour/h4bff/tree/master/packages/example
