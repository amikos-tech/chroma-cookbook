# Chroma Authorization Model with OpenFGA

Source Code

The source code for this article can be found [here](https://github.com/amikos-tech/chromadb-auth).

This article will not provide any code that you can use immediately but will set the stage for our next article, which will introduce the actual Chroma-OpenFGA integration.

With that in mind, let’s get started.

Who is this article for? The intended audience is DevSecOps, but engineers and architects could also use this to learn about Chroma and the authorization models.

## Authorization Model

Authorization models are an excellent way to abstract the way you wish your users to access your application form the actual implementation.

There are many ways to do authz, ranging from commercial Auth0 FGA to OSS options like Ory Keto/Kratos, CASBIN, Permify, and Kubescape, but for this article, we’ve decided to use OpenFGA (which technically is Auth0’s open-source framework for FGA).

Why OpenFGA, I hear you ask? Here are a few reasons:

- Apache-2 licensed
- CNCF Incubating project
- Zanzibar alignment in that it is a ReBAC (Relation-based access control) system
- DSL for modeling and testing permissions (as well as JSON-base version for those with masochistic tendencies)

OpenFGA has done a great job explaining the steps to building an Authorization model, which you can read [here](https://openfga.dev/docs/modeling/getting-started). We will go over those while keeping our goal of creating an authorization model for Chroma.

It is worth noting that the resulting authorization model that we will create here will be suitable for many GenAI applications, such as general-purpose RAG systems. Still, it is not a one-size-fits-all solution to all problems. For instance, if you want to implement authz in Chroma within your organization, OpenFGA might not be the right tool for the job, and you should consult with your IT/Security department for guidance on integrating with existing systems.

## The Goal

Our goal is to achieve the following:

- Allow fine-grained access to the following resources - collection, database, tenant, and Chroma server.
- AlGrouping of users for improved permission management.
- Individual user access to resources
- Roles - owner, writer, reader

Document-Level Access

Although granting access to individual documents in a collection can be beneficial in some contexts, we have left that part out of our goals to keep things as simple and short as possible. If you are interested in this topic, reach out, and we will help you.

This article will not cover user management, commonly called Identity Access Management (IAM). We’ll cover that in a subsequent article.

## Modeling Fundamentals

Let’s start with the fundamentals:

**`Why could user U perform an action A on an object O?`**

We will attempt to answer the question in the context of Chroma by following OpenFGA approach to refining the model. The steps are:

1. Pick the most important features.
1. List of object types
1. List of relations for the types
1. Test the model
1. Iterate

Given that OpenFGA is Zanzibar inspired, the basic primitive for it is a tuple of the following format:

```bash
(User,Relation,Object)
```

With the above we can express any relation between a user (or a team or even another object) the action the user performs (captured by object relations) and the object (aka API resource).

### Pick the features

In the context of Chroma, the features are the actions the user can perform on Chroma API (as of this writing v0.4.24).

Let’s explore what are the actions that users can perform:

- **Create** a tenant
- **Get** a tenant
- **Create** a database for a tenant
- **Get** a database for a tenant
- **Create** a collection in a database
- **Delete** a collection from a database
- **Update** collection name and metadata
- **List** collections in a database
- **Count** collections in a database
- **Add** records to a collection
- **Delete** records from a collection
- **Update** records in a collection
- **Upsert** records in a collection
- **Count** records in a collection
- **Get** records from a collection
- **Query** records in a collection
- **Get** pre-flight-checks

Open Endpoints

Note we will omit get `hearbeat` and get `version`actions as this is generally a good idea to be open so that orchestrators (docker/k8s) can get the health status of chroma.

To make it easy to reason about relations in our authorization model we will rephrase the above to the following format:

```bash
A user {user} can perform action {action} to/on/in {object types} ... IF {conditions}
```

- A user can perform action create tenant on Chroma server if they are owner of the server
- A user can perform action get tenant on Chroma server if they are a reader or writer or owner of the server
- A user can perform action create database on a tenant if they are an owner of the tenant
- A user can perform action get database on a tenant if they are reader, writer or owner of the tenant
- A user can perform action create collection on a database if they are a writer or an owner of the database
- A user can perform action delete collection on a database if they are a writer or an owner of the database
- A user can perform action update collection name or metadata on a database if they are a writer or an owner of the database
- A user can perform action list collections in a database if they are a writer or an owner of the database
- A user can perform action count collections in a database if they are a writer or an owner of the database
- A user can perform action add records on a collection if they are writer or owner of the collection
- A user can perform action delete records on a collection if they are writer or owner of the collection
- A user can perform action update records on a collection if they are writer or owner of the collection
- A user can perform action upsert records on a collection if they are writer or owner of the collection
- A user can perform action get records on a collection if they are writer or owner or reader of the collection
- A user can perform action count records on a collection if they are writer or owner or reader of the collection
- A user can perform action query records on a collection if they are writer or owner or reader of the collection
- A user can perform action get pre-flight-checks on a Chroma server if they are writer or owner or reader of the server

We don’t have to get it all right in the first iteration, but the above is a good starting point that can be adapted further.

The above statements alone are already a great introspection as to what we can do within Chroma and who is supposed to be able to do what. Please note that your mileage may vary, as per your authz requirements, but in our experience the variations are generally around the who.

As an astute reader you have already noted that we’re generally outlined some RBAC stuff in the form of owner, writer and reader.

### List the objects!!!

Now that we know what our users can do, let’s figure solidify our understanding of on what our users will be performing these actions, aka the object types.

Let’s call them out:

- User - this is basic and pretty obvious object type that we want to model our users after
- Chroma server - this is our top level object in the access relations
- Tenant - for most Chroma developers this will equate to a team or a group
- Database
- Collection

We can also examine all of the `of the <object>` in the above statements to ensure we haven’t missed any objects. So far seems we’re all good.

Now that we have our objects let’s create a first iteration of our authorization model using [OpenFGA DSL](https://openfga.dev/docs/concepts#what-is-an-authorization-model):

```graphql
model
  schema 1.1

type server
type user
type tenant
type database
type collection
```

OpenFGA CLI

You will need to install openfga CLI - https://openfga.dev/docs/getting-started/install-sdk. Also check the [VSCode extension](https://marketplace.visualstudio.com/items?itemName=openfga.openfga-vscode) for OpenFGA.

Let’s validate our work:

```bash
fga model validate --file model-article-p1.fga
```

You should see the following output:

```bash
{
  "is_valid":true
}
```

### Relations

Now that we have the actions and the objects, let us figure out the relationships we want to build into our model.

To come up with our relations we can follow these two rules:

- Any noun of the type `{noun} of a/an/the {type}` expression (e.g. `of the collection`)
- Any verb or action described with `can {action} on/in {type}`

So now let’s work on our model to expand it with relationships:

```bash
model
  schema 1.1

type user

type server
  relations
    define owner: [user]
    define reader: [user]
    define writer: [user]
    define can_get_preflight: reader or owner or writer
    define can_create_tenant: owner or writer

type tenant
  relations
    define owner: [user]
    define reader: [user]
    define writer: [user]
    define belongsTo: [server]
    define can_create_database: owner from belongsTo or writer from belongsTo or owner or writer
    define can_get_database: reader or owner or writer or owner from belongsTo or reader from belongsTo or writer from belongsTo

type database
  relations
    define owner: [user]
    define reader: [user]
    define writer: [user]
    define belongsTo: [tenant]
    define can_create_collection: owner from belongsTo or writer from belongsTo or owner or writer
    define can_delete_collection: owner from belongsTo or writer from belongsTo or owner or writer
    define can_list_collections: owner or writer or owner from belongsTo or writer from belongsTo
    define can_get_collection: owner or writer or owner from belongsTo or writer from belongsTo
    define can_get_or_create_collection: owner or writer or owner from belongsTo or writer from belongsTo
    define can_count_collections: owner or writer or owner from belongsTo or writer from belongsTo

type collection
  relations
    define owner: [user]
    define reader: [user]
    define writer: [user]
    define belongsTo: [database]
    define can_add_records: writer or reader or owner from belongsTo or writer from belongsTo
    define can_delete_records: writer or owner from belongsTo or writer from belongsTo
    define can_update_records: writer or owner from belongsTo or writer from belongsTo
    define can_get_records: reader or owner or writer or owner from belongsTo or reader from belongsTo or writer from belongsTo
    define can_upsert_records: writer or owner from belongsTo or writer from belongsTo
    define can_count_records: reader or owner or writer or owner from belongsTo or reader from belongsTo or writer from belongsTo
    define can_query_records: reader or owner or writer or owner from belongsTo or reader from belongsTo or writer from belongsTo
```

Let’s validated:

```bash
fga model validate --file model-article-p2.fga
```

This seems mostly accurate and should do ok as Authorization model. But let us see if we can make it better. If we are to implement the above we will end up with lots of permissions in OpenFGA, not that it can’t handle them, but as we go into the implementation details it will become cumbersome to update and maintain all these permissions. So let’s look for opportunity to simplify things a little.

Can we make the model a little simpler and the first question we ask is do we really need owner, reader, writer on every object or can we make a decision about our model and simplify this. As it turns out we can. The way that most multi-user systems work is that they tend to gravitate to grouping things as a way to reduce the need to maintain a large number of permissions. In our case we can group our users into `team` and in each team we’ll have owner, writer, reader

Let’s see the results:

```bash
model
  schema 1.1

type user

type team
  relations
    define owner: [user]
    define writer: [user]
    define reader: [user]

type server
  relations
    define can_get_preflight: [user, team#owner, team#writer, team#reader]
    define can_create_tenant: [user, team#owner, team#writer]
    define can_get_tenant: [user, team#owner, team#writer, team#reader]

type tenant
  relations
    define can_create_database: [user, team#owner, team#writer]
    define can_get_database: [user, team#owner, team#writer, team#reader]

type database
  relations
    define can_create_collection: [user, team#owner, team#writer]
    define can_list_collections: [user, team#owner, team#writer, team#reader]
    define can_get_or_create_collection: [user, team#owner, team#writer]
    define can_count_collections: [user, team#owner, team#writer, team#reader]

type collection
  relations
    define can_delete_collection: [user, team#owner, team#writer]
    define can_get_collection: [user, team#owner, team#writer, team#reader]
    define can_update_collection: [user, team#owner, team#writer]
    define can_add_records: [user, team#owner, team#writer]
    define can_delete_records: [user, team#owner, team#writer]
    define can_update_records: [user, team#owner, team#writer]
    define can_get_records: [user, team#owner, team#writer, team#reader]
    define can_upsert_records: [user, team#owner, team#writer]
    define can_count_records: [user, team#owner, team#writer, team#reader]
    define can_query_records: [user, team#owner, team#writer, team#reader]
```

That is arguably more readable.

As you will observe we have also added `[user]` in the permissions of each object, why is that you may ask. The reason is that we want to build a fine-grained authorization, which means while a collection can be belong to a team, we can also grant individual permissions to users. This gives us a great way to play around with permissions at the cost of a more complex implementation of how permissions are managed, but we will get to that in the next post.

We have also removed the `belongsTo` relationship as we no longer need it. Reason: OpenFGA does not allow access of relations more than a single layer into the hierarchy thus a collection cannot use the owner of its team for permissions (there are other ways to implement that outside of the scope of this article).

Let’s recap what is our model capable of doing:

- Fine-grained access control to objects is possible via relations
- Users can be grouped into teams (a single user per team is also acceptable for cases where you need a user to be the sole owner of a collection or a database)
- Access to resources can be granted to individual users via object relations
- Define roles within a team (this can be extended to allow roles per resource, but is outside of the scope of this article)

In short we have achieved the goals we have initially set, with a relatively simple and understandable model. However, does our model work? Let’s find out in the next section.

## Testing the model

Luckily OpenFGA folks have provided a great developer experience by making it easy to [write and run tests](https://openfga.dev/docs/modeling/testing). This is a massive W and time-saver.

- An individual user can be given access to specific resources via relations
- Users can be part of any of the team roles
- An object can access by a team

```yaml
name: Chroma Authorization Model Tests # optional

model_file: ./model-article-p4.fga # you can specify an external .fga file, or include it inline

# tuple_file: ./tuples.yaml # you can specify an external file, or include it inline
tuples:
  - user: user:jane
    relation: owner
    object: team:chroma
  - user: user:john
    relation: writer
    object: team:chroma
  - user: user:jill
    relation: reader
    object: team:chroma
  - user: user:sam
    relation: can_create_tenant
    object: server:server1
  - user: user:sam
    relation: can_get_tenant
    object: server:server1
  - user: user:sam
    relation: can_get_preflight
    object: server:server1
  - user: user:michelle
    relation: can_create_tenant
    object: server:server1
  - user: team:chroma#owner
    relation: can_get_preflight
    object: server:server1
  - user: team:chroma#owner
    relation: can_create_tenant
    object: server:server1
  - user: team:chroma#owner
    relation: can_get_tenant
    object: server:server1
  - user: team:chroma#writer
    relation: can_get_preflight
    object: server:server1
  - user: team:chroma#writer
    relation: can_create_tenant
    object: server:server1
  - user: team:chroma#writer
    relation: can_get_tenant
    object: server:server1
  - user: team:chroma#reader
    relation: can_get_preflight
    object: server:server1
  - user: team:chroma#reader
    relation: can_get_tenant
    object: server:server1

tests:
  - name: Users should have team roles
    check:
      - user: user:jane
        object: team:chroma
        assertions:
          owner: true
          writer: false
          reader: false
      - user: user:john
        object: team:chroma
        assertions:
          writer: true
          owner: false
          reader: false
      - user: user:jill
        object: team:chroma
        assertions:
          writer: false
          owner: false
          reader: true
      - user: user:unknown
        object: team:chroma
        assertions:
          writer: false
          owner: false
          reader: false
      - user: user:jane
        object: team:unknown
        assertions:
          writer: false
          owner: false
          reader: false
      - user: user:unknown
        object: team:unknown
        assertions:
          writer: false
          owner: false
          reader: false
  - name: Users should have direct access to server
    check:
      - user: user:sam
        object: server:server1
        assertions:
          can_get_preflight: true
          can_create_tenant: true
          can_get_tenant: true
      - user: user:michelle
        object: server:server1
        assertions:
          can_get_preflight: false
          can_create_tenant: true
          can_get_tenant: false
      - user: user:unknown
        object: server:server1
        assertions:
          can_get_preflight: false
          can_create_tenant: false
          can_get_tenant: false
      - user: user:jill
        object: server:serverX
        assertions:
          can_get_preflight: false
          can_create_tenant: false
          can_get_tenant: false
  - name: Users of a team should have access to server
    check:
      - user: user:jane
        object: server:server1
        assertions:
          can_create_tenant: true
          can_get_tenant: true
          can_get_preflight: true
      - user: user:john
        object: server:server1
        assertions:
          can_create_tenant: true
          can_get_tenant: true
          can_get_preflight: true
      - user: user:jill
        object: server:server1
        assertions:
          can_create_tenant: false
          can_get_tenant: true
          can_get_preflight: true
      - user: user:unknown
        object: server:server1
        assertions:
          can_create_tenant: false
          can_get_tenant: false
          can_get_preflight: false
```

Let’s run the tests:

```yaml
fga model test --tests test.model-article-p4.fga.yaml
```

This will result in the following output:

```yaml
# Test Summary #
Tests 3/3 passing
Checks 42/42 passing
```

That is all folks. We try to keep things as concise as possible and this article has already our levels of comfort in that area. The bottom line is that authorization is no joke and it should take as long of a time as needed.

Writing out all tests will not be concise (maybe we’ll add that to the repo).

## Conclusion

In this article we’ve have built an authorization model for Chroma from scratch using OpenFGA. Admittedly it is a simple model, it still gives is a lot of flexibility to control access to Chroma resources.

## Resources

- https://github.com/amikos-tech/chromadb-auth - the companion repo for this article (files are stored under `openfga/basic/`)
- https://openfga.dev/docs - Read it, understand it, code it!
- https://marketplace.visualstudio.com/items?itemName=openfga.openfga-vscode - It makes your life easier
