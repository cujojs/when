# Promise monitoring and debugging

This dir contains experimental new promise monitoring and debugging utilities for when.js.

## What does it do?

It monitors promise state transitions and then takes action, such as logging to the console, when certain criteria are met, such as when a promise has been rejected but has no `onRejected` handlers attached to it, and thus the rejection would have been silent.

Since promises are asynchronous and their execution may span multiple disjoint stacks, it can also attempt to stitch together a more complete stack trace.  This synthesized trace includes the point at which a promise chain was created, through all promises in the chain to the point where the rejection "escaped" the end of the chain without being handled.

## Using it

Using it is easy: Load `when/monitor/console` in your environment as early as possible.  That's it.  If you have no unhandled rejections, it will be silent, but when you do have them, it will report them to the console, complete with synthetic stack traces.

It works in modern browers (AMD), and in Node and RingoJS (CommonJS).

## Roll your own!

The monitor modules are building blocks.  The [when/monitor/console](console.js) module is one particular, and fairly simple, monitor built using the monitoring APIs and tools.  Using when/monitor/console as an example, you can build your own promise monitoring tools that look for specific types of errors, or patterns and log or display them in whatever way you need.