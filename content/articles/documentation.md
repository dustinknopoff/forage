---
title: My Woes as a Reader and Writer of Documentation
date: 2023-03-14
taxonomies:
  categories:
    - dev
  tags:
    - process
---

Listening to [GoTime Ep: 268](https://changelog.com/gotime/268) has charged up my irritation towards how difficult documentation is in a slew of ways both as a reader and writer.

**Disclaimer** Please don't expect any solutions, only complaints.

## As the Reader

### Organization and Search

Two things stand out the first time looking for documentation (besides how fast or slow the page is to load): how it's organized and whether it's easy to search. When documentation reaches a certain threshold "obvious" places to look for things vanish. Some will fall under more than one topic, others end up with part of the process in one area and the other in an equally unobvious place. If the search isn't good, your chances of finding valuable information vanishes and can only be saved by your colleagues bookmarks folder.

### Stale Information

The next thing that will be frustratingly noticed is that the series of commands to copy or a function signature isn't accurate anymore. Related to the previous section, perhaps the correct version is stuck in someone's personal documentation (either public or private) and hasn't bothered to update the one associated with a project (not usually in a intentional manner, they forgot it existed).

This stale information happens at every level of documentation (inline comments, diagrams, RFCs, Tech Specs, runbooks, etc.).

### Remote + Local / Personal + Shared

Every developer has their own notes. Sometimes it's an infinite bash history, or a scratch folder. Other times they're an avid [Obsidian](https://obsidian.md) user or even handwrite code into a physical notebook! But, let's say your company uses a technology like Confluence, having those two tools play nice with each other is a task that is incredibly easy to give up on.

### Finally, priorities

Roughly how it was eloquently put in Go Time episode, The industry has grudgingly allowed testing to become important and our tooling around it reflects that. But docs, are a distant third place in priority and the tooling reflects that.

## As the Writer

Let's assume everyone starts being with the avid desire to write amazing documentation. 

One of the following eventually breaks this desire:
- The deadlines rush in and there's barely enough time get that required 100% code coverage, let alone write documentation. 
- The existing documentation is so sparse or wrong it's easy to forget to even check in there to even update it
- The documentation goes out of date so quickly it feels pointless to write it again
- The style of the documentation written assumes so much knowledge of the existing system, contributing anything implies a level of familiarity with the system beyond most developers

### The _Right_ Documentation

Part of the problem is the disconnect between the intent of the writer and the reader. In part this is having so much context at the time of writing that non-trivial things can seem obvious.

More importantly is about having the right _kind_ of documentation.

The best articulated I've seen of this is [diátaxis](https://diataxis.fr). It breaks down writing into 4 quadrants: 

- Tutorials
- Explanations
- How-To Guides
- Reference

I'd argue most documentation spaces are mess of these 4 mixed into one with no intention about which kind it is (most of which is either a How-To or Reference). But being intentional about which kind of documentation requires much more thought than is normally put into documentation.

### How do you practice?

No details here. Seriously. How do you get better?