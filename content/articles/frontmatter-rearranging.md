---
title: Frontmatter Rearranging
date: 2023-01-06
extra:
  link: https://gist.github.com/dustinknopoff/0913e25d059f111f57045c904de25980
taxonomies:
  categories:
    - showcase
  tags:
    - dev
    - deno
---

I have a private site I built using Zola for sharing recipes with my family. We currently add them to a shared iCloud drive and I have a script which runs on occasion to trigger a rebuild the site.

A common source of frustration across all times I use zola is if the content already exists and uses frontmatter in a way that differs from what Zola is willing to read.

Originally, I'd had a python script for doing this conversion but at some point the virtualenv loading of a package completely broke and I nuked it, deciding this would be a good time to try out Deno.

Give or take 20 `CMD + Tab`s to the std lib docs, it was quite simple!

