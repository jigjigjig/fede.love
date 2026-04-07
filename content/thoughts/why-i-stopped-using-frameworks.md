---
title: Why I stopped using frameworks
date: 2024-11
---

I should clarify: I stopped using frameworks for personal projects. At work, frameworks are fine. They're a shared vocabulary. They let teams move fast without arguing about folder structure. That's valuable.

But for my own stuff, I kept noticing a pattern. I'd start a project, spend an hour setting up the framework, another hour fighting its opinions, and by the time I could write actual logic, the motivation had cooled. The framework was optimized for a team of ten building a product over years. I was one person building a thing over a weekend.

So I started smaller. Vanilla JS. A single HTML file. Maybe a build step if I really needed one. And something shifted. Projects that used to take a weekend now took an evening. Not because the code was better — often it was worse — but because there was no friction between the idea and the implementation.

The dirty secret of most personal projects is that they don't need routing. They don't need state management. They don't need server-side rendering. They need a function that does a thing, and some HTML to show the result.

I'm not advocating for everyone to drop their frameworks. But if you've been in the ecosystem long enough that you've forgotten what it feels like to just write code — no config files, no build pipeline, no node_modules — try it once. Open a file, write some JavaScript, open it in a browser. Remember what that feels like.

It feels like building things nobody asked for.
