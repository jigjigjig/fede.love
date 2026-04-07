---
title: Simplicity is a feature
date: 2025-01
---

Every dependency is a bet. You're betting that the maintainer won't abandon it, that the API won't change in a way that breaks your code, that the bundle size is worth the convenience. Sometimes the bet pays off. Sometimes you end up vendoring a left-pad.

I've started asking a different question before adding a package: "Can I write this in under 50 lines?" If yes, I probably should. Fifty lines I understand completely are worth more than a thousand lines someone else wrote that I'll never read.

This isn't about reinventing wheels. It's about knowing which wheels are load-bearing and which are decorative. A date formatting library for a personal site? Decorative. A cryptography implementation? Load-bearing. Know the difference.

The simplest version of something is usually the hardest to build. It requires you to actually understand the problem instead of hiding behind abstractions. But once you have it, it's yours. It doesn't break when someone pushes a bad release at 3am. It doesn't add 200KB to your bundle. It does exactly what you need and nothing more.

Simplicity isn't the absence of effort. It's the result of enough effort to remove everything unnecessary.
