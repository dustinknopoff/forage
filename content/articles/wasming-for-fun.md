---
title: Wasming a Rust Package for Fun
date: 2022-11-29
extra:
  link: https://github.com/Stebalien/slug-rs/pull/6/files
taxonomies:
  categories:
    - projects
  tags:
    - dev
    - rust
    - web-assembly
---

Whilst getting interested in [Library.JSON](https://tomcritchlow.com/2020/04/15/library-json/) and building my own [library](/library), one of the issues I continually run into is slight variations between slugifying in javascript and rust (which the [static site generator](https://getzola.org) I use is written in). Eventually I reached the point where I decided it was easier to compile whatever Zola was using for slugs to web assembly than trying to get it exactly the same in javascript.

With some spelunking, I found [https://github.com/Stebalien/slug-rs](https://github.com/Stebalien/slug-rs).

I `git pull`'d it added to the Cargo.toml

```toml
[lib]
crate-type = ["cdylib", "rlib"] # cdylib is for web assembly and rlib is a normal rust library
# ...

[target.'cfg(target_family = "wasm")'.dependencies]
wasm-bindgen = "0.2"
```

Threw a `#[wasm_bindgen]` on `slugify()` function and ran `wasm-pack build --target web` which provides a wonderfully descriptive error

```bash
error: can't #[wasm_bindgen] functions with lifetime or type parameters
  --> src/lib.rs:42:15
   |
42 | pub fn slugify<S: AsRef<str>>(s: S) -> String {
   |               ^^^^^^^^^^^^^^^

error: could not compile `slug` due to previous error
```

I replaced `S` with String and Voila! A `pkg` folder was generated.

This pkg folder was then copied to the static assets folder and in JS, it's called by

```html
<script defer type="module">
import init, { slugify } from '/pkg/slug.js';
// ...

async function run() {
	await init();
	// ...
	slugify("My Test String!!!1!1");
}

run()
</script>
```

For the search bar on [library](/library), my template sets the id for a 'book'

```jinja
<div class="book" id="{{list.name ~ "-" ~ book.title | slugify}}">
```

And the dynamic elements in the search dropdown use the exact same slugifying logic!

Was this unnecessary? Probably. But it works and it was a neat exercise.