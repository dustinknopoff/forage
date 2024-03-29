---
title: Type Investigator
date: 2023-12-22
extra:
  link: https://type-investigator.knopoff.dev
  linkText: Check it out
taxonomies:
  categories:
    - projects
  tags:
    - design
    - dev
    - web

---

How can user-defined input be constrained to not truncate and/or wrap on a page? Let's say there's a fixed width of 600px available and this location will always use Roboto Medium at 22px.

The naive approach would be to type a bunch of `l`s or `m`s and count how many appear. This is unsufficient since, other than monospaced fonts, different characters take up different amounts of space. In the same vein, using a block of Lorem Ipsum text and then counting characters would be slightly better.

What about to make it closer to reality? 

There's many approaches but Type Investigator has chosen to use [this corpus](https://www.kaggle.com/datasets/mikeortman/wikipedia-sentences) (licensed under CC BY-SA 4.0) of text to provide randomness and variability to the sentences we evaluate character length on while hopefully still being accurate to what a user would provide.

This is achieved by:
1. Randomly selecting 100 sentences from the corpus. 
2. For the given font and font size walk each word asking the [font](https://github.com/opentypejs/opentype.js/blob/a769436b36dd6c7170c4008c17ab98a6c1105296/README.md#fontgetadvancewidthtext-fontsize-options) what width the fragment would require.
3. Stop once we're at the available pixel width or over

We then average the result of the 100 sentences to hopefully normalize the result

## What "asking the font what width to render" means

![](https://res.cloudinary.com/dcloudinary/image/upload/f_auto,q_auto/kreqo45czqhxs69gnybr)

![](https://res.cloudinary.com/dcloudinary/image/upload/f_auto,q_auto/zao1n1isyqh9odhuuj7a)

Excluding some complexities of different fonts, kerning, special cases, etc. `getAdvanceWidth` essentially takes a piece of text and converts each character into a glyph (like above). The `advanceWidth` is encoded for each glyph in the ttf file.

![](https://res.cloudinary.com/dcloudinary/image/upload/f_auto,q_auto/blfauetb3d4ephd0goy8)

That is multiplied by `(1 / fontSize) * unitsPerEm` to scale the advanceWidth to the font size we're evaluating. It then sums this for all glyphs in the text.