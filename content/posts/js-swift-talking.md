+++
title = "Retrieving data from a WKWebView and passing to SwiftUI"
date = 2020-12-05
draft = true
[extra]
link = "https://github.com/dustinknopoff/degree-audit-macos/blob/main/Degree%20Audit%20macOS/View%20Elements/WebView.swift"
[taxonomies]
categories = ["dev"]
tags = ["swift"]
+++

> A vaguely related continuation of [NEU Audit Parsing](@/posts/neuaudit.md)

[Skip the backstory](#retrieving-html-from-a-wkwebview)

6 months ago, the Northeastern degree audit had bothered me to the point where I felt it was necessary to somehow get it in a machine readable format (JSON). I'd consider the results a kind of mixed bag. Yes, the output is JSON but I was so done with it that only recently have I considered actually building the UI layer I always envisioned. 

That's not strictly true.

I did create a dashboard like interface in Swift UI, but it was janky and wayyyy to many line charts. So, that was sunset to the `archive` directory.

Fast forward to about a month ago. My Human-Computer Interaction course has an assignment to point out bad designs and create a quick prototype of how it could be fixed.

![](https://res.cloudinary.com/dknopoff/image/upload/f_auto/v1607189153/portfolio/Audit.png)

And on a weekend where I should be doing other homework, I figure "Eh. I should try and make this into a macOS app with SwiftUI!"

![](https://res.cloudinary.com/dknopoff/image/upload/f_auto/v1607189495/portfolio/degree_audit_swiftui.png)

That is maybe 6 hours of work which really speaks to SwiftUI's capabilities!

**But, the hard part was yet to come.**

When that's pretty much done (and I still don't want to do the homework I _need_ to do), I decide I should try incorporating the audit parsing in as well. There's two aspects that make this difficult:

1. All of the SwiftUI examples and documentation uses UIKit.
2. To be able to interoperate Swift <-> JS, a `WKWebView` is necessary (rather than the much simpler `SFSafariView`)

All that together, most articles on the web wouldn't even compile :).

So, here's my hobbled code, that works.

A lot of this is adapted from [SwiftUI Labs](https://gist.github.com/swiftui-lab/a873bf413770db6fd1a525fa424ce8cd). I don't

## Retrieving HTML from a WKWebView

