# Error handling tools

These and [server.ts](../server.ts) are all candidates to be moved to common libraries.

All of these tools are intended to be used together. At least, they are
intended to be shared among REST proxies, but there isn't really a reason
we couldn't use these tools as a base for our GraphQL servers as well.
In fact, I would recommend it, especially for GraphQL servers that serve
rest routes.

## Why any of this? What is the end goal?

It is easier and faster for implementers to just implement what a specific server needs.
Why should they consider consuming this as a server base?

First and foremost, common predictable conventions as you move between repos.

Secondly, I'd like to move toward renovate automatically and aggressively deploying
dependency updates to at least our own internal dependencies. We own both API integration
points, we know how to version APIs to communicate breaking changes and we know how to
make backwards compatible APIs that avoid breaking changes. If we get many services
consuming this code, one update to a library can automatically update every service
that consumes it with observability improvements.

## Design goals

These tools need to be able to be consumed easily. Especially if we intend
to propagate tools like these across multiple libraries, they must be designed
to avoid breaking changes whenever possible.

In order to achieve this, try to follow these guidelines:

1. Allow flexible configuration. These services have different sensibilities.
Some are best effort, and others really try to offer solid reliability. One size
will not fit all.
2. Allow initialization with zero config whenever possible. Default values are
your friend. If introducing new features, try to keep them optional if they aren't
absolutely mandatory.
3. Allow flexible initialization with partial config whenever possible. Check
[RestResponseError](./restResponseError.ts) and
[its tests](./restJsonResponseError.spec.ts) for examples.
4. Configure these tools with options types. This allows documentation to be attached
more easily, and supports extension more easily in the future.
